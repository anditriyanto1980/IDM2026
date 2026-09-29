import { DistributionCenter, Customer, Region } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { INITIAL_DCS } from '../constants/initialData';
import { logActivity } from './auditLogService';

export const getDistributionCenters = async (
  search: string = '',
  customerId?: string,
  regionId?: string,
  status: 'all' | 'active' | 'inactive' = 'all'
): Promise<DistributionCenter[]> => {
  let dcs: DistributionCenter[] = [];
  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const regions = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);

  // 1. Fetch from Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'distribution_centers'));
    if (!snap.empty) {
      dcs = snap.docs.map((d) => d.data() as DistributionCenter);
      setStored(STORAGE_KEYS.DCS, dcs);
    } else {
      setStored(STORAGE_KEYS.DCS, []);
      return [];
    }
  } catch (err) {
    console.warn('Firebase fetch DCs error:', err);
    handleFirestoreError(err, OperationType.LIST, 'distribution_centers');
  }

  // 2. Fallback to local storage
  if (dcs.length === 0) {
    dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  }

  // 3. Filter
  dcs = dcs.filter((dc) => {
    const matchCustomer = !customerId || customerId === 'all' || dc.customer_id === customerId;
    const matchRegion = !regionId || regionId === 'all' || dc.region_id === regionId;
    const matchStatus =
      status === 'all' ? true : status === 'active' ? dc.is_active : !dc.is_active;
    const matchSearch =
      search === '' ||
      dc.dc_code.toLowerCase().includes(search.toLowerCase()) ||
      dc.dc_name.toLowerCase().includes(search.toLowerCase()) ||
      dc.city.toLowerCase().includes(search.toLowerCase()) ||
      dc.province.toLowerCase().includes(search.toLowerCase()) ||
      (dc.pic_name && dc.pic_name.toLowerCase().includes(search.toLowerCase()));

    return matchCustomer && matchRegion && matchStatus && matchSearch;
  });

  // Attach relations
  return dcs.map((dc) => ({
    ...dc,
    customer: customers.find((c) => c.id === dc.customer_id),
    region: regions.find((r) => r.id === dc.region_id),
  }));
};

export const getDistributionCenterById = async (id: string): Promise<DistributionCenter | null> => {
  try {
    const snap = await getDocs(collection(db, 'distribution_centers'));
    const docFound = snap.docs.find((d) => d.id === id);
    if (docFound) {
      const dc = docFound.data() as DistributionCenter;
      const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
      const regions = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
      return {
        ...dc,
        customer: customers.find((c) => c.id === dc.customer_id),
        region: regions.find((r) => r.id === dc.region_id),
      };
    }
  } catch (err) {
    console.warn('Firebase getDCById failed:', err);
  }

  const list = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const dc = list.find((d) => d.id === id);
  if (!dc) return null;

  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const regions = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  return {
    ...dc,
    customer: customers.find((c) => c.id === dc.customer_id),
    region: regions.find((r) => r.id === dc.region_id),
  };
};

export const createDistributionCenter = async (
  payload: Omit<DistributionCenter, 'id' | 'created_at' | 'updated_at' | 'customer' | 'region'>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<DistributionCenter> => {
  const code = payload.dc_code.trim().toUpperCase();
  const name = payload.dc_name.trim();

  if (!code) throw new Error('Kode DC wajib diisi.');
  if (!name) throw new Error('Nama DC wajib diisi.');
  if (!payload.customer_id) throw new Error('Customer wajib dipilih.');
  if (!payload.region_id) throw new Error('Wilayah wajib dipilih.');

  const existingList = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const duplicate = existingList.find((d) => d.dc_code.toLowerCase() === code.toLowerCase());
  if (duplicate) {
    throw new Error(`Kode DC "${code}" sudah terdaftar.`);
  }

  const newDc: DistributionCenter = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dc-${Date.now()}`,
    dc_code: code,
    dc_name: name,
    customer_id: payload.customer_id,
    region_id: payload.region_id,
    city: payload.city.trim(),
    province: payload.province.trim(),
    address: payload.address?.trim() || null,
    pic_name: payload.pic_name?.trim() || null,
    pic_phone: payload.pic_phone?.trim() || null,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to Firebase Firestore
  try {
    await setDoc(doc(db, 'distribution_centers', newDc.id), newDc);
  } catch (err) {
    console.error('Firebase createDC error:', err);
    handleFirestoreError(err, OperationType.CREATE, `distribution_centers/${newDc.id}`);
  }

  setStored(STORAGE_KEYS.DCS, [newDc, ...existingList]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'DISTRIBUTION_CENTERS',
    recordId: newDc.id,
    description: `${operatorInfo?.userRole || 'ADMIN'} created Distribution Center ${newDc.dc_code} (${newDc.dc_name})`,
  });

  return newDc;
};

export const updateDistributionCenter = async (
  id: string,
  payload: Partial<Omit<DistributionCenter, 'id' | 'created_at' | 'updated_at' | 'customer' | 'region'>>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<DistributionCenter> => {
  const existingList = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const targetIndex = existingList.findIndex((d) => d.id === id);

  if (targetIndex === -1) {
    throw new Error('Distribution Center tidak ditemukan.');
  }

  if (payload.dc_code) {
    const code = payload.dc_code.trim().toUpperCase();
    const duplicate = existingList.find(
      (d) => d.dc_code.toLowerCase() === code.toLowerCase() && d.id !== id
    );
    if (duplicate) {
      throw new Error(`Kode DC "${code}" sudah digunakan DC lain.`);
    }
  }

  const updatedDc: DistributionCenter = {
    ...existingList[targetIndex],
    ...payload,
    dc_code: payload.dc_code ? payload.dc_code.trim().toUpperCase() : existingList[targetIndex].dc_code,
    dc_name: payload.dc_name ? payload.dc_name.trim() : existingList[targetIndex].dc_name,
    updated_at: new Date().toISOString(),
  };

  // Update in Firebase Firestore
  try {
    await setDoc(doc(db, 'distribution_centers', id), updatedDc, { merge: true });
  } catch (err) {
    console.error('Firebase updateDC error:', err);
    handleFirestoreError(err, OperationType.UPDATE, `distribution_centers/${id}`);
  }

  existingList[targetIndex] = updatedDc;
  setStored(STORAGE_KEYS.DCS, existingList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'DISTRIBUTION_CENTERS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} updated Distribution Center ${updatedDc.dc_code} (${updatedDc.dc_name})`,
  });

  return updatedDc;
};

export const toggleDcStatus = async (
  id: string,
  newStatus?: boolean,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<DistributionCenter> => {
  const existingList = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const target = existingList.find((d) => d.id === id);
  if (!target) throw new Error('Distribution Center tidak ditemukan.');

  const statusToSet = typeof newStatus === 'boolean' ? newStatus : !target.is_active;
  return updateDistributionCenter(id, { is_active: statusToSet }, operatorInfo);
};

export const deleteDistributionCenter = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const existingList = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const target = existingList.find((d) => d.id === id);
  if (!target) throw new Error('Distribution Center tidak ditemukan.');

  // Delete from Firebase Firestore
  try {
    await deleteDoc(doc(db, 'distribution_centers', id));
  } catch (err) {
    console.error('Firebase deleteDC error:', err);
    handleFirestoreError(err, OperationType.DELETE, `distribution_centers/${id}`);
  }

  const updatedList = existingList.filter((d) => d.id !== id);
  setStored(STORAGE_KEYS.DCS, updatedList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'DISTRIBUTION_CENTERS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted Distribution Center ${target.dc_code} (${target.dc_name})`,
  });
};
