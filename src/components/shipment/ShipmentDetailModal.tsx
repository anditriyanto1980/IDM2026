import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../../types';
import { Modal } from '../common/Modal';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import {
  Truck,
  Building2,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  Phone,
  User,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onPrint: (shipment: Shipment) => void;
  onStatusUpdate: (id: string, newStatus: ShipmentStatus) => Promise<void>;
  canUpdateStatus?: boolean;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onPrint,
  onStatusUpdate,
  canUpdateStatus = true,
}) => {
  if (!shipment) return null;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newStatus: ShipmentStatus) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate(shipment.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Pengiriman: ${shipment.shipment_number}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-slate-900">
                  {shipment.shipment_number}
                </span>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dibuat pada {new Date(shipment.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onPrint(shipment)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-sky-700" />
              <span>Cetak Surat Jalan</span>
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Customer & DC</span>
              <div className="font-semibold text-slate-900">
                {shipment.customer?.customer_name} ({shipment.customer?.customer_code})
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {shipment.dc?.dc_name} - {shipment.dc?.city}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Gudang Asal (Origin)</span>
              <div className="font-semibold text-slate-900">
                {shipment.origin_warehouse}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Ref Forecast: <span className="font-mono">{shipment.forecast_number || '-'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Tanggal Surat Jalan</span>
              <div className="font-semibold text-slate-900">
                {shipment.shipment_date}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Target Tiba di DC</span>
              <div className="font-semibold text-slate-900">
                {shipment.estimated_arrival_date}
              </div>
              {shipment.actual_arrival_date && (
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Tiba: {shipment.actual_arrival_date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transporter & Fleet Info */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-sky-700" />
            <span>Informasi Ekspedisi & Armada Pengangkut</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-1">Ekspedisi / Vendor</span>
              <span className="font-bold text-slate-900">{shipment.transporter_name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-1">Pengemudi / Driver</span>
              <span className="font-bold text-slate-900">{shipment.driver_name || '-'}</span>
              {shipment.driver_phone && (
                <span className="text-[11px] text-slate-500 block">{shipment.driver_phone}</span>
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-1">No. Polisi Kendaraan</span>
              <span className="font-mono font-bold text-slate-900">
                {shipment.vehicle_plate_number || '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-1">No. Resi / AWB</span>
              <span className="font-mono font-bold text-slate-900">
                {shipment.tracking_number_ref || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Item Muatan ({shipment.items?.length || 0} SKU Produk Kurma)
            </span>
          </div>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-10 text-center">No</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Nama Produk Kurma</th>
                <th className="py-2.5 px-4">No. Batch/Lot</th>
                <th className="py-2.5 px-4 text-center">Exp Date</th>
                <th className="py-2.5 px-4 text-right">Qty Kirim</th>
                <th className="py-2.5 px-4 text-center">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {(shipment.items || []).map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {item.sku}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {item.product_name}
                    {item.notes && (
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {item.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {item.batch_number || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-600">
                    {item.expiry_date || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                    {item.qty_shipped.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-500 font-medium">
                    {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={5} className="py-2.5 px-4 text-right text-slate-700">
                  TOTAL PENGIRIMAN:
                </td>
                <td className="py-2.5 px-4 text-right text-slate-900 tabular-nums">
                  {shipment.total_qty.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-4 text-center text-slate-600">PCS</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Lifecycle Status Advancement Actions */}
        {canUpdateStatus && shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-sky-950 block">Pembaruan Status Operasional</span>
              <p className="text-[11px] text-sky-800">
                Perbarui tahapan perjalanan armada pengiriman barang secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {shipment.status === 'READY_TO_DISPATCH' && (
                <button
                  type="button"
                  onClick={() => handleUpdate('IN_TRANSIT')}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Kirim / Berangkatkan Armada</span>
                </button>
              )}

              {shipment.status === 'IN_TRANSIT' && (
                <button
                  type="button"
                  onClick={() => handleUpdate('ARRIVED_DC')}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi Tiba di Gate DC</span>
                </button>
              )}

              {shipment.status === 'ARRIVED_DC' && (
                <button
                  type="button"
                  onClick={() => handleUpdate('DELIVERED')}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi Diterima Utuh (Delivered)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
