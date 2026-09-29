import {
  Shipment,
  ShipmentItem,
  ShipmentStatus,
  Customer,
  DistributionCenter,
  Region,
  Product,
  Forecast,
  CreateShipmentPayload,
} from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';
import { computeForecastStatus } from './forecastService';

export interface ShipmentFilterParams {
  search?: string;
  customerId?: string;
  dcId?: string;
  regionId?: string;
  status?: string;
  period?: string;
}

// Generate next auto-sequence: SJ-YYYYMM-XXXX
export const generateNextShipmentNumber = (dateStr: string): string => {
  const period = dateStr.slice(0, 7).replace(/[^0-9]/g, ''); // "2026-09" -> "202609"
  const stored = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const prefix = `SJ-${period}-`;

  const existingInPeriod = stored.filter((s) => s.shipment_number.startsWith(prefix));
  let maxSeq = 0;

  existingInPeriod.forEach((s) => {
    const seqStr = s.shipment_number.replace(prefix, '');
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
};

export const getShipments = async (filters: ShipmentFilterParams = {}): Promise<Shipment[]> => {
  let list: Shipment[] = [];
  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const regions = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);
  const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);

  try {
    const snap = await getDocs(collection(db, 'shipments'));
    if (!snap.empty) {
      list = snap.docs.map((d) => d.data() as Shipment);
      setStored(STORAGE_KEYS.SHIPMENTS, list);
    } else {
      const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
      if (isResetTotal) {
        setStored(STORAGE_KEYS.SHIPMENTS, []);
        return [];
      }
    }
  } catch (err) {
    console.warn('Firebase getShipments error, fallback to local storage:', err);
  }

  if (list.length === 0) {
    list = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  }

  list = list.filter((s) => {
    const matchCustomer =
      !filters.customerId || filters.customerId === 'all' || s.customer_id === filters.customerId;
    const matchDc = !filters.dcId || filters.dcId === 'all' || s.dc_id === filters.dcId;
    const matchStatus = !filters.status || filters.status === 'all' || s.status === filters.status;

    const q = (filters.search || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      s.shipment_number.toLowerCase().includes(q) ||
      (s.forecast_number && s.forecast_number.toLowerCase().includes(q)) ||
      (s.tracking_number_ref && s.tracking_number_ref.toLowerCase().includes(q)) ||
      (s.transporter_name && s.transporter_name.toLowerCase().includes(q)) ||
      (s.vehicle_plate_number && s.vehicle_plate_number.toLowerCase().includes(q)) ||
      (s.driver_name && s.driver_name.toLowerCase().includes(q)) ||
      (s.dc?.dc_name && s.dc.dc_name.toLowerCase().includes(q)) ||
      (s.customer?.customer_name && s.customer.customer_name.toLowerCase().includes(q));

    return matchCustomer && matchDc && matchStatus && matchSearch;
  });

    // Populate relations
    list = list.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const dc = dcs.find((d) => d.id === s.dc_id);
      const reg = regions.find((r) => r.id === (s.region_id || dc?.region_id));
      const fc = forecasts.find((f) => f.id === s.forecast_id || f.forecast_number === s.forecast_number);

      return {
        ...s,
        customer: cust,
        dc: dc,
        region: reg,
        forecast: fc,
      };
    });

  return list;
};

export const getShipmentById = async (id: string): Promise<Shipment | null> => {
  const all = await getShipments({});
  return all.find((s) => s.id === id) || null;
};

