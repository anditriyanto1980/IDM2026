import React from 'react';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  rows?: number;
  message?: string;
}

export const TableLoadingState: React.FC<LoadingStateProps> = ({ rows = 4, message = 'Memuat data...' }) => {
  return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">{message}</span>
      </div>
    </div>
  );
};

export const LoadingSkeleton: React.FC<LoadingStateProps> = ({ rows = 4, message = 'Memuat data...' }) => {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Terjadi kesalahan saat memuat data.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Gagal Memuat Data</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      )}
    </div>
  );
};
