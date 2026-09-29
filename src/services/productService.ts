import { Product } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';

export const getProducts = async (
  search: string = '',
  status: 'all' | 'active' | 'inactive' = 'all'
): Promise<Product[]> => {
  let products: Product[] = [];

  // 1. Fetch from Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      products = snap.docs.map((d) => d.data() as Product);
      setStored(STORAGE_KEYS.PRODUCTS, products);
    } else {
      setStored(STORAGE_KEYS.PRODUCTS, []);
      return [];
    }
  } catch (err) {
    console.warn('Firebase fetch products error:', err);
    handleFirestoreError(err, OperationType.LIST, 'products');
  }

  // 2. Fallback to storage
  if (products.length === 0) {
    products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  return products.filter((p) => {
    const matchSearch =
      search === '' ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchStatus =
      status === 'all' ? true : status === 'active' ? p.is_active : !p.is_active;

    return matchSearch && matchStatus;
  });
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const snap = await getDocs(collection(db, 'products'));
    const docFound = snap.docs.find((d) => d.id === id);
    if (docFound) return docFound.data() as Product;
  } catch (err) {
    console.warn('Firebase getProductById error:', err);
  }

  const list = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  return list.find((p) => p.id === id) || null;
};

export const createProduct = async (
  payload: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Product> => {
  const sku = payload.sku.trim().toUpperCase();
  const name = payload.product_name.trim();

  if (!sku) throw new Error('SKU wajib diisi.');
  if (!name) throw new Error('Nama Produk wajib diisi.');

  const existingList = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const duplicate = existingList.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  if (duplicate) {
    throw new Error(`SKU "${sku}" sudah terdaftar.`);
  }

  const newProduct: Product = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
    sku,
    product_name: name,
    description: payload.description?.trim() || null,
    unit: payload.unit || 'PCS',
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to Firebase Firestore
  try {
    await setDoc(doc(db, 'products', newProduct.id), newProduct);
  } catch (err) {
    console.error('Firebase createProduct error:', err);
    handleFirestoreError(err, OperationType.CREATE, `products/${newProduct.id}`);
  }

  setStored(STORAGE_KEYS.PRODUCTS, [newProduct, ...existingList]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'PRODUCTS',
    recordId: newProduct.id,
    description: `${operatorInfo?.userRole || 'ADMIN'} created product ${newProduct.sku} (${newProduct.product_name})`,
  });

  return newProduct;
};

export const updateProduct = async (
  id: string,
  payload: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Product> => {
  const existingList = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const targetIndex = existingList.findIndex((p) => p.id === id);

  if (targetIndex === -1) {
    throw new Error('Produk tidak ditemukan.');
  }

  if (payload.sku) {
    const sku = payload.sku.trim().toUpperCase();
    const duplicate = existingList.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== id
    );
    if (duplicate) {
      throw new Error(`SKU "${sku}" sudah digunakan produk lain.`);
    }
  }

  const updatedProduct: Product = {
    ...existingList[targetIndex],
    ...payload,
    sku: payload.sku ? payload.sku.trim().toUpperCase() : existingList[targetIndex].sku,
    product_name: payload.product_name ? payload.product_name.trim() : existingList[targetIndex].product_name,
    description: payload.description !== undefined ? payload.description?.trim() || null : existingList[targetIndex].description,
    unit: payload.unit ? payload.unit.trim().toUpperCase() : existingList[targetIndex].unit,
    updated_at: new Date().toISOString(),
  };

  // Update in Firebase Firestore
  try {
    await setDoc(doc(db, 'products', id), updatedProduct, { merge: true });
  } catch (err) {
    console.error('Firebase updateProduct error:', err);
    handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
  }

  existingList[targetIndex] = updatedProduct;
  setStored(STORAGE_KEYS.PRODUCTS, existingList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'PRODUCTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} updated product ${updatedProduct.sku} (${updatedProduct.product_name})`,
  });

  return updatedProduct;
};

export const toggleProductStatus = async (
  id: string,
  newStatus?: boolean,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Product> => {
  const existingList = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const target = existingList.find((p) => p.id === id);
  if (!target) throw new Error('Produk tidak ditemukan.');

  const statusToSet = typeof newStatus === 'boolean' ? newStatus : !target.is_active;
  return updateProduct(id, { is_active: statusToSet }, operatorInfo);
};

export const deleteProduct = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const existingList = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const target = existingList.find((p) => p.id === id);
  if (!target) throw new Error('Produk tidak ditemukan.');

  // Delete from Firebase Firestore
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    console.error('Firebase deleteProduct error:', err);
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  }

  const updatedList = existingList.filter((p) => p.id !== id);
  setStored(STORAGE_KEYS.PRODUCTS, updatedList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'PRODUCTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted product ${target.sku} (${target.product_name})`,
  });
};
