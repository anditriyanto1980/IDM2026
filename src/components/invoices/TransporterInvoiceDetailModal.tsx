import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { TransporterInvoice, TransporterInvoiceStatus } from '../../types';
import { updateInvoiceStatus } from '../../services/invoiceService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Truck,
} from 'lucide-react';

interface TransporterInvoiceDetailModalProps {
  invoice: TransporterInvoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TransporterInvoiceDetailModal: React.FC<TransporterInvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [paymentRef, setPaymentRef] = useState(invoice.payment_reference || '');
  const [submitting, setSubmitting] = useState(false);

  const handleStatusChange = async (targetStatus: TransporterInvoiceStatus) => {
    if (targetStatus === 'PAID' && !paymentRef.trim()) {
      showToast('error', 'Masukkan nomor referensi transfer bank untuk pelunasan faktur');
      return;
    }

    setSubmitting(true);
    try {
      await updateInvoiceStatus(
        invoice.id,
        targetStatus,
        paymentRef.trim() || undefined,
        user?.full_name || 'Finance Staff'
      );
      showToast('success', `Status faktur diubah menjadi ${targetStatus}`);
      onUpdated();
      onClose();
    } catch (e: any) {
      showToast('error', e.message || 'Gagal memperbarui faktur');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st: TransporterInvoiceStatus) => {
    switch (st) {
      case 'PAID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            LUNAS (PAID)
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            TERVERIFIKASI
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            DISENGKETAKAN
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            MENUNGGU VERIFIKASI
          </span>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rekap Tagihan Ongkos Angkut Ekspedisi" size="xl">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                  {invoice.invoice_number}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Periode: {invoice.period_month}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {invoice.transporter_name}
              </h2>
            </div>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Faktur</span>
              <span className="font-semibold text-slate-800">{invoice.invoice_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jatuh Tempo</span>
              <span className="font-semibold text-slate-800">{invoice.due_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Surat Jalan</span>
              <span className="font-semibold text-slate-800">{invoice.total_shipments} Pengiriman</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ref Pembayaran</span>
              <span className="font-mono font-bold text-slate-800">
                {invoice.payment_reference || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Shipment Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
            Daftar Surat Jalan &amp; Rekonsiliasi Klaim
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">No Surat Jalan</th>
                  <th className="px-4 py-2.5">Tujuan DC</th>
                  <th className="px-4 py-2.5">Tgl Kirim / Terima</th>
                  <th className="px-4 py-2.5 text-right">Kuantiti</th>
                  <th className="px-4 py-2.5 text-right">Ongkir Bruto</th>
                  <th className="px-4 py-2.5 text-right">Potongan Klaim</th>
                  <th className="px-4 py-2.5 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it) => {
                  const net = it.freight_amount - it.claim_deduction;
                  return (
                    <tr key={it.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">
                        {it.shipment_number}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {it.dc_name} ({it.destination_city})
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {it.shipped_date} &rarr; {it.received_date || 'In Transit'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                        {it.weight_or_boxes.toLocaleString('id-ID')} pcs
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                        Rp {it.freight_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {it.has_claim ? (
                          <span className="font-semibold text-rose-600">
                            - Rp {it.claim_deduction.toLocaleString('id-ID')}
                            <span className="block text-[10px] text-slate-400 font-mono">
                              ({it.claim_number})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Rp 0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                        Rp {net.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary Calculation Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block">Catatan Rekonsiliasi:</span>
            <p className="text-slate-500 max-w-md text-[11px] leading-relaxed">
              {invoice.notes || 'Tagihan telah diverifikasi dengan bukti Surat Jalan kembali bertanda tangan DC.'}
            </p>
          </div>

          <div className="text-right space-y-1 w-full sm:w-auto">
            <div className="flex justify-between sm:justify-end gap-6 text-xs text-slate-600">
              <span>Total Ongkos Bruto:</span>
              <span className="font-semibold">Rp {invoice.gross_freight_amount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-6 text-xs text-rose-600">
              <span>Potongan Klaim Kerusakan:</span>
              <span className="font-semibold">- Rp {invoice.claim_deductions.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-6 text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Bersih Dibayarkan:</span>
              <span className="text-emerald-700">Rp {invoice.net_payable_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Action & Verification Workflow */}
        {invoice.status !== 'PAID' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Workflow Verifikasi &amp; Pelunasan:
            </span>

            {invoice.status === 'SUBMITTED' && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Verifikasi kecocokan Surat Jalan fisik dan tanda terima DC.
                </span>
                <button
                  onClick={() => handleStatusChange('VERIFIED')}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Verifikasi Tagihan Ekspedisi
                </button>
              </div>
            )}

            {invoice.status === 'VERIFIED' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      No Referensi Transfer Bank (BCA / Mandiri / BNI):
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Contoh: TRF-BCA-20260925-9912"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleStatusChange('PAID')}
                      disabled={submitting}
                      className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Konfirmasi Pelunasan Faktur</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap Faktur</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
