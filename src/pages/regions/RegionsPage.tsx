import React, { useState, useEffect } from 'react';
import { Region } from '../../types';
import {
  getRegions,
  createRegion,
  updateRegion,
  toggleRegionStatus,
  deleteRegion,
} from '../../services/regionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableLoadingState, EmptyState, ErrorState } from '../../components/common/LoadingAndEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RegionModal } from '../../components/master/RegionModal';
import { Search, Plus, Edit2, Power, Trash2, MapPin, Building2 } from 'lucide-react';

export const RegionsPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<Region | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const canEdit = canAccess('REGIONS', 'edit');

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegions(search, statusFilter);
      setRegions(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar wilayah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedRegion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: Region) => {
    setSelectedRegion(r);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    region_code: string;
    region_name: string;
    description?: string;
    is_active: boolean;
  }) => {
    setModalLoading(true);
    try {
      if (selectedRegion) {
        await updateRegion(selectedRegion.id, payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Wilayah Diperbarui', `Wilayah ${payload.region_name} berhasil disimpan.`);
      } else {
        await createRegion(payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Wilayah Ditambahkan', `Wilayah ${payload.region_name} (${payload.region_code}) berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      fetchList();
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
      await toggleRegionStatus(toggleTarget.id, newStatus, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast(
        'success',
        newStatus ? 'Wilayah Diaktifkan' : 'Wilayah Dinonaktifkan',
        `Status wilayah ${toggleTarget.region_name} berhasil diubah.`
      );
      setToggleTarget(null);
      fetchList();
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
      await deleteRegion(deleteTarget.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'Wilayah Dihapus', `Wilayah ${deleteTarget.region_name} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchList();
    } catch (err: any) {
      showToast('error', 'Penghapusan Dibatalkan', err.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const paginatedRegions = regions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Master Regions</h1>
          <p className="text-xs text-slate-500">
            Zonasi logistik distribusi untuk wilayah pulau dan regional seluruh Indonesia
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Wilayah</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kode atau nama wilayah..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-stretch sm:self-auto justify-center">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
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
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
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
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'inactive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nonaktif
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <TableLoadingState message="Memuat master data wilayah..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchList} />
        ) : regions.length === 0 ? (
          <EmptyState
            title="Tidak Ada Wilayah"
            description={
              search ? 'Tidak ditemukan wilayah yang sesuai dengan pencarian Anda.' : 'Belum ada data wilayah tersimpan.'
            }
            actionLabel={canEdit ? 'Tambah Wilayah Baru' : undefined}
            onAction={canEdit ? handleOpenAdd : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Region Code</th>
                    <th className="px-4 py-3">Region Name</th>
                    <th className="px-4 py-3">Distribution Centers</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRegions.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-900">
                        {reg.region_code}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{reg.region_name}</div>
                        {reg.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {reg.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold tabular-nums">{reg.dc_count || 0}</span>
                          <span className="text-[11px] text-slate-400">DC</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={reg.is_active} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(reg)}
                                className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                                title="Edit Wilayah"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setToggleTarget(reg)}
                                className={`p-1.5 rounded transition-colors ${
                                  reg.is_active
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={reg.is_active ? 'Nonaktifkan Wilayah' : 'Aktifkan Wilayah'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(reg)}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus Wilayah"
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
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={regions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <RegionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        region={selectedRegion}
        isLoading={modalLoading}
      />

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? 'Nonaktifkan Wilayah?' : 'Aktifkan Wilayah?'}
        message={
          toggleTarget?.is_active
            ? `Wilayah "${toggleTarget.region_name}" (${toggleTarget.region_code}) akan dinonaktifkan.`
            : `Wilayah "${toggleTarget?.region_name}" (${toggleTarget?.region_code}) akan diaktifkan kembali.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={toggleTarget?.is_active}
        isLoading={isToggleLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Wilayah?"
        message={`Perhatian: Wilayah "${deleteTarget?.region_name}" (${deleteTarget?.region_code}) hanya dapat dihapus jika tidak ada DC yang berlokasi di wilayah ini. Jika masih ada DC terkait, penghapusan akan dicegah secara otomatis.`}
        confirmLabel="Hapus Permanen"
        isDestructive={true}
        isLoading={isDeleteLoading}
      />
    </div>
  );
};
