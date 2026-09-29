import React from 'react';
import { ClaimStatus } from '../../types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  size?: 'sm' | 'md';
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          dotColor: 'bg-blue-500',
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Diajukan (Submitted)',
        };
      case 'INVESTIGATING':
        return {
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-800',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Investigasi (Under Review)',
        };
      case 'APPROVED':
        return {
          dotColor: 'bg-indigo-500',
          textColor: 'text-indigo-800',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          label: 'Disetujui (Approved)',
        };
      case 'REPLACED':
        return {
          dotColor: 'bg-teal-500',
          textColor: 'text-teal-800',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          label: 'Pengganti Terkirim (Replaced)',
        };
      case 'SETTLED':
        return {
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-800',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Selesai / Tuntas (Settled)',
        };
      case 'REJECTED':
        return {
          dotColor: 'bg-red-500',
          textColor: 'text-red-800',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Ditolak (Rejected)',
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

  const config = getConfig();

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
