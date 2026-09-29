import {
  Forecast,
  Shipment,
  ReceivingInspection,
  Customer,
  DistributionCenter,
  Product,
  Region,
} from '../types';
import { getStored, STORAGE_KEYS } from '../lib/storage';
import { getForecasts } from './forecastService';
import { getShipments } from './shipmentService';
import { getReceivingInspections } from './receivingService';
import { getCustomers } from './customerService';
import { getDistributionCenters } from './dcService';
import { getProducts } from './productService';
import { getRegions } from './regionService';
import * as XLSX from 'xlsx';

export interface ReportFilterOptions {
  period?: string;
  customerId?: string;
  dcId?: string;
  regionId?: string;
}

export interface ExecutiveReportData {
  // Volume KPIs
  totalForecastQty: number;
  totalShippedQty: number;
  totalReceivedQty: number;
  totalOutstandingQty: number;
  fulfillmentRate: number; // shipped vs forecast %
  receivingRate: number; // received vs forecast %
  acceptanceRate: number; // good vs total received %

  // Logistics & Armada KPIs
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  arrivedDcShipments: number;
  readyShipments: number;
  onTimeDeliveryRate: number;

  // Quality & Discrepancy KPIs
  totalGoodQty: number;
  totalDamagedQty: number;
  totalShortageQty: number;
  cleanPassBasts: number;
  totalBasts: number;

  // Breakdowns
  customersBreakdown: CustomerBreakdownItem[];
  dcsBreakdown: DcBreakdownItem[];
  productsBreakdown: ProductBreakdownItem[];
  transportersBreakdown: TransporterBreakdownItem[];
}

export interface CustomerBreakdownItem {
  customerId: string;
  customerCode: string;
  customerName: string;
  forecastQty: number;
  shippedQty: number;
  receivedQty: number;
  outstandingQty: number;
  fulfillmentRate: number;
  totalShipments: number;
  damagedQty: number;
  damageRate: number;
  dcCount: number;
}

export interface DcBreakdownItem {
  dcId: string;
  dcCode: string;
  dcName: string;
  customerName: string;
  regionName: string;
  forecastQty: number;
  shippedQty: number;
  receivedQty: number;
  outstandingQty: number;
  fulfillmentRate: number;
  shipmentCount: number;
  status: 'OPTIMAL' | 'ON_TRACK' | 'ATTENTION' | 'PENDING';
}

export interface ProductBreakdownItem {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  forecastQty: number;
  shippedQty: number;
  receivedQty: number;
  outstandingQty: number;
  fulfillmentRate: number;
  volumeShare: number;
}

export interface TransporterBreakdownItem {
  transporterName: string;
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  totalUnitsCarried: number;
  totalUnitsDamaged: number;
  onTimeDeliveries: number;
  onTimeRate: number;
  damageRate: number;
}

