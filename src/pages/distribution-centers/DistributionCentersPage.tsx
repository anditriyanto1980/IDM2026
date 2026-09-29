import React, { useState, useEffect, useMemo } from 'react';
import { DistributionCenter, Customer } from '../../types';
import {
  getDistributionCenters,
  createDistributionCenter,
  updateDistributionCenter,
  toggleDcStatus,
  deleteDistributionCenter,
} from '../../services/dcService';
import { getCustomers } from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableLoadingState, EmptyState, ErrorState } from '../../components/common/LoadingAndEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DcModal } from '../../components/master/DcModal';
import { exportDistributionCentersToCsv } from '../../services/csvExportService';
import {
  Search,
  Plus,
  Edit2,
  Power,
  Trash2,
  Phone,
  MapPin,
  Building2,
  Download,
  CheckCircle2,
  Globe2,
} from 'lucide-react';

export const DistributionCentersPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allDcsUnfiltered, setAllDcsUnfiltered] = useState<DistributionCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDc, setSelectedDc] = useState<DistributionCenter | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<DistributionCenter | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DistributionCenter | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const canEdit = canAccess('DCS', 'edit');

  const fetchDropdownsAndList = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cList, dList, allDcs] = await Promise.all([
        getCustomers('', 'active'),
        getDistributionCenters(search, selectedCustomerId, selectedRegion, statusFilter),
        getDistributionCenters('', 'all', 'all', 'all'),
      ]);
      setCustomers(cList);
      setDcs(dList);
      setAllDcsUnfiltered(allDcs);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat Distribution Centers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownsAndList();
  }, [search, selectedCustomerId, selectedRegion, statusFilter]);

  // Extract distinct wilayah/regions from all existing DCs for filter dropdown & datalist suggestions
  const distinctRegions = useMemo(() => {
    const set = new Set<string>();
    allDcsUnfiltered.forEach((d) => {
      const name = d.region?.region_name || d.region_id;
      if (name && name.trim()) set.add(name.trim());
    });
    // Add default popular Indonesian logistic regions if empty
    if (set.size === 0) {
      ['Jabodetabek', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Bali & Nusa Tenggara', 'Sumatera', 'Sulawesi'].forEach(
        (r) => set.add(r)
      );
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allDcsUnfiltered]);

  const handleOpenAdd = () => {
    setSelectedDc(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dc: DistributionCenter) => {
    setSelectedDc(dc);
    setIsModalOpen(true);
  };

  const handleSaveDc = async (payload: {
    dc_code: string;
    dc_name: string;
    customer_id: string;
    region_id: string;
    city: string;
    province: string;
    address?: string;
    pic_name?: string;
    pic_phone?: string;
    is_active: boolean;
  }) => {
    setModalLoading(true);
    try {
      if (selectedDc) {
        await updateDistributionCenter(selectedDc.id, payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'DC Diperbarui', `Distribution Center ${payload.dc_name} (${payload.dc_code}) berhasil disimpan.`);
      } else {
        await createDistributionCenter(payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'DC Ditambahkan', `Distribution Center ${payload.dc_name} (${payload.dc_code}) berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      fetchDropdownsAndList();
    } catch (err: any) {
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggleLoading(true);
    try {
      const newStatus = !toggleTarget.is_active;
      await toggleDcStatus(toggleTarget.id, newStatus, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast(
        'success',
        newStatus ? 'DC Diaktifkan' : 'DC Dinonaktifkan',
        `Status DC ${toggleTarget.dc_name} berhasil diubah.`
      );
      setToggleTarget(null);
      fetchDropdownsAndList();
    } catch (err: any) {
      showToast('error', 'Gagal Mengubah Status', err.message);
    } finally {
      setIsToggleLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleteLoading(true);
    try {
      await deleteDistributionCenter(deleteTarget.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'DC Dihapus', `Distribution Center ${deleteTarget.dc_name} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchDropdownsAndList();
    } catch (err: any) {
      showToast('error', 'Penghapusan Dibatalkan', err.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (dcs.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada data DC yang sesuai filter untuk diekspor.');
      return;
    }
    exportDistributionCentersToCsv(dcs);
    showToast('success', 'Export CSV Berhasil', `${dcs.length} data Distribution Center berhasil diekspor ke CSV.`);
  };

  const paginatedDcs = dcs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeDcsCount = allDcsUnfiltered.filter((d) => d.is_active).length;

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-900" />
              <h1 className="text-base font-bold text-slate-900">Master Distribution Centers (DC)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Titik serah gudang DC penerima alokasi logistik beserta data wilayah cakupan operasionalnya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={dcs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Ekspor daftar master DC ke file CSV untuk offline audit"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV ({dcs.length})</span>
            </button>

            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah DC Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-900 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Total Distribution Center</div>
            <div className="text-lg font-bold text-slate-900">
              {allDcsUnfiltered.length} <span className="text-xs font-normal text-slate-400">Titik DC</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">DC Aktif Operasional</div>
            <div className="text-lg font-bold text-emerald-800">
              {activeDcsCount} <span className="text-xs font-normal text-slate-400">Siap Terima Alokasi</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Cakupan Wilayah / Region</div>
            <div className="text-lg font-bold text-indigo-900">
              {distinctRegions.length} <span className="text-xs font-normal text-slate-400">Wilayah Terdata</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode, nama DC, wilayah, kota..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
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
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            >
              <option value="all">Semua Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_code} - {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* Region filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            >
              <option value="all">Semua Wilayah DC</option>
              {distinctRegions.map((rName) => (
                <option key={rName} value={rName}>
                  {rName}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg justify-center">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors text-center ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setStatusFilter('active');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors text-center ${
                statusFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => {
                setStatusFilter('inactive');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors text-center ${
                statusFilter === 'inactive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <TableLoadingState message="Memuat master data Distribution Centers..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDropdownsAndList} />
        ) : dcs.length === 0 ? (
          <EmptyState
            title="Tidak Ada Distribution Center"
            description={
              search ? 'Tidak ditemukan DC yang sesuai kriteria pencarian.' : 'Belum ada data DC tersimpan.'
            }
            actionLabel={canEdit ? 'Tambah DC Baru' : undefined}
            onAction={canEdit ? handleOpenAdd : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">DC Code</th>
                    <th className="px-4 py-3">DC Name</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Wilayah / Region</th>
                    <th className="px-4 py-3">Kota / Provinsi</th>
                    <th className="px-4 py-3">PIC Kontak</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDcs.map((dc) => {
                    const regionLabel = dc.region?.region_name || dc.region_id || 'Umum';
                    return (
                      <tr key={dc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-sky-900 whitespace-nowrap">
                          {dc.dc_code}
                        </td>
                        <td className="px-4 py-3.5">
                          {canEdit ? (
                            <button
                              onClick={() => handleOpenEdit(dc)}
                              className="font-semibold text-slate-900 hover:text-sky-700 text-left transition-colors cursor-pointer group flex items-center gap-1.5"
                              title="Klik untuk edit data DC ini"
                            >
                              <span>{dc.dc_name}</span>
                              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <div className="font-semibold text-slate-900">{dc.dc_name}</div>
                          )}
                          {dc.address && (
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {dc.address}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-medium text-slate-800">
                            {dc.customer?.customer_name || 'Customer'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                            ({dc.customer?.customer_code})
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
                            <MapPin className="w-3 h-3 text-sky-700" />
                            {regionLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{dc.city}</div>
                          <div className="text-[11px] text-slate-400">{dc.province}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {dc.pic_name ? (
                            <div>
                              <div className="text-slate-800 font-medium">{dc.pic_name}</div>
                              {dc.pic_phone && (
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {dc.pic_phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge isActive={dc.is_active} size="sm" />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(dc)}
                                  className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                                  title="Edit DC"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setToggleTarget(dc)}
                                  className={`p-1.5 rounded transition-colors ${
                                    dc.is_active
                                      ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                      : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={dc.is_active ? 'Nonaktifkan DC' : 'Aktifkan DC'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(dc)}
                                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                  title="Hapus DC"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">View Only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={dcs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* DC Modal for Direct Manual Input */}
      <DcModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDc}
        dc={selectedDc}
        customers={customers}
        existingRegions={distinctRegions}
        isLoading={modalLoading}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? 'Nonaktifkan DC?' : 'Aktifkan DC?'}
        message={
          toggleTarget?.is_active
            ? `Distribution Center "${toggleTarget.dc_name}" (${toggleTarget.dc_code}) akan dinonaktifkan.`
            : `Distribution Center "${toggleTarget?.dc_name}" (${toggleTarget?.dc_code}) akan diaktifkan kembali.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={toggleTarget?.is_active}
        isLoading={isToggleLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Distribution Center?"
        message={`Apakah Anda yakin ingin menghapus Distribution Center "${deleteTarget?.dc_name}" (${deleteTarget?.dc_code}) secara permanen?`}
        confirmLabel="Hapus Permanen"
        isDestructive={true}
        isLoading={isDeleteLoading}
      />
    </div>
  );
};
