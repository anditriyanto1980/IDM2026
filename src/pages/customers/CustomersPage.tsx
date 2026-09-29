import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
} from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableLoadingState, EmptyState, ErrorState } from '../../components/common/LoadingAndEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CustomerModal } from '../../components/master/CustomerModal';
import { Search, Plus, Edit2, Power, Trash2, Building2, Info } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Status toggle confirmation
  const [toggleTarget, setToggleTarget] = useState<Customer | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const canEdit = canAccess('CUSTOMERS', 'edit');

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(search, statusFilter);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar customer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    customer_code: string;
    customer_name: string;
    description?: string;
    is_active: boolean;
  }) => {
    setModalLoading(true);
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Customer Diperbarui', `Data customer ${payload.customer_name} berhasil disimpan.`);
      } else {
        await createCustomer(payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Customer Ditambahkan', `Customer ${payload.customer_name} (${payload.customer_code}) berhasil dibuat.`);
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
      await toggleCustomerStatus(toggleTarget.id, newStatus, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast(
        'success',
        newStatus ? 'Customer Diaktifkan' : 'Customer Dinonaktifkan',
        `Status customer ${toggleTarget.customer_name} berhasil diubah.`
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
      await deleteCustomer(deleteTarget.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'Customer Dihapus', `Data customer ${deleteTarget.customer_name} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchList();
    } catch (err: any) {
      showToast('error', 'Penghapusan Dibatalkan', err.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Pagination slice
  const paginatedCustomers = customers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Master Customers</h1>
          <p className="text-xs text-slate-500">
            Daftar customer retail dan wholesale pemesan produk kurma Akram (Indogrosir, Indomarco)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Customer</span>
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
            placeholder="Cari kode atau nama customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        {/* Status segment tab */}
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
          <TableLoadingState message="Memuat master data customer..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchList} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="Tidak Ada Customer"
            description={
              search ? 'Tidak ditemukan customer yang sesuai dengan pencarian Anda.' : 'Belum ada data customer tersimpan.'
            }
            actionLabel={canEdit ? 'Tambah Customer Baru' : undefined}
            onAction={canEdit ? handleOpenAdd : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Customer Code</th>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Distribution Centers</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Dibuat Pada</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-sky-900">
                        {cust.customer_code}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{cust.customer_name}</div>
                        {cust.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {cust.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold tabular-nums">{cust.dc_count || 0}</span>
                          <span className="text-[11px] text-slate-400">DC</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={cust.is_active} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(cust.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(cust)}
                                className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                                title="Edit Customer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setToggleTarget(cust)}
                                className={`p-1.5 rounded transition-colors ${
                                  cust.is_active
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={cust.is_active ? 'Nonaktifkan Customer' : 'Aktifkan Customer'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(cust)}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus Customer"
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
              totalItems={customers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        customer={selectedCustomer}
        isLoading={modalLoading}
      />

      {/* Toggle Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? 'Nonaktifkan Customer?' : 'Aktifkan Customer?'}
        message={
          toggleTarget?.is_active
            ? `Customer "${toggleTarget.customer_name}" (${toggleTarget.customer_code}) akan dinonaktifkan. Data ini tidak akan dapat dipilih untuk alokasi forecast baru.`
            : `Customer "${toggleTarget?.customer_name}" (${toggleTarget?.customer_code}) akan diaktifkan kembali untuk operasional alokasi forecast.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={toggleTarget?.is_active}
        isLoading={isToggleLoading}
      />

      {/* Delete Confirm Dialog (Hard delete checks) */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Customer Permanen?"
        message={`Perhatian: Customer "${deleteTarget?.customer_name}" (${deleteTarget?.customer_code}) hanya dapat dihapus jika belum memiliki riwayat Distribution Center atau transaksi. Jika sudah digunakan, sistem akan menolak penghapusan dan menyarankan opsi Nonaktifkan (Deactivate).`}
        confirmLabel="Hapus Permanen"
        isDestructive={true}
        isLoading={isDeleteLoading}
      />
    </div>
  );
};
