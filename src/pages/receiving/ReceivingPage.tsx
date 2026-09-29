import React, { useState, useEffect, useMemo } from 'react';
import {
  ReceivingInspection,
  Shipment,
  Customer,
  DistributionCenter,
  CreateReceivingPayload,
} from '../../types';
import {
  getReceivingInspections,
  getPendingReceivingShipments,
  createReceivingInspection,
} from '../../services/receivingService';
import { getCustomers } from '../../services/customerService';
import { getDistributionCenters } from '../../services/dcService';
import { ReceivingStatusBadge } from '../../components/receiving/ReceivingStatusBadge';
import { ReceivingInspectionModal } from '../../components/receiving/ReceivingInspectionModal';
import { BastPrintModal } from '../../components/receiving/BastPrintModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  PackageCheck,
  Building2,
  Calendar,
  Truck,
  Boxes,
  Printer,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ReceivingPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [inspections, setInspections] = useState<ReceivingInspection[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dcFilter, setDcFilter] = useState('all');

  // Modals state
  const [selectedShipmentForInspection, setSelectedShipmentForInspection] = useState<Shipment | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedInspectionForPrint, setSelectedInspectionForPrint] = useState<ReceivingInspection | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const canEditReceiving = canAccess('RECEIVING', 'edit');

  const loadData = async () => {
    try {
      setLoading(true);
      const [inspData, pendData, custData, dcData] = await Promise.all([
        getReceivingInspections({}),
        getPendingReceivingShipments(),
        getCustomers(),
        getDistributionCenters(),
      ]);
      setInspections(inspData);
      setPendingShipments(pendData);
      setCustomers(custData);
      setDcs(dcData);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data Receiving',
        message: err?.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Pending Shipments
  const filteredPending = useMemo(() => {
    return pendingShipments.filter((s) => {
      const matchCustomer =
        customerFilter === 'all' || s.customer_id === customerFilter;
      const matchDc = dcFilter === 'all' || s.dc_id === dcFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.shipment_number.toLowerCase().includes(q) ||
        (s.driver_name && s.driver_name.toLowerCase().includes(q)) ||
        (s.transporter_name && s.transporter_name.toLowerCase().includes(q)) ||
        (s.dc?.dc_name && s.dc.dc_name.toLowerCase().includes(q));

      return matchCustomer && matchDc && matchSearch;
    });
  }, [pendingShipments, customerFilter, dcFilter, searchQuery]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      const matchCustomer =
        customerFilter === 'all' || i.customer_id === customerFilter;
      const matchDc = dcFilter === 'all' || i.dc_id === dcFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        i.bast_number.toLowerCase().includes(q) ||
        i.shipment_number.toLowerCase().includes(q) ||
        i.receiver_name.toLowerCase().includes(q) ||
        (i.driver_name && i.driver_name.toLowerCase().includes(q));

      return matchCustomer && matchDc && matchSearch;
    });
  }, [inspections, customerFilter, dcFilter, searchQuery]);

  // Total KPIs
  const totalGoodQty = inspections.reduce((acc, i) => acc + (i.total_good_qty || 0), 0);
  const totalDamagedQty = inspections.reduce((acc, i) => acc + (i.total_damaged_qty || 0), 0);
  const totalShortageQty = inspections.reduce((acc, i) => acc + (i.total_shortage_qty || 0), 0);

  const handleSubmitInspection = async (payload: CreateReceivingPayload) => {
    return await createReceivingInspection(payload, {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });
  };

  const handleInspectionSuccess = (inspection: ReceivingInspection) => {
    showToast({
      type: 'success',
      title: 'Penerimaan Berhasil & BAST Terbit',
      message: `Berita Acara ${inspection.bast_number} resmi terbit (${inspection.total_good_qty.toLocaleString()} pcs diterima).`,
    });
    loadData();
    // Prompt to view & print BAST
    setSelectedInspectionForPrint(inspection);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                DC Receiving & Verifikasi Fisik (BAST)
              </h1>
              <p className="text-xs text-slate-500">
                Pemeriksaan fisik barang tiba di Distribution Center, validasi kuantiti baik vs rusak, dan penerbitan Berita Acara Serah Terima
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Antrean Inbound DC</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {pendingShipments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Surat Jalan siap diperiksa fisik
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Dokumen BAST Terbit</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {inspections.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Telah ditandatangani serah terima
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Qty Diterima Baik</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalGoodQty.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Kondisi baik & steril (PCS)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Qty Rusak / Selisih</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {(totalDamagedQty + totalShortageQty).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalDamagedQty} rusak, {totalShortageQty} selisih
          </div>
        </div>
      </div>

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Antrean Barang Masuk (QC Inbound)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'pending'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pendingShipments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Riwayat Berita Acara (BAST Selesai)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'completed'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {inspections.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. BAST, No. SJ, pengemudi, penerima..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name}
              </option>
            ))}
          </select>

          <select
            value={dcFilter}
            onChange={(e) => setDcFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-[200px]"
          >
            <option value="all">Semua DC</option>
            {dcs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.dc_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Antrean Inbound (Pending Shipments) */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Antrean Pengiriman Menunggu Pemeriksaan DC ({filteredPending.length} Surat Jalan)
            </h3>
            <span className="text-xs text-slate-500">
              Klik &quot;Proses Penerimaan &amp; QC&quot; saat fisik barang tiba di dock DC
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat antrean barang masuk...</span>
            </div>
          ) : filteredPending.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Semua Kiriman Selesai Diterima
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada armada pengiriman yang saat ini menunggu proses penerimaan fisik atau verifikasi BAST.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No. Surat Jalan</th>
                    <th className="px-4 py-3">Customer &amp; DC Tujuan</th>
                    <th className="px-4 py-3">Armada &amp; Supir</th>
                    <th className="px-4 py-3 text-right">Total Muatan</th>
                    <th className="px-4 py-3">Jadwal Tiba</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPending.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold font-mono text-emerald-700">
                          {s.shipment_number}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Ref: {s.forecast_number || 'Non-Forecast'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {s.customer?.customer_name}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{s.dc?.dc_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {s.transporter_name} ({s.vehicle_plate_number || '-'})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Supir: <strong>{s.driver_name || '-'}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {s.total_qty.toLocaleString()} pcs
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">
                          {s.estimated_arrival_date}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canEditReceiving ? (
                          <button
                            onClick={() => {
                              setSelectedShipmentForInspection(s);
                              setIsInspectionModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Proses QC &amp; BAST</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Akses Read-Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Riwayat BAST (Completed Inspections) */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Dokumen Berita Acara Serah Terima Resmi ({filteredInspections.length} BAST)
            </h3>
            <span className="text-xs text-slate-500">
              Arsip verifikasi fisik serah terima barang di DC
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat dokumen BAST...</span>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Belum Ada Dokumen BAST yang Diterbitkan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan lakukan proses penerimaan fisik pada tab Antrean Masuk terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No. BAST &amp; No. SJ</th>
                    <th className="px-4 py-3">Customer &amp; DC</th>
                    <th className="px-4 py-3">Petugas &amp; Tanggal Terima</th>
                    <th className="px-4 py-3 text-right">Kirim (SJ)</th>
                    <th className="px-4 py-3 text-right">Diterima Baik</th>
                    <th className="px-4 py-3 text-right">Rusak / Selisih</th>
                    <th className="px-4 py-3">Status Evaluasi BAST</th>
                    <th className="px-4 py-3 text-right">Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold font-mono text-slate-900">
                          {rec.bast_number}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700">
                          SJ: {rec.shipment_number}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {rec.customer?.customer_name}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {rec.dc?.dc_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {rec.receiver_name}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {rec.received_date}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                        {rec.total_shipped_qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {rec.total_good_qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {rec.total_damaged_qty > 0 || rec.total_shortage_qty > 0 ? (
                          <span className="text-rose-600">
                            {(rec.total_damaged_qty + rec.total_shortage_qty).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ReceivingStatusBadge status={rec.discrepancy_status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedInspectionForPrint(rec);
                            setIsPrintModalOpen(true);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Lihat / Cetak BAST</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QC & Receiving Form Modal */}
      <ReceivingInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedShipmentForInspection(null);
        }}
        shipment={selectedShipmentForInspection}
        onSubmitReceiving={handleSubmitInspection}
        onSuccess={handleInspectionSuccess}
        defaultReceiverName={user?.full_name || 'Petugas Inbound DC'}
      />

      {/* BAST Print Preview Modal */}
      <BastPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedInspectionForPrint(null);
        }}
        inspection={selectedInspectionForPrint}
      />
    </div>
  );
};
