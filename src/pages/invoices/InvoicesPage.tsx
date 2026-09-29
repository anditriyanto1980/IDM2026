import React, { useState, useEffect, useMemo } from 'react';
import {
  TransporterInvoice,
  TransporterInvoiceStatus,
  LogisticsNotification,
} from '../../types';
import {
  getTransporterInvoices,
  getLogisticsNotifications,
  exportInvoicesToExcel,
} from '../../services/invoiceService';
import { TransporterInvoiceDetailModal } from '../../components/invoices/TransporterInvoiceDetailModal';
import { DispatchNotificationModal } from '../../components/invoices/DispatchNotificationModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Receipt,
  Download,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  DollarSign,
  Plus,
  Send,
  Eye,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'invoices' | 'notifications'>('invoices');
  const [invoices, setInvoices] = useState<TransporterInvoice[]>([]);
  const [notifications, setNotifications] = useState<LogisticsNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [transporterFilter, setTransporterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<TransporterInvoice | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invList, notifList] = await Promise.all([
        getTransporterInvoices({
          transporter: transporterFilter !== 'all' ? transporterFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        getLogisticsNotifications(),
      ]);

      setInvoices(invList);
      setNotifications(notifList);
    } catch (e) {
      console.error('Error loading invoices data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [transporterFilter, statusFilter]);

  // Calculations
  const grossTotal = useMemo(() => invoices.reduce((sum, i) => sum + i.gross_freight_amount, 0), [invoices]);
  const claimsTotal = useMemo(() => invoices.reduce((sum, i) => sum + i.claim_deductions, 0), [invoices]);
  const netTotal = useMemo(() => invoices.reduce((sum, i) => sum + i.net_payable_amount, 0), [invoices]);
  const unpaidCount = useMemo(() => invoices.filter((i) => i.status !== 'PAID').length, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch =
        i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.transporter_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [invoices, searchQuery]);

  const getStatusBadge = (st: TransporterInvoiceStatus) => {
    switch (st) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            LUNAS (PAID)
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            TERVERIFIKASI
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            DISENGKETAKAN
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            MENUNGGU VERIFIKASI
          </span>
        );
    }
  };

  const handleExport = () => {
    exportInvoicesToExcel(invoices);
    showToast('success', 'Rekap tagihan ekspedisi berhasil diexport ke Excel');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              <Receipt className="w-3.5 h-3.5 text-sky-700" />
              FREIGHT INVOICING &amp; DISPATCH
            </span>
            <span className="text-xs text-slate-500 font-medium">Rekonsiliasi Biaya Ekspedisi &amp; BAST</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Faktur Tagihan Ekspedisi &amp; Dispatch Notifikasi
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Perhitungan ongkir pengiriman ke DC, pemotongan otomatis klaim kerusakan (Credit Note), verifikasi faktur, dan dispatch notifikasi WhatsApp ke PIC DC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Notifikasi Dispatch</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Ongkos Bruto
          </span>
          <div className="text-xl font-bold text-slate-900">
            Rp {grossTotal.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Dari {invoices.length} faktur tagihan</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block mb-1">
            Potongan Klaim Retur
          </span>
          <div className="text-xl font-bold text-rose-700">
            - Rp {claimsTotal.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block">Credit Note kerusakan BAST</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
            Total Bersih Dibayarkan
          </span>
          <div className="text-xl font-bold text-emerald-700">
            Rp {netTotal.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Net payable ke ekspedisi</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block mb-1">
            Faktur Belum Lunas
          </span>
          <div className="text-xl font-bold text-amber-700">
            {unpaidCount} <span className="text-xs font-normal text-slate-500">Faktur</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">Perlu verifikasi &amp; transfer</span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-sky-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Faktur Tagihan Ekspedisi ({filteredInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-sky-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Log Notifikasi Dispatch ({notifications.length})
            </button>
          </div>

          {activeTab === 'invoices' && (
            <div className="flex items-center gap-2">
              <select
                value={transporterFilter}
                onChange={(e) => setTransporterFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Semua Ekspedisi</option>
                <option value="Dakota Cargo">Dakota Cargo</option>
                <option value="Kalog Express Logistics">Kalog Express Logistics</option>
                <option value="JNE Trucking">JNE Trucking</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="SUBMITTED">Menunggu Verifikasi</option>
                <option value="VERIFIED">Terverifikasi</option>
                <option value="PAID">Lunas (Paid)</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'invoices' && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor faktur atau nama ekspedisi..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}
      </div>

      {/* Content: Invoices Table vs Notifications Stream */}
      {activeTab === 'invoices' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">No Faktur &amp; Periode</th>
                  <th className="px-5 py-3">Ekspedisi Vendor</th>
                  <th className="px-5 py-3">Jatuh Tempo</th>
                  <th className="px-5 py-3 text-center">Jml SJ</th>
                  <th className="px-5 py-3 text-right">Ongkir Bruto</th>
                  <th className="px-5 py-3 text-right">Potongan Klaim</th>
                  <th className="px-5 py-3 text-right">Total Net Dibayar</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-slate-800 block">
                        {inv.invoice_number}
                      </span>
                      <span className="text-[11px] text-slate-400">Periode: {inv.period_month}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {inv.transporter_name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {inv.due_date}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-slate-700">
                      {inv.total_shipments} SJ
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      Rp {inv.gross_freight_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.claim_deductions > 0 ? (
                        <span className="font-semibold text-rose-600">
                          - Rp {inv.claim_deductions.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-slate-400">Rp 0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">
                      Rp {inv.net_payable_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-sky-800 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Lihat Detail & Rekonsiliasi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada faktur tagihan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Notifications Stream */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.channel === 'WHATSAPP'
                      ? 'bg-emerald-100 text-emerald-700'
                      : notif.channel === 'EMAIL'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {notif.channel === 'WHATSAPP' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : notif.channel === 'EMAIL' ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{notif.title}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {notif.reference_number}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notif.sent_at).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2 whitespace-pre-line">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>
                      Penerima: <strong>{notif.recipient_name}</strong> ({notif.recipient_contact})
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: {notif.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs">
                Belum ada rekaman notifikasi dispatch yang terkirim.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <TransporterInvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdated={loadData}
        />
      )}

      {/* Dispatch Modal */}
      <DispatchNotificationModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onSent={loadData}
      />
    </div>
  );
};