export const generateExecutiveReport = async (
  filters: ReportFilterOptions = {}
): Promise<ExecutiveReportData> => {
  const [
    rawForecasts,
    rawShipments,
    rawInspections,
    customers,
    dcs,
    products,
    regions,
  ] = await Promise.all([
    getForecasts({}),
    getShipments({}),
    getReceivingInspections({}),
    getCustomers(),
    getDistributionCenters(),
    getProducts(),
    getRegions(),
  ]);

  // Apply filters
  const forecasts = rawForecasts.filter((f) => {
    if (filters.period && filters.period !== 'all' && f.period !== filters.period) return false;
    if (filters.customerId && filters.customerId !== 'all' && f.customer_id !== filters.customerId) return false;
    if (filters.dcId && filters.dcId !== 'all' && f.dc_id !== filters.dcId) return false;
    return true;
  });

  const shipments = rawShipments.filter((s) => {
    if (filters.customerId && filters.customerId !== 'all' && s.customer_id !== filters.customerId) return false;
    if (filters.dcId && filters.dcId !== 'all' && s.dc_id !== filters.dcId) return false;
    if (filters.period && filters.period !== 'all') {
      const shipPeriod = s.shipment_date.slice(0, 7).replace('-', '');
      if (shipPeriod !== filters.period) return false;
    }
    return true;
  });

  const inspections = rawInspections.filter((i) => {
    if (filters.customerId && filters.customerId !== 'all' && i.customer_id !== filters.customerId) return false;
    if (filters.dcId && filters.dcId !== 'all' && i.dc_id !== filters.dcId) return false;
    return true;
  });

  // Volume Aggregations
  let totalForecastQty = 0;
  let totalShippedQty = 0;
  let totalReceivedQty = 0;
  let totalOutstandingQty = 0;

  forecasts.forEach((f) => {
    totalForecastQty += f.total_qty || 0;
    totalShippedQty += f.total_shipped || 0;
    totalReceivedQty += f.total_received || 0;
    totalOutstandingQty += f.outstanding_qty || 0;
  });

  const fulfillmentRate =
    totalForecastQty > 0 ? Math.min(100, Math.round((totalShippedQty / totalForecastQty) * 100)) : 0;
  const receivingRate =
    totalForecastQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalForecastQty) * 100)) : 0;

  // Shipment Aggregations
  let deliveredShipments = 0;
  let inTransitShipments = 0;
  let arrivedDcShipments = 0;
  let readyShipments = 0;
  let onTimeEligible = 0;
  let onTimeMet = 0;

  shipments.forEach((s) => {
    if (s.status === 'DELIVERED') {
      deliveredShipments++;
      if (s.actual_arrival_date && s.actual_arrival_date <= s.estimated_arrival_date) {
        onTimeMet++;
      }
      onTimeEligible++;
    } else if (s.status === 'IN_TRANSIT') {
      inTransitShipments++;
    } else if (s.status === 'ARRIVED_DC') {
      arrivedDcShipments++;
    } else if (s.status === 'READY_TO_DISPATCH') {
      readyShipments++;
    }
  });

  const onTimeDeliveryRate =
    onTimeEligible > 0 ? Math.round((onTimeMet / onTimeEligible) * 100) : 100;

  // Inspections & QC Aggregations
  let totalGoodQty = 0;
  let totalDamagedQty = 0;
  let totalShortageQty = 0;
  let cleanPassBasts = 0;

  inspections.forEach((i) => {
    totalGoodQty += i.total_good_qty || 0;
    totalDamagedQty += i.total_damaged_qty || 0;
    totalShortageQty += i.total_shortage_qty || 0;
    if (i.discrepancy_status === 'CLEAN_PASS') {
      cleanPassBasts++;
    }
  });

  const totalInspected = totalGoodQty + totalDamagedQty + totalShortageQty;
  const acceptanceRate =
    totalInspected > 0 ? Math.round((totalGoodQty / totalInspected) * 100) : 100;

  // Breakdown 1: Customers
  const customersBreakdown: CustomerBreakdownItem[] = customers.map((c) => {
    const cForecasts = forecasts.filter((f) => f.customer_id === c.id);
    const cShipments = shipments.filter((s) => s.customer_id === c.id);
    const cInspections = inspections.filter((i) => i.customer_id === c.id);
    const cDcs = dcs.filter((d) => d.customer_id === c.id);

    let fcQty = 0;
    let shQty = 0;
    let rcQty = 0;
    let otQty = 0;

    cForecasts.forEach((f) => {
      fcQty += f.total_qty || 0;
      shQty += f.total_shipped || 0;
      rcQty += f.total_received || 0;
      otQty += f.outstanding_qty || 0;
    });

    let dmgQty = 0;
    cInspections.forEach((i) => {
      dmgQty += i.total_damaged_qty || 0;
    });

    const rate = fcQty > 0 ? Math.min(100, Math.round((shQty / fcQty) * 100)) : 0;
    const dmgRate = shQty > 0 ? Math.round((dmgQty / shQty) * 1000) / 10 : 0;

    return {
      customerId: c.id,
      customerCode: c.customer_code,
      customerName: c.customer_name,
      forecastQty: fcQty,
      shippedQty: shQty,
      receivedQty: rcQty,
      outstandingQty: otQty,
      fulfillmentRate: rate,
      totalShipments: cShipments.length,
      damagedQty: dmgQty,
      damageRate: dmgRate,
      dcCount: cDcs.length,
    };
  });

  // Breakdown 2: Distribution Centers
  const dcsBreakdown: DcBreakdownItem[] = dcs.map((d) => {
    const dCust = customers.find((c) => c.id === d.customer_id);
    const dReg = regions.find((r) => r.id === d.region_id);
    const dForecasts = forecasts.filter((f) => f.dc_id === d.id);
    const dShipments = shipments.filter((s) => s.dc_id === d.id);

    let fcQty = 0;
    let shQty = 0;
    let rcQty = 0;
    let otQty = 0;

    dForecasts.forEach((f) => {
      fcQty += f.total_qty || 0;
      shQty += f.total_shipped || 0;
      rcQty += f.total_received || 0;
      otQty += f.outstanding_qty || 0;
    });

    const rate = fcQty > 0 ? Math.min(100, Math.round((shQty / fcQty) * 100)) : 0;

    let status: DcBreakdownItem['status'] = 'OPTIMAL';
    if (rate >= 90) status = 'OPTIMAL';
    else if (rate >= 50) status = 'ON_TRACK';
    else if (rate > 0) status = 'ATTENTION';
    else status = 'PENDING';

    return {
      dcId: d.id,
      dcCode: d.dc_code,
      dcName: d.dc_name,
      customerName: dCust?.customer_name || 'Customer',
      regionName: dReg?.region_name || 'Wilayah',
      forecastQty: fcQty,
      shippedQty: shQty,
      receivedQty: rcQty,
      outstandingQty: otQty,
      fulfillmentRate: rate,
      shipmentCount: dShipments.length,
      status,
    };
  });

  // Breakdown 3: Products (SKUs)
  const productsBreakdown: ProductBreakdownItem[] = products.map((p) => {
    let pFc = 0;
    let pSh = 0;
    let pRc = 0;

    forecasts.forEach((f) => {
      (f.items || []).forEach((fi) => {
        if (fi.product_id === p.id) {
          pFc += fi.qty_forecast || 0;
          pSh += fi.qty_shipped || 0;
          pRc += fi.qty_received || 0;
        }
      });
    });

    // Also collect from shipments if unlinked
    shipments.forEach((s) => {
      if (!s.forecast_id) {
        (s.items || []).forEach((si) => {
          if (si.product_id === p.id) {
            pSh += si.qty_shipped || 0;
          }
        });
      }
    });

    const pOutstanding = Math.max(0, pFc - pSh);
    const pRate = pFc > 0 ? Math.min(100, Math.round((pSh / pFc) * 100)) : 0;
    const volumeShare =
      totalForecastQty > 0 ? Math.round((pFc / totalForecastQty) * 100) : 0;

    return {
      productId: p.id,
      sku: p.sku,
      productName: p.product_name,
      unit: p.unit || 'PCS',
      forecastQty: pFc,
      shippedQty: pSh,
      receivedQty: pRc,
      outstandingQty: pOutstanding,
      fulfillmentRate: pRate,
      volumeShare,
    };
  });

  // Breakdown 4: Transporters
  const transporterMap = new Map<string, TransporterBreakdownItem>();
  shipments.forEach((s) => {
    const tName = s.transporter_name || 'Ekspedisi Lainnya';
    let item = transporterMap.get(tName);
    if (!item) {
      item = {
        transporterName: tName,
        totalShipments: 0,
        deliveredShipments: 0,
        inTransitShipments: 0,
        totalUnitsCarried: 0,
        totalUnitsDamaged: 0,
        onTimeDeliveries: 0,
        onTimeRate: 100,
        damageRate: 0,
      };
      transporterMap.set(tName, item);
    }

    item.totalShipments++;
    item.totalUnitsCarried += s.total_qty || 0;

    if (s.status === 'DELIVERED') {
      item.deliveredShipments++;
      if (s.actual_arrival_date && s.actual_arrival_date <= s.estimated_arrival_date) {
        item.onTimeDeliveries++;
      }
    } else if (s.status === 'IN_TRANSIT') {
      item.inTransitShipments++;
    }
  });

  // Calculate damage per transporter
  inspections.forEach((insp) => {
    const matchShip = shipments.find((s) => s.id === insp.shipment_id);
    if (matchShip) {
      const tName = matchShip.transporter_name || 'Ekspedisi Lainnya';
      const item = transporterMap.get(tName);
      if (item) {
        item.totalUnitsDamaged += insp.total_damaged_qty || 0;
      }
    }
  });

  const transportersBreakdown = Array.from(transporterMap.values()).map((t) => {
    const onTimeRate =
      t.deliveredShipments > 0
        ? Math.round((t.onTimeDeliveries / t.deliveredShipments) * 100)
        : 100;
    const damageRate =
      t.totalUnitsCarried > 0
        ? Math.round((t.totalUnitsDamaged / t.totalUnitsCarried) * 1000) / 10
        : 0;

    return {
      ...t,
      onTimeRate,
      damageRate,
    };
  });

  return {
    totalForecastQty,
    totalShippedQty,
    totalReceivedQty,
    totalOutstandingQty,
    fulfillmentRate,
    receivingRate,
    acceptanceRate,
    totalShipments: shipments.length,
    deliveredShipments,
    inTransitShipments,
    arrivedDcShipments,
    readyShipments,
    onTimeDeliveryRate,
    totalGoodQty,
    totalDamagedQty,
    totalShortageQty,
    cleanPassBasts,
    totalBasts: inspections.length,
    customersBreakdown,
    dcsBreakdown,
    productsBreakdown,
    transportersBreakdown,
  };
};

