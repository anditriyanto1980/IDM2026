import React, { useState, useEffect } from 'react';
import {
  LogisticsCorridor,
  ControlTowerKPI,
  WarehouseInventory,
  Shipment,
  DiscrepancyClaim,
  AiLogisticsAdvice,
} from '../../types';
import {
  getLogisticsCorridors,
  getControlTowerKPIs,
  getTransporterSlaScores,
  TransporterSlaScore,
} from '../../services/controlTowerService';
import { getWarehouseInventory } from '../../services/inventoryService';
import { getShipments } from '../../services/shipmentService';
import { getClaims } from '../../services/claimService';
import { getAiLogisticsAdvices } from '../../services/aiControlTowerService';
import { CorridorRiskMap } from '../../components/control-tower/CorridorRiskMap';
import { AiCopilotModal } from '../../components/control-tower/AiCopilotModal';
import {
  Compass,
  Sparkles,
  Bot,
  Truck,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Boxes,
} from 'lucide-react';

export const ControlTowerPage: React.FC = () => {
  const [corridors, setCorridors] = useState<LogisticsCorridor[]>([]);
  const [kpis, setKpis] = useState<ControlTowerKPI | null>(null);
  const [slaScores, setSlaScores] = useState<TransporterSlaScore[]>([]);
  const [advices, setAdvices] = useState<AiLogisticsAdvice[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [corridorList, kpiData, slaList, invList, shpList, clmList] = await Promise.all([
        getLogisticsCorridors(),
        getControlTowerKPIs(),
        getTransporterSlaScores(),
        getWarehouseInventory(),
        getShipments(),
        getClaims(),
      ]);

      setCorridors(corridorList);
      setKpis(kpiData);
      setSlaScores(slaList);
      setInventory(invList);
      setShipments(shpList);

      const aiAdvices = await getAiLogisticsAdvices(kpiData, invList, shpList, clmList);
      setAdvices(aiAdvices);
    } catch (e) {
      console.error('Error loading Control Tower data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              <Compass className="w-3.5 h-3.5 text-sky-700 animate-pulse" />
              LIVE LOGISTICS CONTROL TOWER
            </span>
            <span className="text-xs text-slate-500 font-medium">Fase 6 Enterprise Command</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pusat Kendali Rantai Pasok Nasional (Control Tower)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Visibilitas end-to-end multi-koridor logistik: dari kesiapan stok gudang pusat, armada on the road, hingga SLA pemeriksaan fisik di 8 DC Indomarco & Indogrosir.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>AI Supply Chain Copilot</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh Telemetri"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Active Trucks */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Armada Berjalan</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis.active_shipments_in_transit} <span className="text-sm font-normal text-slate-500">Truk</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Muatan: <strong>{kpis.total_boxes_on_the_road.toLocaleString('id-ID')} pcs</strong> kurma
            </div>
          </div>

          {/* Card 2: National OTIF */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">National OTIF</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">
              {kpis.national_otif_rate}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Target minimum SLA: <strong>95%</strong>
            </div>
          </div>

          {/* Card 3: Central ATP Stock */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Stok Bebas (ATP)</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis.central_warehouse_atp_boxes.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">pcs</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Siap dialokasikan ke forecast baru
            </div>
          </div>

          {/* Card 4: Avg DC Turnaround */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Waktu Bongkar DC</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis.avg_dc_receiving_hours} <span className="text-sm font-normal text-slate-500">Jam</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Dari truk tiba hingga BAST terbit
            </div>
          </div>
        </div>
      )}

      {/* AI Supply Chain Intelligence Widget */}
      <div className="bg-gradient-to-br from-indigo-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Akram AI Supply Chain Optimizer &amp; Early Warning System
              </h2>
              <p className="text-xs text-indigo-200">
                Peringatan dini cerdas berbasis analisis risiko musiman Ramadhan, kemacetan rute tol, dan proteksi margin.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white text-xs font-medium rounded-lg transition-colors border border-white/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-300" />
            <span>Buka Obrolan AI Copilot</span>
          </button>
        </div>

        {/* 3 AI Tactical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advices.map((adv) => (
            <div
              key={adv.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 hover:border-white/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {adv.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    adv.urgency === 'HIGH' ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-500/30 text-amber-200'
                  }`}>
                    {adv.urgency}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white mb-2 leading-snug">
                  {adv.title}
                </h3>
                <p className="text-[11px] text-indigo-100/80 leading-relaxed mb-3">
                  {adv.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 text-[10px] text-emerald-200">
                &bull; {adv.estimated_impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corridor Map Component */}
      <CorridorRiskMap corridors={corridors} />

      {/* Transporter SLA Scorecard Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-700" />
              Transporter SLA &amp; Kinerja Ekspedisi Logistik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat ketepatan waktu pengantaran (OTIF), rasio bebas kerusakan barang, dan nilai klaim per vendor logistik
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Standar SLA Vendor: Min. 95% On-Time
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nama Ekspedisi</th>
                <th className="px-6 py-3 text-center">Total Trip</th>
                <th className="px-6 py-3 text-center">Tepat Waktu</th>
                <th className="px-6 py-3 text-center">OTIF Rate</th>
                <th className="px-6 py-3 text-center">Damage-Free Rate</th>
                <th className="px-6 py-3 text-right">Total Klaim Kerusakan</th>
                <th className="px-6 py-3 text-center">Grade Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slaScores.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3 font-bold text-slate-900">
                    {s.transporter_name}
                  </td>
                  <td className="px-6 py-3 text-center font-medium text-slate-700">
                    {s.total_trips}
                  </td>
                  <td className="px-6 py-3 text-center font-medium text-slate-700">
                    {s.on_time_trips}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {s.otif_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="font-semibold text-slate-800">
                      {s.damage_free_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">
                    {s.total_claims_amount > 0 ? (
                      <span className="text-rose-600 font-semibold">
                        Rp {s.total_claims_amount.toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <span className="text-slate-400">Rp 0</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-sky-100 text-sky-800 border border-sky-200">
                      {s.rating_grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Copilot Modal */}
      {kpis && (
        <AiCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          kpis={kpis}
          inventory={inventory}
          shipments={shipments}
        />
      )}
    </div>
  );
};
