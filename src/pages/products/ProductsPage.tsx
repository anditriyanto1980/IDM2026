import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import {
  getProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableLoadingState, EmptyState, ErrorState } from '../../components/common/LoadingAndEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProductModal } from '../../components/master/ProductModal';
import { Search, Plus, Edit2, Power, Trash2, Package } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<Product | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const canEdit = canAccess('PRODUCTS', 'edit');

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(search, statusFilter);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    sku: string;
    product_name: string;
    unit: string;
    description?: string;
    is_active: boolean;
  }) => {
    setModalLoading(true);
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Produk Diperbarui', `Produk ${payload.product_name} (${payload.sku}) berhasil disimpan.`);
      } else {
        await createProduct(payload, {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        });
        showToast('success', 'Produk Ditambahkan', `Produk ${payload.product_name} (${payload.sku}) berhasil ditambahkan.`);
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
      await toggleProductStatus(toggleTarget.id, newStatus, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast(
        'success',
        newStatus ? 'Produk Diaktifkan' : 'Produk Dinonaktifkan',
        `Status produk ${toggleTarget.product_name} berhasil diubah.`
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
      await deleteProduct(deleteTarget.id, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'Produk Dihapus', `Produk ${deleteTarget.product_name} berhasil dihapus.`);
      setDeleteTarget(null);
      fetchList();
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Produk', err.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Master Products</h1>
          <p className="text-xs text-slate-500">
            Katalog SKU kurma Akram untuk alokasi forecast dan surat jalan pengiriman
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
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
            placeholder="Cari SKU atau nama produk..."
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
          <TableLoadingState message="Memuat katalog produk..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchList} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Tidak Ada Produk"
            description={
              search ? 'Tidak ditemukan produk yang sesuai dengan pencarian Anda.' : 'Belum ada produk terdaftar.'
            }
            actionLabel={canEdit ? 'Tambah Produk Baru' : undefined}
            onAction={canEdit ? handleOpenAdd : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Satuan (Unit)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Dibuat Pada</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-sky-900">
                        {prod.sku}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{prod.product_name}</div>
                        {prod.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {prod.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {prod.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={prod.is_active} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(prod.created_at).toLocaleDateString('id-ID', {
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
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                                title="Edit Produk"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setToggleTarget(prod)}
                                className={`p-1.5 rounded transition-colors ${
                                  prod.is_active
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={prod.is_active ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(prod)}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus Produk"
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
              totalItems={products.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={selectedProduct}
        isLoading={modalLoading}
      />

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? 'Nonaktifkan Produk?' : 'Aktifkan Produk?'}
        message={
          toggleTarget?.is_active
            ? `Produk "${toggleTarget.product_name}" (${toggleTarget.sku}) akan dinonaktifkan dari pilihan alokasi baru.`
            : `Produk "${toggleTarget?.product_name}" (${toggleTarget?.sku}) akan diaktifkan kembali.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={toggleTarget?.is_active}
        isLoading={isToggleLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Produk?"
        message={`Apakah Anda yakin ingin menghapus produk "${deleteTarget?.product_name}" (${deleteTarget?.sku}) secara permanen?`}
        confirmLabel="Hapus Permanen"
        isDestructive={true}
        isLoading={isDeleteLoading}
      />
    </div>
  );
};
