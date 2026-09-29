import React from 'react';
import { Shipment, ShipmentMilestone } from '../../types';
import { ShipmentStatusBadge } from '../shipment/ShipmentStatusBadge';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Boxes,
} from 'lucide-react';

interface LiveRouteMapCardProps {
  shipment: Shipment;
  latestMilestone?: ShipmentMilestone;
  onOpenDetails: (shipment: Shipment) => void;
  onAddCheckpoint: (shipment: Shipment) => void;
  canEdit?: boolean;
}

export const LiveRouteMapCard: React.FC<LiveRouteMapCardProps> = ({
  shipment,
  latestMilestone,
  onOpenDetails,
  onAddCheckpoint,
  canEdit = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isDelayed =
    (shipment.status === 'IN_TRANSIT' || shipment.status === 'ARRIVED_DC') &&
    shipment.estimated_arrival_date < todayStr;

  const isDelivered = shipment.status === 'DELIVERED';
  const isArrivedDc = shipment.status === 'ARRIVED_DC';

  // Calculate route stage percentage
  let stagePercent = 20;
  if (shipment.status === 'READY_TO_DISPATCH') stagePercent = 25;
  if (shipment.status === 'IN_TRANSIT') stagePercent = 60;
  if (shipment.status === 'ARRIVED_DC') stagePercent = 85;
  if (shipment.status === 'DELIVERED') stagePercent = 100;

  const cleanPhone = (shipment.driver_phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDetails(shipment)}
              className="text-sm font-bold font-mono text-emerald-700 hover:text-emerald-800 tracking-tight hover:underline flex items-center gap-1"
            >
              <span>{shipment.shipment_number}</span>
            </button>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
              {shipment.transporter_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDelayed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                <AlertTriangle className="w-3 h-3" />
                <span>Delay SLA</span>
              </span>
            )}
            <ShipmentStatusBadge status={shipment.status} size="sm" />
          </div>
        </div>

        {/* Route Visualizer */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
            <div className="flex items-center gap-1.5 truncate max-w-[45%]">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={shipment.origin_warehouse}>
                {shipment.origin_warehouse}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />

            <div className="flex items-center gap-1.5 truncate max-w-[45%] text-right justify-end">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate text-slate-900 font-bold" title={shipment.dc?.dc_name || 'DC Tujuan'}>
                {shipment.dc?.dc_name || 'DC Tujuan'}
              </span>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                isDelivered
                  ? 'bg-emerald-500'
                  : isDelayed
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${stagePercent}%` }}
            />
          </div>

          {/* Active Checkpoint Label */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-medium text-slate-900">
                {latestMilestone ? latestMilestone.location : 'Menunggu Update Rute'}
              </span>
            </div>

            <span className="font-mono text-slate-500 text-[10px]">
              {latestMilestone ? new Date(latestMilestone.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
            </span>
          </div>
        </div>

        {/* Driver & Vehicle Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
              Armada & Pengemudi:
            </span>
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{shipment.driver_name || 'Supir Ekspedisi'}</span>
            </div>
            <div className="font-mono text-slate-500 text-[11px] mt-0.5">
              {shipment.vehicle_plate_number || 'No Polisi -'}
            </div>

            {/* Direct WhatsApp Call */}
            {shipment.driver_phone && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={`https://wa.me/${waNumber}?text=Halo%20Pak%20${encodeURIComponent(shipment.driver_name || '')},%20konfirmasi%20posisi%20pengiriman%20Akram%20${shipment.shipment_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-100"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-200"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Panggil</span>
                </a>
              </div>
            )}
          </div>

          <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
              Target Kedatangan (SLA):
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{shipment.estimated_arrival_date}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{shipment.total_qty.toLocaleString()} pcs kurma</span>
            </div>
            {shipment.customer && (
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                Customer: <strong className="text-slate-700 font-medium">{shipment.customer.customer_name}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetails(shipment)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
        >
          <span>Lihat Timeline & Item</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        {canEdit && shipment.status !== 'DELIVERED' && (
          <button
            onClick={() => onAddCheckpoint(shipment)}
            className="text-xs font-medium px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Update Posisi</span>
          </button>
        )}
      </div>
    </div>
  );
};
