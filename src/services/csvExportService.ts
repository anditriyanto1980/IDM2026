import { Shipment, ShipmentMilestone, ActivityLog, DistributionCenter, WarehouseInventory } from '../types';

/**
 * Escapes and formats a cell value according to RFC-4180 CSV standard.
 */
export const formatCsvCell = (val: any): string => {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // If the cell contains quotes, commas, newlines, or tabs, enclose in quotes and escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Downloads a generated CSV string with UTF-8 BOM (\uFEFF)
 * for seamless compatibility with Microsoft Excel, LibreOffice, and data audit tools.
 */
export const downloadCsvFile = (filename: string, csvRows: string[][]): void => {
  const csvContent = csvRows.map((row) => row.map(formatCsvCell).join(',')).join('\r\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports Live Distribution Tracking Table to CSV for offline monitoring and logistics audit.
 */
export const exportTrackingTableToCsv = (
  shipments: Shipment[],
  latestMilestoneMap?: Map<string, ShipmentMilestone>
): void => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `IDM_Tracking_Distribusi_Armada_${timestamp}.csv`;

  const headers = [
    'No. Surat Jalan',
    'Ref. No. Forecast',
    'Customer',
    'DC Tujuan',
    'Kode DC',
    'Wilayah / Region',
    'Kota Tujuan',
    'Gudang Asal (Origin)',
    'Status Pengiriman',
    'Ekspedisi / Transporter',
    'Nama Sopir',
    'No. Kontak Sopir',
    'Plat Nomor Kendaraan',
    'No. Resi / AWB',
    'Tanggal Pengiriman',
    'Estimasi Tiba (ETA)',
    'Tanggal Tiba Aktual',
    'Total Muatan (PCS)',
    'Checkpoint / Lokasi Terakhir',
    'Status Checkpoint',
    'Waktu Update Checkpoint',
    'Catatan Perjalanan Terakhir',
    'Dibuat Oleh',
    'Waktu Pembuatan Dokumen',
  ];

  const rows: string[][] = [headers];

  shipments.forEach((s) => {
    const milestone = latestMilestoneMap?.get(s.id);
    const lastLocation = milestone?.location || milestone?.title || '-';
    const lastStatus = milestone?.milestone_type || '-';
    const lastTimestamp = milestone?.timestamp
      ? new Date(milestone.timestamp).toLocaleString('id-ID')
      : '-';
    const lastNotes = milestone?.notes || '-';

    rows.push([
      s.shipment_number,
      s.forecast_number || '-',
      s.customer?.customer_name || '-',
      s.dc?.dc_name || '-',
      s.dc?.dc_code || '-',
      s.region?.region_name || '-',
      s.dc?.city || '-',
      s.origin_warehouse || '-',
      s.status,
      s.transporter_name,
      s.driver_name || '-',
      s.driver_phone || '-',
      s.vehicle_plate_number || '-',
      s.tracking_number_ref || '-',
      s.shipment_date,
      s.estimated_arrival_date,
      s.actual_arrival_date || '-',
      String(s.total_qty || 0),
      lastLocation,
      lastStatus,
      lastTimestamp,
      lastNotes,
      s.created_by || '-',
      s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '-',
    ]);
  });

  downloadCsvFile(filename, rows);
};

/**
 * Exports Detailed Shipments (Surat Jalan) Table to CSV.
 */
export const exportShipmentsTableToCsv = (shipments: Shipment[]): void => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `IDM_Rekap_Surat_Jalan_Distribusi_${timestamp}.csv`;

  const headers = [
    'No. Surat Jalan',
    'Ref. Forecast',
    'Customer',
    'Kode Customer',
    'DC Penerima',
    'Kode DC',
    'Wilayah',
    'Kota DC',
    'Gudang Asal',
    'Tanggal Kirim',
    'Estimasi Tiba (ETA)',
    'Tiba Aktual',
    'Status',
    'Total Qty (PCS)',
    'Transporter',
    'Sopir',
    'No. Kontak',
    'No. Plat Truk',
    'No. Resi',
    'Catatan Pengiriman',
    'Dibuat Oleh',
    'Waktu Dibuat',
  ];

  const rows: string[][] = [headers];

  shipments.forEach((s) => {
    rows.push([
      s.shipment_number,
      s.forecast_number || '-',
      s.customer?.customer_name || '-',
      s.customer?.customer_code || '-',
      s.dc?.dc_name || '-',
      s.dc?.dc_code || '-',
      s.region?.region_name || '-',
      s.dc?.city || '-',
      s.origin_warehouse || '-',
      s.shipment_date,
      s.estimated_arrival_date,
      s.actual_arrival_date || '-',
      s.status,
      String(s.total_qty || 0),
      s.transporter_name,
      s.driver_name || '-',
      s.driver_phone || '-',
      s.vehicle_plate_number || '-',
      s.tracking_number_ref || '-',
      s.notes || '-',
      s.created_by || '-',
      s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '-',
    ]);
  });

  downloadCsvFile(filename, rows);
};

/**
 * Exports Operational Audit Trail / Activity Logs to CSV for compliance and audits.
 */
export const exportAuditLogsToCsv = (logs: ActivityLog[]): void => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `IDM_Audit_Trail_Operasional_${timestamp}.csv`;

  const headers = [
    'ID Log',
    'Waktu Kejadian (WIB)',
    'ISO Timestamp',
    'Email Akun Pengguna',
    'Role / Jabatan',
    'Tipe Aksi (Action)',
    'Modul Sistem',
    'ID Dokumen / Record Ref',
    'Deskripsi Jejak Audit',
  ];

  const rows: string[][] = [headers];

  logs.forEach((log) => {
    const formattedDate = log.created_at
      ? new Date(log.created_at).toLocaleString('id-ID')
      : '-';

    rows.push([
      log.id,
      formattedDate,
      log.created_at || '-',
      log.user_email || 'system',
      log.user_role || 'ADMIN',
      log.action,
      log.module,
      log.record_id || '-',
      log.description,
    ]);
  });

  downloadCsvFile(filename, rows);
};

