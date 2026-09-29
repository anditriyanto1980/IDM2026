import React, { useState, useEffect, useMemo } from 'react';
import {
  WarehouseInventory,
  StockMutation,
  WarehouseLocation,
  WarehouseLocationCode,
} from '../../types';
import {
  getWarehouses,
  getWarehouseInventory,
  getStockMutations,
  exportInventoryToExcel,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../../services/inventoryService';
import { WarehouseStockCard } from '../../components/inventory/WarehouseStockCard';
import { StockMutationModal } from '../../components/inventory/StockMutationModal';
import { WarehouseModal } from '../../components/inventory/WarehouseModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Boxes,
  Building2,
  PackagePlus,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Pencil,
  Plus,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'stock' | 'mutations'>('stock');
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWh, setSelectedWh] = useState<string>('all');
  const [skuFilter, setSkuFilter] = useState<string>('all');
  const [mutationTypeFilter, setMutationTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [preselectedItem, setPreselectedItem] = useState<WarehouseInventory | null>(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [selectedWarehouseForEdit, setSelectedWarehouseForEdit] = useState<WarehouseLocation | null>(null);

  const handleOpenAddWarehouse = () => {
    setSelectedWarehouseForEdit(null);
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (wh: WarehouseLocation) => {
    setSelectedWarehouseForEdit(wh);
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (payload: WarehouseLocation) => {
    if (selectedWarehouseForEdit) {
      await updateWarehouse(selectedWarehouseForEdit.code, payload, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'Gudang Diperbarui', `Fasilitas gudang ${payload.name} berhasil diperbarui.`);
    } else {
      await createWarehouse(payload, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast('success', 'Gudang Ditambahkan', `Fasilitas gudang baru ${payload.name} berhasil ditambahkan.`);
    }
    await loadData();
  };

  const handleDeleteWarehouse = async (code: string) => {
    await deleteWarehouse(code, {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });
    showToast('success', 'Gudang Dihapus', `Fasilitas gudang ${code} telah dihapus.`);
    if (selectedWh === code) {
      setSelectedWh('all');
    }
    await loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [whList, invList, mutList] = await Promise.all([
        getWarehouses(),
        getWarehouseInventory(selectedWh !== 'all' ? (selectedWh as WarehouseLocationCode) : undefined),
        getStockMutations({
          warehouseCode: selectedWh !== 'all' ? selectedWh : undefined,
          sku: skuFilter !== 'all' ? skuFilter : undefined,
          mutationType: mutationTypeFilter !== 'all' ? mutationTypeFilter : undefined,
        }),
      ]);

      setWarehouses(whList);
      setInventory(invList);
      setMutations(mutList);
    } catch (e) {
      console.error('Error loading inventory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWh, skuFilter, mutationTypeFilter]);

  // Aggregate Stats
  const totalOnHand = useMemo(() => inventory.reduce((sum, i) => sum + i.stock_on_hand, 0), [inventory]);
  const totalReserved = useMemo(() => inventory.reduce((sum, i) => sum + i.stock_reserved, 0), [inventory]);
  const totalAtp = useMemo(() => inventory.reduce((sum, i) => sum + i.stock_available, 0), [inventory]);
  const warningItemsCount = useMemo(
    () => inventory.filter((i) => i.stock_status === 'CRITICAL_LOW' || i.stock_status === 'REORDER_POINT').length,
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSku = skuFilter === 'all' || item.sku === skuFilter;
      return matchSearch && matchSku;
    });
  }, [inventory, searchQuery, skuFilter]);

  const handleExport = () => {
    exportInventoryToExcel(inventory, mutations);
    showToast('success', 'Laporan stok gudang berhasil diexport ke Excel');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              <Boxes className="w-3.5 h-3.5 text-sky-700" />
              MULTI-WAREHOUSE INVENTORY
            </span>
            <span className="text-xs text-slate-500 font-medium">Stok Fasilitas Pusat &amp; Penyangga</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Stok Multi-Gudang &amp; Alokasi Kurma Akram
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pemantauan saldo fisik (On Hand), reservasi kuota forecast yang disetujui, dan stok bebas Available to Promise (ATP) di Cikarang, Marunda, dan Surabaya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {canAccess('INVENTORY', 'edit') && (
            <button
              onClick={handleOpenAddWarehouse}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Kelola & Tambah Fasilitas Gudang"
            >
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>+ Fasilitas Gudang</span>
            </button>
          )}

          {canAccess('INVENTORY', 'edit') && (
            <button
              onClick={() => {
                setPreselectedItem(null);
                setIsMutationModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Catat Mutasi / Inbound</span>
            </button>
          )}

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

      {/* Aggregate KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Stok Fisik (On Hand)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalOnHand.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Di 3 fasilitas pergudangan</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block mb-1">
            Stok Teralokasi (Reserved)
          </span>
          <div className="text-2xl font-bold text-amber-800">
            {totalReserved.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Untuk forecast &amp; SJ aktif</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
            Stok Bebas (ATP)
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {totalAtp.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Siap dialokasikan ke order baru</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block mb-1">
            Peringatan Reorder / Kritis
          </span>
          <div className="text-2xl font-bold text-rose-700">
            {warningItemsCount} <span className="text-xs font-normal text-slate-500">SKU/Gudang</span>
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block">Di bawah threshold safety stock</span>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'stock'
                  ? 'bg-sky-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Posisi Stok Multi-Gudang ({filteredInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('mutations')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'mutations'
                  ? 'bg-sky-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Buku Mutasi Barang (Ledger) ({mutations.length})
            </button>
          </div>

          {/* Warehouse Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedWh('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedWh === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Fasilitas ({warehouses.length})
            </button>
            {warehouses.map((w) => (
              <div
                key={w.code}
                className={`inline-flex items-center rounded-md text-[11px] font-medium transition-colors ${
                  selectedWh === w.code
                    ? 'bg-sky-800 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <button
                  onClick={() => setSelectedWh(w.code)}
                  className="px-2.5 py-1 cursor-pointer flex items-center gap-1"
                  title={`${w.name} (${w.city})`}
                >
                  <span>{w.city || w.name}</span>
                  <span className="text-[9px] opacity-75 font-mono">({w.code.replace('WH_', '')})</span>
                </button>
                {canAccess('INVENTORY', 'edit') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditWarehouse(w);
                    }}
                    className={`p-1 mr-1 rounded hover:bg-black/15 transition-colors cursor-pointer ${
                      selectedWh === w.code ? 'text-emerald-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={`Edit & Ganti Nama ${w.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {canAccess('INVENTORY', 'edit') && (
              <button
                onClick={handleOpenAddWarehouse}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Tambah Fasilitas Gudang Baru"
              >
                <Plus className="w-3 h-3" />
                <span>Gudang Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Sub-filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan SKU, nama kurma, atau nama gudang..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">Semua SKU Produk</option>
              <option value="AKR-KHL-200">AKR-KHL-200 (Akram Khalas 200g)</option>
              <option value="AKR-SHP">AKR-SHP (Akram Share Pack)</option>
              <option value="AKR-KHR">AKR-KHR (Akram Khalas Rigid)</option>
            </select>

            {activeTab === 'mutations' && (
              <select
                value={mutationTypeFilter}
                onChange={(e) => setMutationTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Semua Tipe Mutasi</option>
                <option value="INBOUND_PRODUCTION">Inbound Produksi</option>
                <option value="OUTBOUND_SHIPMENT">Outbound Pengiriman</option>
                <option value="RETURN_BAST">Retur BAST</option>
                <option value="DAMAGE_DISPOSAL">Pemusnahan Rusak</option>
                <option value="ADJUSTMENT_AUDIT">Audit Opname</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Selected Warehouse Info Banner & Edit CTA */}
      {selectedWh !== 'all' && (() => {
        const currentWh = warehouses.find((w) => w.code === selectedWh);
        if (!currentWh) return null;
        return (
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Building2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{currentWh.name}</h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                    {currentWh.code}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {currentWh.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Lokasi:</strong> {currentWh.city}, {currentWh.province} &bull; <strong>Kapasitas:</strong> {currentWh.capacity_boxes.toLocaleString('id-ID')} boxes &bull; <strong>PIC:</strong> {currentWh.pic_name} ({currentWh.pic_phone})
                </p>
              </div>
            </div>

            {canAccess('INVENTORY', 'edit') && (
              <button
                onClick={() => handleOpenEditWarehouse(currentWh)}
                className="px-3 py-1.5 text-xs font-semibold text-sky-800 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Pencil className="w-3.5 h-3.5 text-sky-700" />
                <span>Ganti Nama / Edit Data Gudang</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Content Rendering: Stock Cards vs Mutation Ledger */}
      {activeTab === 'stock' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInventory.map((item) => (
            <WarehouseStockCard
              key={item.id}
              item={item}
              onRecordMutation={(target) => {
                setPreselectedItem(target);
                setIsMutationModalOpen(true);
              }}
            />
          ))}

          {filteredInventory.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-xl">
              <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tidak ada data stok yang sesuai dengan filter pencarian.</p>
            </div>
          )}
        </div>
      ) : (
        /* Mutation Ledger Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">No Mutasi &amp; Tanggal</th>
                  <th className="px-5 py-3">Gudang</th>
                  <th className="px-5 py-3">Tipe Mutasi</th>
                  <th className="px-5 py-3">SKU &amp; Produk</th>
                  <th className="px-5 py-3 text-right">Kuantiti</th>
                  <th className="px-5 py-3">Ref Dokumen</th>
                  <th className="px-5 py-3">No Batch</th>
                  <th className="px-5 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-slate-800 block">
                        {m.mutation_number}
                      </span>
                      <span className="text-[11px] text-slate-400">{m.date}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {m.warehouse_code.replace('WH_', '')}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.mutation_type === 'INBOUND_PRODUCTION' || m.mutation_type === 'RETURN_BAST'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.mutation_type === 'OUTBOUND_SHIPMENT'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.mutation_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-semibold text-slate-800 block">{m.sku}</span>
                      <span className="text-[11px] text-slate-500">{m.product_name}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-bold ${
                          m.qty > 0 ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {m.qty > 0 ? `+${m.qty.toLocaleString('id-ID')}` : m.qty.toLocaleString('id-ID')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{m.unit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-slate-700 block">{m.reference_doc_number}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{m.reference_doc_type}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {m.batch_number}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-[11px]">
                      {m.created_by}
                    </td>
                  </tr>
                ))}

                {mutations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Belum ada catatan mutasi stok yang tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mutation Modal */}
      <StockMutationModal
        isOpen={isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        onSuccess={loadData}
        preselectedItem={preselectedItem}
      />

      {/* Warehouse Facility Modal */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        warehouse={selectedWarehouseForEdit}
        onSave={handleSaveWarehouse}
        onDelete={handleDeleteWarehouse}
      />
    </div>
  );
};
