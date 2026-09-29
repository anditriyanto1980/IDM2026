import React from 'react';
import { ShipmentStatus } from '../../types';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ShipmentStatusBadge: React.FC<ShipmentStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const getStatusConfig = (st: ShipmentStatus) => {
    switch (st) {
      case 'DRAFT':
        return {
          label: 'Draft Gudang',
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
        };
      case 'READY_TO_DISPATCH':
        return {
          label: 'Siap Berangkat',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-700',
        };
      case 'IN_TRANSIT':
        return {
          label: 'Dalam Perjalanan',
          dotColor: 'bg-sky-500',
          textColor: 'text-sky-700',
        };
      case 'ARRIVED_DC':
        return {
          label: 'Tiba di Gate DC',
          dotColor: 'bg-indigo-500',
          textColor: 'text-indigo-700',
        };
      case 'DELIVERED':
        return {
          label: 'Selesai Diterima',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
        };
      default:
        return {
          label: st,
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        size === 'sm' ? 'text-xs' : 'text-xs'
      } ${config.textColor}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        aria-hidden="true"
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