/**
 * Exports Distribution Centers (DC Master Data) to CSV.
 */
export const exportDistributionCentersToCsv = (dcs: DistributionCenter[]): void => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `IDM_Master_Distribution_Centers_${timestamp}.csv`;

  const headers = [
    'Kode DC',
    'Nama DC',
    'Customer Induk',
    'Kode Customer',
    'Wilayah (Region)',
    'Kota',
    'Provinsi',
    'Alamat Lengkap',
    'Nama PIC',
    'No. Telepon PIC',
    'Status Aktif',
    'Terakhir Diperbarui',
  ];

  const rows: string[][] = [headers];

  dcs.forEach((d) => {
    rows.push([
      d.dc_code,
      d.dc_name,
      d.customer?.customer_name || '-',
      d.customer?.customer_code || '-',
      d.region?.region_name || '-',
      d.city,
      d.province,
      d.address || '-',
      d.pic_name || '-',
      d.pic_phone || '-',
      d.is_active ? 'AKTIF' : 'NONAKTIF',
      d.updated_at ? new Date(d.updated_at).toLocaleString('id-ID') : '-',
    ]);
  });

  downloadCsvFile(filename, rows);
};

/**
 * Exports Multi-Warehouse Inventory Stock to CSV for warehouse auditing.
 */
export const exportInventoryStockToCsv = (inventory: WarehouseInventory[]): void => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `IDM_Stok_Multi_Gudang_${timestamp}.csv`;

  const headers = [
    'Kode Gudang',
    'Nama Fasilitas Gudang',
    'SKU Produk',
    'Nama Produk',
    'Satuan (Unit)',
    'Stok Fisik (On Hand)',
    'Stok Direservasi (Allocated)',
    'Stok Bebas (ATP)',
    'Batas Minimum (Safety Stock)',
    'Titik Pesan Ulang (Reorder Point)',
    'Status Ketersediaan Stok',
  ];

  const rows: string[][] = [headers];

  inventory.forEach((item) => {
    rows.push([
      item.warehouse_code,
      item.warehouse_name,
      item.sku,
      item.product_name,
      item.unit,
      String(item.stock_on_hand),
      String(item.stock_reserved),
      String(item.stock_available),
      String(item.safety_stock),
      String(item.reorder_point),
      item.stock_status,
    ]);
  });

  downloadCsvFile(filename, rows);
};
