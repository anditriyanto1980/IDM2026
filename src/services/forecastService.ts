import { Forecast, ForecastItem, ForecastStatus, Customer, DistributionCenter, Region, Product, ExcelForecastRow } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';
import * as XLSX from 'xlsx';

export interface ForecastFilterParams {
  search?: string;
  customerId?: string;
  dcId?: string;
  regionId?: string;
  period?: string;
  status?: string;
}

// Compute dynamic status based on shipment fulfillment and target delivery date
export const computeForecastStatus = (forecast: {
  target_delivery_date: string;
  total_qty: number;
  total_shipped: number;
  total_received: number;
  status: ForecastStatus;
}): ForecastStatus => {
  const today = new Date().toISOString().split('T')[0];
  const isPastTarget = forecast.target_delivery_date < today;

  if (forecast.total_received >= forecast.total_qty && forecast.total_qty > 0) {
    return 'RECEIVED';
  }
  if (isPastTarget && forecast.total_shipped < forecast.total_qty) {
    return 'OVERDUE';
  }
  if (forecast.total_shipped > 0 && forecast.total_shipped < forecast.total_qty) {
    return 'PARTIAL';
  }
  if (forecast.total_shipped >= forecast.total_qty && forecast.total_qty > 0) {
    return 'IN_TRANSIT';
  }
  return forecast.status || 'FORECAST';
};

export const getForecasts = async (filters: ForecastFilterParams = {}): Promise<Forecast[]> => {
  let list: Forecast[] = [];
  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const regions = getStored<Region[]>(STORAGE_KEYS.REGIONS, []);

  try {
    const snap = await getDocs(collection(db, 'forecasts'));
    if (!snap.empty) {
      list = snap.docs.map((d) => d.data() as Forecast);
      setStored(STORAGE_KEYS.FORECASTS, list);
    } else {
      const isResetTotal = typeof window !== 'undefined' && localStorage.getItem('akram_cleared_no_data') === 'true';
      if (isResetTotal) {
        setStored(STORAGE_KEYS.FORECASTS, []);
        return [];
      }
    }
  } catch (err) {
    console.warn('Firebase getForecasts error, fallback to local storage:', err);
  }

  if (list.length === 0) {
    list = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  }

  list = list.filter((f) => {
    const matchCustomer = !filters.customerId || filters.customerId === 'all' || f.customer_id === filters.customerId;
    const matchDc = !filters.dcId || filters.dcId === 'all' || f.dc_id === filters.dcId;
    const matchRegion = !filters.regionId || filters.regionId === 'all' || f.region_id === filters.regionId;
    const matchPeriod = !filters.period || filters.period === 'all' || f.period === filters.period;
    const computedStatus = computeForecastStatus(f);
    const matchStatus = !filters.status || filters.status === 'all' || computedStatus === filters.status || f.status === filters.status;

    const searchLower = (filters.search || '').toLowerCase().trim();
    const matchSearch =
      searchLower === '' ||
      f.forecast_number.toLowerCase().includes(searchLower) ||
      (f.notes && f.notes.toLowerCase().includes(searchLower)) ||
      (f.dc?.dc_name && f.dc.dc_name.toLowerCase().includes(searchLower)) ||
      (f.customer?.customer_name && f.customer.customer_name.toLowerCase().includes(searchLower));

    return matchCustomer && matchDc && matchRegion && matchPeriod && matchStatus && matchSearch;
  });

    // Populate relations
    list = list.map((f) => {
      const cust = customers.find((c) => c.id === f.customer_id);
      const dc = dcs.find((d) => d.id === f.dc_id);
      const reg = regions.find((r) => r.id === (f.region_id || dc?.region_id));
      const computedStatus = computeForecastStatus(f);

      return {
        ...f,
        customer: cust,
        dc: dc,
        region: reg,
        status: computedStatus,
        outstanding_qty: Math.max(0, f.total_qty - f.total_shipped),
      };
    });

  return list;
};

export const getForecastById = async (id: string): Promise<Forecast | null> => {
  const all = await getForecasts({});
  return all.find((f) => f.id === id) || null;
};

