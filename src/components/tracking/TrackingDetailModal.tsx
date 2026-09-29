import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentMilestone } from '../../types';
import { Modal } from '../common/Modal';
import { ShipmentStatusBadge } from '../shipment/ShipmentStatusBadge';
import { MilestoneTimeline } from './MilestoneTimeline';
import { getMilestonesByShipment } from '../../services/trackingService';
import {
  Truck,
  Building2,
  Calendar,
  MapPin,
  Boxes,
  Phone,
  MessageCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface TrackingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onOpenAddMilestone?: (shipment: Shipment) => void;
  canEdit?: boolean;
}

export const TrackingDetailModal: React.FC<TrackingDetailModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onOpenAddMilestone,
  canEdit = false,
}) => {
  const [milestones, setMilestones] = useState<ShipmentMilestone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMilestones = async () => {
    if (!shipment) return;
    try {
      setLoading(true);
      const data = await getMilestonesByShipment(shipment.id);
      setMilestones(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && shipment) {
      fetchMilestones();
    }
  }, [isOpen, shipment?.id]);

  if (!shipment) return null;

  const cleanPhone = (shipment.driver_phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Tracking: ${shipment.shipment_number}`}
      subtitle={`Monitoring timeline pergerakan pengiriman dan armada ekspedisi secara realtime`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-slate-900">
                  {shipment.shipment_number}
                </span>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ref. Forecast:{' '}
                <strong className="text-slate-700 font-medium">
                  {shipment.forecast_number || 'Pengiriman Langsung (Non-Forecast)'}
                </strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Total Muatan
              </span>
              <span className="text-sm font-bold text-emerald-700">
                {shipment.total_qty.toLocaleString()} PCS
              </span>
            </div>
          </div>

          {/* Quick Route & Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Rute Distribusi
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Asal: <strong>{shipment.origin_warehouse}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tujuan: {shipment.dc?.dc_name || 'DC Tujuan'} ({shipment.customer?.customer_name})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tgl Kirim: {shipment.shipment_date} | Estimasi Tiba: {shipment.estimated_arrival_date}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Armada & Pengemudi
              </div>
              <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{shipment.transporter_name} ({shipment.vehicle_plate_number || 'Plat No -'})</span>
              </div>
              <div className="text-slate-600 text-xs">
                Driver: <strong>{shipment.driver_name || '-'}</strong>
              </div>
              {shipment.driver_phone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://wa.me/${waNumber}?text=Halo%20Pak%20${encodeURIComponent(shipment.driver_name || '')},%20konfirmasi%20posisi%20pengiriman%20Akram%20${shipment.shipment_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded hover:bg-emerald-100"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp Driver</span>
                  </a>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-200"
                  >
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Panggil Telepon</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Timeline Header */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Riwayat Milestone & Checkpoint Perjalanan
              </h3>
              <p className="text-xs text-slate-500">
                Lacak posisi fisik dan kronologis status surat jalan dari pemuatan hingga penerimaan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchMilestones}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
                title="Muat Ulang Milestone"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {canEdit && shipment.status !== 'DELIVERED' && onOpenAddMilestone && (
                <button
                  type="button"
                  onClick={() => onOpenAddMilestone(shipment)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Update Posisi</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <MilestoneTimeline milestones={milestones} />
          </div>
        </div>

        {/* Product Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Rincian Produk Muatan ({shipment.items?.length || 0} SKU)
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-3 py-2">SKU & Produk</th>
                  <th className="px-3 py-2 text-right">Kuantiti</th>
                  <th className="px-3 py-2">Batch / Lot</th>
                  <th className="px-3 py-2">Exp. Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {shipment.items?.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{item.sku}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                      {item.qty_shipped.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      {item.batch_number || '-'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {item.expiry_date || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
