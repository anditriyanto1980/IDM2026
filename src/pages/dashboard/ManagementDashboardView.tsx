import React, { useMemo } from 'react';
import {
  Forecast,
  Shipment,
  ReceivingInspection,
  DiscrepancyClaim,
  Customer,
  DistributionCenter,
} from '../../types';
import { NavItemKey } from '../../components/layout/Sidebar';
import {
  TrendingUp,
  Building2,
  PackageCheck,
  AlertTriangle,
  Award,
  DollarSign,
  ArrowRight,
  Boxes,
  Truck,
  CheckCircle2,
  BarChart3,
  Percent,
} from 'lucide-react';

interface ManagementDashboardViewProps {
  forecasts: Forecast[];
  shipments: Shipment[];
  customers: Customer[];
  dcs: DistributionCenter[];
  onNavigate: (route: NavItemKey) => void;
}

export const ManagementDashboardView: React.FC<ManagementDashboardViewProps> = ({
  forecasts,
  shipments,
  customers,
  dcs,
  onNavigate,
}) => {
  // Aggregate Calculations
  const totalForecastVolume = useMemo(
    () => forecasts.reduce((sum, f) => sum + (f.total_qty || 0), 0),
    [forecasts]
  );
  const totalShippedVolume = useMemo(
    () => shipments.reduce((sum, s) => sum + (s.total_qty || 0), 0),
    [shipments]
  );
  const totalOutstandingVolume = Math.max(0, totalForecastVolume - totalShippedVolume);
  const fulfillmentRate =
    totalForecastVolume > 0 ? Math.min(100, Math.round((totalShippedVolume / totalForecastVolume) * 100)) : 0;

  // Estimated Financials (Rp 25.000 average wholesale price per pack)
  const avgPackPrice = 25000;
  const estimatedTotalForecastValue = totalForecastVolume * avgPackPrice;
  const estimatedShippedValue = totalShippedVolume * avgPackPrice;

  // Customer Comparative Data (Indogrosir vs Indomarco)
  const customerStats = useMemo(() => {
    return customers.map((c) => {
      const custForecasts = forecasts.filter((f) => f.customer_id === c.id);
      const custShipments = shipments.filter((s) => s.customer_id === c.id);

      const fQty = custForecasts.reduce((sum, f) => sum + (f.total_qty || 0), 0);
      const sQty = custShipments.reduce((sum, s) => sum + (s.total_qty || 0), 0);
      const outQty = Math.max(0, fQty - sQty);
      const rate = fQty > 0 ? Math.min(100, Math.round((sQty / fQty) * 100)) : 0;

      return {
        customer: c,
        forecastQty: fQty,
        shippedQty: sQty,
        outstandingQty: outQty,
        fulfillmentRate: rate,
      };
    });
  }, [customers, forecasts, shipments]);

  // DC Performance Leaderboard
  const dcLeaderboard = useMemo(() => {
    return dcs
      .map((dc) => {
        const dcForecasts = forecasts.filter((f) => f.dc_id === dc.id);
        const dcShipments = shipments.filter((s) => s.dc_id === dc.id);

        const fQty = dcForecasts.reduce((sum, f) => sum + (f.total_qty || 0), 0);
        const sQty = dcShipments.reduce((sum, s) => sum + (s.total_qty || 0), 0);
        const rate = fQty > 0 ? Math.min(100, Math.round((sQty / fQty) * 100)) : 0;

        let rankTier: 'EXCELLENT' | 'ON_TRACK' | 'ATTENTION' = 'ON_TRACK';
        if (rate >= 90) rankTier = 'EXCELLENT';
        else if (rate < 60) rankTier = 'ATTENTION';

        return {
          dc,
          forecastQty: fQty,
          shippedQty: sQty,
          fulfillmentRate: rate,
          rankTier,
        };
      })
      .sort((a, b) => b.fulfillmentRate - a.fulfillmentRate);
  }, [dcs, forecasts, shipments]);

  return (
    <div className="space-y-6">
      {/* Executive Financial & Fulfillment Gauge Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
              Executive Management Overview
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Realisasi Pemenuhan Kuota Kurma Akram Nasional
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ringkasan komprehensif alokasi rantai pasok untuk Direksi &amp; Manajemen: perbandingan performa Indomarco vs Indogrosir, estimasi nilai kargo terdistribusi, dan mitigasi bottleneck DC.
            </p>
          </div>

          {/* Large Gauge Counter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex items-center gap-6 shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                National Fulfillment Rate
              </span>
              <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                {fulfillmentRate}%
              </div>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {totalShippedVolume.toLocaleString('id-ID')} / {totalForecastVolume.toLocaleString('id-ID')} pcs
              </span>
            </div>

            <div className="w-px h-12 bg-white/20"></div>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Estimasi Nilai Terkirim
              </span>
              <div className="text-2xl font-bold text-white tracking-tight">
                Rp {(estimatedShippedValue / 1000000000).toFixed(2)} M
              </div>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Dari target Rp {(estimatedTotalForecastValue / 1000000000).toFixed(2)} M
              </span>
            </div>
          </div>
        </div>

        {/* Macro Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Progress Alokasi Pengiriman Fisik vs Target Forecast</span>
            <span className="text-emerald-300 font-bold">{fulfillmentRate}% Realisasi</span>
          </div>
          <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${fulfillmentRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Customer Comparative Analysis Cards (Indogrosir vs Indomarco) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {customerStats.map((item) => (
          <div
            key={item.customer.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center font-bold text-sm">
                    {item.customer.customer_code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.customer.customer_name}</h3>
                    <span className="text-[11px] text-slate-500">{item.customer.description?.split('.')[0]}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {item.fulfillmentRate}% Realisasi
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3">
                <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Target Kuota
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {item.forecastQty.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">pcs</span>
                </div>
                <div className="bg-emerald-50/70 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                    Teralokasi
                  </span>
                  <span className="text-sm font-bold text-emerald-900">
                    {item.shippedQty.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">pcs</span>
                </div>
                <div className="bg-amber-50/70 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-0.5">
                    Outstanding
                  </span>
                  <span className="text-sm font-bold text-amber-900">
                    {item.outstandingQty.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-amber-700 block">pcs</span>
                </div>
              </div>

              {/* Mini progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Persentase Pemenuhan:</span>
                  <span className="font-semibold text-slate-700">{item.fulfillmentRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-800 h-full rounded-full transition-all"
                    style={{ width: `${item.fulfillmentRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => onNavigate('forecast')}
                className="text-xs font-semibold text-sky-800 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Rincian Forecast DC {item.customer.customer_name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DC Performance Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Leaderboard Kinerja 8 Distribution Center Nasional
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Peringkat DC berdasarkan persentase pemenuhan kuota forecast dan ketepatan penerimaan
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-sky-800 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Laporan Eksekutif Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-center">Rank</th>
                <th className="px-6 py-3">Distribution Center</th>
                <th className="px-6 py-3">Jaringan Ritel</th>
                <th className="px-6 py-3 text-right">Target Kuota</th>
                <th className="px-6 py-3 text-right">Terkirim Fisik</th>
                <th className="px-6 py-3 text-center">Realisasi (%)</th>
                <th className="px-6 py-3 text-center">Status Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dcLeaderboard.map((item, idx) => (
                <tr key={item.dc.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3 text-center font-bold text-slate-600">
                    {idx === 0 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold inline-flex items-center justify-center">
                        1
                      </span>
                    ) : idx === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold inline-flex items-center justify-center">
                        2
                      </span>
                    ) : idx === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold inline-flex items-center justify-center">
                        3
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-slate-900 block">{item.dc.dc_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.dc.dc_code} - {item.dc.city}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-700">
                    {item.dc.customer?.customer_name || 'Retail'}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">
                    {item.forecastQty.toLocaleString('id-ID')} pcs
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-700">
                    {item.shippedQty.toLocaleString('id-ID')} pcs
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {item.fulfillmentRate}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {item.rankTier === 'EXCELLENT' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        TOP PERFORMER
                      </span>
                    ) : item.rankTier === 'ON_TRACK' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        ON TRACK
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        NEEDS ATTENTION
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