// Generate next auto-sequence: FORECAST-YYYYMM-XXXX
export const generateNextForecastNumber = (period: string): string => {
  const cleanPeriod = period.replace(/[^0-9]/g, ''); // "2026-09" -> "202609"
  const stored = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  const prefix = `FORECAST-${cleanPeriod}-`;

  const existingInPeriod = stored.filter((f) => f.forecast_number.startsWith(prefix));
  let maxSeq = 0;

  existingInPeriod.forEach((f) => {
    const seqStr = f.forecast_number.replace(prefix, '');
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
};

export const createForecast = async (
  payload: {
    customer_id: string;
    dc_id: string;
    region_id?: string;
    period: string; // "YYYY-MM"
    forecast_date: string;
    target_delivery_date: string;
    notes?: string;
    items: Array<{
      product_id: string;
      qty_forecast: number;
      unit?: string;
      notes?: string;
    }>;
  },
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Forecast> => {
  if (!payload.customer_id) throw new Error('Customer wajib dipilih.');
  if (!payload.dc_id) throw new Error('Distribution Center wajib dipilih.');
  if (!payload.period) throw new Error('Periode forecast (Bulan-Tahun) wajib diisi.');
  if (!payload.forecast_date) throw new Error('Tanggal forecast wajib diisi.');
  if (!payload.target_delivery_date) throw new Error('Target delivery date wajib diisi.');
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Minimal harus ada 1 item produk kurma dalam forecast.');
  }

  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const targetDc = dcs.find((d) => d.id === payload.dc_id);
  const regionId = payload.region_id || targetDc?.region_id || '';

  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const forecastId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fc-${Date.now()}`;
  const forecastNumber = generateNextForecastNumber(payload.period);

  let totalQty = 0;
  const forecastItems: ForecastItem[] = payload.items.map((item, idx) => {
    const prod = products.find((p) => p.id === item.product_id);
    const qty = Math.max(0, Number(item.qty_forecast) || 0);
    totalQty += qty;

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fci-${Date.now()}-${idx}`,
      forecast_id: forecastId,
      product_id: item.product_id,
      sku: prod?.sku || 'SKU',
      product_name: prod?.product_name || 'Produk Akram',
      qty_forecast: qty,
      qty_shipped: 0,
      qty_received: 0,
      unit: item.unit || prod?.unit || 'PCS',
      notes: item.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  if (totalQty <= 0) {
    throw new Error('Total kuantiti forecast harus lebih besar dari 0.');
  }

  const newForecast: Forecast = {
    id: forecastId,
    forecast_number: forecastNumber,
    customer_id: payload.customer_id,
    dc_id: payload.dc_id,
    region_id: regionId,
    period: payload.period,
    forecast_date: payload.forecast_date,
    target_delivery_date: payload.target_delivery_date,
    notes: payload.notes?.trim() || null,
    status: 'FORECAST',
    total_qty: totalQty,
    total_shipped: 0,
    total_received: 0,
    outstanding_qty: totalQty,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: forecastItems,
  };

  try {
    await setDoc(doc(db, 'forecasts', newForecast.id), newForecast);
  } catch (err: any) {
    console.warn('Firebase save forecast failed, saving locally:', err);
  }

  const existing = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  setStored(STORAGE_KEYS.FORECASTS, [newForecast, ...existing]);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'FORECASTS',
    recordId: newForecast.id,
    description: `${operatorInfo?.userRole || 'SALES'} created forecast ${newForecast.forecast_number} (${newForecast.total_qty.toLocaleString()} pcs)`,
  });

  return newForecast;
};

export const updateForecast = async (
  id: string,
  payload: Partial<Omit<Forecast, 'id' | 'forecast_number' | 'created_at' | 'updated_at'>>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Forecast> => {
  const list = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  const index = list.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Data Forecast tidak ditemukan.');

  const existing = list[index];
  if (existing.total_shipped > 0 && payload.items) {
    throw new Error('Forecast yang sudah memiliki shipment tidak dapat diubah daftar item produknya.');
  }

  const updated: Forecast = {
    ...existing,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (payload.items) {
    const totalQty = payload.items.reduce((sum, item) => sum + (Number(item.qty_forecast) || 0), 0);
    updated.total_qty = totalQty;
    updated.outstanding_qty = Math.max(0, totalQty - updated.total_shipped);
  }

  try {
    await setDoc(doc(db, 'forecasts', id), updated);
  } catch (err) {
    console.warn('Firebase updateForecast error:', err);
  }

  list[index] = updated;
  setStored(STORAGE_KEYS.FORECASTS, list);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'FORECASTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'SALES'} updated forecast ${updated.forecast_number}`,
  });

  return updated;
};

