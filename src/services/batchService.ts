import { BatchTraceItem, Product, Shipment, ReceivingInspection } from '../types';
import { getStored, STORAGE_KEYS } from '../lib/storage';

export const MASTER_BATCHES: Array<{
  batch_number: string;
  sku: string;
  production_date: string;
  expiry_date: string;
  total_produced_qty: number;
}> = [
  {
    batch_number: 'BATCH-202608-K1',
    sku: 'AKR-KHL-200',
    production_date: '2026-08-01',
    expiry_date: '2027-08-30',
    total_produced_qty: 25000,
  },
  {
    batch_number: 'BATCH-202608-S1',
    sku: 'AKR-SHP',
    production_date: '2026-08-05',
    expiry_date: '2027-08-30',
    total_produced_qty: 15000,
  },
  {
    batch_number: 'BATCH-202608-R1',
    sku: 'AKR-KHR',
    production_date: '2026-08-10',
    expiry_date: '2027-08-30',
    total_produced_qty: 10000,
  },
  {
    batch_number: 'BATCH-202609-K2',
    sku: 'AKR-KHL-200',
    production_date: '2026-09-01',
    expiry_date: '2027-09-15',
    total_produced_qty: 30000,
  },
  {
    batch_number: 'BATCH-202609-S2',
    sku: 'AKR-SHP',
    production_date: '2026-09-05',
    expiry_date: '2027-09-15',
    total_produced_qty: 20000,
  },
];

export const getBatchTraceability = async (): Promise<BatchTraceItem[]> => {
  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const inspections = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);

  const now = Date.now();

  return MASTER_BATCHES.map((b) => {
    const prod = products.find((p) => p.sku === b.sku);

    // Sum shipped for this batch
    let totalShipped = 0;
    shipments.forEach((s) => {
      (s.items || []).forEach((si) => {
        if (si.batch_number === b.batch_number || (!si.batch_number && si.sku === b.sku)) {
          totalShipped += si.qty_shipped || 0;
        }
      });
    });

    // Sum received good & damaged
    let totalReceivedGood = 0;
    let totalDamaged = 0;
    inspections.forEach((insp) => {
      (insp.items || []).forEach((ii) => {
        if (ii.batch_number_verified === b.batch_number || (!ii.batch_number_verified && ii.sku === b.sku)) {
          totalReceivedGood += ii.qty_good || 0;
          totalDamaged += ii.qty_damaged || 0;
        }
      });
    });

    const warehouseBalance = Math.max(0, b.total_produced_qty - totalShipped);
    const expTime = new Date(b.expiry_date).getTime();
    const remainingDays = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));

    let shelfLifeStatus: BatchTraceItem['shelf_life_status'] = 'FRESH';
    if (remainingDays > 240) shelfLifeStatus = 'FRESH';
    else if (remainingDays > 120) shelfLifeStatus = 'GOOD';
    else if (remainingDays > 60) shelfLifeStatus = 'WARNING';
    else shelfLifeStatus = 'CRITICAL';

    return {
      batch_number: b.batch_number,
      sku: b.sku,
      product_name: prod?.product_name || 'Produk Akram',
      production_date: b.production_date,
      expiry_date: b.expiry_date,
      total_produced_qty: b.total_produced_qty,
      total_shipped_qty: totalShipped,
      total_received_good_qty: totalReceivedGood,
      total_damaged_qty: totalDamaged,
      warehouse_stock_balance: warehouseBalance,
      remaining_shelf_life_days: remainingDays,
      shelf_life_status: shelfLifeStatus,
    };
  });
};

export interface BatchMovementItem {
  shipment_number: string;
  shipment_date: string;
  customer_name: string;
  dc_name: string;
  qty_shipped: number;
  qty_good?: number;
  qty_damaged?: number;
  status: string;
}

export const getBatchMovement = async (batchNumber: string): Promise<BatchMovementItem[]> => {
  const shipments = getStored<Shipment[]>(STORAGE_KEYS.SHIPMENTS, []);
  const inspections = getStored<ReceivingInspection[]>(STORAGE_KEYS.RECEIVING_INSPECTIONS, []);

  const results: BatchMovementItem[] = [];

  shipments.forEach((s) => {
    const matchingItems = (s.items || []).filter((si) => si.batch_number === batchNumber);
    if (matchingItems.length > 0) {
      const shippedQty = matchingItems.reduce((acc, it) => acc + it.qty_shipped, 0);
      const matchInsp = inspections.find((i) => i.shipment_id === s.id);

      let goodQty: number | undefined = undefined;
      let dmgQty: number | undefined = undefined;

      if (matchInsp) {
        const inspItems = (matchInsp.items || []).filter((ii) => ii.batch_number_verified === batchNumber);
        if (inspItems.length > 0) {
          goodQty = inspItems.reduce((acc, it) => acc + it.qty_good, 0);
          dmgQty = inspItems.reduce((acc, it) => acc + it.qty_damaged, 0);
        }
      }

      results.push({
        shipment_number: s.shipment_number,
        shipment_date: s.shipment_date,
        customer_name: s.customer?.customer_name || 'Customer',
        dc_name: s.dc?.dc_name || 'DC Tujuan',
        qty_shipped: shippedQty,
        qty_good: goodQty,
        qty_damaged: dmgQty,
        status: s.status,
      });
    }
  });

  return results;
};
