import {
  ReceivingInspection,
  ReceivingInspectionItem,
  CreateReceivingPayload,
  DiscrepancyStatus,
  Shipment,
  Customer,
  DistributionCenter,
  Forecast,
} from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';
import { updateShipmentStatus } from './shipmentService';
import { addMilestone } from './trackingService';
import { computeForecastStatus } from './forecastService';

// Auto-sequence generator: BAST-YYYYMM-XXXX
export const generateNextBastNumber = (dateStr: string): string => {
  const period = dateStr.slice(0, 7).replace(/[^0-9]/g, ''); // "2026-09" -> "202609"
  const stored = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
  const prefix = `BAST-${period}-`;

  const existingInPeriod = stored.filter((r) => r.bast_number.startsWith(prefix));
  let maxSeq = 0;

  existingInPeriod.forEach((r) => {
    const seqStr = r.bast_number.replace(prefix, '');
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
};

export interface ReceivingFilterParams {
  search?: string;
  customerId?: string;
  dcId?: string;
  discrepancyStatus?: string;
}

export const getReceivingInspections = async (
  filters: ReceivingFilterParams = {}
): Promise<ReceivingInspection[]> => {
  let list: ReceivingInspection[] = [];
  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);

  try {
    const snap = await getDocs(collection(db, 'receiving_inspections'));
    if (!snap.empty) {
      list = snap.docs.map((d) => d.data() as ReceivingInspection);
      setStored(STORAGE_KEYS.RECEIVING_INSPECTIONS, list);
    } else {
      const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
      if (isResetTotal) {
        setStored(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
        return [];
      }
    }
  } catch (err) {
    console.warn('Firebase getReceivingInspections error, fallback to local:', err);
  }

  if (list.length === 0) {
    list = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
  }

  return list;
};

export const getInspectionByShipmentId = async (
  shipmentId: string
): Promise<ReceivingInspection | null> => {
  const all = await getReceivingInspections({});
  return all.find((r) => r.shipment_id === shipmentId) || null;
};

export const getPendingReceivingShipments = async (): Promise<Shipment[]> => {
  const storedShipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const storedInspections = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
  const inspectedShipmentIds = new Set(storedInspections.map((i) => i.shipment_id));

  // Shipments that are in transit, arrived at DC, or ready to dispatch and not yet inspected
  return storedShipments.filter(
    (s) =>
      !inspectedShipmentIds.has(s.id) &&
      (s.status === 'ARRIVED_DC' || s.status === 'IN_TRANSIT' || s.status === 'READY_TO_DISPATCH')
  );
};

export const createReceivingInspection = async (
  payload: CreateReceivingPayload,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<ReceivingInspection> => {
  if (!payload.shipment_id) throw new Error('Shipment ID wajib disertakan.');
  if (!payload.received_date) throw new Error('Tanggal penerimaan fisik wajib diisi.');
  if (!payload.receiver_name?.trim()) throw new Error('Nama petugas penerima DC wajib diisi.');
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Detail pemeriksaan item produk kurma wajib diisi.');
  }

  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const targetShipment = shipments.find((s) => s.id === payload.shipment_id);
  if (!targetShipment) throw new Error('Data Surat Jalan tidak ditemukan.');

  // Check if already inspected
  const existingInspections = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
  if (existingInspections.some((i) => i.shipment_id === payload.shipment_id)) {
    throw new Error(`Surat Jalan ${targetShipment.shipment_number} sudah memiliki Berita Acara Serah Terima (BAST).`);
  }

  const bastNumber = generateNextBastNumber(payload.received_date);
  const inspectionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `rec-${Date.now()}`;

  let totalShipped = 0;
  let totalGood = 0;
  let totalDamaged = 0;
  let totalShortage = 0;

  const inspectionItems: ReceivingInspectionItem[] = payload.items.map((item, idx) => {
    const shipped = Number(item.qty_shipped) || 0;
    const good = Number(item.qty_good) || 0;
    const damaged = Math.max(0, Number(item.qty_damaged) || 0);
    const shortage = Math.max(0, Number(item.qty_shortage) || (shipped - good - damaged));

    totalShipped += shipped;
    totalGood += good;
    totalDamaged += damaged;
    totalShortage += shortage;

    return {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rec-item-${Date.now()}-${idx}`,
      inspection_id: inspectionId,
      shipment_item_id: item.shipment_item_id,
      product_id: item.product_id,
      sku: item.sku,
      product_name: item.product_name,
      qty_shipped: shipped,
      qty_good: good,
      qty_damaged: damaged,
      qty_shortage: shortage,
      unit: item.unit || 'PCS',
      damage_reason: item.damage_reason?.trim() || null,
      expiry_date_verified: item.expiry_date_verified || null,
      batch_number_verified: item.batch_number_verified || null,
    };
  });

  // Calculate discrepancy status
  let discrepancyStatus: DiscrepancyStatus = 'CLEAN_PASS';
  if (totalGood === 0 && totalShipped > 0) {
    discrepancyStatus = 'REJECTED';
  } else if (totalShortage > 0) {
    discrepancyStatus = 'SHORTAGE';
  } else if (totalDamaged > 0) {
    discrepancyStatus = 'PARTIAL_DAMAGE';
  }

  const newInspection: ReceivingInspection = {
    id: inspectionId,
    bast_number: bastNumber,
    shipment_id: targetShipment.id,
    shipment_number: targetShipment.shipment_number,
    forecast_id: targetShipment.forecast_id,
    forecast_number: targetShipment.forecast_number,
    customer_id: targetShipment.customer_id,
    dc_id: targetShipment.dc_id,
    received_date: payload.received_date,
    receiver_name: payload.receiver_name.trim(),
    receiver_role: payload.receiver_role || 'Petugas Inbound Receiving DC',
    receiver_nip: payload.receiver_nip?.trim() || null,
    driver_name: payload.driver_name || targetShipment.driver_name || null,
    driver_plate_number: targetShipment.vehicle_plate_number || null,
    warehouse_supervisor_name: payload.warehouse_supervisor_name?.trim() || 'Kepala Gudang DC',
    total_shipped_qty: totalShipped,
    total_good_qty: totalGood,
    total_damaged_qty: totalDamaged,
    total_shortage_qty: totalShortage,
    discrepancy_status: discrepancyStatus,
    general_notes: payload.general_notes?.trim() || null,
    proof_attachment_name: payload.proof_attachment_name || null,
    proof_attachment_url: payload.proof_attachment_url || null,
    signed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: inspectionItems,
  };

  try {
    await setDoc(doc(db, 'receiving_inspections', newInspection.id), newInspection);
  } catch (err) {
    console.warn('Firebase createReceivingInspection error, saving locally:', err);
  }

  // Persist locally
  setStored(STORAGE_KEYS.RECEIVING_INSPECTIONS, [newInspection, ...existingInspections]);

  // Update Shipment status to DELIVERED
  await updateShipmentStatus(
    targetShipment.id,
    'DELIVERED',
    payload.received_date,
    operatorInfo
  );

  // Add final completed milestone to tracking
  await addMilestone(
    {
      shipment_id: targetShipment.id,
      milestone_type: 'COMPLETED_RECEIVED',
      title: `Serah Terima DC Selesai (${bastNumber})`,
      location: `Inbound Receiving DC (${newInspection.receiver_name})`,
      notes: `Fisik diterima: ${totalGood.toLocaleString()} pcs baik, ${totalDamaged.toLocaleString()} pcs rusak, ${totalShortage.toLocaleString()} pcs selisih. Status BAST: ${discrepancyStatus}.`,
      timestamp: new Date().toISOString(),
    },
    operatorInfo
  );

  // Update Forecast total_received and items if applicable
  if (targetShipment.forecast_id) {
    const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
    const fcIndex = forecasts.findIndex((f) => f.id === targetShipment.forecast_id);
    if (fcIndex !== -1) {
      const fc = forecasts[fcIndex];
      const updatedTotalReceived = (fc.total_received || 0) + totalGood;
      const updatedFc: Forecast = {
        ...fc,
        total_received: updatedTotalReceived,
        updated_at: new Date().toISOString(),
      };
      updatedFc.status = computeForecastStatus(updatedFc);
      forecasts[fcIndex] = updatedFc;
      setStored(STORAGE_KEYS.FORECASTS, forecasts);
    }
  }

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'RECEIVING',
    recordId: newInspection.id,
    description: `${operatorInfo?.userRole || 'RECEIVING'} issued BAST ${bastNumber} for SJ ${targetShipment.shipment_number} (${totalGood.toLocaleString()} pcs good, ${totalDamaged.toLocaleString()} pcs damaged)`,
  });

  return newInspection;
};
