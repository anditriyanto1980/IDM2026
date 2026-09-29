import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X, Check, Database } from 'lucide-react';
import { resetAllData } from '../../lib/firebase';
import { useToast } from '../../hooks/useToast';

interface ResetAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetAllDataModal: React.FC<ResetAllDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetType, setResetType] = useState<'reseed' | 'clear'>('clear');

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    setLoading(true);
    try {
      const shouldReseed = resetType === 'reseed';
      await resetAllData(shouldReseed);

      showToast(
        'success',
        shouldReseed ? 'Data Berhasil Direset ke Default' : 'TOTAL RESET BERHASIL: NO DATA (KOSONG TOTAL)',
        shouldReseed
          ? 'Database Firebase Firestore telah diisi kembali dengan master data resmi 8 DC & 3 SKU.'
          : 'Seluruh data di database Firebase Firestore dan penyimpanan lokal telah dikosongkan total (0 Data).'
      );

      setTimeout(() => {
        setLoading(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }, 700);
    } catch (err: any) {
      setLoading(false);
      showToast('error', 'Gagal Me-reset Data', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">Reset &amp; Clear Database Firebase</h3>
              <p className="text-[11px] text-rose-700">Tindakan ini memengaruhi penyimpanan Firebase Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 block">Pilih Mode Tindakan Reset:</label>

            {/* Option 1: Clear All NO DATA */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                resetType === 'clear'
                  ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetType"
                checked={resetType === 'clear'}
                onChange={() => setResetType('clear')}
                className="mt-0.5 text-rose-700 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-rose-900 block flex items-center gap-1.5 text-xs">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  RESET TOTAL: KOSONGKAN SEMUA DATA (TOTAL NO DATA)
                </span>
                <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                  Menghapus SEMUA dokumen transaksi dan master di Firestore &amp; Cache Lokal (0 Customer, 0 SKU, 0 DC, 0 Forecast, 0 Surat Jalan, 0 BAST). Bersih total tanpa data untuk input mandiri dari awal.
                </p>
              </div>
            </label>

            {/* Option 2: Reseed Default */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                resetType === 'reseed'
                  ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/10'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetType"
                checked={resetType === 'reseed'}
                onChange={() => setResetType('reseed')}
                className="mt-0.5 text-sky-700 focus:ring-sky-600"
              />
              <div>
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-700" />
                  Muat Data Contoh Demo (8 DC Nasional &amp; 3 SKU Kurma)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mengisi kembali Firebase Firestore dengan data sampel resmi Indomarco, Indogrosir, dan 8 Distribution Center.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
            <Database className="w-4 h-4 text-sky-700 shrink-0" />
            <span>Target: Proyek Firebase Firestore (indigo-gear-cds98)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={handleExecuteReset}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              resetType === 'clear'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-800 hover:bg-sky-900'
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Reset...</span>
              </>
            ) : (
              <>
                {resetType === 'clear' ? <Trash2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                <span>{resetType === 'clear' ? 'Kosongkan Seluruh Data (0 Data)' : 'Muat Data Contoh Sekarang'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
