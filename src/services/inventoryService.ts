import {
  WarehouseLocation,
  WarehouseInventory,
  StockMutation,
  CreateStockMutationPayload,
  WarehouseLocationCode,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { INITIAL_WAREHOUSES, INITIAL_WAREHOUSE_INVENTORY, INITIAL_STOCK_MUTATIONS } from '../constants/initialData';
import { logActivity } from './auditLogService';
import * as XLSX from 'xlsx';

export const getWarehouses = async (): Promise<WarehouseLocation[]> => {
  try {
    const snap = await getDocs(collection(db, 'warehouses'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as WarehouseLocation);
      setStored(STORAGE_KEYS.WAREHOUSES, list);
      return list;
    }
  } catch (e) {
    console.warn('Firestore warehouses fetch failed, fallback to local', e);
  }

  const stored = getStored<WarehouseLocation[]>(STORAGE_KEYS.WAREHOUSES, []);
  if (stored && stored.length > 0) {
    return stored;
  }

  // If empty and not total reset, fallback to INITIAL_WAREHOUSES
  const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
  if (!isResetTotal) {
    setStored(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
    // seed to firestore in background
    try {
      for (const w of INITIAL_WAREHOUSES) {
        setDoc(doc(db, 'warehouses', w.code), w);
      }
    } catch {}
    return INITIAL_WAREHOUSES;
  }

  return [];
};

export const createWarehouse = async (
  payload: WarehouseLocation,
  actor?: { userId?: string; userEmail?: string; userRole?: string }
): Promise<WarehouseLocation> => {
  const warehouses = await getWarehouses();
  const exists = warehouses.find((w) => w.code.toUpperCase() === payload.code.toUpperCase());
  if (exists) {
    throw new Error(`Fasilitas gudang dengan kode ${payload.code} sudah terdaftar.`);
  }

  const cleanPayload: WarehouseLocation = {
    ...payload,
    code: payload.code.toUpperCase().replace(/\s+/g, '_') as WarehouseLocationCode,
  };

  try {
    await setDoc(doc(db, 'warehouses', cleanPayload.code), cleanPayload);
  } catch (e) {
    console.warn('Firestore warehouse create fallback to local', e);
  }

  const updatedList = [...warehouses, cleanPayload];
  setStored(STORAGE_KEYS.WAREHOUSES, updatedList);

  logActivity({
    userId: actor?.userId || 'system',
    userEmail: actor?.userEmail || 'admin@akram.id',
    userRole: (actor?.userRole as any) || 'ADMIN',
    action: 'CREATE',
    module: 'INVENTORY',
    recordId: cleanPayload.code,
    description: `Fasilitas gudang baru ${cleanPayload.name} (${cleanPayload.code}) berhasil ditambahkan.`,
  });

  return cleanPayload;
};

export const updateWarehouse = async (
  code: string,
  updates: Partial<WarehouseLocation>,
  actor?: { userId?: string; userEmail?: string; userRole?: string }
): Promise<WarehouseLocation> => {
  const warehouses = await getWarehouses();
  const index = warehouses.findIndex((w) => w.code === code);
  if (index === -1) {
    throw new Error(`Fasilitas gudang dengan kode ${code} tidak ditemukan.`);
  }

  const oldName = warehouses[index].name;
  const updated: WarehouseLocation = {
    ...warehouses[index],
    ...updates,
    code: warehouses[index].code, // preserve code
  };

  warehouses[index] = updated;

  try {
    await setDoc(doc(db, 'warehouses', code), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore warehouse update fallback to local', e);
  }

  setStored(STORAGE_KEYS.WAREHOUSES, [...warehouses]);

  // If warehouse name changed, update all inventory records using this warehouse code
  if (updates.name && updates.name !== oldName) {
    const inventories = getStored<WarehouseInventory[]>(STORAGE_KEYS.WAREHOUSE_INVENTORY, []);
    let invChanged = false;
    const updatedInventories = inventories.map((inv) => {
      if (inv.warehouse_code === code) {
        invChanged = true;
        return { ...inv, warehouse_name: updates.name! };
      }
      return inv;
    });

    if (invChanged) {
      setStored(STORAGE_KEYS.WAREHOUSE_INVENTORY, updatedInventories);
      try {
        for (const item of updatedInventories.filter((i) => i.warehouse_code === code)) {
          setDoc(doc(db, 'inventory', item.id), item, { merge: true });
        }
      } catch (err) {
        console.warn('Sync inventory warehouse name failed', err);
      }
    }
  }

  logActivity({
    userId: actor?.userId || 'system',
    userEmail: actor?.userEmail || 'admin@akram.id',
    userRole: (actor?.userRole as any) || 'ADMIN',
    action: 'UPDATE',
    module: 'INVENTORY',
    recordId: code,
    description: `Nama fasilitas gudang ${code} diubah dari "${oldName}" menjadi "${updated.name}".`,
  });

  return updated;
};

export const deleteWarehouse = async (
  code: string,
  actor?: { userId?: string; userEmail?: string; userRole?: string }
): Promise<void> => {
  const warehouses = await getWarehouses();
  const target = warehouses.find((w) => w.code === code);
  const filtered = warehouses.filter((w) => w.code !== code);

  try {
    await deleteDoc(doc(db, 'warehouses', code));
  } catch (e) {
    console.warn('Firestore warehouse delete fallback to local', e);
  }

  setStored(STORAGE_KEYS.WAREHOUSES, filtered);

  logActivity({
    userId: actor?.userId || 'system',
    userEmail: actor?.userEmail || 'admin@akram.id',
    userRole: (actor?.userRole as any) || 'ADMIN',
    action: 'DELETE',
    module: 'INVENTORY',
    recordId: code,
    description: `Fasilitas gudang ${target?.name || code} (${code}) telah dihapus.`,
  });
};

export const getWarehouseInventory = async (warehouseCode?: WarehouseLocationCode): Promise<WarehouseInventory[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('central_warehouse_inventory').select('*').order('warehouse_code');
      if (warehouseCode && warehouseCode !== ('all' as any)) {
        query = query.eq('warehouse_code', warehouseCode);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as WarehouseInventory[];
      }
    } catch (e) {
      console.warn('Supabase inventory read failed, fallback to local storage', e);
    }
  }

  const all = getStored<WarehouseInventory[]>(STORAGE_KEYS.WAREHOUSE_INVENTORY, []);
  if (warehouseCode && warehouseCode !== ('all' as any)) {
    return all.filter((item) => item.warehouse_code === warehouseCode);
  }
  return all;
};

export const getStockMutations = async (filters?: {
  warehouseCode?: string;
  sku?: string;
  mutationType?: string;
}): Promise<StockMutation[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('stock_mutations').select('*').order('date', { ascending: false });
      if (filters?.warehouseCode && filters.warehouseCode !== 'all') {
        query = query.eq('warehouse_code', filters.warehouseCode);
      }
      if (filters?.sku && filters.sku !== 'all') {
        query = query.eq('sku', filters.sku);
      }
      if (filters?.mutationType && filters.mutationType !== 'all') {
        query = query.eq('mutation_type', filters.mutationType);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as StockMutation[];
      }
    } catch (e) {
      console.warn('Supabase stock mutations read failed, fallback to local storage', e);
    }
  }

  let mutations = getStored<StockMutation[]>(STORAGE_KEYS.STOCK_MUTATIONS, []);

  if (filters?.warehouseCode && filters.warehouseCode !== 'all') {
    mutations = mutations.filter((m) => m.warehouse_code === filters.warehouseCode);
  }
  if (filters?.sku && filters.sku !== 'all') {
    mutations = mutations.filter((m) => m.sku === filters.sku);
  }
  if (filters?.mutationType && filters.mutationType !== 'all') {
    mutations = mutations.filter((m) => m.mutation_type === filters.mutationType);
  }

  return mutations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createStockMutation = async (
  payload: CreateStockMutationPayload,
  actorName = 'Operator Warehouse'
): Promise<StockMutation> => {
  const existingMutations = getStored<StockMutation[]>(STORAGE_KEYS.STOCK_MUTATIONS, []);
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const seq = String(existingMutations.length + 1).padStart(4, '0');
  const mutationNumber = `MUT-${yearMonth}-${seq}`;

  const newMutation: StockMutation = {
    id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    mutation_number: mutationNumber,
    date: now.toISOString().slice(0, 10),
    mutation_type: payload.mutation_type,
    warehouse_code: payload.warehouse_code,
    product_id: payload.product_id,
    sku: payload.sku,
    product_name: payload.product_name,
    qty: payload.qty,
    unit: payload.unit || 'PCS',
    reference_doc_type: payload.reference_doc_type,
    reference_doc_number: payload.reference_doc_number,
    batch_number: payload.batch_number,
    notes: payload.notes || null,
    created_by: actorName,
    created_at: now.toISOString(),
  };

  // Update inventory balance
  const currentInventory = getStored<WarehouseInventory[]>(STORAGE_KEYS.WAREHOUSE_INVENTORY, INITIAL_WAREHOUSE_INVENTORY);
  const updatedInventory = currentInventory.map((item) => {
    if (item.warehouse_code === payload.warehouse_code && item.sku === payload.sku) {
      const newOnHand = Math.max(0, item.stock_on_hand + payload.qty);
      const newAvailable = Math.max(0, newOnHand - item.stock_reserved);
      let status: 'OPTIMAL' | 'REORDER_POINT' | 'CRITICAL_LOW' | 'OVERSTOCK' = 'OPTIMAL';
      if (newAvailable <= item.safety_stock) {
        status = 'CRITICAL_LOW';
      } else if (newAvailable <= item.reorder_point) {
        status = 'REORDER_POINT';
      }

      return {
        ...item,
        stock_on_hand: newOnHand,
        stock_available: newAvailable,
        stock_status: status,
        updated_at: now.toISOString(),
      };
    }
    return item;
  });

  // Save to local storage
  setStored(STORAGE_KEYS.STOCK_MUTATIONS, [newMutation, ...existingMutations]);
  setStored(STORAGE_KEYS.WAREHOUSE_INVENTORY, updatedInventory);

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('stock_mutations').insert([newMutation]);
      const matched = updatedInventory.find(
        (i) => i.warehouse_code === payload.warehouse_code && i.sku === payload.sku
      );
      if (matched) {
        await supabase
          .from('central_warehouse_inventory')
          .update({
            stock_on_hand: matched.stock_on_hand,
            stock_available: matched.stock_available,
            stock_status: matched.stock_status,
            updated_at: now.toISOString(),
          })
          .match({ warehouse_code: payload.warehouse_code, sku: payload.sku });
      }
    } catch (e) {
      console.warn('Supabase stock mutation insert failed', e);
    }
  }

  // Audit Log
  await logActivity({
    action: 'CREATE',
    module: 'INVENTORY',
    recordId: newMutation.id,
    description: `${actorName} recorded stock mutation ${mutationNumber} (${payload.mutation_type}: ${payload.qty > 0 ? '+' : ''}${payload.qty} ${payload.unit} ${payload.sku}) at ${payload.warehouse_code}`,
  });

  return newMutation;
};

