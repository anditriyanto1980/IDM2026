import React, { useState } from 'react';
import { MilestoneType } from '../../types';
import { Modal } from '../common/Modal';
import { MapPin, Clock, FileText, AlertTriangle, Truck } from 'lucide-react';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  shipmentNumber: string;
  onAdd: (data: {
    milestone_type: MilestoneType;
    title: string;
    location: string;
    notes: string;
    timestamp: string;
  }) => Promise<void>;
}

const PRESET_MILESTONES: Array<{
  type: MilestoneType;
  title: string;
  defaultLocation: string;
}> = [
  {
    type: 'DEPARTED_WAREHOUSE',
    title: 'Armada Berangkat (Dispatched)',
    defaultLocation: 'Gudang Pusat Akram Cikarang',
  },
  {
    type: 'IN_TRANSIT_CHECKPOINT',
    title: 'Tol Cikampek KM 57',
    defaultLocation: 'Rest Area Tol Jakarta - Cikampek KM 57',
  },
  {
    type: 'IN_TRANSIT_CHECKPOINT',
    title: 'Tol Cipali KM 102',
    defaultLocation: 'Subang, Jawa Barat',
  },
  {
    type: 'IN_TRANSIT_CHECKPOINT',
    title: 'Tol Batang - Semarang KM 379A',
    defaultLocation: 'Batang, Jawa Tengah',
  },
  {
    type: 'ARRIVED_DC_GATE',
    title: 'Tiba di Gerbang Distribution Center',
    defaultLocation: 'Pos Sekuriti DC',
  },
  {
    type: 'UNLOADING_INSPECTION',
    title: 'Bongkar Muat & Pemeriksaan Fisik',
    defaultLocation: 'Dock Inbound DC',
  },
  {
    type: 'EXCEPTION_DELAY',
    title: 'Kendala / Keterlambatan Perjalanan',
    defaultLocation: 'Jalur Ekspedisi',
  },
];

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  onClose,
  shipmentId,
  shipmentNumber,
  onAdd,
}) => {
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('IN_TRANSIT_CHECKPOINT');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_MILESTONES)[0]) => {
    setMilestoneType(preset.type);
    setTitle(preset.title);
    setLocation(preset.defaultLocation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama checkpoint / aktivitas wajib diisi.');
      return;
    }
    if (!location.trim()) {
      setError('Lokasi checkpoint wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAdd({
        milestone_type: milestoneType,
        title: title.trim(),
        location: location.trim(),
        notes: notes.trim(),
        timestamp: new Date(timestamp).toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perbarui Posisi & Checkpoint Pengiriman"
      subtitle={`Catat posisi realtime atau update pergerakan armada untuk Surat Jalan ${shipmentNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Rekomendasi Cepat Checkpoint Rute:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MILESTONES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-colors"
              >
                + {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Milestone Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Kategori Checkpoint <span className="text-rose-500">*</span>
          </label>
          <select
            value={milestoneType}
            onChange={(e) => setMilestoneType(e.target.value as MilestoneType)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="DEPARTED_WAREHOUSE">Armada Berangkat (Departed Cikarang)</option>
            <option value="IN_TRANSIT_CHECKPOINT">Dalam Perjalanan (In-Transit Checkpoint Tol/Kota)</option>
            <option value="ARRIVED_DC_GATE">Tiba di Gerbang DC (Arrived Gate)</option>
            <option value="UNLOADING_INSPECTION">Proses Bongkar Muat & Pemeriksaan Fisik</option>
            <option value="COMPLETED_RECEIVED">Serah Terima Lengkap (Delivered / Selesai)</option>
            <option value="EXCEPTION_DELAY">Keterlambatan / Kendala Perjalanan (Delay Exception)</option>
          </select>
        </div>

        {/* Checkpoint Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Judul Checkpoint / Kegiatan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Tol Cipularang KM 72 atau Antrian Dock DC"
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Lokasi Fisik Terkini <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Gerbang Tol Kalikangkung, Semarang atau DC Indogrosir"
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Date Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Waktu Checkpoint <span className="text-rose-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informasi kondisi lalu lintas, cuaca, nomor segel kontainer, dsb..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{submitting ? 'Menyimpan...' : 'Simpan Checkpoint'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