export const deleteForecast = async (
  id: string,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<void> => {
  const list = getStored<Forecast[]>(STORAGE_KEYS.FORECASTS, []);
  const target = list.find((f) => f.id === id);
  if (!target) throw new Error('Forecast tidak ditemukan.');

  // Delete Rule: Forecast cannot be deleted if shipments are already allocated/in transit
  if (target.total_shipped > 0) {
    throw new Error(
      `Tidak dapat menghapus forecast ${target.forecast_number} karena sudah dialokasikan pengiriman (Total Shipped: ${target.total_shipped.toLocaleString()} pcs). Audit trail harus terjaga!`
    );
  }

  try {
    await deleteDoc(doc(db, 'forecasts', id));
  } catch (err: any) {
    console.warn('Firebase deleteForecast error:', err);
  }

  const remaining = list.filter((f) => f.id !== id);
  setStored(STORAGE_KEYS.FORECASTS, remaining);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'DELETE',
    module: 'FORECASTS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} deleted forecast ${target.forecast_number}`,
  });
};

// ==========================================
// EXCEL IMPORT & EXPORT UTILITIES (PHASE 2)
// ==========================================

export const parseExcelForecastFile = async (file: File): Promise<ExcelForecastRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);

  const parsedRows: ExcelForecastRow[] = rawRows.map((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const customerCode = String(row['Customer Code'] || row['Customer'] || row['CustomerCode'] || '').trim().toUpperCase();
    const period = String(row['Periode'] || row['Period'] || '').trim();
    const forecastDate = String(row['Tanggal Forecast'] || row['Forecast Date'] || row['ForecastDate'] || '').trim();
    const dcCode = String(row['DC Code'] || row['DC'] || row['DcCode'] || '').trim().toUpperCase();
    const sku = String(row['SKU'] || row['Product SKU'] || row['Product'] || '').trim().toUpperCase();
    const rawQty = row['Qty Forecast'] || row['Qty'] || row['Quantity'] || 0;
    const qty = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10) || 0;
    const targetDelivery = String(row['Target Delivery'] || row['TargetDelivery'] || '').trim();
    const notes = String(row['Catatan'] || row['Notes'] || '').trim();

    const errors: string[] = [];

    // Validation
    const matchedCustomer = customers.find((c) => c.customer_code.toUpperCase() === customerCode);
    if (!customerCode) {
      errors.push('Customer Code wajib diisi');
    } else if (!matchedCustomer) {
      errors.push(`Customer "${customerCode}" tidak terdaftar di sistem`);
    }

    const matchedDc = dcs.find((d) => d.dc_code.toUpperCase() === dcCode);
    if (!dcCode) {
      errors.push('DC Code wajib diisi');
    } else if (!matchedDc) {
      errors.push(`DC "${dcCode}" tidak terdaftar di sistem`);
    } else if (matchedCustomer && matchedDc.customer_id !== matchedCustomer.id) {
      errors.push(`DC ${dcCode} bukan milik customer ${customerCode}`);
    }

    const matchedProduct = products.find((p) => p.sku.toUpperCase() === sku);
    if (!sku) {
      errors.push('SKU Produk wajib diisi');
    } else if (!matchedProduct) {
      errors.push(`SKU "${sku}" tidak terdaftar di master produk Akram`);
    }

    if (qty <= 0) {
      errors.push('Qty Forecast harus berupa angka lebih besar dari 0');
    }

    if (!period) {
      errors.push('Periode forecast wajib diisi (format: YYYY-MM)');
    }

    if (!targetDelivery) {
      errors.push('Target Delivery wajib diisi');
    }

    return {
      rowNumber,
      customerCode,
      period,
      forecastDate: forecastDate || new Date().toISOString().split('T')[0],
      dcCode,
      sku,
      qty,
      targetDelivery,
      notes,
      isValid: errors.length === 0,
      errors,
    };
  });

  return parsedRows;
};

