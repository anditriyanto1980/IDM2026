import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { sku: string; product_name: string; unit: string; description?: string; is_active: boolean }) => Promise<void>;
  product?: Product | null;
  isLoading?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isLoading = false,
}) => {
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setProductName(product.product_name);
      setUnit(product.unit || 'PCS');
      setDescription(product.description || '');
      setIsActive(product.is_active);
    } else {
      setSku('');
      setProductName('');
      setUnit('PCS');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSku = sku.trim().toUpperCase();
    const trimmedName = productName.trim();
    const trimmedUnit = unit.trim().toUpperCase();

    if (!trimmedSku) {
      setError('SKU Produk wajib diisi.');
      return;
    }
    if (!trimmedName) {
      setError('Nama Produk wajib diisi.');
      return;
    }
    if (!trimmedUnit) {
      setError('Satuan (Unit) wajib diisi.');
      return;
    }

    try {
      await onSave({
        sku: trimmedSku,
        product_name: trimmedName,
        unit: trimmedUnit,
        description: description.trim() || undefined,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data produk.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Produk' : 'Tambah Produk Baru'}
      subtitle="Katalog SKU kurma Akram untuk tracking dan alokasi forecast"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {product ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            SKU Produk <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="Contoh: AKR-KHL-200, AKR-SHP, AKR-KHR"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all uppercase font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Kode SKU standar akurat untuk pencocokan saat import forecast Excel.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Produk <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Contoh: Akram Khalas 200g"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Satuan (Unit) <span className="text-rose-500">*</span>
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          >
            <option value="PCS">PCS (Pieces)</option>
            <option value="CTN">CTN (Carton / Dus)</option>
            <option value="PACK">PACK</option>
            <option value="BOX">BOX</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Spesifikasi</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Spesifikasi berat, jenis kurma, kemasan, atau isi per karton..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800">Status Aktif</span>
            <p className="text-[11px] text-slate-400">Aktifkan agar dapat dipilih dalam alokasi forecast</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </form>
    </Modal>
  );
};