export const createShipment = async (
  payload: CreateShipmentPayload,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Shipment> => {
  if (!payload.customer_id) throw new Error('Customer wajib dipilih.');
  if (!payload.dc_id) throw new Error('Distribution Center tujuan wajib dipilih.');
  if (!payload.shipment_date) throw new Error('Tanggal surat jalan wajib diisi.');
  if (!payload.estimated_arrival_date) throw new Error('Estimasi tanggal tiba di DC wajib diisi.');
  if (!payload.origin_warehouse) throw new Error('Gudang asal pengiriman wajib diisi.');
  if (!payload.transporter_name) throw new Error('Nama ekspedisi/armada pengangkut wajib diisi.');
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Minimal harus ada 1 item produk kurma yang dikirim.');
  }

  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const targetDc = dcs.find((d) => d.id === payload.dc_id);
  const regionId = payload.region_id || targetDc?.region_id || '';

  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const shipmentId =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ship-${Date.now()}`;
  const shipmentNumber = generateNextShipmentNumber(payload.shipment_date);

  let totalQty = 0;
  const shipmentItems: ShipmentItem[] = payload.items.map((item, idx) => {
    const prod = products.find((p) => p.id === item.product_id);
    const qty = Math.max(0, Number(item.qty_shipped) || 0);
    totalQty += qty;

    return {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ship-item-${Date.now()}-${idx}`,
      shipment_id: shipmentId,
      forecast_item_id: item.forecast_item_id || null,
      product_id: item.product_id,
      sku: prod?.sku || 'SKU',
      product_name: prod?.product_name || 'Produk Akram',
      qty_shipped: qty,
      unit: item.unit || prod?.unit || 'PCS',
      batch_number: item.batch_number?.trim() || null,
      expiry_date: item.expiry_date || null,
      notes: item.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  if (totalQty <= 0) {
    throw new Error('Total kuantiti pengiriman harus lebih besar dari 0.');
  }

  const newShipment: Shipment = {
    id: shipmentId,
    shipment_number: shipmentNumber,
    forecast_id: payload.forecast_id || null,
    forecast_number: payload.forecast_number || null,
    customer_id: payload.customer_id,
    dc_id: payload.dc_id,
    region_id: regionId,
    shipment_date: payload.shipment_date,
    estimated_arrival_date: payload.estimated_arrival_date,
    actual_arrival_date: null,
    origin_warehouse: payload.origin_warehouse,
    transporter_name: payload.transporter_name,
    driver_name: payload.driver_name?.trim() || null,
    driver_phone: payload.driver_phone?.trim() || null,
    vehicle_plate_number: payload.vehicle_plate_number?.trim() || null,
    tracking_number_ref: payload.tracking_number_ref?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: 'READY_TO_DISPATCH',
    total_qty: totalQty,
    created_by: operatorInfo?.userEmail || 'Kepala Gudang',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: shipmentItems,
  };

  // 1. Update Linked Forecast if applicable
  if (payload.forecast_id) {
    const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
    const fcIndex = forecasts.findIndex((f) => f.id === payload.forecast_id);
    if (fcIndex !== -1) {
      const targetFc = forecasts[fcIndex];
      const updatedShipped = (targetFc.total_shipped || 0) + totalQty;
      const updatedOutstanding = Math.max(0, targetFc.total_qty - updatedShipped);

      // Update matching items in forecast
      const updatedItems = (targetFc.items || []).map((fi) => {
        const matchingShipItem = payload.items.find((si) => si.product_id === fi.product_id);
        if (matchingShipItem) {
          return {
            ...fi,
            qty_shipped: (fi.qty_shipped || 0) + (Number(matchingShipItem.qty_shipped) || 0),
            updated_at: new Date().toISOString(),
          };
        }
        return fi;
      });

      const updatedForecast: Forecast = {
        ...targetFc,
        total_shipped: updatedShipped,
        outstanding_qty: updatedOutstanding,
        items: updatedItems,
        updated_at: new Date().toISOString(),
      };
      updatedForecast.status = computeForecastStatus(updatedForecast);

      forecasts[fcIndex] = updatedForecast;
      setStored(STORAGE_KEYS.FORECASTS, forecasts);

      try {
        await setDoc(doc(db, 'forecasts', targetFc.id), updatedForecast);
      } catch (err) {
        console.warn('Firebase forecast update error:', err);
      }
    }
  }

  try {
    await setDoc(doc(db, 'shipments', newShipment.id), newShipment);
  } catch (err) {
    console.warn('Firebase save shipment error, saving locally:', err);
  }

  const existingShipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  setStored(STORAGE_KEYS.SHIPMENTS, [newShipment, ...existingShipments]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'SHIPMENTS',
    recordId: newShipment.id,
    description: `${operatorInfo?.userRole || 'WAREHOUSE'} created Surat Jalan ${newShipment.shipment_number} (${newShipment.total_qty.toLocaleString()} pcs)`,
  });

  return newShipment;
};