export const commitExcelForecasts = async (
  rows: ExcelForecastRow[],
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<Forecast[]> => {
  const validRows = rows.filter((r) => r.isValid);
  if (validRows.length === 0) {
    throw new Error('Tidak ada baris valid yang dapat di-import.');
  }

  const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const dcs = getStored<DistributionCenter[]>(STORAGE_KEYS.DCS, []);
  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);

  // Group by (CustomerCode + DcCode + Period + TargetDelivery)
  const grouped: Record<string, ExcelForecastRow[]> = {};
  validRows.forEach((r) => {
    const key = `${r.customerCode}_${r.dcCode}_${r.period}_${r.targetDelivery}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const createdForecasts: Forecast[] = [];

  for (const groupKey of Object.keys(grouped)) {
    const groupItems = grouped[groupKey];
    const first = groupItems[0];

    const customer = customers.find((c) => c.customer_code.toUpperCase() === first.customerCode);
    const dc = dcs.find((d) => d.dc_code.toUpperCase() === first.dcCode);
    if (!customer || !dc) continue;

    const itemsPayload = groupItems.map((r) => {
      const prod = products.find((p) => p.sku.toUpperCase() === r.sku);
      return {
        product_id: prod!.id,
        qty_forecast: r.qty,
        unit: prod?.unit || 'PCS',
        notes: r.notes,
      };
    });

    const newForecast = await createForecast(
      {
        customer_id: customer.id,
        dc_id: dc.id,
        region_id: dc.region_id,
        period: first.period,
        forecast_date: first.forecastDate,
        target_delivery_date: first.targetDelivery,
        notes: first.notes || `Import Excel (${groupItems.length} SKU)`,
        items: itemsPayload,
      },
      operatorInfo
    );

    createdForecasts.push(newForecast);
  }

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'FORECASTS',
    description: `${operatorInfo?.userRole || 'SALES'} imported ${createdForecasts.length} forecast(s) with ${validRows.length} item lines from Excel`,
  });

  return createdForecasts;
};

export const downloadForecastTemplate = (): void => {
  const templateData = [
    {
      'Customer Code': 'IDM',
      'DC Code': 'IDM-BDG',
      'Periode': '2026-09',
      'Tanggal Forecast': '2026-09-01',
      'SKU': 'AKR-KHL-200',
      'Qty Forecast': 5000,
      'Target Delivery': '2026-09-28',
      'Catatan': 'Kebutuhan awal kuartal',
    },
    {
      'Customer Code': 'IDM',
      'DC Code': 'IDM-BDG',
      'Periode': '2026-09',
      'Tanggal Forecast': '2026-09-01',
      'SKU': 'AKR-SHP',
      'Qty Forecast': 3000,
      'Target Delivery': '2026-09-28',
      'Catatan': 'Kebutuhan awal kuartal',
    },
    {
      'Customer Code': 'IDM',
      'DC Code': 'IDM-BDG',
      'Periode': '2026-09',
      'Tanggal Forecast': '2026-09-01',
      'SKU': 'AKR-KHR',
      'Qty Forecast': 2000,
      'Target Delivery': '2026-09-28',
      'Catatan': 'Kebutuhan awal kuartal',
    },
    {
      'Customer Code': 'IGR',
      'DC Code': 'IGR-JKT',
      'Periode': '2026-09',
      'Tanggal Forecast': '2026-09-05',
      'SKU': 'AKR-KHL-200',
      'Qty Forecast': 8000,
      'Target Delivery': '2026-09-30',
      'Catatan': 'Alokasi grosir Jabodetabek',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Customer Code
    { wch: 15 }, // DC Code
    { wch: 12 }, // Periode
    { wch: 18 }, // Tanggal Forecast
    { wch: 18 }, // SKU
    { wch: 15 }, // Qty Forecast
    { wch: 18 }, // Target Delivery
    { wch: 28 }, // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Forecast Akram');
  XLSX.writeFile(wb, 'Template_Forecast_Akram.xlsx');
};
