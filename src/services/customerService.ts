import { Customer, DistributionCenter } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';

export const getCustomers = async (
  search: string = '',
  status: 'all' | 'active' | 'inactive' = 'all'
): Promise<Customer[]> => {
  let customers: Customer[] = [];

  // 1. Fetch from Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'customers'));
    if (!snap.empty) {
      customers = snap.docs.map((d) => d.data() as Customer);
      // Synchronize to local storage cache
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    } else {
      setStored(STORAGE_KEYS.CUSTOMERS, []);
      return [];
    }
  } catch (err) {
    console.warn('Firebase fetch customers failed, falling back to storage:', err);
    handleFirestoreError(err, OperationType.LIST, 'customers');
  }

  // 2. Fallback to local storage if Firestore was empty or offline
  if (customers.length === 0) {
    customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  // 3. Filter by search & status
  let filtered = customers.filter((c) => {
    const matchSearch =
      search === '' ||
      c.customer_code.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchStatus =
      status === 'all' ? true : status === 'active' ? c.is_active : !c.is_active;

    return matchSearch && matchStatus;
  });

  // Attach DC count
  const allDcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  return filtered.map((c) => ({
    ...c,
    dc_count: allDcs.filter((dc) => dc.customer_id === c.id && dc.is_active).length,
  }));
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const snap = await getDocs(collection(db, 'customers'));
    const docFound = snap.docs.find((d) => d.id === id);
    if (docFound) return docFound.data() as Customer;
  } catch (err) {
    console.warn('Firebase getCustomerById failed:', err);
  }

  const list = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  return list.find((c) => c.id === id) || null;
};

export const createCustomer = async (
  payload: Omit<Customer, 'id' | 'created_at' | 'updated_at'>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Customer> => {
  const code = payload.customer_code.trim().toUpperCase();
  const name = payload.customer_name.trim();

  if (!code) throw new Error('Customer Code wajib diisi.');
  if (!name) throw new Error('Customer Name wajib diisi.');

  const existingList = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const duplicate = existingList.find(
    (c) => c.customer_code.toLowerCase() === code.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Customer Code "${code}" sudah terdaftar.`);
  }

  const newCustomer: Customer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`,
    customer_code: code,
    customer_name: name,
    description: payload.description?.trim() || null,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to Firebase Firestore
  try {
    await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);
  } catch (err) {
    console.error('Firebase createCustomer error:', err);
    handleFirestoreError(err, OperationType.CREATE, `customers/${newCustomer.id}`);
  }

  // Update local storage cache
  setStored(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...existingList]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'CUSTOMERS',
    recordId: newCustomer.id,
    description: `${operatorInfo?.userRole || 'ADMIN'} created customer ${newCustomer.customer_name} (${newCustomer.customer_code})`,
  });

  return newCustomer;
};

export const updateCustomer = async (
  id: string,
  payload: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Customer> => {
  const existingList = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const targetIndex = existingList.findIndex((c) => c.id === id);

  if (targetIndex === -1) {
    throw new Error('Customer tidak ditemukan.');
  }

  if (payload.customer_code) {
    const code = payload.customer_code.trim().toUpperCase();
    const duplicate = existingList.find(
      (c) => c.customer_code.toLowerCase() === code.toLowerCase() && c.id !== id
    );
    if (duplicate) {
      throw new Error(`Customer Code "${code}" sudah digunakan customer lain.`);
    }
  }

  const updatedCustomer: Customer = {
    ...existingList[targetIndex],
    ...payload,
    customer_code: payload.customer_code ? payload.customer_code.trim().toUpperCase() : existingList[targetIndex].customer_code,
    customer_name: payload.customer_name ? payload.customer_name.trim() : existingList[targetIndex].customer_name,
    description: payload.description !== undefined ? payload.description?.trim() || null : existingList[targetIndex].description,
    updated_at: new Date().toISOString(),
  };

  // Update in Firebase Firestore
  try {
    await setDoc(doc(db, 'customers', id), updatedCustomer, { merge: true });
  } catch (err) {
    console.error('Firebase updateCustomer error:', err);
    handleFirestoreError(err, OperationType.UPDATE, `customers/${id}`);
  }

  // Update local cache
  existingList[targetIndex] = updatedCustomer;
  setStored(STORAGE_KEYS.CUSTOMERS, existingList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'CUSTOMERS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} updated customer ${updatedCustomer.customer_name} (${updatedCustomer.customer_code})`,
  });

  return updatedCustomer;
};

export const toggleCustomerStatus = async (
  id: string,
  newStatus?: boolean,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Customer> => {
  const existingList = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const target = existingList.find((c) => c.id === id);
  if (!target) throw new Error('Customer tidak ditemukan.');

  const statusToSet = typeof newStatus === 'boolean' ? newStatus : !target.is_active;
  return updateCustomer(id, { is_active: statusToSet }, operatorInfo);
};

export const deleteCustomer = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const existingList = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const target = existingList.find((c) => c.id === id);
  if (!target) throw new Error('Customer tidak ditemukan.');

  // Check if DC exists linked to this customer
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const linkedDcs = dcs.filter((dc) => dc.customer_id === id);
  if (linkedDcs.length > 0) {
    throw new Error(
      `Tidak dapat menghapus Customer. Masih terdapat ${linkedDcs.length} Distribution Center yang terhubung.`
    );
  }

  // Delete from Firebase Firestore
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (err) {
    console.error('Firebase deleteCustomer error:', err);
    handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
  }

  const updatedList = existingList.filter((c) => c.id !== id);
  setStored(STORAGE_KEYS.CUSTOMERS, updatedList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'CUSTOMERS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted customer ${target.customer_name} (${target.customer_code})`,
  });
};
