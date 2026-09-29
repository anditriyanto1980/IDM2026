import {
  DiscrepancyClaim,
  ClaimItem,
  CreateClaimPayload,
  ClaimStatus,
  ClaimResolutionType,
  ResponsibleParty,
  ReceivingInspection,
  Shipment,
  Customer,
  DistributionCenter,
} from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';
import { getReceivingInspections } from './receivingService';

// Sequence generator: CLM-YYYYMM-XXXX
export const generateNextClaimNumber = (dateStr: string): string => {
  const period = dateStr.slice(0, 7).replace(/[^0-9]/g, ''); // "2026-09" -> "202609"
  const stored = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);
  const prefix = `CLM-${period}-`;

  const existingInPeriod = stored.filter((c) => c.claim_number.startsWith(prefix));
  let maxSeq = 0;

  existingInPeriod.forEach((c) => {
    const seqStr = c.claim_number.replace(prefix, '');
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
};

export interface ClaimFilterParams {
  search?: string;
  customerId?: string;
  status?: string;
  responsibleParty?: string;
}

export const getClaims = async (
  filters: ClaimFilterParams = {}
): Promise<DiscrepancyClaim[]> => {
  let list: DiscrepancyClaim[] = [];
  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);

  try {
    const snap = await getDocs(collection(db, 'claims'));
    if (!snap.empty) {
      list = snap.docs.map((d) => d.data() as DiscrepancyClaim);
      setStored(STORAGE_KEYS.CLAIMS, list);
    } else {
      const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
      if (isResetTotal) {
        setStored(STORAGE_KEYS.CLAIMS, []);
        return [];
      }
    }
  } catch (err) {
    console.warn('Firebase getClaims error, fallback to local storage:', err);
  }

  if (list.length === 0) {
    list = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);
  }

  return list;
};

export const getClaimById = async (id: string): Promise<DiscrepancyClaim | null> => {
  const all = await getClaims({});
  return all.find((c) => c.id === id) || null;
};

export const getBastsEligibleForClaim = async (): Promise<ReceivingInspection[]> => {
  const inspections = await getReceivingInspections({});
  const existingClaims = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);
  const claimedBastIds = new Set(existingClaims.map((c) => c.bast_id));

  // Eligible BAST: has damaged items or shortage, and no active claim yet
  return inspections.filter(
    (i) =>
      !claimedBastIds.has(i.id) &&
      (i.total_damaged_qty > 0 || i.total_shortage_qty > 0)
  );
};

export const createClaim = async (
  payload: CreateClaimPayload,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<DiscrepancyClaim> => {
  if (!payload.bast_id) throw new Error('BAST ID wajib disertakan.');
  if (!payload.claim_date) throw new Error('Tanggal klaim wajib diisi.');
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Minimal harus ada 1 item barang rusak/selisih yang diklaim.');
  }

  const inspections = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);
  const bast = inspections.find((i) => i.id === payload.bast_id);
  if (!bast) throw new Error('Data BAST rujukan tidak ditemukan.');

  const claimId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `clm-${Date.now()}`;
  const claimNumber = generateNextClaimNumber(payload.claim_date);

  let totalDamaged = 0;
  let totalShortage = 0;
  let estimatedLoss = 0;

  const claimItems: ClaimItem[] = payload.items.map((it, idx) => {
    const dmg = Number(it.qty_damaged) || 0;
    const sht = Number(it.qty_shortage) || 0;
    const unitPrice = Number(it.unit_price_estimate) || 25000;
    const subtotal = (dmg + sht) * unitPrice;

    totalDamaged += dmg;
    totalShortage += sht;
    estimatedLoss += subtotal;

    return {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `clm-item-${Date.now()}-${idx}`,
      claim_id: claimId,
      product_id: it.product_id,
      sku: it.sku,
      product_name: it.product_name,
      qty_damaged: dmg,
      qty_shortage: sht,
      unit_price_estimate: unitPrice,
      subtotal_loss_estimate: subtotal,
      unit: it.unit || 'PCS',
      damage_reason: it.damage_reason?.trim() || null,
      batch_number: it.batch_number?.trim() || null,
    };
  });

  const newClaim: DiscrepancyClaim = {
    id: claimId,
    claim_number: claimNumber,
    bast_id: bast.id,
    bast_number: bast.bast_number,
    shipment_id: bast.shipment_id,
    shipment_number: bast.shipment_number,
    customer_id: bast.customer_id,
    dc_id: bast.dc_id,
    claim_date: payload.claim_date,
    responsible_party: payload.responsible_party,
    total_damaged_qty: totalDamaged,
    total_shortage_qty: totalShortage,
    estimated_loss_amount: estimatedLoss,
    resolution_type: null,
    replacement_shipment_number: null,
    status: 'INVESTIGATING',
    investigation_notes: payload.investigation_notes?.trim() || null,
    resolution_notes: null,
    evidence_photo_url: null,
    settled_at: null,
    created_by: operatorInfo?.userEmail || 'Petugas Mutu Logistik',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: claimItems,
  };

  try {
    await setDoc(doc(db, 'claims', newClaim.id), newClaim);
  } catch (err) {
    console.warn('Firebase createClaim error:', err);
  }

  // Persist locally
  const existingClaims = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);
  setStored(STORAGE_KEYS.CLAIMS, [newClaim, ...existingClaims]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'CLAIMS',
    recordId: newClaim.id,
    description: `${operatorInfo?.userRole || 'RECEIVING'} submitted Claim ${newClaim.claim_number} for BAST ${bast.bast_number} (${totalDamaged} damaged pcs)`,
  });

  return newClaim;
};

export const updateClaimResolution = async (
  id: string,
  resolution: {
    status: ClaimStatus;
    resolution_type?: ClaimResolutionType;
    replacement_shipment_number?: string;
    resolution_notes?: string;
  },
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<DiscrepancyClaim> => {
  const claims = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Data Klaim tidak ditemukan.');

  const existing = claims[index];
  const updated: DiscrepancyClaim = {
    ...existing,
    status: resolution.status,
    resolution_type: resolution.resolution_type || existing.resolution_type,
    replacement_shipment_number:
      resolution.replacement_shipment_number?.trim() || existing.replacement_shipment_number,
    resolution_notes: resolution.resolution_notes?.trim() || existing.resolution_notes,
    settled_at:
      resolution.status === 'SETTLED' || resolution.status === 'REPLACED'
        ? new Date().toISOString()
        : existing.settled_at,
    updated_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'claims', id), updated);
  } catch (err) {
    console.warn('Firebase updateClaimResolution error:', err);
  }

  claims[index] = updated;
  setStored(STORAGE_KEYS.CLAIMS, claims);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'CLAIMS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'WAREHOUSE'} updated Claim ${updated.claim_number} status to ${resolution.status} (${resolution.resolution_type || 'Resolution'})`,
  });

  return updated;
};
