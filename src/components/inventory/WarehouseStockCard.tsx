import React from 'react';
import { WarehouseInventory } from '../../types';
import { Package, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface WarehouseStockCardProps {
  item: WarehouseInventory;
  onRecordMutation?: (item: WarehouseInventory) => void;
}

export const WarehouseStockCard: React.FC<WarehouseStockCardProps> = ({ item, onRecordMutation }) => {
  const getStatusBadge = (status: WarehouseInventory['stock_status']) => {
    switch (status) {
      case 'CRITICAL_LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            CRITICAL LOW
          </span>
        );
      case 'REORDER_POINT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            REORDER POINT
          </span>
        );
      case 'OVERSTOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            OVERSTOCK
          </span>
        );
      case 'OPTIMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            OPTIMAL
          </span>
        );
    }
  };

  // Percent ATP of On Hand
  const atpPercent = item.stock_on_hand > 0 ? Math.round((item.stock_available / item.stock_on_hand) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {item.sku}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {item.warehouse_name.split('(')[0].trim()}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
              {item.product_name}
            </h3>
          </div>
          {getStatusBadge(item.stock_status)}
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3">
          <div className="bg-slate-50 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Stock Fisik
            </span>
            <span className="text-sm font-bold text-slate-800">
              {item.stock_on_hand.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 block">{item.unit}</span>
          </div>

          <div className="bg-amber-50/60 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
              Reserved
            </span>
            <span className="text-sm font-bold text-amber-900">
              {item.stock_reserved.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-amber-700 block">{item.unit}</span>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
              Bebas (ATP)
            </span>
            <span className="text-sm font-bold text-emerald-900">
              {item.stock_available.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-emerald-700 block">{item.unit}</span>
          </div>
        </div>

        {/* Progress bar: Available to Promise */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Rasio Ketersediaan Bebas:</span>
            <span className="font-semibold text-slate-700">{atpPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                item.stock_status === 'CRITICAL_LOW'
                  ? 'bg-rose-500'
                  : item.stock_status === 'REORDER_POINT'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, atpPercent)}%` }}
            />
          </div>
        </div>

        {/* Buffer thresholds info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Safety Stock: <strong>{item.safety_stock.toLocaleString('id-ID')}</strong></span>
          <span>Reorder Point: <strong>{item.reorder_point.toLocaleString('id-ID')}</strong></span>
        </div>
      </div>

      {/* Action Footer */}
      {onRecordMutation && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Audit: {item.last_audit_date}
          </span>
          <button
            onClick={() => onRecordMutation(item)}
            className="text-xs font-semibold text-sky-800 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            + Catat Mutasi
          </button>
        </div>
      )}
    </div>
  );
};
