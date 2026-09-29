import React from 'react';
import { ForecastStatus } from '../../types';

interface ForecastStatusBadgeProps {
  status: ForecastStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ForecastStatusBadge: React.FC<ForecastStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const getStatusConfig = (st: ForecastStatus) => {
    switch (st) {
      case 'FORECAST':
        return {
          label: 'Forecast Dibuat',
          dotColor: 'bg-sky-500',
          textColor: 'text-sky-700',
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
        };
      case 'PARTIAL':
        return {
          label: 'Sebagian Terkirim',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
      case 'IN_TRANSIT':
        return {
          label: 'Dalam Perjalanan',
          dotColor: 'bg-indigo-500',
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
        };
      case 'RECEIVED':
        return {
          label: 'Selesai Diterima',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
        };
      case 'OVERDUE':
        return {
          label: 'Lewat Target',
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
        };
      default:
        return {
          label: st,
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
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
