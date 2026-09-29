import React, { useState, useEffect } from 'react';
import {
  ReceivingInspection,
  CreateClaimPayload,
  ResponsibleParty,
  DiscrepancyClaim,
} from '../../types';
import { Modal } from '../common/Modal';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  Boxes,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleBasts: ReceivingInspection[];
  onSuccess: (claim: DiscrepancyClaim) => void;
  onSubmitClaim: (payload: CreateClaimPayload) => Promise<DiscrepancyClaim>;
}

interface ClaimItemRow {
  product_id: string;
  sku: string;
  product_name: string;
  qty_damaged: number;
  qty_shortage: number;
  unit_price_estimate: number;
  unit: string;
  damage_reason: string;
  batch_number: string;
}

export const CreateClaimModal: React.FC<CreateClaimModalProps> = ({
  isOpen,
  onClose,
  eligibleBasts,
  onSuccess,
  onSubmitClaim,
}) => {
  const [selectedBastId, setSelectedBastId] = useState('');
  const [claimDate, setClaimDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [responsibleParty, setResponsibleParty] = useState<ResponsibleParty>('TRANSPORTER');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [claimItems, setClaimItems] = useState<ClaimItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBast = eligibleBasts.find((b) => b.id === selectedBastId);

  useEffect(() => {
    if (eligibleBasts.length > 0 && !selectedBastId) {
      setSelectedBastId(eligibleBasts[0].id);
    }
  }, [eligibleBasts]);

  useEffect(() => {
    if (selectedBast) {
      // Find items with damaged or shortage
      const damagedOrShortItems = (selectedBast.items || []).filter(
        (it) => it.qty_damaged > 0 || it.qty_shortage > 0
      );

      const rows: ClaimItemRow[] = damagedOrShortItems.map((it) => {
        let price = 25000;
        if (it.sku.includes('SHP')) price = 35000;
        if (it.sku.includes('KHR')) price = 45000;

        return {
          product_id: it.product_id,
          sku: it.sku,
          product_name: it.product_name,
          qty_damaged: it.qty_damaged,
          qty_shortage: it.qty_shortage,
          unit_price_estimate: price,
          unit: it.unit || 'PCS',
          damage_reason: it.damage_reason || 'Kemasan rusak saat transit ekspedisi',
          batch_number: it.batch_number_verified || '',
        };
      });

      setClaimItems(rows);
    } else {
      setClaimItems([]);
    }
  }, [selectedBast]);

  const handleUpdateItemPrice = (idx: number, newPrice: number) => {
    const updated = [...claimItems];
    updated[idx] = {
      ...updated[idx],
      unit_price_estimate: Math.max(0, newPrice),
    };
    setClaimItems(updated);
  };

  const totalDamaged = claimItems.reduce((acc, it) => acc + it.qty_damaged, 0);
  const totalShortage = claimItems.reduce((acc, it) => acc + it.qty_shortage, 0);
  const totalLossAmount = claimItems.reduce(
    (acc, it) => acc + (it.qty_damaged + it.qty_shortage) * it.unit_price_estimate,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBastId) {
      setError('Silakan pilih Berita Acara (BAST) yang memiliki barang rusak/selisih.');
      return;
    }
    if (claimItems.length === 0) {
      setError('Tidak ada item yang mengalami kerusakan atau kekurangan kuantiti.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: CreateClaimPayload = {
        bast_id: selectedBastId,
        claim_date: claimDate,
        responsible_party: responsibleParty,
        investigation_notes: investigationNotes.trim() || undefined,
        items: claimItems,
      };

      const result = await onSubmitClaim(payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat berkas klaim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengajuan Klaim Kerusakan &amp; Retur BAST"
      subtitle="Dokumentasi investigasi selisih barang rusak di DC dan pembebanan tanggung jawab kerugian"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Select Eligible BAST */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Pilih Berita Acara Serah Terima (BAST) yang Mengalami Selisih / Kerusakan <span className="text-rose-500">*</span>
          </label>
          {eligibleBasts.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              Semua dokumen BAST dalam kondisi 100% Clean Pass, atau sudah memiliki berkas klaim aktif.
            </div>
          ) : (
            <select
              value={selectedBastId}
              onChange={(e) => setSelectedBastId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {eligibleBasts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bast_number} — SJ: {b.shipment_number} ({b.customer?.customer_name} • {b.dc?.dc_name}) — Rusak: {b.total_damaged_qty} pcs, Selisih: {b.total_shortage_qty} pcs
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected BAST Details Card */}
        {selectedBast && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dokumen Rujukan</span>
              <div className="font-bold font-mono text-slate-900 mt-0.5">{selectedBast.bast_number}</div>
              <div className="text-[11px] text-emerald-700">Surat Jalan: {selectedBast.shipment_number}</div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Penerima &amp; Lokasi</span>
              <div className="font-semibold text-slate-800 mt-0.5">{selectedBast.dc?.dc_name}</div>
              <div className="text-[11px] text-slate-500">Petugas: {selectedBast.receiver_name}</div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Armada / Pengemudi</span>
              <div className="font-medium text-slate-800 mt-0.5">{selectedBast.driver_name || 'Driver Ekspedisi'}</div>
              <div className="text-[11px] text-slate-500">Plat: {selectedBast.driver_plate_number || '-'}</div>
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Tanggal Pengajuan Klaim <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Pihak Penanggung Jawab Kerugian (Responsible Party) <span className="text-rose-500">*</span>
            </label>
            <select
              value={responsibleParty}
              onChange={(e) => setResponsibleParty(e.target.value as ResponsibleParty)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="TRANSPORTER">Pihak Ekspedisi / Transporter (Kelalaian Handling Supir / Terhimpit)</option>
              <option value="ORIGIN_WAREHOUSE">Gudang Asal Akram (Cacat Pemuatan Awal / Defect Pabrik)</option>
              <option value="DESTINATION_DC">Pihak DC Penerima (Insiden Saat Proses Bongkar Dock)</option>
              <option value="FORCE_MAJEURE">Keadaan Kahar / Force Majeure (Bencana Alam / Cuaca Ekstrem)</option>
            </select>
          </div>
        </div>

        {/* Claim Items Breakdown Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
            Rincian Barang yang Diklaim &amp; Estimasi Nilai Kerugian
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Produk &amp; Batch</th>
                  <th className="px-2 py-2 text-right">Qty Rusak</th>
                  <th className="px-2 py-2 text-right">Qty Selisih</th>
                  <th className="px-2 py-2 text-right w-28">Harga Satuan (Rp)</th>
                  <th className="px-3 py-2 text-right">Estimasi Kerugian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claimItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{it.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {it.sku} • Batch: {it.batch_number || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-rose-600">
                      {it.qty_damaged.toLocaleString()} {it.unit}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-amber-600">
                      {it.qty_shortage.toLocaleString()} {it.unit}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={it.unit_price_estimate}
                        onChange={(e) => handleUpdateItemPrice(idx, Number(e.target.value))}
                        className="w-24 text-right px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      Rp {((it.qty_damaged + it.qty_shortage) * it.unit_price_estimate).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td className="px-3 py-2 text-right uppercase text-[11px] text-slate-600">
                    Total Kerugian Fisik:
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-rose-600">
                    {totalDamaged.toLocaleString()} pcs
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-amber-600">
                    {totalShortage.toLocaleString()} pcs
                  </td>
                  <td className="px-2 py-2 text-right text-slate-500 text-[10px]">
                    Estimasi Total:
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-black text-rose-700">
                    Rp {totalLossAmount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Investigation Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Catatan Kronologi / Bukti Temuan Investigasi
          </label>
          <textarea
            rows={2}
            value={investigationNotes}
            onChange={(e) => setInvestigationNotes(e.target.value)}
            placeholder="Keterangan kondisi tumpukan barang di truk ekspedisi, bukti foto kardus basah/terhimpit, berita acara penolakan DC..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || eligibleBasts.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{submitting ? 'Memproses...' : 'Terbitkan Dokumen Klaim'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
