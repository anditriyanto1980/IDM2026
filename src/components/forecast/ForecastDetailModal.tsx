import React from 'react';
import { Forecast } from '../../types';
import { Modal } from '../common/Modal';
import { ForecastStatusBadge } from './ForecastStatusBadge';
import {
  Calendar,
  Building2,
  MapPin,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ForecastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  forecast: Forecast | null;
  onEdit?: (forecast: Forecast) => void;
}

export const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({
  isOpen,
  onClose,
  forecast,
  onEdit,
}) => {
  if (!forecast) return null;

  const fulfillmentRate =
    forecast.total_qty > 0
      ? Math.min(100, Math.round((forecast.total_shipped / forecast.total_qty) * 100))
      : 0;

  const exportForecastToExcel = () => {
    const data = (forecast.items || []).map((item, idx) => ({
      No: idx + 1,
      'No Forecast': forecast.forecast_number,
      Customer: forecast.customer?.customer_name || 'Customer',
      DC: forecast.dc?.dc_name || 'DC',
      'Kode DC': forecast.dc?.dc_code || '',
      Periode: forecast.period,
      'Target Delivery': forecast.target_delivery_date,
      SKU: item.sku,
      'Nama Produk': item.product_name,
      'Qty Forecast': item.qty_forecast,
      'Qty Shipped': item.qty_shipped,
      'Qty Received': item.qty_received,
      Outstanding: Math.max(0, item.qty_forecast - item.qty_shipped),
      Satuan: item.unit,
      Status: forecast.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, forecast.forecast_number);
    XLSX.writeFile(wb, `${forecast.forecast_number}_Detail.xlsx`);
  };

  // Determine timeline step
  const getTimelineStep = () => {
    if (forecast.status === 'RECEIVED') return 4;
    if (forecast.status === 'IN_TRANSIT') return 3;
    if (forecast.total_shipped > 0) return 2;
    return 1;
  };

  const currentStep = getTimelineStep();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Forecast: ${forecast.forecast_number}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-slate-900">
                  {forecast.forecast_number}
                </span>
                <ForecastStatusBadge status={forecast.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dibuat pada {new Date(forecast.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportForecastToExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export XLS</span>
              </button>
              {onEdit && forecast.total_shipped === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(forecast);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
                >
                  Edit Forecast
                </button>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Customer</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{forecast.customer?.customer_name || 'N/A'} ({forecast.customer?.customer_code})</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Distribution Center</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{forecast.dc?.dc_name || 'N/A'}</span>
              </div>
              <span className="text-[11px] text-slate-500">{forecast.dc?.city || ''}, {forecast.region?.region_name || ''}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Periode Forecast</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{forecast.period}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Target Delivery</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{forecast.target_delivery_date}</span>
              </div>
              {forecast.status === 'OVERDUE' && (
                <span className="text-[10px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> Melewati jadwal target
                </span>
              )}
            </div>
          </div>

          {forecast.notes && (
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Catatan: </span>
              {forecast.notes}
            </div>
          )}
        </div>

        {/* Lifecycle Tracker */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Alur Lifecycle Pemenuhan (Fulfillment Status)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                currentStep >= 1
                  ? 'bg-sky-50/50 border-sky-200 text-sky-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    currentStep >= 1 ? 'text-sky-600' : 'text-slate-300'
                  }`}
                />
                <span className="font-bold">1. Forecast Terdaftar</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Alokasi kebutuhan kurma diajukan ke sistem.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                currentStep >= 2
                  ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package
                  className={`w-4 h-4 ${
                    currentStep >= 2 ? 'text-amber-600' : 'text-slate-300'
                  }`}
                />
                <span className="font-bold">2. Alokasi Gudang</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {forecast.total_shipped > 0
                  ? `${forecast.total_shipped.toLocaleString()} pcs telah dialokasikan`
                  : 'Menunggu proses shipment'}
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                currentStep >= 3
                  ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Truck
                  className={`w-4 h-4 ${
                    currentStep >= 3 ? 'text-indigo-600' : 'text-slate-300'
                  }`}
                />
                <span className="font-bold">3. Pengiriman DC</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Armada logistik dalam perjalanan ke DC.
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                currentStep >= 4
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    currentStep >= 4 ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className="font-bold">4. Diterima di DC</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {forecast.status === 'RECEIVED'
                  ? 'Diterima lengkap dan terverifikasi'
                  : 'Menunggu konfirmasi receiving'}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Mini Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Forecast
            </span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {forecast.total_qty.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">PCS</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Terkirim (Shipped)
            </span>
            <span className="text-xl font-bold text-sky-800 tabular-nums">
              {forecast.total_shipped.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">PCS</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Outstanding (Sisa)
            </span>
            <span className="text-xl font-bold text-amber-700 tabular-nums">
              {(forecast.outstanding_qty ?? Math.max(0, forecast.total_qty - forecast.total_shipped)).toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">PCS</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Fulfillment Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700 tabular-nums">
                {fulfillmentRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${fulfillmentRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Item Produk Kurma ({forecast.items?.length || 0} SKU)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Nama Produk</th>
                  <th className="py-2.5 px-4 text-right">Qty Forecast</th>
                  <th className="py-2.5 px-4 text-right">Qty Shipped</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4 text-center">Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {forecast.items && forecast.items.length > 0 ? (
                  forecast.items.map((item, idx) => {
                    const outstanding = Math.max(0, item.qty_forecast - item.qty_shipped);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.product_name}
                          {item.notes && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                          {item.qty_forecast.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                          {item.qty_shipped.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-700 tabular-nums">
                          {outstanding.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-medium">
                          {item.unit}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Tidak ada detail item produk
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-slate-700">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 tabular-nums">
                    {forecast.total_qty.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 tabular-nums">
                    {forecast.total_shipped.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 tabular-nums">
                    {(forecast.outstanding_qty ?? Math.max(0, forecast.total_qty - forecast.total_shipped)).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">PCS</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
