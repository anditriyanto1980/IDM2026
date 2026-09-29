import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  WarehouseInventory,
  WarehouseLocation,
  WarehouseLocationCode,
  StockMutationType,
  CreateStockMutationPayload,
} from '../../types';
import { INITIAL_PRODUCTS } from '../../constants/initialData';
import { createStockMutation, getWarehouses } from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Boxes, PackagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StockMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItem?: WarehouseInventory | null;
}

export const StockMutationModal: React.FC<StockMutationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedItem,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [warehouseCode, setWarehouseCode] = useState<WarehouseLocationCode>('WH_CIKARANG');
  const [sku, setSku] = useState('AKR-KHL-200');
  const [mutationType, setMutationType] = useState<StockMutationType>('INBOUND_PRODUCTION');
  const [qty, setQty] = useState<number>(5000);
  const [refDocType, setRefDocType] = useState<'PRODUCTION_BATCH' | 'SURAT_JALAN' | 'BAST' | 'AUDIT_BA'>('PRODUCTION_BATCH');
  const [refDocNumber, setRefDocNumber] = useState('BATCH-202609-PROD1');
  const [batchNumber, setBatchNumber] = useState('BATCH-202609-K1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getWarehouses().then((whList) => {
        setWarehouses(whList);
        if (whList.length > 0 && !preselectedItem) {
          setWarehouseCode(whList[0].code);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedItem) {
      setWarehouseCode(preselectedItem.warehouse_code);
      setSku(preselectedItem.sku);
    }
  }, [preselectedItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || qty <= 0) {
      showToast('error', 'Kuantiti mutasi harus lebih besar dari 0');
      return;
    }

    const selectedProduct = INITIAL_PRODUCTS.find((p) => p.sku === sku);
    if (!selectedProduct) {
      showToast('error', 'Produk tidak ditemukan');
      return;
    }

    setSubmitting(true);
    try {
      // Outbound or disposal is negative in stock balance
      const effectiveQty =
        mutationType === 'OUTBOUND_SHIPMENT' || mutationType === 'DAMAGE_DISPOSAL'
          ? -Math.abs(qty)
          : Math.abs(qty);

      const payload: CreateStockMutationPayload = {
        mutation_type: mutationType,
        warehouse_code: warehouseCode,
        product_id: selectedProduct.id,
        sku: selectedProduct.sku,
        product_name: selectedProduct.product_name,
        qty: effectiveQty,
        unit: 'PCS',
        reference_doc_type: refDocType,
        reference_doc_number: refDocNumber,
        batch_number: batchNumber,
        notes: notes || undefined,
      };

      await createStockMutation(payload, user?.full_name || 'Petugas Gudang');
      showToast('success', `Mutasi stok ${payload.sku} berhasil dicatat!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan mutasi stok');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Mutasi Stok Gudang (Inbound / Outbound / Retur)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-900">
          <PackagePlus className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <span>
            Mutasi stok akan langsung mengkalkulasi ulang <strong>Stock Fisik (On Hand)</strong> dan{' '}
            <strong>Available to Promise (ATP)</strong> di fasilitas gudang yang dipilih.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Warehouse Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fasilitas Gudang:
            </label>
            <select
              value={warehouseCode}
              onChange={(e) => setWarehouseCode(e.target.value as WarehouseLocationCode)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {warehouses.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU Produk Kurma:
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {INITIAL_PRODUCTS.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} - {p.product_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mutation Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Mutasi Stok:
            </label>
            <select
              value={mutationType}
              onChange={(e) => {
                const val = e.target.value as StockMutationType;
                setMutationType(val);
                if (val === 'INBOUND_PRODUCTION') setRefDocType('PRODUCTION_BATCH');
                else if (val === 'OUTBOUND_SHIPMENT') setRefDocType('SURAT_JALAN');
                else if (val === 'RETURN_BAST') setRefDocType('BAST');
                else setRefDocType('AUDIT_BA');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="INBOUND_PRODUCTION">+ Inbound Hasil Produksi / Impor (Stok Masuk)</option>
              <option value="OUTBOUND_SHIPMENT">- Outbound Pengiriman Surat Jalan (Stok Keluar)</option>
              <option value="RETURN_BAST">+ Penerimaan Retur Barang BAST (Stok Masuk)</option>
              <option value="DAMAGE_DISPOSAL">- Pemusnahan Barang Rusak / Expired (Stok Keluar)</option>
              <option value="ADJUSTMENT_AUDIT">Penyesuaian Opname Fisik Gudang</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kuantiti (PCS):
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              placeholder="Contoh: 5000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reference Doc Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipe Dokumen Acuan:
            </label>
            <select
              value={refDocType}
              onChange={(e) => setRefDocType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="PRODUCTION_BATCH">Batch Produksi</option>
              <option value="SURAT_JALAN">Surat Jalan (SJ)</option>
              <option value="BAST">Berita Acara (BAST)</option>
              <option value="AUDIT_BA">Berita Acara Stock Opname</option>
            </select>
          </div>

          {/* Reference Doc Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No Dokumen Acuan:
            </label>
            <input
              type="text"
              value={refDocNumber}
              onChange={(e) => setRefDocNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              placeholder="Contoh: BATCH-202609-PROD1"
              required
            />
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No Batch Produksi:
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              placeholder="Contoh: BATCH-202609-K1"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan / Catatan Operator:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Keterangan tambahan mutasi stok..."
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{submitting ? 'Menyimpan...' : 'Simpan Mutasi Stok'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