export const exportInventoryToExcel = (
  inventory: WarehouseInventory[],
  mutations: StockMutation[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Stock Balance
  const stockRows = inventory.map((inv, idx) => ({
    No: idx + 1,
    Gudang: inv.warehouse_name,
    SKU: inv.sku,
    'Nama Produk': inv.product_name,
    'Stock Fisik (On Hand)': inv.stock_on_hand,
    'Stock Ter-alokasi (Reserved)': inv.stock_reserved,
    'Stock Bebas (ATP)': inv.stock_available,
    'Safety Stock': inv.safety_stock,
    'Reorder Point': inv.reorder_point,
    Status: inv.stock_status,
    Satuan: inv.unit,
    'Audit Terakhir': inv.last_audit_date,
  }));
  const ws1 = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Posisi Stok Gudang');

  // Sheet 2: Mutations Ledger
  const mutationRows = mutations.map((m, idx) => ({
    No: idx + 1,
    'No Mutasi': m.mutation_number,
    Tanggal: m.date,
    Tipe: m.mutation_type,
    Gudang: m.warehouse_code,
    SKU: m.sku,
    'Nama Produk': m.product_name,
    Qty: m.qty,
    Satuan: m.unit,
    'Ref Dokumen': m.reference_doc_type,
    'No Referensi': m.reference_doc_number,
    'Batch No': m.batch_number,
    Keterangan: m.notes || '-',
    Operator: m.created_by,
  }));
  const ws2 = XLSX.utils.json_to_sheet(mutationRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Buku Mutasi Stok');

  const fileName = `Laporan_Stok_Gudang_Akram_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
