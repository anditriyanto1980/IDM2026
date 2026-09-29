import React, { useState, useEffect } from 'react';
import { Customer, DistributionCenter, Product, Forecast, CreateShipmentPayload } from '../../types';
import { Modal } from '../common/Modal';
import { getWarehouses } from '../../services/inventoryService';
import {
  Truck,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Link,
  Boxes,
} from 'lucide-react';

interface ShipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateShipmentPayload) => Promise<void>;
  customers: Customer[];
  dcs: DistributionCenter[];
  products: Product[];
  forecasts: Forecast[];
}

interface ItemRow {
  product_id: string;
  forecast_item_id?: string;
  qty_shipped: number;
  unit: string;
  batch_number: string;
  expiry_date: string;
  notes?: string;
  maxForecastQty?: number;
}

const COMMON_TRANSPORTERS = [
  'Dakota Cargo',
  'JNE Trucking (JTR)',
  'Armada Sendiri / Internal Fleet',
  'Wahana Express',
  'Kargo Tech Logistics',
  'Indah Logistik Cargo',
];

const DEFAULT_WAREHOUSES = [
  'Gudang Pusat Cikarang (Hub Utama Nasional)',
  'Gudang Penyangga Marunda (Buffer Center)',
  'Gudang Transit Hub Rungkut (Wilayah Timur)',
];

