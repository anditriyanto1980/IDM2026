import React, { useState } from 'react';
import { DiscrepancyClaim, ClaimStatus, ClaimResolutionType } from '../../types';
import { Modal } from '../common/Modal';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  Boxes,
  FileText,
  DollarSign,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

interface ClaimDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: DiscrepancyClaim | null;
  onUpdateResolution: (
    claimId: string,
    resolution: {
      status: ClaimStatus;
      resolution_type?: ClaimResolutionType;
      replacement_shipment_number?: string;
      resolution_notes?: string;
    }
  ) => Promise<void>;
  canEdit?: boolean;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  isOpen,
  onClose,
  claim,
  onUpdateResolution,
  canEdit = false,
}) => {
  const [status, setStatus] = useState<ClaimStatus>('APPROVED');
  const [resolutionType, setResolutionType] = useState<ClaimResolutionType>('CREDIT_NOTE');
  const [replacementShipment, setReplacementShipment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!claim) return null;

  const handleApplyResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onUpdateResolution(claim.id, {
        status,
        resolution_type: resolutionType,
        replacement_shipment_number: replacementShipment.trim() || undefined,
        resolution_notes: resolutionNotes.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getResponsiblePartyLabel = (party: string) => {
    switch (party) {
      case 'TRANSPORTER':
        return 'Pihak Ekspedisi / Armada (Kelalaian Transport)';
      case 'ORIGIN_WAREHOUSE':
        return 'Gudang Pusat Akram (Cacat Muatan Awal)';
      case 'DESTINATION_DC':
        return 'Distribution Center (Insiden Bongkar)';
      case 'FORCE_MAJEURE':
        return 'Keadaan Kahar / Bencana Alam';
      default:
        return party;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Berkas Klaim Kerusakan: ${claim.claim_number}`}
      subtitle="Dokumen resmi penanganan ketidaksesuaian serah terima barang dan pertanggungjawaban kerugian"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Summary Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-slate-900">{claim.claim_number}</span>
                <ClaimStatusBadge status={claim.status} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ref. BAST: <strong className="text-slate-800 font-medium">{claim.bast_number}</strong> • Surat Jalan: <strong className="text-emerald-700 font-medium">{claim.shipment_number}</strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimasi Nilai Klaim</span>
              <span className="text-base font-bold font-mono text-rose-700">
                Rp {claim.estimated_loss_amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pihak Dituntut</span>
              <strong className="text-slate-900 block mt-0.5">{getResponsiblePartyLabel(claim.responsible_party)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer &amp; Lokasi DC</span>
              <span className="text-slate-800 font-medium block mt-0.5">{claim.customer?.customer_name} ({claim.dc?.dc_name})</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Kerusakan</span>
              <span className="text-rose-600 font-bold block mt-0.5">{claim.total_damaged_qty} pcs rusak • {claim.total_shortage_qty} pcs selisih</span>
            </div>
          </div>
        </div>

        {/* Investigation Notes */}
        {claim.investigation_notes && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900">
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Temuan &amp; Kronologi Investigasi:</span>
            </span>
            <p className="leading-relaxed text-amber-800">{claim.investigation_notes}</p>
          </div>
        )}

        {/* Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Rincian Barang yang Mengalami Kerusakan ({claim.items?.length || 0} SKU)
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Produk &amp; Batch</th>
                  <th className="px-2 py-2 text-right">Rusak</th>
                  <th className="px-2 py-2 text-right">Selisih</th>
                  <th className="px-2 py-2 text-right">Harga Satuan</th>
                  <th className="px-3 py-2 text-right">Subtotal Kerugian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(claim.items || []).map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{it.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {it.sku} • Batch: {it.batch_number || '-'}
                      </div>
                      {it.damage_reason && (
                        <div className="text-[10px] text-rose-600 italic mt-0.5">
                          {it.damage_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-rose-600">
                      {it.qty_damaged.toLocaleString()} {it.unit}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-amber-600">
                      {it.qty_shortage.toLocaleString()} {it.unit}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-600">
                      Rp {it.unit_price_estimate.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      Rp {it.subtotal_loss_estimate.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing Resolution info if settled */}
        {claim.status === 'SETTLED' || claim.status === 'REPLACED' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900">
            <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Klaim Telah Diselesaikan ({claim.resolution_type})</span>
            </span>
            <p className="text-emerald-800 leading-relaxed mb-2">
              {claim.resolution_notes || 'Klaim telah disetujui dan dituntaskan sesuai kesepakatan penanggung jawab.'}
            </p>
            {claim.replacement_shipment_number && (
              <div className="font-medium">
                Surat Jalan Pengganti: <strong className="font-mono text-slate-900">{claim.replacement_shipment_number}</strong>
              </div>
            )}
            <div className="text-[10px] text-emerald-600 mt-1">
              Diselesaikan pada: {claim.settled_at ? new Date(claim.settled_at).toLocaleDateString('id-ID') : '-'}
            </div>
          </div>
        ) : canEdit ? (
          /* Resolution Action Form */
          <form onSubmit={handleApplyResolution} className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tindakan Penyelesaian Klaim (Resolution Action)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Ubah Status Klaim
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="APPROVED">Disetujui (Approved)</option>
                  <option value="REPLACED">Barang Pengganti Telah Dikirim (Replaced)</option>
                  <option value="SETTLED">Selesai / Tuntas Ganti Rugi (Settled)</option>
                  <option value="REJECTED">Tolak Klaim (Rejected)</option>
                  <option value="INVESTIGATING">Masih Investigasi (Under Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Bentuk Penyelesaian Kerugian
                </label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as ClaimResolutionType)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="CREDIT_NOTE">Nota Kredit / Pemotongan Ongkos Angkut (Credit Note)</option>
                  <option value="REPLACEMENT_SHIPMENT">Pengiriman Ulang Barang Pengganti (Re-delivery)</option>
                  <option value="INSURANCE_CLAIM">Klaim Asuransi Pengiriman Kargo</option>
                  <option value="REJECTED">Ditolak (Non-Claimable)</option>
                </select>
              </div>
            </div>

            {resolutionType === 'REPLACEMENT_SHIPMENT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nomor Surat Jalan Pengganti (Replacement SJ)
                </label>
                <input
                  type="text"
                  value={replacementShipment}
                  onChange={(e) => setReplacementShipment(e.target.value)}
                  placeholder="Contoh: SJ-202609-0004"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Catatan Kesepakatan Penyelesaian
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Kesepakatan pemotongan tagihan faktur, nomor surat persetujuan ekspedisi, jadwal pengiriman ulang..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Penyelesaian Klaim'}</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Modal close */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
