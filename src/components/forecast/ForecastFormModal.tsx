import React, { useState, useEffect } from 'react';
import { Customer, DistributionCenter, Product, Forecast } from '../../types';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Calendar, Building2, MapPin, AlertCircle } from 'lucide-react';

interface ForecastFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  forecastToEdit?: Forecast | null;
  customers: Customer[];
  dcs: DistributionCenter[];
  products: Product[];
}

interface ItemRow {
  product_id: string;
  qty_forecast: number;
  unit: string;
  notes?: string;
}

export const ForecastFormModal: React.FC<ForecastFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  forecastToEdit,
  customers,
  dcs,
  products,
}) => {
  const isEditing = Boolean(forecastToEdit);

  const [customerId, setCustomerId] = useState('');
  const [dcId, setDcId] = useState('');
  const [period, setPeriod] = useState('');
  const [forecastDate, setForecastDate] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (forecastToEdit) {
        setCustomerId(forecastToEdit.customer_id);
        setDcId(forecastToEdit.dc_id);
        setPeriod(forecastToEdit.period);
        setForecastDate(forecastToEdit.forecast_date);
        setTargetDeliveryDate(forecastToEdit.target_delivery_date);
        setNotes(forecastToEdit.notes || '');
        setItems(
          (forecastToEdit.items || []).map((i) => ({
            product_id: i.product_id,
            qty_forecast: i.qty_forecast,
            unit: i.unit,
            notes: i.notes || '',
          }))
        );
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const defaultPeriod = `${yyyy}-${mm}`;
        const defaultDate = today.toISOString().split('T')[0];

        // Target delivery ~2 weeks ahead
        const targetDateObj = new Date();
        targetDateObj.setDate(targetDateObj.getDate() + 14);
        const defaultTarget = targetDateObj.toISOString().split('T')[0];

        setCustomerId(customers[0]?.id || '');
        setDcId('');
        setPeriod(defaultPeriod);
        setForecastDate(defaultDate);
        setTargetDeliveryDate(defaultTarget);
        setNotes('');

        // Pre-populate with first product
        if (products.length > 0) {
          setItems([
            {
              product_id: products[0].id,
              qty_forecast: 1000,
              unit: products[0].unit || 'PCS',
              notes: '',
            },
          ]);
        } else {
          setItems([]);
        }
      }
    }
  }, [isOpen, forecastToEdit, customers, products]);

  // Filter distribution centers based on selected customer
  const filteredDcs = dcs.filter((d) => !customerId || d.customer_id === customerId);

  // Reset dcId if customer changes and selected dc doesn't belong to customer
  useEffect(() => {
    if (customerId && dcId) {
      const match = filteredDcs.find((d) => d.id === dcId);
      if (!match) {
        setDcId(filteredDcs[0]?.id || '');
      }
    } else if (customerId && !dcId && filteredDcs.length > 0) {
      setDcId(filteredDcs[0].id);
    }
  }, [customerId, filteredDcs, dcId]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    // Find first product not yet in items, or default to first
    const unusedProduct = products.find((p) => !items.some((i) => i.product_id === p.id)) || products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: unusedProduct.id,
        qty_forecast: 500,
        unit: unusedProduct.unit || 'PCS',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('Minimal harus ada 1 item produk dalam forecast.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'product_id') {
        const prod = products.find((p) => p.id === value);
        next[index] = {
          ...next[index],
          product_id: value,
          unit: prod?.unit || 'PCS',
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: value,
        };
      }
      return next;
    });
  };

  const totalForecastQty = items.reduce((sum, i) => sum + (Number(i.qty_forecast) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Customer wajib dipilih.');
      return;
    }
    if (!dcId) {
      setError('Distribution Center tujuan wajib dipilih.');
      return;
    }
    if (!period.trim()) {
      setError('Periode forecast (YYYY-MM) wajib diisi.');
      return;
    }
    if (!forecastDate) {
      setError('Tanggal forecast wajib diisi.');
      return;
    }
    if (!targetDeliveryDate) {
      setError('Target delivery date wajib diisi.');
      return;
    }
    if (items.length === 0) {
      setError('Minimal harus ada 1 item produk kurma.');
      return;
    }
    if (totalForecastQty <= 0) {
      setError('Total kuantiti forecast harus lebih besar dari 0.');
      return;
    }

    // Check for duplicate products
    const productIds = items.map((i) => i.product_id);
    const hasDuplicates = new Set(productIds).size !== productIds.length;
    if (hasDuplicates) {
      setError('Terdapat produk yang sama dalam rincian item. Gabungkan kuantiti dalam satu baris produk.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        customer_id: customerId,
        dc_id: dcId,
        period: period.trim(),
        forecast_date: forecastDate,
        target_delivery_date: targetDeliveryDate,
        notes: notes.trim() || undefined,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data forecast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Forecast: ${forecastToEdit?.forecast_number}` : 'Buat Forecast Baru'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Customer & Distribution Center */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isEditing && (forecastToEdit?.total_shipped || 0) > 0}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Distribution Center (DC) Tujuan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={dcId}
                onChange={(e) => setDcId(e.target.value)}
                disabled={isEditing && (forecastToEdit?.total_shipped || 0) > 0}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white disabled:bg-slate-100"
              >
                <option value="">Pilih Distribution Center...</option>
                {filteredDcs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dc_name} ({d.dc_code}) - {d.city}
                  </option>
                ))}
              </select>
            </div>
            {customerId && filteredDcs.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                Customer ini belum memiliki DC aktif. Silakan tambahkan di Master Data DC.
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Period & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Periode Forecast (YYYY-MM) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 2026-09"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Forecast <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={forecastDate}
                onChange={(e) => setForecastDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Delivery Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Kebutuhan khusus atau keterangan alokasi"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Section 3: Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden pt-1">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Item Produk Kurma
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah SKU</span>
            </button>
          </div>

          <div className="p-3 space-y-2.5 max-h-64 overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2.5 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/80"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Produk Kurma</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Qty Forecast</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qty_forecast}
                    onChange={(e) =>
                      handleItemChange(idx, 'qty_forecast', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={item.unit}
                    readOnly
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-100 text-slate-600 text-center font-medium"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end justify-center pt-5">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-40 transition-colors rounded-md"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table summary row */}
          <div className="bg-slate-100/80 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>TOTAL KUANTITI FORECAST:</span>
            <span className="font-mono text-sm text-sky-900 tabular-nums">
              {totalForecastQty.toLocaleString('id-ID')} PCS
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-sky-800 rounded-lg hover:bg-sky-900 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Forecast'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
