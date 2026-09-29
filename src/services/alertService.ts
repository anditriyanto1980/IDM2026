import {
  LogisticsNotification,
  Forecast,
  Shipment,
  WarehouseInventory,
  ReceivingInspection,
  DiscrepancyClaim,
} from '../types';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import {
  INITIAL_FORECASTS,
  INITIAL_SHIPMENTS,
  INITIAL_WAREHOUSE_INVENTORY,
  INITIAL_CLAIMS,
  INITIAL_NOTIFICATIONS,
} from '../constants/initialData';

export interface SystemAlert {
  id: string;
  type: 'CRITICAL_STOCK' | 'OVERDUE_FORECAST' | 'SHIPMENT_DELAY' | 'BAST_DISCREPANCY' | 'UNSETTLED_CLAIM';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  targetId?: string;
  timestamp: string;
  isRead: boolean;
}

export const getSystemAlerts = async (): Promise<SystemAlert[]> => {
  const forecasts = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const inventory = getStored<WarehouseInventory[]>(STORAGE_KEYS.WAREHOUSE_INVENTORY, []);
  const claims = getStored<DiscrepancyClaim[]>(STORAGE_KEYS.CLAIMS, []);

  const alerts: SystemAlert[] = [];
  const now = new Date();

  // 1. Critical Inventory Stock Alerts
  inventory.forEach((item) => {
    if (item.stock_status === 'CRITICAL_LOW') {
      alerts.push({
        id: `alert-stock-${item.id}`,
        type: 'CRITICAL_STOCK',
        severity: 'CRITICAL',
        title: `Stok Kritis: ${item.sku} di ${item.warehouse_name.split('(')[0].trim()}`,
        description: `Stok bebas (ATP) tersisa ${item.stock_available.toLocaleString('id-ID')} pcs, berada di bawah batas safety stock (${item.safety_stock.toLocaleString('id-ID')} pcs).`,
        actionLabel: 'Lihat Stok Gudang',
        actionRoute: 'inventory',
        targetId: item.id,
        timestamp: item.updated_at || now.toISOString(),
        isRead: false,
      });
    } else if (item.stock_status === 'REORDER_POINT') {
      alerts.push({
        id: `alert-stock-reorder-${item.id}`,
        type: 'CRITICAL_STOCK',
        severity: 'WARNING',
        title: `Reorder Warning: ${item.sku} di ${item.warehouse_name.split('(')[0].trim()}`,
        description: `Stok bebas telah menyentuh batas Reorder Point (${item.reorder_point.toLocaleString('id-ID')} pcs). Diperlukan perencanaan batch produksi baru.`,
        actionLabel: 'Tambah Inbound',
        actionRoute: 'inventory',
        targetId: item.id,
        timestamp: item.updated_at || now.toISOString(),
        isRead: false,
      });
    }
  });

  // 2. Overdue Forecast Alerts
  forecasts.forEach((f) => {
    if (f.status === 'OVERDUE') {
      alerts.push({
        id: `alert-fc-${f.id}`,
        type: 'OVERDUE_FORECAST',
        severity: 'CRITICAL',
        title: `Forecast Terlambat: ${f.forecast_number}`,
        description: `Target pengiriman ke ${f.dc?.dc_name || 'DC'} telah melewati batas waktu (${f.target_delivery_date}). Kuantiti outstanding: ${f.outstanding_qty.toLocaleString('id-ID')} pcs.`,
        actionLabel: 'Alokasikan Shipment',
        actionRoute: 'shipment',
        targetId: f.id,
        timestamp: f.created_at,
        isRead: false,
      });
    }
  });

  // 3. Delayed Shipments
  shipments.forEach((s) => {
    if (s.status === 'IN_TRANSIT' && s.estimated_arrival_date) {
      const est = new Date(s.estimated_arrival_date);
      if (now > est) {
        alerts.push({
          id: `alert-shp-${s.id}`,
          type: 'SHIPMENT_DELAY',
          severity: 'WARNING',
          title: `Potensi Keterlambatan Truk: ${s.shipment_number}`,
          description: `Armada ${s.transporter_name} (${s.vehicle_plate_number || 'Truk Box'}) menuju ${s.dc?.dc_name || 'DC'} telah melampaui estimasi ketibaan (${s.estimated_arrival_date}).`,
          actionLabel: 'Pantau Live Tracking',
          actionRoute: 'tracking',
          targetId: s.id,
          timestamp: s.shipment_date,
          isRead: false,
        });
      }
    }
  });

  // 4. Unsettled Claims
  claims.forEach((c) => {
    if (c.status === 'SUBMITTED' || c.status === 'INVESTIGATING') {
      alerts.push({
        id: `alert-clm-${c.id}`,
        type: 'UNSETTLED_CLAIM',
        severity: 'WARNING',
        title: `Klaim Retur Menunggu Penyelesaian: ${c.claim_number}`,
        description: `Klaim kerusakan ${c.total_damaged_qty} pcs senilai Rp ${c.estimated_loss_amount.toLocaleString('id-ID')} pada BAST ${c.bast_number} memerlukan verifikasi ganti rugi.`,
        actionLabel: 'Selesaikan Klaim',
        actionRoute: 'claims',
        targetId: c.id,
        timestamp: c.created_at,
        isRead: false,
      });
    }
  });

  return alerts;
};
