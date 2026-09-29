import { Region, DistributionCenter } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';

export const getRegions = async (
  search: string = '',
  status: 'all' | 'active' | 'inactive' = 'all'
): Promise<Region[]> => {
  let regions: Region[] = [];

  try {
    const snap = await getDocs(collection(db, 'regions'));
    if (!snap.empty) {
      regions = snap.docs.map((d) => d.data() as Region);
      setStored(STORAGE_KEYS.REGIONS, regions);
    } else {
      // If Firestore is empty, sync local cache to empty as well
      const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
      if (isResetTotal) {
        setStored(STORAGE_KEYS.REGIONS, []);
        return [];
      }
    }
  } catch (err) {
    console.warn('Firebase fetch regions failed:', err);
    handleFirestoreError(err, OperationType.LIST, 'regions');
  }

  if (regions.length === 0) {
    const list = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
    regions = list.filter((r) => {
      const matchSearch =
        search === '' ||
        r.region_code.toLowerCase().includes(search.toLowerCase()) ||
        r.region_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        status === 'all' ? true : status === 'active' ? r.is_active : !r.is_active;

      return matchSearch && matchStatus;
    });
  }

  const allDcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  return regions.map((r) => ({
    ...r,
    dc_count: allDcs.filter((dc) => dc.region_id === r.id && dc.is_active).length,
  }));
};

export const getRegionById = async (id: string): Promise<Region | null> => {
  try {
    const snap = await getDocs(collection(db, 'regions'));
    const docFound = snap.docs.find((d) => d.id === id);
    if (docFound) return docFound.data() as Region;
  } catch (err) {
    console.warn('Firebase getRegionById error:', err);
  }

  const list = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  return list.find((r) => r.id === id) || null;
};

export const createRegion = async (
  payload: Omit<Region, 'id' | 'created_at' | 'updated_at'>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Region> => {
  const code = payload.region_code.trim().toUpperCase().replace(/\s+/g, '_');
  const name = payload.region_name.trim();

  if (!code) throw new Error('Region Code wajib diisi.');
  if (!name) throw new Error('Region Name wajib diisi.');

  const existingList = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  const duplicate = existingList.find(
    (r) => r.region_code.toLowerCase() === code.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Kode Wilayah "${code}" sudah terdaftar.`);
  }

  const newRegion: Region = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `reg-${Date.now()}`,
    region_code: code,
    region_name: name,
    description: payload.description?.trim() || null,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'regions', newRegion.id), newRegion);
  } catch (err) {
    console.warn('Firebase save region error:', err);
  }

  setStored(STORAGE_KEYS.REGIONS, [...existingList, newRegion]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'REGIONS',
    recordId: newRegion.id,
    description: `${operatorInfo?.userRole || 'ADMIN'} created region ${newRegion.region_name} (${newRegion.region_code})`,
  });

  return newRegion;
};

export const updateRegion = async (
  id: string,
  payload: Partial<Omit<Region, 'id' | 'created_at' | 'updated_at'>>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Region> => {
  const existingList = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  const targetIndex = existingList.findIndex((r) => r.id === id);

  if (targetIndex === -1) {
    throw new Error('Wilayah tidak ditemukan.');
  }

  if (payload.region_code) {
    const code = payload.region_code.trim().toUpperCase().replace(/\s+/g, '_');
    const duplicate = existingList.find(
      (r) => r.id !== id && r.region_code.toLowerCase() === code.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Kode Wilayah "${code}" sudah digunakan.`);
    }
  }

  const updatedRegion: Region = {
    ...existingList[targetIndex],
    ...payload,
    region_code: payload.region_code ? payload.region_code.trim().toUpperCase().replace(/\s+/g, '_') : existingList[targetIndex].region_code,
    region_name: payload.region_name ? payload.region_name.trim() : existingList[targetIndex].region_name,
    description: payload.description !== undefined ? payload.description?.trim() || null : existingList[targetIndex].description,
    updated_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'regions', id), updatedRegion);
  } catch (err) {
    console.warn('Firebase update region error:', err);
  }

  existingList[targetIndex] = updatedRegion;
  setStored(STORAGE_KEYS.REGIONS, existingList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'REGIONS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} updated region ${updatedRegion.region_name} (${updatedRegion.region_code})`,
  });

  return updatedRegion;
};

export const toggleRegionStatus = async (
  id: string,
  isActive: boolean,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Region> => {
  return updateRegion(id, { is_active: isActive }, operatorInfo);
};

export const deleteRegion = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const linkedDcs = dcs.filter((dc) => dc.region_id === id);

  if (linkedDcs.length > 0) {
    throw new Error(
      `Tidak dapat menghapus wilayah ini karena masih memiliki ${linkedDcs.length} Distribution Center terkait. Harap nonaktifkan wilayah ini sebagai gantinya.`
    );
  }

  const existingList = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  const region = existingList.find((r) => r.id === id);
  if (!region) throw new Error('Wilayah tidak ditemukan.');

  try {
    await deleteDoc(doc(db, 'regions', id));
  } catch (err) {
    console.warn('Firebase delete region error:', err);
  }

  const filtered = existingList.filter((r) => r.id !== id);
  setStored(STORAGE_KEYS.REGIONS, filtered);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'REGIONS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted region ${region.region_name} (${region.region_code})`,
  });
};