export const exportExecutiveReportToExcel = (
  data: ExecutiveReportData,
  periodTitle = 'Semua Periode'
): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Eksekutif
  const summarySheetData = [
    ['LAPORAN KINERJA EKSEKUTIF RANTAI PASOK & DISTRIBUSI KURMA AKRAM'],
    ['PT AKRAM NIAGA NUSANTARA - DISTRIBUTION LOGISTICS SYSTEM'],
    ['Periode Laporan:', periodTitle],
    ['Tanggal Generate:', new Date().toLocaleString('id-ID')],
    [''],
    ['METRIK UTAMA FULFILLMENT & VOLUME NASIONAL'],
    ['Indikator', 'Nilai', 'Satuan'],
    ['Total Kebutuhan Forecast', data.totalForecastQty, 'PCS'],
    ['Total Kuantiti Terkirim (Surat Jalan)', data.totalShippedQty, 'PCS'],
    ['Total Kuantiti Tiba di DC (Terverifikasi BAST)', data.totalReceivedQty, 'PCS'],
    ['Total Sisa Alokasi Outstanding', data.totalOutstandingQty, 'PCS'],
    ['Fulfillment Rate (Terkirim vs Forecast)', `${data.fulfillmentRate}%`, '%'],
    ['Receiving Rate (Tiba vs Forecast)', `${data.receivingRate}%`, '%'],
    ['Acceptance Quality Rate (Fisik Baik)', `${data.acceptanceRate}%`, '%'],
    [''],
    ['KINERJA OPERASIONAL ARMADA & LOGISTIK'],
    ['Indikator', 'Nilai', 'Satuan'],
    ['Total Dokumen Surat Jalan Diterbitkan', data.totalShipments, 'Dokumen'],
    ['Pengiriman Berhasil Tiba (Delivered)', data.deliveredShipments, 'Surat Jalan'],
    ['Armada Sedang Dalam Perjalanan (In-Transit)', data.inTransitShipments, 'Truk'],
    ['Armada Tiba Menunggu Bongkar di DC', data.arrivedDcShipments, 'Truk'],
    ['Armada Siap Berangkat (Ready to Dispatch)', data.readyShipments, 'Surat Jalan'],
    ['Kepatuhan Ketepatan Waktu (On-Time SLA)', `${data.onTimeDeliveryRate}%`, '%'],
    [''],
    ['KUALITAS & DISCREPANCY FISIK (BAST DC)'],
    ['Indikator', 'Nilai', 'Satuan'],
    ['Total Berita Acara Serah Terima (BAST)', data.totalBasts, 'BAST'],
    ['BAST 100% Sesuai (Clean Pass)', data.cleanPassBasts, 'BAST'],
    ['Total Kuantiti Barang Rusak / Reject', data.totalDamagedQty, 'PCS'],
    ['Total Kuantiti Selisih Kurang (Shortage)', data.totalShortageQty, 'PCS'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // Sheet 2: Kinerja Customer & Distribution Center
  const dcSheetData = [
    ['LAPORAN FULFILLMENT PER DISTRIBUTION CENTER (DC)'],
    [''],
    [
      'Kode DC',
      'Nama Distribution Center',
      'Customer',
      'Wilayah',
      'Target Forecast (PCS)',
      'Terkirim (PCS)',
      'Diterima Baik (PCS)',
      'Sisa Outstanding (PCS)',
      'Fulfillment Rate (%)',
      'Total Kiriman',
      'Status Evaluasi',
    ],
    ...data.dcsBreakdown.map((d) => [
      d.dcCode,
      d.dcName,
      d.customerName,
      d.regionName,
      d.forecastQty,
      d.shippedQty,
      d.receivedQty,
      d.outstandingQty,
      `${d.fulfillmentRate}%`,
      d.shipmentCount,
      d.status,
    ]),
  ];
  const wsDc = XLSX.utils.aoa_to_sheet(dcSheetData);
  XLSX.utils.book_append_sheet(wb, wsDc, 'Kinerja Distribution Centers');

  // Sheet 3: Kinerja Produk SKU
  const productSheetData = [
    ['LAPORAN KINERJA PENJUALAN & DISTRIBUSI SKU PRODUK AKRAM'],
    [''],
    [
      'SKU',
      'Nama Produk',
      'Satuan',
      'Forecast (PCS)',
      'Terkirim (PCS)',
      'Diterima di DC (PCS)',
      'Outstanding (PCS)',
      'Fulfillment Rate (%)',
      'Porsi Volume Nasional (%)',
    ],
    ...data.productsBreakdown.map((p) => [
      p.sku,
      p.productName,
      p.unit,
      p.forecastQty,
      p.shippedQty,
      p.receivedQty,
      p.outstandingQty,
      `${p.fulfillmentRate}%`,
      `${p.volumeShare}%`,
    ]),
  ];
  const wsProduct = XLSX.utils.aoa_to_sheet(productSheetData);
  XLSX.utils.book_append_sheet(wb, wsProduct, 'Kinerja Produk SKU');

  // Sheet 4: Kinerja Ekspedisi Logistik
  const transporterSheetData = [
    ['LAPORAN KINERJA EKSPEDISI & ARMADA PENGIRIMAN'],
    [''],
    [
      'Nama Ekspedisi / Armada',
      'Total Surat Jalan',
      'Selesai Terkirim',
      'Sedang In-Transit',
      'Total Kuantiti Diangkut (PCS)',
      'Kuantiti Rusak (PCS)',
      'Tingkat On-Time SLA (%)',
      'Tingkat Kerusakan (%)',
    ],
    ...data.transportersBreakdown.map((t) => [
      t.transporterName,
      t.totalShipments,
      t.deliveredShipments,
      t.inTransitShipments,
      t.totalUnitsCarried,
      t.totalUnitsDamaged,
      `${t.onTimeRate}%`,
      `${t.damageRate}%`,
    ]),
  ];
  const wsTransporter = XLSX.utils.aoa_to_sheet(transporterSheetData);
  XLSX.utils.book_append_sheet(wb, wsTransporter, 'Kinerja Ekspedisi');

  // Write file
  const filename = `Akram_Executive_Supply_Chain_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// ==========================================
// TAHAP 8: STANDALONE EXCEL REPORTS EXPORTERS
// ==========================================

export const exportForecastExcelReport = async () => {
  const forecasts = await getForecasts({});
  const rows = forecasts.map((f, idx) => ({
    No: idx + 1,
    'No Forecast': f.forecast_number,
    Customer: f.customer?.customer_name || '-',
    'Distribution Center': f.dc?.dc_name || '-',
    Wilayah: f.region?.region_name || '-',
    Periode: f.period,
    'Target Kirim': f.target_delivery_date,
    'Total Target (PCS)': f.total_qty,
    'Teralokasi (PCS)': f.total_shipped ?? f.allocated_qty ?? 0,
    'Outstanding (PCS)': f.outstanding_qty,
    Status: f.status,
    'Tgl Dibuat': f.created_at.slice(0, 10),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Forecast');
  XLSX.writeFile(wb, `Laporan_Forecast_Akram_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportShipmentExcelReport = async () => {
  const shipments = await getShipments({});
  const rows = shipments.map((s, idx) => ({
    No: idx + 1,
    'No Surat Jalan': s.shipment_number,
    'No Forecast Ref': s.forecast_number || '-',
    Customer: s.customer?.customer_name || '-',
    'DC Tujuan': s.dc?.dc_name || '-',
    'Gudang Asal': s.origin_warehouse,
    'Tgl Berangkat': s.shipment_date,
    'Estimasi Tiba': s.estimated_arrival_date,
    'Aktual Tiba': s.actual_arrival_date || '-',
    Ekspedisi: s.transporter_name,
    'No Polisi Truk': s.vehicle_plate_number || '-',
    'Nama Driver': s.driver_name || '-',
    'Kontak Driver': s.driver_phone || '-',
    'No Resi': s.tracking_number_ref || '-',
    'Total Muatan (PCS)': s.total_qty,
    Status: s.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Surat Jalan');
  XLSX.writeFile(wb, `Laporan_Pengiriman_Surat_Jalan_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportBastExcelReport = async () => {
  const basts = await getReceivingInspections();
  const rows = basts.map((b, idx) => ({
    No: idx + 1,
    'No BAST': b.bast_number,
    'No Surat Jalan': b.shipment_number,
    Customer: b.customer?.customer_name || '-',
    'Distribution Center': b.dc?.dc_name || '-',
    'Tanggal Bongkar': b.received_date || b.inspection_date || '-',
    'Petugas Penerima DC': b.receiver_name,
    'Supir Ekspedisi': b.driver_name,
    'Total Dikirim (PCS)': b.total_shipped_qty ?? b.total_qty_shipped ?? 0,
    'Kondisi Baik (PCS)': b.total_good_qty ?? b.total_qty_good ?? 0,
    'Kondisi Rusak (PCS)': b.total_damaged_qty ?? b.total_qty_damaged ?? 0,
    'Selisih Kurang (PCS)': b.total_shortage_qty ?? b.total_qty_shortage ?? 0,
    'Status Fisik': b.discrepancy_status,
    'SLA Penerimaan (Jam)': b.receiving_duration_hours || 4,
    Keterangan: b.general_notes || b.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pemeriksaan DC & BAST');
  XLSX.writeFile(wb, `Laporan_BAST_Receiving_DC_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

