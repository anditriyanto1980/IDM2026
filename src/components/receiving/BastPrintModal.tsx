import React, { useRef } from 'react';
import { ReceivingInspection } from '../../types';
import { Modal } from '../common/Modal';
import { Printer, Download, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BastPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: ReceivingInspection | null;
}

export const BastPrintModal: React.FC<BastPrintModalProps> = ({
  isOpen,
  onClose,
  inspection,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!inspection) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headerInfo = [
      ['BERITA ACARA SERAH TERIMA BARANG (BAST)'],
      ['PT AKRAM NIAGA NUSANTARA - DISTRIBUTION LOGISTICS SYSTEM'],
      [''],
      ['No. BAST:', inspection.bast_number, 'No. Surat Jalan:', inspection.shipment_number],
      ['Tanggal Terima:', inspection.received_date, 'Customer / DC:', `${inspection.customer?.customer_name || ''} - ${inspection.dc?.dc_name || ''}`],
      ['Petugas Receiving:', inspection.receiver_name, 'NIP / ID:', inspection.receiver_nip || '-'],
      ['Pengemudi / Supir:', inspection.driver_name || '-', 'No. Polisi Armada:', inspection.driver_plate_number || '-'],
      ['Status BAST:', inspection.discrepancy_status],
      [''],
      ['RINCIAN PEMERIKSAAN FISIK PRODUK'],
      [
        'No',
        'SKU',
        'Nama Produk',
        'Qty Kirim (SJ)',
        'Qty Diterima Baik',
        'Qty Rusak',
        'Qty Selisih',
        'Satuan',
        'Batch / Lot',
        'Exp. Date',
        'Catatan Kerusakan',
      ],
    ];

    const itemRows = (inspection.items || []).map((it, idx) => [
      idx + 1,
      it.sku,
      it.product_name,
      it.qty_shipped,
      it.qty_good,
      it.qty_damaged,
      it.qty_shortage,
      it.unit,
      it.batch_number_verified || '-',
      it.expiry_date_verified || '-',
      it.damage_reason || 'Kondisi Baik',
    ]);

    const summaryRows = [
      [''],
      [
        'TOTAL',
        '',
        '',
        inspection.total_shipped_qty,
        inspection.total_good_qty,
        inspection.total_damaged_qty,
        inspection.total_shortage_qty,
        'PCS',
      ],
      [''],
      ['Catatan Umum:', inspection.general_notes || '-'],
    ];

    const allData = [...headerInfo, ...itemRows, ...summaryRows];
    const ws = XLSX.utils.aoa_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BAST');
    XLSX.writeFile(wb, `${inspection.bast_number}_${inspection.shipment_number}.xlsx`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dokumen Resmi Berita Acara Serah Terima (BAST)"
      subtitle={`Pratinjau fisik dokumen BAST ${inspection.bast_number} untuk dicetak atau diunduh`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Action Header */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Format Resmi BAST</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold">
              {inspection.discrepancy_status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak BAST (Print)</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div
          ref={printAreaRef}
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                  PT AKRAM NIAGA NUSANTARA
                </h1>
                <p className="text-[11px] text-slate-600 max-w-sm">
                  Distribusi Kurma Premium & Logistik Nasional Rantai Pasok
                </p>
                <p className="text-[10px] text-slate-500">
                  Kawasan Industri Cikarang, Jawa Barat | Telp: (021) 8990-2345
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-xs tracking-wider rounded mb-1">
                  BERITA ACARA SERAH TERIMA
                </span>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {inspection.bast_number}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Ref SJ: <strong>{inspection.shipment_number}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Paragraph */}
          <p className="text-xs text-slate-700 leading-relaxed mb-4">
            Pada hari ini, tanggal{' '}
            <strong className="text-slate-900 font-semibold">{inspection.received_date}</strong>, telah
            dilakukan serah terima dan pemeriksaan kondisi fisik barang kiriman antara pihak pengirim
            dengan pihak penerima bertempat di{' '}
            <strong className="text-slate-900 font-semibold">
              {inspection.dc?.dc_name || 'Distribution Center'}
            </strong>{' '}
            dengan keterangan sebagai berikut:
          </p>

          {/* Parties Meta Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-3.5 mb-5 bg-slate-50/50">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pihak I (Pengirim / Armada Ekspedisi):
              </span>
              <div className="space-y-0.5 text-slate-800">
                <div>Pengemudi / Supir: <strong>{inspection.driver_name || '-'}</strong></div>
                <div>No. Polisi Kendaraan: <strong>{inspection.driver_plate_number || '-'}</strong></div>
                <div>Gudang Asal: <strong>{inspection.shipment?.origin_warehouse || 'Gudang Pusat Akram'}</strong></div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pihak II (Penerima / Distribution Center):
              </span>
              <div className="space-y-0.5 text-slate-800">
                <div>Customer / DC: <strong>{inspection.customer?.customer_name} ({inspection.dc?.dc_name})</strong></div>
                <div>Petugas Receiving: <strong>{inspection.receiver_name}</strong></div>
                <div>NIP / ID: <strong>{inspection.receiver_nip || '-'}</strong></div>
              </div>
            </div>
          </div>

          {/* Items Verification Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-2.5 w-8 text-center">No</th>
                  <th className="py-2 px-2.5">SKU & Deskripsi</th>
                  <th className="py-2 px-2.5 text-right">Kirim (SJ)</th>
                  <th className="py-2 px-2.5 text-right">Baik</th>
                  <th className="py-2 px-2.5 text-right">Rusak</th>
                  <th className="py-2 px-2.5 text-right">Selisih</th>
                  <th className="py-2 px-2.5">Batch / Exp</th>
                  <th className="py-2 px-2.5">Catatan Kerusakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(inspection.items || []).map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-2 px-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2.5">
                      <div className="font-semibold text-slate-900">{it.product_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{it.sku}</div>
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-semibold">
                      {it.qty_shipped.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700">
                      {it.qty_good.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-semibold text-rose-600">
                      {it.qty_damaged > 0 ? it.qty_damaged.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-semibold text-amber-600">
                      {it.qty_shortage > 0 ? it.qty_shortage.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[10px] text-slate-600">
                      <div>{it.batch_number_verified || '-'}</div>
                      <div className="text-slate-400">{it.expiry_date_verified || '-'}</div>
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-slate-600">
                      {it.damage_reason || <span className="text-emerald-600">Kondisi Baik</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={2} className="py-2.5 px-2.5 text-right uppercase text-[11px]">
                    Total Kuantiti (PCS):
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold">
                    {inspection.total_shipped_qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-700">
                    {inspection.total_good_qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-rose-600">
                    {inspection.total_damaged_qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-amber-600">
                    {inspection.total_shortage_qty.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-2.5 px-2.5 text-[11px] text-slate-600">
                    Status: <strong className="text-slate-900">{inspection.discrepancy_status}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {inspection.general_notes && (
            <div className="text-xs bg-slate-50 p-3 rounded border border-slate-200 mb-6">
              <span className="font-semibold text-slate-800 block mb-0.5">Catatan Hasil Pemeriksaan:</span>
              <p className="text-slate-600 leading-relaxed">{inspection.general_notes}</p>
            </div>
          )}

          {/* 3 Signature Boxes */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 mb-4 text-center">
              Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam rangkap untuk dipergunakan sebagaimana mestinya.
            </p>

            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              {/* Pihak I */}
              <div className="border border-slate-200 rounded p-2 flex flex-col justify-between h-28">
                <span className="text-[10px] uppercase font-bold text-slate-500">Pihak I (Pengirim / Supir)</span>
                <div>
                  <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
                  <span className="font-semibold text-slate-800 text-[11px] block">{inspection.driver_name || '( ........................ )'}</span>
                  <span className="text-[10px] text-slate-400">Ekspedisi Logistik</span>
                </div>
              </div>

              {/* Pihak II */}
              <div className="border border-slate-200 rounded p-2 flex flex-col justify-between h-28 bg-emerald-50/20">
                <span className="text-[10px] uppercase font-bold text-slate-500">Pihak II (Petugas Receiving DC)</span>
                <div>
                  <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
                  <span className="font-semibold text-slate-900 text-[11px] block">{inspection.receiver_name}</span>
                  <span className="text-[10px] text-slate-500">{inspection.receiver_role}</span>
                </div>
              </div>

              {/* Mengetahui */}
              <div className="border border-slate-200 rounded p-2 flex flex-col justify-between h-28">
                <span className="text-[10px] uppercase font-bold text-slate-500">Mengetahui (Kepala Gudang DC)</span>
                <div>
                  <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
                  <span className="font-semibold text-slate-800 text-[11px] block">{inspection.warehouse_supervisor_name || 'Kepala Gudang DC'}</span>
                  <span className="text-[10px] text-slate-400">Supervisor DC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Close Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
