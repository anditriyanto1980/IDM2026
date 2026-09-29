import React, { useState, useEffect } from 'react';
import { BatchTraceItem } from '../../types';
import { Modal } from '../common/Modal';
import { getBatchMovement, BatchMovementItem } from '../../services/batchService';
import {
  Boxes,
  Calendar,
  Truck,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface BatchMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchTraceItem | null;
}

export const BatchMovementModal: React.FC<BatchMovementModalProps> = ({
  isOpen,
  onClose,
  batch,
}) => {
  const [movements, setMovements] = useState<BatchMovementItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      setLoading(true);
      getBatchMovement(batch.batch_number)
        .then((data) => setMovements(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, batch?.batch_number]);

  if (!batch) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Jejak Distribusi Batch: ${batch.batch_number}`}
      subtitle={`Riwayat pergerakan alokasi batch ${batch.product_name} ke Distribution Center nasional`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Batch Overview Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-sm font-bold font-mono text-slate-900">{batch.batch_number}</span>
              <div className="text-xs text-slate-600 font-semibold">{batch.product_name} ({batch.sku})</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sisa Masa Simpan</span>
              <span className="font-mono font-bold text-sm text-emerald-700">
                {batch.remaining_shelf_life_days} Hari
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center pt-2 border-t border-slate-200">
            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Produksi</span>
              <span className="font-mono font-bold text-slate-900">{batch.total_produced_qty.toLocaleString()} pcs</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-emerald-600 block uppercase font-medium">Terkirim</span>
              <span className="font-mono font-bold text-emerald-700">{batch.total_shipped_qty.toLocaleString()} pcs</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-teal-600 block uppercase font-medium">Diterima Baik DC</span>
              <span className="font-mono font-bold text-teal-700">{batch.total_received_good_qty.toLocaleString()} pcs</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-600 block uppercase font-medium">Stok Gudang Pusat</span>
              <span className="font-mono font-bold text-slate-900">{batch.warehouse_stock_balance.toLocaleString()} pcs</span>
            </div>
          </div>
        </div>

        {/* Movement Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Riwayat Surat Jalan yang Mengangkut Batch Ini ({movements.length} Dokumen)
          </h4>

          {loading ? (
            <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat jejak distribusi...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
              Belum ada Surat Jalan yang mendistribusikan batch ini ke DC.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">No. Surat Jalan</th>
                    <th className="px-3 py-2.5">Customer &amp; DC Tujuan</th>
                    <th className="px-3 py-2.5 text-right">Kuantiti Muatan</th>
                    <th className="px-3 py-2.5 text-right">Diterima Baik</th>
                    <th className="px-3 py-2.5">Status Pengiriman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-emerald-700">{m.shipment_number}</div>
                        <div className="text-[10px] text-slate-400">{m.shipment_date}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">{m.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{m.dc_name}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {m.qty_shipped.toLocaleString()} pcs
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-teal-700">
                        {m.qty_good !== undefined ? `${m.qty_good.toLocaleString()} pcs` : '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Close */}
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
