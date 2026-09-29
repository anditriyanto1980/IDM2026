import React, { useState, useEffect, useMemo } from 'react';
import {
  Shipment,
  Customer,
  DistributionCenter,
  Product,
  Forecast,
  ShipmentStatus,
  CreateShipmentPayload,
} from '../../types';
import {
  getShipments,
  createShipment,
  updateShipmentStatus,
  deleteShipment,
} from '../../services/shipmentService';
import { getCustomers } from '../../services/customerService';
import { getDistributionCenters } from '../../services/dcService';
import { getProducts } from '../../services/productService';
import { getForecasts } from '../../services/forecastService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ShipmentStatusBadge } from '../../components/shipment/ShipmentStatusBadge';
import { ShipmentDetailModal } from '../../components/shipment/ShipmentDetailModal';
import { SuratJalanPrintModal } from '../../components/shipment/SuratJalanPrintModal';
import { ShipmentFormModal } from '../../components/shipment/ShipmentFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingAndEmptyState';
import { exportShipmentsTableToCsv } from '../../services/csvExportService';
import {
  Search,
  Plus,
  Printer,
  Eye,
  Trash2,
  Truck,
  Building2,
  Calendar,
  CheckCircle2,
  Boxes,
  ArrowRight,
  Clock,
  MapPin,
  Download,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const ShipmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);
  const [printShipment, setPrintShipment] = useState<Shipment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  // Role permissions: Admin, Warehouse, Logistics can create/dispatch
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'WAREHOUSE' || user?.role === 'LOGISTICS';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, cList, dcList, pList, fList] = await Promise.all([
        getShipments({}),
        getCustomers(),
        getDistributionCenters(),
        getProducts(),
        getForecasts({}),
      ]);
      setShipments(sList);
      setCustomers(cList.filter((c) => c.is_active));
      setDcs(dcList.filter((d) => d.is_active));
      setProducts(pList.filter((p) => p.is_active));
      setForecasts(fList);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal memuat data pengiriman',
        message: err?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchCustomer =
        selectedCustomerId === 'all' || s.customer_id === selectedCustomerId;
      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.shipment_number.toLowerCase().includes(q) ||
        (s.forecast_number && s.forecast_number.toLowerCase().includes(q)) ||
        (s.tracking_number_ref && s.tracking_number_ref.toLowerCase().includes(q)) ||
        (s.transporter_name && s.transporter_name.toLowerCase().includes(q)) ||
        (s.vehicle_plate_number && s.vehicle_plate_number.toLowerCase().includes(q)) ||
        (s.driver_name && s.driver_name.toLowerCase().includes(q)) ||
        (s.dc?.dc_name && s.dc.dc_name.toLowerCase().includes(q)) ||
        (s.customer?.customer_name && s.customer.customer_name.toLowerCase().includes(q));

      return matchCustomer && matchStatus && matchSearch;
    });
  }, [shipments, search, selectedCustomerId, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE);
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredShipments, currentPage]);

  // Aggregate KPI
  const kpi = useMemo(() => {
    let inTransit = 0;
    let ready = 0;
    let delivered = 0;
    let totalQty = 0;

    shipments.forEach((s) => {
      totalQty += s.total_qty || 0;
      if (s.status === 'IN_TRANSIT') inTransit++;
      if (s.status === 'READY_TO_DISPATCH') ready++;
      if (s.status === 'DELIVERED') delivered++;
    });

    return {
      totalShipments: shipments.length,
      inTransit,
      ready,
      delivered,
      totalQty,
    };
  }, [shipments]);

  // Handlers
  const handleCreateShipment = async (payload: CreateShipmentPayload) => {
    const created = await createShipment(payload, {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });
    showToast({
      type: 'success',
      title: 'Surat Jalan Diterbitkan',
      message: `Nomor ${created.shipment_number} berhasil dibuat.`,
    });
    await loadData();
    setIsFormOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: ShipmentStatus) => {
    try {
      const updated = await updateShipmentStatus(id, newStatus, undefined, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Status Diperbarui',
        message: `Surat Jalan ${updated.shipment_number} kini berstatus: ${newStatus}`,
      });
      await loadData();
      if (detailShipment?.id === id) {
        setDetailShipment(updated);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Status',
        message: err?.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!shipmentToDelete) return;
    try {
      await deleteShipment(shipmentToDelete.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Surat Jalan Dihapus',
        message: `Surat Jalan ${shipmentToDelete.shipment_number} telah dihapus.`,
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err?.message,
      });
    } finally {
      setShipmentToDelete(null);
    }
  };

  const handleExportCsv = () => {
    if (filteredShipments.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada data surat jalan yang sesuai filter untuk diekspor.');
      return;
    }
    exportShipmentsTableToCsv(filteredShipments);
    showToast('success', 'Export CSV Berhasil', `${filteredShipments.length} dokumen surat jalan berhasil diunduh ke format CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Shipment &amp; Surat Jalan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen penerbitan Surat Jalan resmi, armada logistik, dan pelacakan pengiriman kurma ke DC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredShipments.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Unduh rekap surat jalan ke format CSV untuk audit & pelaporan offline"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV ({filteredShipments.length})</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-800 rounded-lg hover:bg-sky-900 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Terbitkan Surat Jalan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Surat Jalan
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {kpi.totalShipments}
            </span>
            <span className="text-xs text-slate-500 font-medium">Dokumen</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {kpi.delivered} pengiriman telah selesai diterima
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dalam Perjalanan (In Transit)
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-900 tabular-nums">{kpi.inTransit}</span>
            <span className="text-xs text-slate-500 font-medium">Armada Aktif</span>
          </div>
          <div className="text-[11px] text-sky-700 font-medium mt-1">
            Menuju Distribution Center
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Siap Berangkat (Ready)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800 tabular-nums">{kpi.ready}</span>
            <span className="text-xs text-slate-500 font-medium">Muatan Gudang</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Menunggu pickup / keberangkatan
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Volume Terkirim
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800 tabular-nums">
              {kpi.totalQty.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">PCS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi produk kurma dialokasikan</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari no. SJ, no. resi, sopir, plat nomor, DC..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Customer filter */}
          <div>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} ({c.customer_code})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Status</option>
              <option value="READY_TO_DISPATCH">Siap Berangkat</option>
              <option value="IN_TRANSIT">Dalam Perjalanan</option>
              <option value="ARRIVED_DC">Tiba di Gate DC</option>
              <option value="DELIVERED">Selesai Diterima</option>
            </select>
          </div>
        </div>

        {(search || selectedCustomerId !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Menampilkan {filteredShipments.length} dari {shipments.length} total surat jalan
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCustomerId('all');
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className="text-sky-800 hover:text-sky-950 font-medium"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak Ada Data Pengiriman"
              description={
                search || selectedCustomerId !== 'all' || selectedStatus !== 'all'
                  ? 'Tidak ada pengiriman yang sesuai dengan kriteria pencarian dan filter.'
                  : 'Belum ada Surat Jalan yang diterbitkan. Buat Surat Jalan baru untuk memulai proses pengiriman ke DC.'
              }
              actionLabel={canManage ? '+ Terbitkan Surat Jalan' : undefined}
              onAction={canManage ? () => setIsFormOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">No. Surat Jalan</th>
                  <th className="py-3 px-4">Customer & DC Tujuan</th>
                  <th className="py-3 px-4">Ekspedisi & Armada</th>
                  <th className="py-3 px-4">Tgl Kirim / ETA</th>
                  <th className="py-3 px-4 text-right">Total Qty</th>
                  <th className="py-3 px-4">Status Pengiriman</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedShipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setDetailShipment(s)}
                  >
                    {/* Shipment Number & Forecast Link */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                      <span className="hover:underline block">{s.shipment_number}</span>
                      {s.forecast_number && (
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">
                          Ref: {s.forecast_number}
                        </span>
                      )}
                    </td>

                    {/* Customer & DC */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {s.customer?.customer_name} ({s.customer?.customer_code})
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {s.dc?.dc_name} - {s.dc?.city}
                        </span>
                      </span>
                    </td>

                    {/* Transporter & Vehicle */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">
                        {s.transporter_name}
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {s.vehicle_plate_number && <span>{s.vehicle_plate_number}</span>}
                        {s.driver_name && (
                          <span className="font-sans ml-1 text-slate-400">({s.driver_name})</span>
                        )}
                      </div>
                      {s.tracking_number_ref && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Resi: {s.tracking_number_ref}
                        </span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 block font-medium">{s.shipment_date}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ETA: {s.estimated_arrival_date}
                      </span>
                    </td>

                    {/* Total Qty */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {s.total_qty.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">PCS</span>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        {s.items?.length || 0} SKU
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <ShipmentStatusBadge status={s.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailShipment(s)}
                          className="p-1.5 text-slate-400 hover:text-sky-800 rounded-md hover:bg-slate-100 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintShipment(s)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Cetak Surat Jalan"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {canManage && s.status === 'READY_TO_DISPATCH' && (
                          <button
                            type="button"
                            onClick={() => setShipmentToDelete(s)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Hapus Surat Jalan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredShipments.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredShipments.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ShipmentDetailModal
        isOpen={Boolean(detailShipment)}
        onClose={() => setDetailShipment(null)}
        shipment={detailShipment}
        onPrint={(s) => {
          setDetailShipment(null);
          setPrintShipment(s);
        }}
        onStatusUpdate={handleUpdateStatus}
        canUpdateStatus={canManage}
      />

      <SuratJalanPrintModal
        isOpen={Boolean(printShipment)}
        onClose={() => setPrintShipment(null)}
        shipment={printShipment}
      />

      <ShipmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateShipment}
        customers={customers}
        dcs={dcs}
        products={products}
        forecasts={forecasts}
      />

      <ConfirmDialog
        isOpen={Boolean(shipmentToDelete)}
        title="Hapus Surat Jalan"
        message={`Apakah Anda yakin ingin membatalkan dan menghapus Surat Jalan ${shipmentToDelete?.shipment_number}? Alokasi kuantiti forecast terkait akan dikembalikan.`}
        confirmLabel="Ya, Hapus"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShipmentToDelete(null)}
      />
    </div>
  );
};
