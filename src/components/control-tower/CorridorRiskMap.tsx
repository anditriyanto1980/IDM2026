import React, { useState } from 'react';
import { LogisticsCorridor } from '../../types';
import { Truck, AlertTriangle, CheckCircle2, Clock, MapPin, ChevronRight, Info } from 'lucide-react';

interface CorridorRiskMapProps {
  corridors: LogisticsCorridor[];
}

export const CorridorRiskMap: React.FC<CorridorRiskMapProps> = ({ corridors }) => {
  const [selectedCorridor, setSelectedCorridor] = useState<LogisticsCorridor>(corridors[0] || null);

  const getRiskBadge = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Risiko Tinggi
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Waspada
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Jalur Lancar
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-700" />
            Pemantauan 6 Koridor Logistik Nasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jalur distribusi armada truk dari Hub Cikarang, Marunda & Surabaya menuju 8 Distribution Center Indomarco & Indogrosir
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span> Keterlambatan
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span> Antrean Pelabuhan
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left Column: List of Corridors */}
        <div className="lg:col-span-5 p-4 space-y-2.5 max-h-[460px] overflow-y-auto">
          {corridors.map((c) => {
            const isSelected = selectedCorridor?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCorridor(c)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {c.code}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{c.name}</h3>
                  </div>
                  {getRiskBadge(c.corridor_risk_level)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <strong>{c.active_trucks_count}</strong> armada jalan
                  </span>
                  <span>{c.distance_km} km</span>
                  <span>~{c.normal_transit_hours} jam</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Corridor Telemetry */}
        <div className="lg:col-span-7 p-6 bg-slate-50/30 flex flex-col justify-between">
          {selectedCorridor ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider mb-1">
                    Detail Telemetri Jalur
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {selectedCorridor.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hub Asal: <strong className="text-slate-700">{selectedCorridor.origin_hub}</strong> &rarr; Wilayah Tujuan:{' '}
                    <strong className="text-slate-700">{selectedCorridor.destination_region}</strong>
                  </p>
                </div>
                {getRiskBadge(selectedCorridor.corridor_risk_level)}
              </div>

              {/* Corridor Route Visualizer */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Rute Utama Tol &amp; Penyeberangan:</span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedCorridor.distance_km} KM</span>
                </div>
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono">
                  {selectedCorridor.toll_route}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 bg-slate-100 rounded-lg p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Armada Aktif</span>
                    <span className="text-base font-bold text-slate-900">{selectedCorridor.active_trucks_count} Truk</span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-lg p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Truk Tertunda</span>
                    <span className={`text-base font-bold ${selectedCorridor.delayed_trucks_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {selectedCorridor.delayed_trucks_count} Truk
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-lg p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time Normal</span>
                    <span className="text-base font-bold text-slate-900">{selectedCorridor.normal_transit_hours} Jam</span>
                  </div>
                </div>
              </div>

              {/* Status Note & Condition */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block mb-0.5">
                      Laporan Kondisi Koridor Terkini:
                    </span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {selectedCorridor.status_note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Covered DCs */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Distribution Center yang Dilayani Jalur Ini:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCorridor.covered_dcs.map((dc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                    >
                      {dc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Pilih salah satu koridor logistik untuk melihat kondisi telemetri jalur.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
