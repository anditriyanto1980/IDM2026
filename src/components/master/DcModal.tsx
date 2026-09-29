import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DistributionCenter, Customer, Region } from '../../types';

interface DcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
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
  }) => Promise<void>;
  dc?: DistributionCenter | null;
  customers: Customer[];
  regions: Region[];
  isLoading?: boolean;
}

export const DcModal: React.FC<DcModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dc,
  customers,
  regions,
  isLoading = false,
}) => {
  const [dcCode, setDcCode] = useState('');
  const [dcName, setDcName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dc) {
      setDcCode(dc.dc_code);
      setDcName(dc.dc_name);
      setCustomerId(dc.customer_id);
      setRegionId(dc.region_id);
      setCity(dc.city);
      setProvince(dc.province);
      setAddress(dc.address || '');
      setPicName(dc.pic_name || '');
      setPicPhone(dc.pic_phone || '');
      setIsActive(dc.is_active);
    } else {
      setDcCode('');
      setDcName('');
      setCustomerId(customers.length > 0 ? customers[0].id : '');
      setRegionId(regions.length > 0 ? regions[0].id : '');
      setCity('');
      setProvince('');
      setAddress('');
      setPicName('');
      setPicPhone('');
      setIsActive(true);
    }
    setError(null);
  }, [dc, isOpen, customers, regions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = dcCode.trim().toUpperCase();
    const name = dcName.trim();

    if (!code) {
      setError('DC Code wajib diisi.');
      return;
    }
    if (!name) {
      setError('Nama DC wajib diisi.');
      return;
    }
    if (!customerId) {
      setError('Customer wajib dipilih.');
      return;
    }
    if (!regionId) {
      setError('Wilayah (Region) wajib dipilih.');
      return;
    }
    if (!city.trim()) {
      setError('Kota wajib diisi.');
      return;
    }
    if (!province.trim()) {
      setError('Provinsi wajib diisi.');
      return;
    }

    try {
      await onSave({
        dc_code: code,
        dc_name: name,
        customer_id: customerId,
        region_id: regionId,
        city: city.trim(),
        province: province.trim(),
        address: address.trim() || undefined,
        pic_name: picName.trim() || undefined,
        pic_phone: picPhone.trim() || undefined,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data Distribution Center.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dc ? 'Edit Distribution Center' : 'Tambah Distribution Center'}
      subtitle="Pusat distribusi penerima alokasi pengiriman produk kurma Akram"
      maxWidth="xl"
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
            form="dc-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {dc ? 'Simpan Perubahan' : 'Tambah DC'}
          </button>
        </>
      }
    >
      <form id="dc-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              DC Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={dcCode}
              onChange={(e) => setDcCode(e.target.value.toUpperCase())}
              placeholder="Contoh: IGR-JKT, IDM-SBY"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama DC <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={dcName}
              onChange={(e) => setDcName(e.target.value)}
              placeholder="Contoh: DC Indogrosir Jakarta Pusat"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            >
              <option value="" disabled>Pilih Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_code} - {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wilayah (Region) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            >
              <option value="" disabled>Pilih Wilayah...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.region_name} ({r.region_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kota / Kabupaten <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Jakarta Utara, Surabaya"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provinsi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Contoh: DKI Jakarta, Jawa Timur"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap DC</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jalan, kompleks pergudangan, nomor gedung, dsb..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama PIC (Person in Charge)</label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kontak PIC / WhatsApp</label>
            <input
              type="text"
              value={picPhone}
              onChange={(e) => setPicPhone(e.target.value)}
              placeholder="Contoh: 081288991234"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800">Status Operasional DC</span>
            <p className="text-[11px] text-slate-400">Aktifkan untuk alokasi penerimaan pengiriman barang</p>
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
