import React, { useRef } from 'react';
import { ExecutiveReportData } from '../../services/reportService';
import { Modal } from '../common/Modal';
import { Printer, Download, Building2, Calendar, FileText, CheckCircle2, TrendingUp, Boxes, Truck } from 'lucide-react';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ExecutiveReportData | null;
  periodTitle?: string;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  periodTitle = 'Periode Operasional Berjalan',
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Format Cetak Laporan Eksekutif Rantai Pasok"
      subtitle="Pratinjau dokumen ringkasan eksekutif untuk presentasi manajemen dan cetak PDF"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-700">
            Dokumen Siap Cetak (Executive Briefing Format)
          </div>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen (Print / PDF)</span>
          </button>
        </div>

        {/* Paper Document Canvas */}
        <div
          ref={printAreaRef}
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                  PT AKRAM NIAGA NUSANTARA
                </h1>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                  LAPORAN KINERJA EKSEKUTIF FULFILLMENT &amp; LOGISTIK NASIONAL
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Distribusi Kurma Akram ke Jaringan Distribution Center (DC) Indogrosir &amp; Indomarco
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-[10px] tracking-wider rounded mb-1">
                  EXECUTIVE BRIEFING
                </span>
                <div className="text-xs font-semibold text-slate-800">{periodTitle}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Matrix Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              1. Indikator Utama Rantai Pasok (Supply Chain KPIs)
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Forecast</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {reportData.totalForecastQty.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">PCS</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Terkirim (Surat Jalan)</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  {reportData.totalShippedQty.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">PCS</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Tiba di DC (BAST)</span>
                <span className="text-base font-bold font-mono text-teal-700">
                  {reportData.totalReceivedQty.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">PCS</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Fulfillment Rate</span>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {reportData.fulfillmentRate}%
                </span>
                <span className="text-[10px] text-slate-400 block">Tingkat Pemenuhan</span>
              </div>
            </div>
          </div>

          {/* Quality & Armada Summary Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Kinerja Armada &amp; Operasional Logistik:
              </span>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Total Surat Jalan Diterbitkan:</span>
                  <strong className="font-mono text-slate-900">{reportData.totalShipments} Dokumen</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pengiriman Selesai (Delivered):</span>
                  <strong className="font-mono text-emerald-700">{reportData.deliveredShipments} Surat Jalan</strong>
                </div>
                <div className="flex justify-between">
                  <span>Armada Dalam Perjalanan (In-Transit):</span>
                  <strong className="font-mono text-amber-700">{reportData.inTransitShipments} Truk</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kepatuhan On-Time SLA:</span>
                  <strong className="font-mono text-slate-900">{reportData.onTimeDeliveryRate}% Tepat Waktu</strong>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Kualitas Fisik &amp; Hasil QC Serah Terima DC:
              </span>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Dokumen BAST Terbit:</span>
                  <strong className="font-mono text-slate-900">{reportData.totalBasts} Dokumen</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tingkat Kualitas Baik (Clean Pass):</span>
                  <strong className="font-mono text-emerald-700">{reportData.acceptanceRate}% Sesuai</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Barang Rusak / Cacat:</span>
                  <strong className="font-mono text-rose-600">{reportData.totalDamagedQty.toLocaleString()} pcs</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Selisih Kurang (Shortage):</span>
                  <strong className="font-mono text-amber-600">{reportData.totalShortageQty.toLocaleString()} pcs</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Performance Summary */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              2. Kinerja Pemenuhan per Jaringan Customer Retail
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-right">Target Forecast</th>
                    <th className="py-2 px-3 text-right">Terkirim (SJ)</th>
                    <th className="py-2 px-3 text-right">Tiba di DC</th>
                    <th className="py-2 px-3 text-right">Fulfillment</th>
                    <th className="py-2 px-3 text-right">DC Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.customersBreakdown.map((c) => (
                    <tr key={c.customerId}>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {c.customerName} ({c.customerCode})
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{c.forecastQty.toLocaleString()} pcs</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {c.shippedQty.toLocaleString()} pcs
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{c.receivedQty.toLocaleString()} pcs</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {c.fulfillmentRate}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{c.dcCount} DC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Performance Summary */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              3. Kinerja Distribusi Berdasarkan SKU Produk
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">SKU &amp; Nama Produk</th>
                    <th className="py-2 px-3 text-right">Forecast</th>
                    <th className="py-2 px-3 text-right">Terkirim</th>
                    <th className="py-2 px-3 text-right">Outstanding</th>
                    <th className="py-2 px-3 text-right">Porsi Nasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.productsBreakdown.map((p) => (
                    <tr key={p.productId}>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900">{p.productName}</span>{' '}
                        <span className="font-mono text-slate-500 text-[10px]">({p.sku})</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{p.forecastQty.toLocaleString()} pcs</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {p.shippedQty.toLocaleString()} pcs
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-700">
                        {p.outstandingQty.toLocaleString()} pcs
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {p.volumeShare}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Executive Sign-off */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-12">
                Disusun Oleh: Logistik &amp; Supply Chain
              </span>
              <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">Supply Chain Manager</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-12">
                Mengetahui &amp; Disetujui:
              </span>
              <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">Direktur Operasional</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