export const updateShipmentStatus = async (
  id: string,
  newStatus: ShipmentStatus,
  actualArrivalDate?: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Shipment> => {
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const index = shipments.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Data Surat Jalan tidak ditemukan.');

  const existing = shipments[index];
  const updated: Shipment = {
    ...existing,
    status: newStatus,
    actual_arrival_date:
      newStatus === 'DELIVERED' || newStatus === 'ARRIVED_DC'
        ? actualArrivalDate || new Date().toISOString().split('T')[0]
        : existing.actual_arrival_date,
    updated_at: new Date().toISOString(),
  };

  // If status transitions to DELIVERED, update forecast total_received
  if (newStatus === 'DELIVERED' && existing.forecast_id && existing.status !== 'DELIVERED') {
    const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
    const fcIndex = forecasts.findIndex((f) => f.id === existing.forecast_id);
    if (fcIndex !== -1) {
      const fc = forecasts[fcIndex];
      const updatedReceived = (fc.total_received || 0) + existing.total_qty;
      const updatedFc: Forecast = {
        ...fc,
        total_received: updatedReceived,
        updated_at: new Date().toISOString(),
      };
      updatedFc.status = computeForecastStatus(updatedFc);
      forecasts[fcIndex] = updatedFc;
      setStored(STORAGE_KEYS.FORECASTS, forecasts);
    }
  }

  try {
    await setDoc(doc(db, 'shipments', id), updated);
  } catch (err) {
    console.warn('Firebase updateShipmentStatus error:', err);
  }

  shipments[index] = updated;
  setStored(STORAGE_KEYS.SHIPMENTS, shipments);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'SHIPMENTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'LOGISTICS'} updated Surat Jalan ${updated.shipment_number} status to ${newStatus}`,
  });

  return updated;
};

export const deleteShipment = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const target = shipments.find((s) => s.id === id);
  if (!target) throw new Error('Data Surat Jalan tidak ditemukan.');

  // Guard: cannot delete if already in transit or delivered
  if (target.status === 'IN_TRANSIT' || target.status === 'ARRIVED_DC' || target.status === 'DELIVERED') {
    throw new Error(
      `Tidak dapat menghapus Surat Jalan ${target.shipment_number} karena status saat ini ${target.status}. Dokumen pengiriman yang sedang berjalan atau sudah tiba harus dibatalkan, bukan dihapus demi integritas audit trail!`
    );
  }

  // Revert allocated quantities on linked forecast
  if (target.forecast_id) {
    const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
    const fcIndex = forecasts.findIndex((f) => f.id === target.forecast_id);
    if (fcIndex !== -1) {
      const fc = forecasts[fcIndex];
      const revertedShipped = Math.max(0, (fc.total_shipped || 0) - target.total_qty);
      const revertedOutstanding = Math.max(0, fc.total_qty - revertedShipped);

      const revertedFc: Forecast = {
        ...fc,
        total_shipped: revertedShipped,
        outstanding_qty: revertedOutstanding,
        updated_at: new Date().toISOString(),
      };
      revertedFc.status = computeForecastStatus(revertedFc);
      forecasts[fcIndex] = revertedFc;
      setStored(STORAGE_KEYS.FORECASTS, forecasts);
    }
  }

  try {
    await deleteDoc(doc(db, 'shipments', id));
  } catch (err) {
    console.warn('Firebase deleteShipment error:', err);
  }

  const remaining = shipments.filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.SHIPMENTS, remaining);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'SHIPMENTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted Surat Jalan ${target.shipment_number}`,
  });
};
