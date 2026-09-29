import React, { useState, useEffect, useMemo } from 'react';
import { Forecast, Customer, DistributionCenter, Product } from '../../types';
import {
  getForecasts,
  createForecast,
  updateForecast,
  deleteForecast,
  downloadForecastTemplate,
} from '../../services/forecastService';
import { getCustomers } from '../../services/customerService';
import { getDistributionCenters } from '../../services/dcService';
import { getProducts } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ForecastStatusBadge } from '../../components/forecast/ForecastStatusBadge';
import { ForecastDetailModal } from '../../components/forecast/ForecastDetailModal';
import { ForecastFormModal } from '../../components/forecast/ForecastFormModal';
import { ForecastImportModal } from '../../components/forecast/ForecastImportModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingAndEmptyState';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Boxes,
  TrendingUp,
  PackageCheck,
  Clock,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const ForecastPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [detailForecast, setDetailForecast] = useState<Forecast | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [forecastToEdit, setForecastToEdit] = useState<Forecast | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [forecastToDelete, setForecastToDelete] = useState<Forecast | null>(null);

  // Role permissions
  const canManage = user?.role === 'ADMIN' || user?.role === 'SALES';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fList, cList, dcList, pList] = await Promise.all([
        getForecasts({}),
        getCustomers(),
        getDistributionCenters(),
        getProducts(),
      ]);
      setForecasts(fList);
      setCustomers(cList.filter((c) => c.is_active));
      setDcs(dcList.filter((d) => d.is_active));
      setProducts(pList.filter((p) => p.is_active));
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal memuat data forecast',
        message: err?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique periods from forecasts
  const periods = useMemo(() => {
    const set = new Set<string>();
    forecasts.forEach((f) => {
      if (f.period) set.add(f.period);
    });
    return Array.from(set).sort().reverse();
  }, [forecasts]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts.filter((f) => {
      const matchCustomer =
        selectedCustomerId === 'all' || f.customer_id === selectedCustomerId;
      const matchPeriod =
        selectedPeriod === 'all' || f.period === selectedPeriod;
      const matchStatus =
        selectedStatus === 'all' || f.status === selectedStatus;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.forecast_number.toLowerCase().includes(q) ||
        (f.dc?.dc_name && f.dc.dc_name.toLowerCase().includes(q)) ||
        (f.dc?.city && f.dc.city.toLowerCase().includes(q)) ||
        (f.customer?.customer_name && f.customer.customer_name.toLowerCase().includes(q)) ||
        (f.notes && f.notes.toLowerCase().includes(q));

      return matchCustomer && matchPeriod && matchStatus && matchSearch;
    });
  }, [forecasts, search, selectedCustomerId, selectedPeriod, selectedStatus]);

  // Pagination slice
  const totalPages = Math.ceil(filteredForecasts.length / ITEMS_PER_PAGE);
  const paginatedForecasts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredForecasts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredForecasts, currentPage]);

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    let totalQty = 0;
    let totalShipped = 0;
    let totalReceived = 0;
    let overdueCount = 0;

    forecasts.forEach((f) => {
      totalQty += f.total_qty || 0;
      totalShipped += f.total_shipped || 0;
      totalReceived += f.total_received || 0;
      if (f.status === 'OVERDUE') overdueCount++;
    });

    const outstanding = Math.max(0, totalQty - totalShipped);
    const fulfillmentRate =
      totalQty > 0 ? Math.min(100, Math.round((totalShipped / totalQty) * 100)) : 0;

    return {
      totalForecasts: forecasts.length,
      totalQty,
      totalShipped,
      totalReceived,
      outstanding,
      fulfillmentRate,
      overdueCount,
    };
  }, [forecasts]);

  // Handlers
  const handleSaveForecast = async (payload: any) => {
    if (forecastToEdit) {
      await updateForecast(forecastToEdit.id, payload, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Forecast Berhasil Diperbarui',
        message: `Perubahan pada forecast ${forecastToEdit.forecast_number} telah disimpan.`,
      });
    } else {
      const created = await createForecast(payload, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Forecast Baru Terdaftar',
        message: `Nomor ${created.forecast_number} berhasil dibuat.`,
      });
    }
    await loadData();
    setIsFormOpen(false);
    setForecastToEdit(null);
  };

  const handleDeleteForecast = async () => {
    if (!forecastToDelete) return;
    try {
      await deleteForecast(forecastToDelete.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Forecast Dihapus',
        message: `Forecast ${forecastToDelete.forecast_number} telah dihapus dari sistem.`,
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Forecast',
        message: err?.message,
      });
    } finally {
      setForecastToDelete(null);
    }
  };

  const handleImportSuccess = async (count: number) => {
    showToast({
      type: 'success',
      title: 'Import Excel Berhasil',
      message: `${count} forecast berhasil diimpor dan disimpan ke database.`,
    });
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Forecast Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perencanaan dan alokasi kebutuhan kurma per Distribution Center (IDM & IGR)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={downloadForecastTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Download Template Excel untuk Pengisian Batch"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template XLS</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setForecastToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-800 rounded-lg hover:bg-sky-900 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Forecast</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Forecast
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {kpiStats.totalForecasts}
            </span>
            <span className="text-xs text-slate-500 font-medium">Dokumen</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mencakup {customers.length} Customer & {dcs.length} DC
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Volume Alokasi (PCS)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {kpiStats.totalQty.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">PCS</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Total target permintaan periode ini
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Fulfillment Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-950 tabular-nums">
              {kpiStats.fulfillmentRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({kpiStats.totalShipped.toLocaleString('id-ID')} pcs)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${kpiStats.fulfillmentRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Outstanding (Sisa Kirim)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800 tabular-nums">
              {kpiStats.outstanding.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">PCS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {kpiStats.overdueCount > 0 ? (
              <span className="text-rose-600 font-semibold">
                {kpiStats.overdueCount} forecast lewat target
              </span>
            ) : (
              'Semua jadwal sesuai rencana'
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nomor forecast, DC, catatan..."
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

          {/* Period filter */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Periode</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  Periode {p}
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
              <option value="FORECAST">Forecast Dibuat</option>
              <option value="PARTIAL">Sebagian Terkirim</option>
              <option value="IN_TRANSIT">Dalam Perjalanan</option>
              <option value="RECEIVED">Selesai Diterima</option>
              <option value="OVERDUE">Lewat Target</option>
            </select>
          </div>
        </div>

        {/* Active filter pills / reset */}
        {(search || selectedCustomerId !== 'all' || selectedPeriod !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Menampilkan {filteredForecasts.length} dari {forecasts.length} total forecast
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCustomerId('all');
                setSelectedPeriod('all');
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

      {/* Main Forecast Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : filteredForecasts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak Ada Forecast Ditemukan"
              description={
                search || selectedCustomerId !== 'all' || selectedPeriod !== 'all' || selectedStatus !== 'all'
                  ? 'Tidak ada data forecast yang cocok dengan kriteria pencarian dan filter.'
                  : 'Belum ada data forecast dalam sistem. Mulai dengan membuat forecast manual atau impor dari Excel.'
              }
              actionLabel={canManage ? '+ Buat Forecast Baru' : undefined}
              onAction={
                canManage
                  ? () => {
                      setForecastToEdit(null);
                      setIsFormOpen(true);
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">No. Forecast</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Distribution Center</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Target Delivery</th>
                  <th className="py-3 px-4 text-right">Total Qty</th>
                  <th className="py-3 px-4">Status & Progres</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedForecasts.map((forecast) => {
                  const rate =
                    forecast.total_qty > 0
                      ? Math.min(100, Math.round((forecast.total_shipped / forecast.total_qty) * 100))
                      : 0;

                  return (
                    <tr
                      key={forecast.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setDetailForecast(forecast)}
                    >
                      {/* Forecast Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                        <span className="hover:underline flex items-center gap-1.5">
                          {forecast.forecast_number}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal font-sans block">
                          {forecast.items?.length || 0} SKU produk
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {forecast.customer?.customer_name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {forecast.customer?.customer_code}
                        </span>
                      </td>

                      {/* Distribution Center */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{forecast.dc?.dc_name || 'DC Tujuan'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {forecast.dc?.city || ''} ({forecast.region?.region_code || ''})
                        </span>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {forecast.period}
                      </td>

                      {/* Target Delivery */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">
                          {forecast.target_delivery_date}
                        </span>
                        {forecast.status === 'OVERDUE' && (
                          <span className="text-[10px] text-rose-600 font-medium block">
                            Terlambat
                          </span>
                        )}
                      </td>

                      {/* Total Qty */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {forecast.total_qty.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">PCS</span>
                      </td>

                      {/* Status & Progress Bar */}
                      <td className="py-3.5 px-4 min-w-36">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <ForecastStatusBadge status={forecast.status} size="sm" />
                          <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                            {rate}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              forecast.status === 'RECEIVED'
                                ? 'bg-emerald-500'
                                : forecast.status === 'OVERDUE'
                                ? 'bg-rose-500'
                                : 'bg-sky-600'
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailForecast(forecast)}
                            className="p-1.5 text-slate-400 hover:text-sky-800 rounded-md hover:bg-slate-100 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && forecast.total_shipped === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setForecastToEdit(forecast);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-700 rounded-md hover:bg-slate-100 transition-colors"
                              title="Edit Forecast"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canManage && forecast.total_shipped === 0 && (
                            <button
                              type="button"
                              onClick={() => setForecastToDelete(forecast)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                              title="Hapus Forecast"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {filteredForecasts.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredForecasts.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ForecastDetailModal
        isOpen={Boolean(detailForecast)}
        onClose={() => setDetailForecast(null)}
        forecast={detailForecast}
        onEdit={(fc) => {
          setForecastToEdit(fc);
          setIsFormOpen(true);
        }}
      />

      <ForecastFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setForecastToEdit(null);
        }}
        onSubmit={handleSaveForecast}
        forecastToEdit={forecastToEdit}
        customers={customers}
        dcs={dcs}
        products={products}
      />

      <ForecastImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <ConfirmDialog
        isOpen={Boolean(forecastToDelete)}
        title="Konfirmasi Hapus Forecast"
        message={`Apakah Anda yakin ingin menghapus forecast ${forecastToDelete?.forecast_number} (${forecastToDelete?.total_qty.toLocaleString()} PCS)? Tindakan ini akan dicatat di audit log.`}
        confirmLabel="Ya, Hapus"
        isDanger={true}
        onConfirm={handleDeleteForecast}
        onCancel={() => setForecastToDelete(null)}
      />
    </div>
  );
};
