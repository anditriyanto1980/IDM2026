import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Region } from '../../types';

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { region_code: string; region_name: string; description?: string; is_active: boolean }) => Promise<void>;
  region?: Region | null;
  isLoading?: boolean;
}

export const RegionModal: React.FC<RegionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  region,
  isLoading = false,
}) => {
  const [regionCode, setRegionCode] = useState('');
  const [regionName, setRegionName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (region) {
      setRegionCode(region.region_code);
      setRegionName(region.region_name);
      setDescription(region.description || '');
      setIsActive(region.is_active);
    } else {
      setRegionCode('');
      setRegionName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [region, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = regionCode.trim().toUpperCase().replace(/\s+/g, '_');
    const trimmedName = regionName.trim();

    if (!trimmedCode) {
      setError('Region Code wajib diisi.');
      return;
    }
    if (!trimmedName) {
      setError('Region Name wajib diisi.');
      return;
    }

    try {
      await onSave({
        region_code: trimmedCode,
        region_name: trimmedName,
        description: description.trim() || undefined,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data wilayah.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={region ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
      subtitle="Klasifikasi zonasi distribusi logistik nasional seluruh Indonesia"
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
            form="region-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {region ? 'Simpan Perubahan' : 'Tambah Wilayah'}
          </button>
        </>
      }
    >
      <form id="region-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Region Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value.toUpperCase())}
            placeholder="Contoh: JAWA_TIMUR, SUMATERA, SULAWESI"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all uppercase font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Format huruf besar tanpa spasi (gunakan underscore, contoh: JAWA_BARAT).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Region Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={regionName}
            onChange={(e) => setRegionName(e.target.value)}
            placeholder="Contoh: Jawa Timur & Madura"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Cakupan Area</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Daftar kota/kabupaten atau cakupan jangkauan logistik..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800">Status Aktif</span>
            <p className="text-[11px] text-slate-400">Aktifkan untuk pemilihan DC di wilayah ini</p>
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
