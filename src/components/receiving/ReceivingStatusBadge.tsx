import React from 'react';
import { DiscrepancyStatus } from '../../types';

interface ReceivingStatusBadgeProps {
  status: DiscrepancyStatus;
  size?: 'sm' | 'md';
}

export const ReceivingStatusBadge: React.FC<ReceivingStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'CLEAN_PASS':
        return {
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-800',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: '100% Sesuai (Clean Pass)',
        };
      case 'PARTIAL_DAMAGE':
        return {
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-800',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Sebagian Rusak (Partial Damage)',
        };
      case 'SHORTAGE':
        return {
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-800',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: 'Selisih Kurang (Shortage)',
        };
      case 'REJECTED':
        return {
          dotColor: 'bg-red-600',
          textColor: 'text-red-900',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Ditolak Total (Rejected)',
        };
      default:
        return {
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          label: status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${
        config.bgColor
      } ${config.borderColor} ${config.textColor} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};
