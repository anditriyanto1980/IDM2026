import {
  ShipmentMilestone,
  MilestoneType,
  Shipment,
  ShipmentStatus,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';
import { getShipments, updateShipmentStatus } from './shipmentService';

export interface AddMilestonePayload {
  shipment_id: string;
  milestone_type: MilestoneType;
  title: string;
  location: string;
  notes?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
}

export const getMilestonesByShipment = async (
  shipmentId: string
): Promise<ShipmentMilestone[]> => {
  let list: ShipmentMilestone[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('shipment_milestones')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('timestamp', { ascending: true });

      if (!error && data) {
        list = data as ShipmentMilestone[];
      }
    } catch (err) {
      console.warn('Supabase getMilestones error, fallback to local storage:', err);
    }
  }

  if (list.length === 0) {
    const stored = getStored<ShipmentMilestone[]>(STORAGE_KEYS.MILESTONES, []);
    list = stored
      .filter((m) => m.shipment_id === shipmentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  return list;
};

export const getAllMilestones = async (): Promise<ShipmentMilestone[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('shipment_milestones')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        return data as ShipmentMilestone[];
      }
    } catch (err) {
      console.warn('Supabase getAllMilestones error:', err);
    }
  }

  return getStored<ShipmentMilestone[]>(STORAGE_KEYS.MILESTONES, []);
};

export const addMilestone = async (
  payload: AddMilestonePayload,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<ShipmentMilestone> => {
  if (!payload.shipment_id) throw new Error('Shipment ID wajib disertakan.');
  if (!payload.title?.trim()) throw new Error('Judul checkpoint/milestone wajib diisi.');
  if (!payload.location?.trim()) throw new Error('Lokasi checkpoint wajib diisi.');

  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const targetShipment = shipments.find((s) => s.id === payload.shipment_id);
  if (!targetShipment) throw new Error('Data Surat Jalan tidak ditemukan.');

  const milestoneId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `mile-${Date.now()}`;

  const newMilestone: ShipmentMilestone = {
    id: milestoneId,
    shipment_id: payload.shipment_id,
    milestone_type: payload.milestone_type,
    title: payload.title.trim(),
    location: payload.location.trim(),
    notes: payload.notes?.trim() || null,
    timestamp: payload.timestamp || new Date().toISOString(),
    recorded_by: operatorInfo?.userEmail || 'Petugas Tracking Logistik',
    is_completed: true,
    latitude: payload.latitude || null,
    longitude: payload.longitude || null,
  };

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('shipment_milestones').insert([
        {
          id: newMilestone.id,
          shipment_id: newMilestone.shipment_id,
          milestone_type: newMilestone.milestone_type,
          title: newMilestone.title,
          location: newMilestone.location,
          notes: newMilestone.notes,
          timestamp: newMilestone.timestamp,
          recorded_by: newMilestone.recorded_by,
          is_completed: newMilestone.is_completed,
        },
      ]);
      if (error) console.warn('Supabase addMilestone error:', error);
    } catch (err) {
      console.warn('Supabase addMilestone error:', err);
    }
  }

  // Persist locally
  const existingMilestones = getStored<ShipmentMilestone[]>(STORAGE_KEYS.MILESTONES, []);
  setStored(STORAGE_KEYS.MILESTONES, [...existingMilestones, newMilestone]);

  // Status auto-progression on Shipment based on Milestone
  let correspondingStatus: ShipmentStatus | null = null;
  if (
    payload.milestone_type === 'DEPARTED_WAREHOUSE' ||
    payload.milestone_type === 'IN_TRANSIT_CHECKPOINT'
  ) {
    if (targetShipment.status === 'READY_TO_DISPATCH' || targetShipment.status === 'DRAFT') {
      correspondingStatus = 'IN_TRANSIT';
    }
  } else if (
    payload.milestone_type === 'ARRIVED_DC_GATE' ||
    payload.milestone_type === 'UNLOADING_INSPECTION'
  ) {
    if (targetShipment.status === 'IN_TRANSIT' || targetShipment.status === 'READY_TO_DISPATCH') {
      correspondingStatus = 'ARRIVED_DC';
    }
  } else if (payload.milestone_type === 'COMPLETED_RECEIVED') {
    if (targetShipment.status !== 'DELIVERED') {
      correspondingStatus = 'DELIVERED';
    }
  }

  if (correspondingStatus) {
    await updateShipmentStatus(targetShipment.id, correspondingStatus, undefined, operatorInfo);
  }

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'TRACKING',
    recordId: targetShipment.id,
    description: `${operatorInfo?.userRole || 'LOGISTICS'} logged milestone [${newMilestone.title}] at ${newMilestone.location} for ${targetShipment.shipment_number}`,
  });

  return newMilestone;
};

export interface LiveFleetSummary {
  totalArmada: number;
  inTransit: number;
  arrivedDc: number;
  readyToDispatch: number;
  deliveredToday: number;
  delayedCount: number;
  onTimeRate: number;
}

export const getLiveFleetSummary = (shipments: Shipment[]): LiveFleetSummary => {
  const todayStr = new Date().toISOString().split('T')[0];

  let inTransit = 0;
  let arrivedDc = 0;
  let readyToDispatch = 0;
  let deliveredToday = 0;
  let delayedCount = 0;
  let onTimeEligible = 0;
  let onTimeMet = 0;

  shipments.forEach((s) => {
    if (s.status === 'IN_TRANSIT') {
      inTransit++;
      if (s.estimated_arrival_date < todayStr) {
        delayedCount++;
      } else {
        onTimeMet++;
      }
      onTimeEligible++;
    } else if (s.status === 'ARRIVED_DC') {
      arrivedDc++;
      if (s.estimated_arrival_date < todayStr) {
        delayedCount++;
      } else {
        onTimeMet++;
      }
      onTimeEligible++;
    } else if (s.status === 'READY_TO_DISPATCH') {
      readyToDispatch++;
    } else if (s.status === 'DELIVERED') {
      if (s.actual_arrival_date === todayStr || s.updated_at.startsWith(todayStr)) {
        deliveredToday++;
      }
      if (s.actual_arrival_date && s.actual_arrival_date <= s.estimated_arrival_date) {
        onTimeMet++;
      }
      onTimeEligible++;
    }
  });

  const onTimeRate =
    onTimeEligible > 0 ? Math.round((onTimeMet / onTimeEligible) * 100) : 100;

  return {
    totalArmada: shipments.length,
    inTransit,
    arrivedDc,
    readyToDispatch,
    deliveredToday,
    delayedCount,
    onTimeRate,
  };
};

export const searchWaybill = async (
  query: string
): Promise<{ shipment: Shipment; milestones: ShipmentMilestone[] } | null> => {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const shipments = await getShipments({});
  const found = shipments.find(
    (s) =>
      s.shipment_number.toLowerCase() === q ||
      (s.tracking_number_ref && s.tracking_number_ref.toLowerCase() === q) ||
      (s.vehicle_plate_number &&
        s.vehicle_plate_number.toLowerCase().replace(/\s/g, '') === q.replace(/\s/g, ''))
  );

  if (!found) return null;

  const milestones = await getMilestonesByShipment(found.id);
  return { shipment: found, milestones };
};