export const ShipmentFormModal: React.FC<ShipmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  dcs,
  products,
  forecasts,
}) => {
  const [selectedForecastId, setSelectedForecastId] = useState<string>('');
  const [customerId, setCustomerId] = useState('');
  const [dcId, setDcId] = useState('');
  const [warehouseList, setWarehouseList] = useState<string[]>(DEFAULT_WAREHOUSES);
  const [originWarehouse, setOriginWarehouse] = useState(DEFAULT_WAREHOUSES[0]);
  const [isCustomOrigin, setIsCustomOrigin] = useState(false);
  const [customOriginWarehouse, setCustomOriginWarehouse] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState('');
  const [transporterName, setTransporterName] = useState(COMMON_TRANSPORTERS[0]);
  const [customTransporter, setCustomTransporter] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');
  const [trackingNumberRef, setTrackingNumberRef] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsCustomOrigin(false);
      setCustomOriginWarehouse('');
      const today = new Date();
      setShipmentDate(today.toISOString().split('T')[0]);

      const eta = new Date();
      eta.setDate(eta.getDate() + 2);
      setEstimatedArrivalDate(eta.toISOString().split('T')[0]);

      setSelectedForecastId('');
      setCustomerId(customers[0]?.id || '');
      setDcId('');
      setDriverName('');
      setDriverPhone('');
      setVehiclePlateNumber('');
      setTrackingNumberRef('');
      setNotes('');

      // Dynamically load warehouses from service
      getWarehouses().then((whs) => {
        if (whs && whs.length > 0) {
          const names = whs.map((w) => w.name);
          setWarehouseList(names);
          setOriginWarehouse(names[0]);
        }
      });

      // Default 1 item
      if (products.length > 0) {
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + 1);
        setItems([
          {
            product_id: products[0].id,
            qty_shipped: 1000,
            unit: products[0].unit || 'PCS',
            batch_number: `BATCH-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-01`,
            expiry_date: expDate.toISOString().split('T')[0],
            notes: '',
          },
        ]);
      }
    }
  }, [isOpen, customers, products]);

  // When a Forecast is selected, auto-fill Customer, DC, and line items with outstanding quantities
  const handleSelectForecast = (fcId: string) => {
    setSelectedForecastId(fcId);
    if (!fcId) return;

    const fc = forecasts.find((f) => f.id === fcId);
    if (!fc) return;

    setCustomerId(fc.customer_id);
    setDcId(fc.dc_id);

    const today = new Date();
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);
    const expStr = expDate.toISOString().split('T')[0];

    if (fc.items && fc.items.length > 0) {
      const generatedItems: ItemRow[] = fc.items.map((fi, idx) => {
        const remaining = Math.max(0, fi.qty_forecast - fi.qty_shipped);
        return {
          product_id: fi.product_id,
          forecast_item_id: fi.id,
          qty_shipped: remaining > 0 ? remaining : fi.qty_forecast,
          unit: fi.unit || 'PCS',
          batch_number: `BATCH-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0${idx + 1}`,
          expiry_date: expStr,
          notes: fi.notes || '',
          maxForecastQty: remaining,
        };
      });
      setItems(generatedItems);
    }
  };

  const filteredDcs = dcs.filter((d) => !customerId || d.customer_id === customerId);

  useEffect(() => {
    if (customerId && !selectedForecastId) {
      const match = filteredDcs.find((d) => d.id === dcId);
      if (!match) {
        setDcId(filteredDcs[0]?.id || '');
      }
    }
  }, [customerId, filteredDcs, dcId, selectedForecastId]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const unusedProduct = products.find((p) => !items.some((i) => i.product_id === p.id)) || products[0];
    const today = new Date();
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    setItems((prev) => [
      ...prev,
      {
        product_id: unusedProduct.id,
        qty_shipped: 500,
        unit: unusedProduct.unit || 'PCS',
        batch_number: `BATCH-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0${prev.length + 1}`,
        expiry_date: expDate.toISOString().split('T')[0],
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('Minimal harus ada 1 item muatan dalam surat jalan.');
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

  const totalShipmentQty = items.reduce((sum, i) => sum + (Number(i.qty_shipped) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Customer penerima wajib dipilih.');
      return;
    }
    if (!dcId) {
      setError('Distribution Center tujuan wajib dipilih.');
      return;
    }
    if (!shipmentDate) {
      setError('Tanggal surat jalan wajib diisi.');
      return;
    }
    if (!estimatedArrivalDate) {
      setError('Estimasi tanggal tiba di DC wajib diisi.');
      return;
    }
    const finalTransporter =
      transporterName === 'Lainnya' ? customTransporter.trim() : transporterName;
    if (!finalTransporter) {
      setError('Nama ekspedisi/armada pengangkut wajib diisi.');
      return;
    }
    if (items.length === 0) {
      setError('Minimal harus ada 1 item produk kurma.');
      return;
    }
    if (totalShipmentQty <= 0) {
      setError('Total kuantiti pengiriman harus lebih besar dari 0.');
      return;
    }

    const linkedFc = forecasts.find((f) => f.id === selectedForecastId);

    const finalOrigin = isCustomOrigin ? (customOriginWarehouse.trim() || 'Gudang Pusat') : originWarehouse;

    try {
      setIsSubmitting(true);
      await onSubmit({
        forecast_id: selectedForecastId || undefined,
        forecast_number: linkedFc?.forecast_number || undefined,
        customer_id: customerId,
        dc_id: dcId,
        origin_warehouse: finalOrigin,
        shipment_date: shipmentDate,
        estimated_arrival_date: estimatedArrivalDate,
        transporter_name: finalTransporter,
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        vehicle_plate_number: vehiclePlateNumber.trim().toUpperCase() || undefined,
        tracking_number_ref: trackingNumberRef.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat Surat Jalan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Surat Jalan / Shipment Baru" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 0: Link with Forecast */}
        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
          <label className="block text-xs font-bold text-sky-950 mb-1 flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-sky-800" />
            <span>Alokasikan dari Dokumen Forecast Terdaftar (Opsional):</span>
          </label>
          <select
            value={selectedForecastId}
            onChange={(e) => handleSelectForecast(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-sky-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="">-- Pilih Dokumen Forecast (Otomatis mengisi Customer & DC) --</option>
            {forecasts
              .filter((f) => f.status !== 'RECEIVED' && f.status !== 'CANCELLED')
              .map((fc) => (
                <option key={fc.id} value={fc.id}>
                  {fc.forecast_number} · {fc.customer?.customer_name} ({fc.dc?.dc_name}) · Sisa: {(fc.outstanding_qty ?? fc.total_qty).toLocaleString()} PCS
                </option>
              ))}
          </select>
          <p className="text-[11px] text-sky-700 mt-1">
            Memilih forecast akan otomatis mengaitkan alokasi dan memperbarui status pemenuhan forecast.
          </p>
        </div>

        {/* Section 1: Customer & DC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Penerima <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={Boolean(selectedForecastId)}
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
              Distribution Center Tujuan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={dcId}
                onChange={(e) => setDcId(e.target.value)}
                disabled={Boolean(selectedForecastId)}
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
          </div>
        </div>

        {/* Section 2: Warehouse Origin & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Gudang Asal (Origin) <span className="text-rose-500">*</span>
              </label>
              {!isCustomOrigin ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomOrigin(true);
                    setCustomOriginWarehouse('');
                  }}
                  className="text-[10px] text-sky-700 hover:text-sky-900 font-medium cursor-pointer"
                >
                  + Input Bebas
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomOrigin(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Pilih Daftar
                </button>
              )}
            </div>

            {!isCustomOrigin ? (
              <select
                value={originWarehouse}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsCustomOrigin(true);
                    setCustomOriginWarehouse('');
                  } else {
                    setOriginWarehouse(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
              >
                {warehouseList.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Ketik Nama Gudang Lainnya...</option>
              </select>
            ) : (
              <input
                type="text"
                required
                value={customOriginWarehouse}
                onChange={(e) => setCustomOriginWarehouse(e.target.value)}
                placeholder="Contoh: Gudang DC Modern Cikupa"
                className="w-full px-3 py-2 text-xs border border-sky-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Surat Jalan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimasi Tiba di DC <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={estimatedArrivalDate}
                onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Transporter & Driver Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-sky-800" />
            <span>Ekspedisi & Transportasi</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ekspedisi / Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {COMMON_TRANSPORTERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Lainnya">Lainnya (Input Manual)</option>
              </select>
              {transporterName === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Nama Ekspedisi"
                  value={customTransporter}
                  onChange={(e) => setCustomTransporter(e.target.value)}
                  className="w-full mt-1.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nama Sopir (Driver)
              </label>
              <input
                type="text"
                placeholder="e.g. Hendra Saputra"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                No. HP Sopir
              </label>
              <input
                type="text"
                placeholder="e.g. 0812-9988-1234"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                No. Polisi Armada
              </label>
              <input
                type="text"
                placeholder="e.g. B 9481 UXY"
                value={vehiclePlateNumber}
                onChange={(e) => setVehiclePlateNumber(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nomor Resi / AWB / Dokumen Ref
              </label>
              <input
                type="text"
                placeholder="e.g. DKT-98218731"
                value={trackingNumberRef}
                onChange={(e) => setTrackingNumberRef(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Catatan Pengiriman (Opsional)
              </label>
              <input
                type="text"
                placeholder="Keterangan muatan atau instruksi serah terima"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Muatan Produk Kurma
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
                className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/80"
              >
                <div className="col-span-12 sm:col-span-4">
                  <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Produk Kurma</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Qty Kirim</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qty_shipped}
                    onChange={(e) =>
                      handleItemChange(idx, 'qty_shipped', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {item.maxForecastQty !== undefined && (
                    <span className="text-[9px] text-slate-400 block text-right">
                      Max: {item.maxForecastQty.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-0.5">No. Batch/Lot</label>
                  <input
                    type="text"
                    placeholder="BATCH-YYYYMM-XX"
                    value={item.batch_number}
                    onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value.toUpperCase())}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-10 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Exp Date</label>
                  <input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                    className="w-full px-1.5 py-1 text-[11px] border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-40 transition-colors rounded"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-100/80 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>TOTAL MUATAN SURAT JALAN:</span>
            <span className="font-mono text-sm text-sky-900 tabular-nums">
              {totalShipmentQty.toLocaleString('id-ID')} PCS
            </span>
          </div>
        </div>

        {/* Footer */}
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
            className="px-5 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Surat Jalan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
