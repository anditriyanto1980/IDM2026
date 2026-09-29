import React from 'react';

interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeText = 'Aktif',
  inactiveText = 'Nonaktif',
  size = 'md',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      } ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
        aria-hidden="true"
      />
      <span>{isActive ? activeText : inactiveText}</span>
    </span>
  );
};
