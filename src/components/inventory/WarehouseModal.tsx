import React, { useState, useEffect } from 'react';
import { WarehouseLocation, WarehouseLocationCode } from '../../types';
import { Modal } from '../common/Modal';
import { Building2, MapPin, User, Phone, Package, Trash2 } from 'lucide-react';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse?: WarehouseLocation | null;
  onSave: (payload: WarehouseLocation) => Promise<void>;
  onDelete?: (code: string) => Promise<void>;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  onSave,
  onDelete,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState<'CENTRAL_HUB' | 'BUFFER_HUB' | 'TRANSIT_HUB'>('CENTRAL_HUB');
  const [capacityBoxes, setCapacityBoxes] = useState<number>(100000);
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (warehouse) {
      setCode(warehouse.code);
      setName(warehouse.name);
      setCity(warehouse.city);
      setProvince(warehouse.province);
      setType(warehouse.type);
      setCapacityBoxes(warehouse.capacity_boxes);
      setPicName(warehouse.pic_name);
      setPicPhone(warehouse.pic_phone);
    } else {
      setCode('');
      setName('');
      setCity('');
      setProvince('');
      setType('CENTRAL_HUB');
      setCapacityBoxes(100000);
      setPicName('');
      setPicPhone('');
    }
    setError(null);
  }, [warehouse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Kode gudang wajib diisi.');
      return;
    }
    if (!name.trim()) {
      setError('Nama fasilitas gudang wajib diisi.');
      return;
    }
    if (!city.trim()) {
      setError('Kota fasilitas gudang wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: WarehouseLocation = {
        code: code.trim().toUpperCase().replace(/\s+/g, '_') as WarehouseLocationCode,
        name: name.trim(),
        city: city.trim(),
        province: province.trim() || 'Indonesia',
        type,
        capacity_boxes: Number(capacityBoxes) || 0,
        pic_name: picName.trim() || '-',
        pic_phone: picPhone.trim() || '-',
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan fasilitas gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!warehouse || !onDelete) return;
    if (!window.confirm(`Yakin ingin menghapus fasilitas gudang "${warehouse.name}"?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(warehouse.code);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus fasilitas gudang.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse ? 'Edit Fasilitas Gudang' : 'Tambah Fasilitas Gudang Baru'}
      subtitle="Atur nama gudang asal, lokasi hub logistik, kapasitas, dan kontak PIC"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {warehouse && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Gudang'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isDeleting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="warehouse-form"
              disabled={isLoading || isDeleting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {warehouse ? 'Simpan Perubahan' : 'Tambah Gudang'}
            </button>
          </div>
        </div>
      }
    >
      <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-800">
          <p className="font-semibold mb-0.5">Fleksibilitas Pergudangan:</p>
          <p className="text-[11px] text-sky-700">
            Nama gudang ini akan digunakan di seluruh modul sistem (Pencatatan Stok Multi-Gudang, Pilihan Gudang Asal Surat Jalan, dan Mutasi Barang).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Gudang <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                required
                disabled={!!warehouse}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WH_JAKARTA"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Fasilitas Gudang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gudang Utama Logistik Cikarang"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kota <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bekasi, Surabaya, dll"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Jawa Barat, DKI Jakarta, dll"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipe Fasilitas
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
            >
              <option value="CENTRAL_HUB">Central Hub (Hub Utama)</option>
              <option value="BUFFER_HUB">Buffer Hub (Gudang Penyangga)</option>
              <option value="TRANSIT_HUB">Transit Hub (Gudang Antara)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kapasitas Penyimpanan (Boxes)
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="number"
                min="0"
                value={capacityBoxes}
                onChange={(e) => setCapacityBoxes(Number(e.target.value))}
                placeholder="100000"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama PIC Gudang
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Bambang Sudiro"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No. Kontak PIC
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
