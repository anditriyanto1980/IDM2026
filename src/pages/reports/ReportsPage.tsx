import React, { useState, useEffect, useMemo } from 'react';
import {
  generateExecutiveReport,
  exportExecutiveReportToExcel,
  exportForecastExcelReport,
  exportShipmentExcelReport,
  exportBastExcelReport,
  ExecutiveReportData,
} from '../../services/reportService';
import { getCustomers } from '../../services/customerService';
import { getDistributionCenters } from '../../services/dcService';
import { getShipments } from '../../services/shipmentService';
import { getAllMilestones } from '../../services/trackingService';
import {
  exportTrackingTableToCsv,
  exportShipmentsTableToCsv,
  exportDistributionCentersToCsv,
} from '../../services/csvExportService';
import { Customer, DistributionCenter, ShipmentMilestone } from '../../types';
import { PrintableReportModal } from '../../components/reports/PrintableReportModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  FileBarChart,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  PackageCheck,
  Truck,
  Boxes,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reportData, setReportData] = useState<ExecutiveReportData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dcFilter, setDcFilter] = useState('all');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dcs' | 'customers' | 'skus' | 'transporters'>('dcs');

  // Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, custList, dcList] = await Promise.all([
        generateExecutiveReport({
          period: periodFilter !== 'all' ? periodFilter.replace('-', '') : undefined,
          customerId: customerFilter,
          dcId: dcFilter,
        }),
        getCustomers(),
        getDistributionCenters(),
      ]);
      setReportData(data);
      setCustomers(custList);
      setDcs(dcList);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Laporan',
        message: err?.message || 'Terjadi kesalahan sistem saat mengagregasi data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodFilter, customerFilter, dcFilter]);

  const periodTitle = useMemo(() => {
    if (periodFilter === '2026-09') return 'September 2026';
    if (periodFilter === '2026-10') return 'Oktober 2026';
    return 'Semua Periode Berjalan';
  }, [periodFilter]);

  const handleExportExcel = () => {
    if (!reportData) return;
    try {
      exportExecutiveReportToExcel(reportData, periodTitle);
      showToast({
        type: 'success',
        title: 'Export Excel Berhasil',
        message: 'Laporan eksekutif rantai pasok multi-sheet berhasil diunduh.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunduh Excel',
        message: err?.message || 'Terjadi kesalahan saat membuat file.',
      });
    }
  };

  const getDcStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Optimal (≥90%)
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
            On Track (≥50%)
          </span>
        );
      case 'ATTENTION':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Perlu Alokasi
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <FileBarChart className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Executive Logistics &amp; Fulfillment Reports
              </h1>
              <p className="text-xs text-slate-500">
                Pusat intelijen rantai pasok: evaluasi kuota forecast, tingkat pemenuhan pengiriman DC, ketepatan waktu armada, dan audit BAST
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
            title="Refresh Laporan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!reportData}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Dokumen</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!reportData}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Paket Master (4-Sheet Excel)</span>
          </button>
        </div>
      </div>

      {/* Dedicated Standalone Excel & CSV Reports Hub for Offline & Audit */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-0.5">
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            Pusat Ekspor Laporan Excel &amp; CSV (Offline Reporting &amp; Audit Support)
          </span>
          <p className="text-[11px] text-emerald-800">
            Unduh data operasional tracking dan distribusi dalam format Excel (.xlsx) atau CSV (.csv) untuk rekonsiliasi audit:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Buttons */}
          <button
            onClick={async () => {
              await exportForecastExcelReport();
              showToast({ type: 'success', title: 'Export Forecast', message: 'Laporan forecast Excel berhasil diunduh.' });
            }}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Excel Forecast</span>
          </button>

          <button
            onClick={async () => {
              await exportShipmentExcelReport();
              showToast({ type: 'success', title: 'Export Surat Jalan', message: 'Rekap pengiriman Excel berhasil diunduh.' });
            }}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Excel Surat Jalan</span>
          </button>

          {/* CSV Export Buttons for Offline & Audit Support */}
          <button
            onClick={async () => {
              try {
                const [ships, miles] = await Promise.all([getShipments({}), getAllMilestones()]);
                const map = new Map<string, ShipmentMilestone>();
                miles.forEach((m) => {
                  const existing = map.get(m.shipment_id);
                  if (!existing || new Date(m.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
                    map.set(m.shipment_id, m);
                  }
                });
                exportTrackingTableToCsv(ships, map);
                showToast({ type: 'success', title: 'Export CSV Tracking', message: `${ships.length} data live tracking berhasil diunduh ke CSV.` });
              } catch (e: any) {
                showToast({ type: 'error', title: 'Gagal Ekspor CSV', message: e?.message || 'Terjadi kesalahan sistem.' });
              }
            }}
            className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Ekspor live tracking data pengiriman ke file CSV"
          >
            <Download className="w-3 h-3 text-emerald-300" />
            <span>CSV Tracking</span>
          </button>

          <button
            onClick={async () => {
              try {
                const ships = await getShipments({});
                exportShipmentsTableToCsv(ships);
                showToast({ type: 'success', title: 'Export CSV Surat Jalan', message: `${ships.length} data surat jalan berhasil diekspor ke CSV.` });
              } catch (e: any) {
                showToast({ type: 'error', title: 'Gagal Ekspor CSV', message: e?.message || 'Terjadi kesalahan sistem.' });
              }
            }}
            className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Ekspor rekap pengiriman ke file CSV"
          >
            <Download className="w-3 h-3 text-emerald-300" />
            <span>CSV Pengiriman</span>
          </button>

          <button
            onClick={async () => {
              try {
                const dcsList = await getDistributionCenters();
                exportDistributionCentersToCsv(dcsList);
                showToast({ type: 'success', title: 'Export CSV DC', message: `${dcsList.length} titik distribution center berhasil diekspor ke CSV.` });
              } catch (e: any) {
                showToast({ type: 'error', title: 'Gagal Ekspor CSV', message: e?.message || 'Terjadi kesalahan sistem.' });
              }
            }}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Ekspor data master DC ke file CSV"
          >
            <span>CSV Master DC</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Laporan:</span>
          </span>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Semua Periode</option>
            <option value="2026-09">September 2026 (202609)</option>
            <option value="2026-10">Oktober 2026 (202610)</option>
          </select>

          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Semua Customer Retail</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name} ({c.customer_code})
              </option>
            ))}
          </select>

          {/* DC Filter */}
          <select
            value={dcFilter}
            onChange={(e) => setDcFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium max-w-[200px]"
          >
            <option value="all">Semua Distribution Center</option>
            {dcs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.dc_name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Status Data: <strong className="text-slate-800">{periodTitle}</strong>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs">Mengagregasi data supply chain dan audit trail...</span>
        </div>
      ) : (
        <>
          {/* Main Visual Fulfillment Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* National Fulfillment Rate Gauge */}
            <div className="lg:col-span-2 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                      Tingkat Pemenuhan Forecast Nasional (Fulfillment Gauge)
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800/80 text-emerald-300 border border-slate-700">
                    {periodTitle}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-baseline gap-4">
                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                    {reportData.fulfillmentRate}%
                  </div>
                  <div className="text-xs text-slate-300 max-w-sm">
                    Total <strong className="text-emerald-300 font-semibold">{reportData.totalShippedQty.toLocaleString()} pcs</strong> kurma
                    telah dialokasikan dan dikirim dari total kebutuhan forecast{' '}
                    <strong className="text-white font-semibold">{reportData.totalForecastQty.toLocaleString()} pcs</strong>.
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 w-full bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className="bg-linear-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${reportData.fulfillmentRate}%` }}
                  />
                </div>
              </div>

              {/* 4 Volume Sub-counters */}
              <div className="mt-8 pt-5 border-t border-slate-700/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Forecast</span>
                  <span className="text-base font-bold font-mono text-white">
                    {reportData.totalForecastQty.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">PCS</span>
                </div>

                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-emerald-400 block uppercase font-medium">Terkirim (SJ)</span>
                  <span className="text-base font-bold font-mono text-emerald-300">
                    {reportData.totalShippedQty.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">PCS</span>
                </div>

                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-teal-400 block uppercase font-medium">Tiba di DC (BAST)</span>
                  <span className="text-base font-bold font-mono text-teal-300">
                    {reportData.totalReceivedQty.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">PCS</span>
                </div>

                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-amber-400 block uppercase font-medium">Sisa Outstanding</span>
                  <span className="text-base font-bold font-mono text-amber-300">
                    {reportData.totalOutstandingQty.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">PCS</span>
                </div>
              </div>
            </div>

            {/* Quality & SLA Health Score Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kualitas Serah Terima &amp; SLA
                </h3>
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  Tingkat Keberhasilan Penerimaan
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluasi fisik barang saat dibongkar di DC Indomarco &amp; Indogrosir
                </p>
              </div>

              <div className="space-y-4">
                {/* On-Time Delivery */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ketepatan Waktu Armada (On-Time SLA)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{reportData.onTimeDeliveryRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${reportData.onTimeDeliveryRate}%` }}
                    />
                  </div>
                </div>

                {/* Quality Acceptance Rate */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fisik Diterima Baik (Acceptance Rate)</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">{reportData.acceptanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${reportData.acceptanceRate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Clean Pass: {reportData.cleanPassBasts} BAST</span>
                    <span className="text-rose-600 font-medium">Rusak: {reportData.totalDamagedQty.toLocaleString()} pcs</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Dokumen BAST:</span>
                <strong className="text-slate-800">{reportData.totalBasts} BAST diterbitkan</strong>
              </div>
            </div>
          </div>

          {/* Deep-Dive Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200 bg-slate-50/70 p-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('dcs')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'dcs'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Matriks Distribution Centers ({reportData.dcsBreakdown.length} DC)</span>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'customers'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kinerja Customer Retail ({reportData.customersBreakdown.length} Akun)</span>
              </button>

              <button
                onClick={() => setActiveTab('skus')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'skus'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Kinerja Produk SKU Kurma ({reportData.productsBreakdown.length} SKU)</span>
              </button>

              <button
                onClick={() => setActiveTab('transporters')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'transporters'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Keandalan Ekspedisi &amp; Armada ({reportData.transportersBreakdown.length} Vendor)</span>
              </button>
            </div>

            {/* Tab 1 Content: Distribution Centers Table */}
            {activeTab === 'dcs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Distribution Center</th>
                      <th className="px-4 py-3">Customer &amp; Wilayah</th>
                      <th className="px-4 py-3 text-right">Target Forecast</th>
                      <th className="px-4 py-3 text-right">Terkirim (SJ)</th>
                      <th className="px-4 py-3 text-right">Diterima Baik</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                      <th className="px-4 py-3">Tingkat Fulfillment</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.dcsBreakdown.map((d) => (
                      <tr key={d.dcId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>{d.dcName}</div>
                          <span className="font-mono text-[10px] text-slate-400">{d.dcCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{d.customerName}</div>
                          <div className="text-[11px] text-slate-400">{d.regionName}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                          {d.forecastQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {d.shippedQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-teal-700">
                          {d.receivedQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-amber-700">
                          {d.outstandingQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, d.fulfillmentRate)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">
                              {d.fulfillmentRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{getDcStatusBadge(d.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2 Content: Customer Breakdown Cards */}
            {activeTab === 'customers' && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.customersBreakdown.map((c) => (
                  <div key={c.customerId} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                            {c.customerCode}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{c.customerName}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Cakupan {c.dcCount} Distribution Centers nasional
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fulfillment</span>
                        <span className="text-2xl font-bold font-mono text-emerald-700">{c.fulfillmentRate}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${c.fulfillmentRate}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Forecast</span>
                        <strong className="font-mono text-slate-900">{c.forecastQty.toLocaleString()} pcs</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-emerald-600 block">Terkirim</span>
                        <strong className="font-mono text-emerald-700">{c.shippedQty.toLocaleString()} pcs</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-amber-600 block">Outstanding</span>
                        <strong className="font-mono text-amber-700">{c.outstandingQty.toLocaleString()} pcs</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>Total Surat Jalan: <strong>{c.totalShipments} dokumen</strong></span>
                      <span>Tingkat Kerusakan: <strong className={c.damagedQty > 0 ? 'text-rose-600' : 'text-emerald-600'}>{c.damagedQty} pcs ({c.damageRate}%)</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3 Content: SKU Performance */}
            {activeTab === 'skus' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">SKU &amp; Nama Produk</th>
                      <th className="px-4 py-3 text-right">Target Kebutuhan</th>
                      <th className="px-4 py-3 text-right">Terkirim (SJ)</th>
                      <th className="px-4 py-3 text-right">Tiba di DC</th>
                      <th className="px-4 py-3 text-right">Sisa Outstanding</th>
                      <th className="px-4 py-3">Tingkat Pemenuhan</th>
                      <th className="px-4 py-3 text-right">Porsi Nasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.productsBreakdown.map((p) => (
                      <tr key={p.productId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{p.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">SKU: {p.sku} • Satuan: {p.unit}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                          {p.forecastQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {p.shippedQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-teal-700">
                          {p.receivedQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-amber-700">
                          {p.outstandingQty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, p.fulfillmentRate)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">
                              {p.fulfillmentRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {p.volumeShare}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4 Content: Transporters & Fleet Performance */}
            {activeTab === 'transporters' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Ekspedisi / Armada</th>
                      <th className="px-4 py-3 text-right">Total Surat Jalan</th>
                      <th className="px-4 py-3 text-right">Selesai Tiba</th>
                      <th className="px-4 py-3 text-right">Sedang In-Transit</th>
                      <th className="px-4 py-3 text-right">Total Muatan (PCS)</th>
                      <th className="px-4 py-3 text-right">Barang Rusak</th>
                      <th className="px-4 py-3">Kepatuhan On-Time SLA</th>
                      <th className="px-4 py-3 text-right">Tingkat Kerusakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.transportersBreakdown.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {t.transporterName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                          {t.totalShipments}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {t.deliveredShipments}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-amber-700">
                          {t.inTransitShipments}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {t.totalUnitsCarried.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                          {t.totalUnitsDamaged > 0 ? t.totalUnitsDamaged.toLocaleString() : '0'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${t.onTimeRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">
                              {t.onTimeRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                          {t.damageRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Printable Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={reportData}
        periodTitle={periodTitle}
      />
    </div>
  );
};
