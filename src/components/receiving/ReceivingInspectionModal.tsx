import React, { useState, useEffect } from 'react';
import { Shipment, CreateReceivingPayload, ReceivingInspection } from '../../types';
import { Modal } from '../common/Modal';
import {
  PackageCheck,
  Building2,
  Calendar,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  UserCheck,
  FileText,
} from 'lucide-react';

interface ReceivingInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onSuccess: (inspection: ReceivingInspection) => void;
  onSubmitReceiving: (payload: CreateReceivingPayload) => Promise<ReceivingInspection>;
  defaultReceiverName?: string;
}

interface InspectionItemRow {
  shipment_item_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_shipped: number;
  qty_good: number;
  qty_damaged: number;
  qty_shortage: number;
  unit: string;
  damage_reason: string;
  expiry_date_verified: string;
  batch_number_verified: string;
  is_verified_ok: boolean;
}

export const ReceivingInspectionModal: React.FC<ReceivingInspectionModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onSuccess,
  onSubmitReceiving,
  defaultReceiverName = 'Petugas Inbound DC',
}) => {
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [receiverName, setReceiverName] = useState(defaultReceiverName);
  const [receiverNip, setReceiverNip] = useState('');
  const [receiverRole, setReceiverRole] = useState('Petugas Receiving DC');
  const [driverName, setDriverName] = useState('');
  const [supervisorName, setSupervisorName] = useState('Kepala Gudang DC');
  const [generalNotes, setGeneralNotes] = useState('');
  const [itemRows, setItemRows] = useState<InspectionItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipment) {
      setDriverName(shipment.driver_name || '');
      // Initialize item rows with 100% good as initial default
      const rows: InspectionItemRow[] = (shipment.items || []).map((it) => ({
        shipment_item_id: it.id,
        product_id: it.product_id,
        sku: it.sku,
        product_name: it.product_name,
        qty_shipped: it.qty_shipped,
        qty_good: it.qty_shipped,
        qty_damaged: 0,
        qty_shortage: 0,
        unit: it.unit || 'PCS',
        damage_reason: '',
        expiry_date_verified: it.expiry_date || '',
        batch_number_verified: it.batch_number || '',
        is_verified_ok: true,
      }));
      setItemRows(rows);
    }
  }, [shipment]);

  if (!shipment) return null;

  const handleUpdateItem = (
    idx: number,
    field: keyof InspectionItemRow,
    value: any
  ) => {
    const updated = [...itemRows];
    const row = { ...updated[idx], [field]: value };

    if (field === 'qty_good' || field === 'qty_damaged') {
      const good = Math.max(0, Number(field === 'qty_good' ? value : row.qty_good) || 0);
      const damaged = Math.max(0, Number(field === 'qty_damaged' ? value : row.qty_damaged) || 0);
      const shortage = Math.max(0, row.qty_shipped - (good + damaged));
      row.qty_good = good;
      row.qty_damaged = damaged;
      row.qty_shortage = shortage;
    }

    updated[idx] = row;
    setItemRows(updated);
  };

  const handleMarkAllPerfect = () => {
    const updated = itemRows.map((it) => ({
      ...it,
      qty_good: it.qty_shipped,
      qty_damaged: 0,
      qty_shortage: 0,
      damage_reason: '',
      is_verified_ok: true,
    }));
    setItemRows(updated);
  };

  // Calculations
  const totalShipped = itemRows.reduce((acc, it) => acc + it.qty_shipped, 0);
  const totalGood = itemRows.reduce((acc, it) => acc + it.qty_good, 0);
  const totalDamaged = itemRows.reduce((acc, it) => acc + it.qty_damaged, 0);
  const totalShortage = itemRows.reduce((acc, it) => acc + it.qty_shortage, 0);

  let evaluationStatus = '100% CLEAN PASS (Kondisi Sempurna)';
  let evaluationColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (totalGood === 0 && totalShipped > 0) {
    evaluationStatus = 'REJECTED (Seluruh Muatan Ditolak)';
    evaluationColor = 'text-red-700 bg-red-50 border-red-200';
  } else if (totalShortage > 0) {
    evaluationStatus = `SHORTAGE (Selisih Kurang ${totalShortage.toLocaleString()} pcs)`;
    evaluationColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (totalDamaged > 0) {
    evaluationStatus = `PARTIAL DAMAGE (${totalDamaged.toLocaleString()} pcs Rusak)`;
    evaluationColor = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      setError('Nama petugas receiving DC wajib diisi.');
      return;
    }

    // Validation
    for (const it of itemRows) {
      if (it.qty_damaged > 0 && !it.damage_reason.trim()) {
        setError(`Alasan kerusakan untuk SKU ${it.sku} wajib diisi jika terdapat barang rusak.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateReceivingPayload = {
        shipment_id: shipment.id,
        received_date: receivedDate,
        receiver_name: receiverName.trim(),
        receiver_role: receiverRole.trim(),
        receiver_nip: receiverNip.trim() || undefined,
        driver_name: driverName.trim() || undefined,
        warehouse_supervisor_name: supervisorName.trim() || undefined,
        general_notes: generalNotes.trim() || undefined,
        items: itemRows.map((it) => ({
          shipment_item_id: it.shipment_item_id,
          product_id: it.product_id,
          sku: it.sku,
          product_name: it.product_name,
          qty_shipped: it.qty_shipped,
          qty_good: it.qty_good,
          qty_damaged: it.qty_damaged,
          qty_shortage: it.qty_shortage,
          unit: it.unit,
          damage_reason: it.damage_reason || undefined,
          expiry_date_verified: it.expiry_date_verified || undefined,
          batch_number_verified: it.batch_number_verified || undefined,
        })),
      };

      const result = await onSubmitReceiving(payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan hasil penerimaan barang.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Formulir Penerimaan & QC Fisik Distribution Center"
      subtitle={`Verifikasi fisik barang tiba, kalkulasi kuantiti baik/rusak/selisih, dan penerbitan Berita Acara Serah Terima (BAST)`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shipment Origin & Target Info */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Surat Jalan
            </span>
            <div className="font-bold font-mono text-slate-900 mt-0.5">
              {shipment.shipment_number}
            </div>
            <div className="text-[11px] text-slate-500">
              Ref Forecast: {shipment.forecast_number || 'Non-Forecast'}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Gudang Asal & Tujuan
            </span>
            <div className="font-semibold text-slate-800 mt-0.5">
              {shipment.origin_warehouse}
            </div>
            <div className="text-emerald-700 font-semibold">
              ➡️ {shipment.dc?.dc_name} ({shipment.customer?.customer_name})
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Armada & Sopir
            </span>
            <div className="font-medium text-slate-800 mt-0.5">
              {shipment.transporter_name} ({shipment.vehicle_plate_number || '-'})
            </div>
            <div className="text-slate-600">
              Pengemudi: <strong>{shipment.driver_name || '-'}</strong>
            </div>
          </div>
        </div>

        {/* General Receiving Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Tanggal Penerimaan Fisik <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Nama Petugas Receiving DC <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Contoh: Dwi Prasetya"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              NIP / ID Petugas DC
            </label>
            <input
              type="text"
              value={receiverNip}
              onChange={(e) => setReceiverNip(e.target.value)}
              placeholder="Contoh: RCV-IDM-042"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Item Rows Inspection Table */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pemeriksaan Fisik per SKU ({itemRows.length} Produk)
              </h4>
              <p className="text-[11px] text-slate-500">
                Cocokkan kuantiti fisik dengan dokumen Surat Jalan. Input barang rusak bila ada.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllPerfect}
              className="text-[11px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Semua Kondisi Baik 100%</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Produk</th>
                    <th className="px-2.5 py-2.5 text-right w-24">Qty SJ</th>
                    <th className="px-2.5 py-2.5 text-right w-28">
                      <span className="text-emerald-700">Qty Baik</span>
                    </th>
                    <th className="px-2.5 py-2.5 text-right w-24">
                      <span className="text-rose-600">Qty Rusak</span>
                    </th>
                    <th className="px-2.5 py-2.5 text-right w-24">
                      <span className="text-amber-600">Selisih</span>
                    </th>
                    <th className="px-3 py-2.5">Keterangan / Alasan Kerusakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemRows.map((it, idx) => (
                    <tr key={it.shipment_item_id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">{it.product_name}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {it.sku} • Batch: {it.batch_number_verified || '-'}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono font-semibold text-slate-800">
                        {it.qty_shipped.toLocaleString()} {it.unit}
                      </td>
                      <td className="px-2.5 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          max={it.qty_shipped}
                          value={it.qty_good}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'qty_good', e.target.value)
                          }
                          className="w-24 text-right px-2 py-1 text-xs border border-emerald-300 rounded font-mono font-bold text-emerald-800 bg-emerald-50/30 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-2.5 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          max={it.qty_shipped}
                          value={it.qty_damaged}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'qty_damaged', e.target.value)
                          }
                          className={`w-20 text-right px-2 py-1 text-xs border rounded font-mono font-semibold ${
                            it.qty_damaged > 0
                              ? 'border-rose-400 bg-rose-50 text-rose-700'
                              : 'border-slate-200 text-slate-600'
                          } focus:outline-hidden focus:ring-1 focus:ring-rose-500`}
                        />
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono font-semibold text-amber-700">
                        {it.qty_shortage > 0 ? it.qty_shortage.toLocaleString() : '0'}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={it.damage_reason}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'damage_reason', e.target.value)
                          }
                          placeholder={
                            it.qty_damaged > 0
                              ? 'Wajib: kemasan sobek, bocor, basah...'
                              : 'Kondisi kemasan rapi dan segel aman'
                          }
                          className={`w-full text-xs px-2.5 py-1 border rounded ${
                            it.qty_damaged > 0 && !it.damage_reason
                              ? 'border-rose-400 bg-rose-50/50'
                              : 'border-slate-200'
                          } focus:outline-hidden focus:ring-1 focus:ring-emerald-500`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer Summary */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Kirim:</span>
                  <span className="font-mono font-bold text-slate-900 ml-1.5">{totalShipped.toLocaleString()} pcs</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold">Diterima Baik:</span>
                  <span className="font-mono font-bold text-emerald-700 ml-1.5">{totalGood.toLocaleString()} pcs</span>
                </div>
                {totalDamaged > 0 && (
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase font-semibold">Rusak/Reject:</span>
                    <span className="font-mono font-bold text-rose-600 ml-1.5">{totalDamaged.toLocaleString()} pcs</span>
                  </div>
                )}
                {totalShortage > 0 && (
                  <div>
                    <span className="text-[10px] text-amber-600 uppercase font-semibold">Selisih Kurang:</span>
                    <span className="font-mono font-bold text-amber-600 ml-1.5">{totalShortage.toLocaleString()} pcs</span>
                  </div>
                )}
              </div>

              {/* Status Evaluation Pill */}
              <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${evaluationColor}`}>
                {evaluationStatus}
              </div>
            </div>
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Catatan Tambahan Pemeriksaan Dokumen BAST
          </label>
          <textarea
            rows={2}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Catatan mengenai kondisi kebersihan armada, suhu kontainer, keutuhan segel ekspedisi, dll..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
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
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <PackageCheck className="w-4 h-4" />
            <span>{submitting ? 'Memproses Penerimaan...' : 'Selesaikan Penerimaan & Terbitkan BAST'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
