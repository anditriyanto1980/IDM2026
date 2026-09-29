import React, { useRef } from 'react';
import { Shipment } from '../../types';
import { Modal } from '../common/Modal';
import { Printer, Download, Building2, Truck, Calendar, MapPin, Boxes } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SuratJalanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

export const SuratJalanPrintModal: React.FC<SuratJalanPrintModalProps> = ({
  isOpen,
  onClose,
  shipment,
}) => {
  if (!shipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = (shipment.items || []).map((item, idx) => ({
      No: idx + 1,
      'No Surat Jalan': shipment.shipment_number,
      'Ref Forecast': shipment.forecast_number || '-',
      'Tgl Kirim': shipment.shipment_date,
      Customer: shipment.customer?.customer_name || 'Customer',
      'DC Tujuan': shipment.dc?.dc_name || 'DC Tujuan',
      Kota: shipment.dc?.city || '-',
      Ekspedisi: shipment.transporter_name,
      Sopir: shipment.driver_name || '-',
      'No Polisi': shipment.vehicle_plate_number || '-',
      'No Resi': shipment.tracking_number_ref || '-',
      SKU: item.sku,
      'Nama Barang': item.product_name,
      'No Batch': item.batch_number || '-',
      'Exp Date': item.expiry_date || '-',
      'Qty Kirim': item.qty_shipped,
      Satuan: item.unit,
      Catatan: item.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Surat Jalan');
    XLSX.writeFile(wb, `${shipment.shipment_number}_SuratJalan.xlsx`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Surat Jalan Resmi: ${shipment.shipment_number}`}
      size="2xl"
    >
      <div className="space-y-4">
        {/* Print & Export Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg print:hidden">
          <span className="text-xs text-slate-500">
            Dokumen resmi siap cetak / arsip logistik pengiriman
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export XLS</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Surat Jalan</span>
            </button>
          </div>
        </div>

        {/* The Printable Document Container */}
        <div className="bg-white border-2 border-slate-300 p-8 rounded-xl shadow-xs text-slate-900 font-sans text-xs leading-normal">
          {/* Header & Logo */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-lg">
                <Boxes className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                  PT AKRAM LOGISTIK NUSANTARA
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  Divisi Distribusi Produk Kurma & Wholesale FMCG
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Kawasan Industri Delta Silicon III, Jl. Trembesi Blok F No. 12, Cikarang Pusat, Jawa Barat
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp: (021) 8990-1234 · Email: logistics@akram.id
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded font-bold text-xs uppercase tracking-wider text-slate-900">
                SURAT JALAN / DELIVERY ORDER
              </div>
              <div className="mt-2 text-xs">
                <span className="text-slate-500">No. Dokumen: </span>
                <strong className="font-mono text-sm text-slate-900">
                  {shipment.shipment_number}
                </strong>
              </div>
              {shipment.forecast_number && (
                <div className="text-[11px] text-slate-500">
                  Ref Forecast: <strong className="font-mono text-slate-800">{shipment.forecast_number}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Two Columns: Pengirim & Penerima */}
          <div className="grid grid-cols-2 gap-6 pb-5 mb-5 border-b border-slate-200">
            {/* Pengirim */}
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                PENGIRIM (ORIGIN WAREHOUSE):
              </span>
              <p className="font-bold text-slate-900 text-xs">
                {shipment.origin_warehouse}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Tanggal Pengiriman: <strong>{shipment.shipment_date}</strong>
              </p>
              <p className="text-[11px] text-slate-600">
                Estimasi Tiba: <strong>{shipment.estimated_arrival_date}</strong>
              </p>
            </div>

            {/* Penerima */}
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                PENERIMA (DESTINATION DC):
              </span>
              <p className="font-bold text-slate-900 text-xs">
                {shipment.customer?.customer_name} ({shipment.customer?.customer_code})
              </p>
              <p className="text-[11px] font-semibold text-slate-800">
                {shipment.dc?.dc_name} ({shipment.dc?.dc_code})
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {shipment.dc?.address || 'Kawasan Gudang DC'}
              </p>
              <p className="text-[11px] text-slate-600">
                {shipment.dc?.city}, {shipment.region?.region_name}
              </p>
              {shipment.dc?.pic_name && (
                <p className="text-[11px] text-slate-700 mt-1">
                  PIC: <strong>{shipment.dc.pic_name}</strong> ({shipment.dc.pic_phone || '-'})
                </p>
              )}
            </div>
          </div>

          {/* Expedition & Transporter Info Bar */}
          <div className="grid grid-cols-4 gap-3 bg-slate-100/90 p-3 rounded-lg border border-slate-200 mb-5 text-[11px]">
            <div>
              <span className="text-slate-500 block font-medium">Ekspedisi / Armada:</span>
              <span className="font-bold text-slate-900">{shipment.transporter_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Pengemudi (Driver):</span>
              <span className="font-bold text-slate-900">
                {shipment.driver_name || '-'} {shipment.driver_phone ? `(${shipment.driver_phone})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">No. Polisi Armada:</span>
              <span className="font-mono font-bold text-slate-900">
                {shipment.vehicle_plate_number || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">No. Resi / AWB Ref:</span>
              <span className="font-mono font-bold text-slate-900">
                {shipment.tracking_number_ref || '-'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse border border-slate-300 text-xs mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-2 px-3 border border-slate-300 text-center w-10">No</th>
                <th className="py-2 px-3 border border-slate-300 w-32">SKU</th>
                <th className="py-2 px-3 border border-slate-300">Nama Barang & Deskripsi</th>
                <th className="py-2 px-3 border border-slate-300 w-28">No. Batch/Lot</th>
                <th className="py-2 px-3 border border-slate-300 w-24 text-center">Exp. Date</th>
                <th className="py-2 px-3 border border-slate-300 text-right w-24">Qty Kirim</th>
                <th className="py-2 px-3 border border-slate-300 text-center w-16">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {(shipment.items || []).map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-2 px-3 border border-slate-300 text-center text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 font-mono font-semibold">
                    {item.sku}
                  </td>
                  <td className="py-2 px-3 border border-slate-300">
                    <span className="font-medium text-slate-900">{item.product_name}</span>
                    {item.notes && (
                      <span className="block text-[10px] text-slate-400 font-normal italic">
                        {item.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 font-mono text-[11px]">
                    {item.batch_number || '-'}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-mono text-[11px]">
                    {item.expiry_date || '-'}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-right font-bold tabular-nums">
                    {item.qty_shipped.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-medium text-slate-600">
                    {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td colSpan={5} className="py-2 px-3 border border-slate-300 text-right">
                  TOTAL KUANTITI PENGIRIMAN:
                </td>
                <td className="py-2 px-3 border border-slate-300 text-right font-mono text-sm tabular-nums text-slate-900">
                  {shipment.total_qty.toLocaleString('id-ID')}
                </td>
                <td className="py-2 px-3 border border-slate-300 text-center">PCS</td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          {shipment.notes && (
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-[11px] mb-6">
              <strong>Catatan Khusus:</strong> {shipment.notes}
            </div>
          )}

          {/* 4 Signatures Grid */}
          <div className="grid grid-cols-4 gap-4 text-center text-[11px] pt-2">
            <div className="flex flex-col justify-between h-28 border border-dashed border-slate-300 p-2 rounded">
              <span className="font-semibold text-slate-700">Dibuat / Bag. Gudang</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
                <span className="text-[10px] text-slate-500">( {shipment.created_by || 'Staff Gudang'} )</span>
              </div>
              <span className="text-[9px] text-slate-400">Tgl: {shipment.shipment_date}</span>
            </div>

            <div className="flex flex-col justify-between h-28 border border-dashed border-slate-300 p-2 rounded">
              <span className="font-semibold text-slate-700">Sopir / Ekspedisi</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
                <span className="text-[10px] text-slate-500">( {shipment.driver_name || 'Driver'} )</span>
              </div>
              <span className="text-[9px] text-slate-400">Tgl: {shipment.shipment_date}</span>
            </div>

            <div className="flex flex-col justify-between h-28 border border-dashed border-slate-300 p-2 rounded">
              <span className="font-semibold text-slate-700">Petugas Keamanan</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
                <span className="text-[10px] text-slate-500">( Security Pos Jaga )</span>
              </div>
              <span className="text-[9px] text-slate-400">Tgl: ____________</span>
            </div>

            <div className="flex flex-col justify-between h-28 border border-dashed border-slate-300 p-2 rounded bg-slate-50/50">
              <span className="font-semibold text-slate-700">Penerima DC (Cap & Nama)</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
                <span className="text-[10px] text-slate-500">( {shipment.dc?.pic_name || 'Petugas Receiving'} )</span>
              </div>
              <span className="text-[9px] text-slate-400">Tgl: ____________</span>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
            Barang telah diperiksa dan diserahterimakan dalam kondisi baik, tersegel, dan memenuhi standar mutu pangan Akram.
          </div>
        </div>
      </div>
    </Modal>
  );
};
