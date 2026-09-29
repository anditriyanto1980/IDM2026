import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  itemsPerPage?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  itemsPerPage = 10,
  totalPages: propTotalPages,
  onPageChange,
}) => {
  const size = pageSize || itemsPerPage;
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / size));
  const finalTotalPages = propTotalPages || calculatedTotalPages;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * size + 1;
  const endItem = Math.min(totalItems, currentPage * size);

  if (totalItems <= size) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-medium text-slate-800 tabular-nums">{totalItems}</span> data
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
      <div>
        Menampilkan <span className="font-medium text-slate-800 tabular-nums">{startItem}</span> -{' '}
        <span className="font-medium text-slate-800 tabular-nums">{endItem}</span> dari{' '}
        <span className="font-medium text-slate-800 tabular-nums">{totalItems}</span> data
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2 font-medium text-slate-700 tabular-nums">
          Hal {currentPage} / {finalTotalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= finalTotalPages}
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
