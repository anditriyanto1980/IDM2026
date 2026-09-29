import React from 'react';
import { ShipmentMilestone } from '../../types';
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  PackageCheck,
  AlertTriangle,
  Building2,
  FileText,
} from 'lucide-react';

interface MilestoneTimelineProps {
  milestones: ShipmentMilestone[];
  isCompact?: boolean;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones,
  isCompact = false,
}) => {
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
        return <FileText className="w-3.5 h-3.5 text-sky-600" />;
      case 'PICKING_LOADING':
        return <Building2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'DEPARTED_WAREHOUSE':
        return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case 'IN_TRANSIT_CHECKPOINT':
        return <MapPin className="w-3.5 h-3.5 text-amber-600" />;
      case 'ARRIVED_DC_GATE':
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'UNLOADING_INSPECTION':
        return <Clock className="w-3.5 h-3.5 text-teal-600" />;
      case 'COMPLETED_RECEIVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EXCEPTION_DELAY':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB',
      };
    } catch {
      return { date: iso, time: '' };
    }
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        Belum ada riwayat checkpoint/milestone untuk pengiriman ini.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
      {milestones.map((m, idx) => {
        const isLatest = idx === milestones.length - 1;
        const { date, time } = formatDateTime(m.timestamp);

        return (
          <div key={m.id || idx} className="relative group">
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                isLatest
                  ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-100'
                  : 'bg-white border-slate-300'
              }`}
            >
              {getMilestoneIcon(m.milestone_type)}
            </div>

            {/* Content Card */}
            <div
              className={`rounded-lg p-3 border transition-colors ${
                isLatest
                  ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    {m.title}
                  </h4>
                  {isLatest && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Posisi Terkini
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span className="font-medium text-slate-700">{date}</span>
                  <span>•</span>
                  <span>{time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{m.location}</span>
              </div>

              {m.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100 leading-relaxed mb-2">
                  {m.notes}
                </p>
              )}

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Dicatat oleh: <strong className="text-slate-600 font-medium">{m.recorded_by}</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
