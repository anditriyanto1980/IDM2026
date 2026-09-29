import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCustomers } from '../../services/customerService';
import { getProducts } from '../../services/productService';
import { getRegions } from '../../services/regionService';
import { getDistributionCenters } from '../../services/dcService';
import { fetchActivityLogs } from '../../services/auditLogService';
import { getForecasts } from '../../services/forecastService';
import { getShipments } from '../../services/shipmentService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Customer, Product, Region, DistributionCenter, ActivityLog, Forecast, Shipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ForecastStatusBadge } from '../../components/forecast/ForecastStatusBadge';
import { ShipmentStatusBadge } from '../../components/shipment/ShipmentStatusBadge';
import {
  Users,
  Package,
  MapPin,
  Building2,
  Database,
  ShieldCheck,
  Server,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Boxes,
  PackageCheck,
  Truck,
  Navigation,
  FileBarChart,
  Compass,
  Layers,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { NavItemKey } from '../../components/layout/Sidebar';
import { ManagementDashboardView } from './ManagementDashboardView';

interface DashboardPageProps {
  onNavigate: (key: NavItemKey) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboardMode, setDashboardMode] = useState<'OPERATIONAL' | 'MANAGEMENT'>(
    user?.role === 'MANAGEMENT' ? 'MANAGEMENT' : 'OPERATIONAL'
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, pList, rList, dList, fList, sList, logList] = await Promise.all([
        getCustomers(),
        getProducts(),
        getRegions(),
        getDistributionCenters(),
        getForecasts({}),
        getShipments({}),
        fetchActivityLogs(6),
      ]);
      setCustomers(cList);
      setProducts(pList);
      setRegions(rList);
      setDcs(dList);
      setForecasts(fList);
      setShipments(sList);
      setLogs(logList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalForecastQty = forecasts.reduce((sum, f) => sum + (f.total_qty || 0), 0);
  const totalShippedQty = shipments.reduce((sum, s) => sum + (s.total_qty || 0), 0);
  const totalOutstandingQty = Math.max(0, totalForecastQty - totalShippedQty);
  const fulfillmentRate =
    totalForecastQty > 0 ? Math.min(100, Math.round((totalShippedQty / totalForecastQty) * 100)) : 0;
  const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-800 uppercase tracking-wider mb-1">
            Sistem Operasional Distribusi Kurma
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            IDM Tracking System
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pusat kendali rantai pasok kurma Akram nasional: dari alokasi forecast, penerbitan Surat Jalan, hingga pemantauan armada menuju DC Indomarco & Indogrosir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigate('control-tower')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            <span>Control Tower</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Stok Gudang</span>
          </button>
          <button
            onClick={() => onNavigate('forecast')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Forecast</span>
          </button>
          <button
            onClick={() => onNavigate('shipment')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Surat Jalan</span>
          </button>
          <button
            onClick={() => onNavigate('tracking')}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Tracking</span>
          </button>
          <button
            onClick={() => onNavigate('receiving')}
            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>DC Receiving &amp; BAST</span>
          </button>
          <button
            onClick={() => onNavigate('invoices')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Faktur Ongkir</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileBarChart className="w-3.5 h-3.5 text-amber-300" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => onNavigate('testing')}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Uji Keseluruhan 10 Tahap & Sertifikasi Keamanan"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Testing &amp; QA</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDashboardMode('OPERATIONAL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dashboardMode === 'OPERATIONAL'
                ? 'bg-sky-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Dashboard Operasional Distribusi
          </button>
          <button
            onClick={() => setDashboardMode('MANAGEMENT')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              dashboardMode === 'MANAGEMENT'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dashboard Manajemen &amp; Realisasi Kuota</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          {dashboardMode === 'MANAGEMENT' ? 'Mode Analitik Eksekutif Aktif' : 'Mode Operasional Harian Aktif'}
        </span>
      </div>

      {dashboardMode === 'MANAGEMENT' ? (
        <ManagementDashboardView
          forecasts={forecasts}
          shipments={shipments}
          customers={customers}
          dcs={dcs}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          {/* KPI Cards (Operational & Logistic metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forecast Volume */}
        <div
          onClick={() => onNavigate('forecast')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Forecast
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center group-hover:bg-sky-800 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '-' : totalForecastQty.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">PCS</span>
          </div>
          <p className="text-[11px] text-sky-800 font-medium mt-1 flex items-center gap-1">
            <span>{forecasts.length} dokumen alokasi</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Armada In-Transit (Phase 3 Core) */}
        <div
          onClick={() => onNavigate('shipment')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Armada In-Transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center group-hover:bg-sky-800 group-hover:text-white transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-900 tabular-nums">{loading ? '-' : inTransitCount}</span>
            <span className="text-xs text-slate-500 font-medium">Pengiriman Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total {shipments.length} Surat Jalan diterbitkan
          </p>
        </div>

        {/* Fulfillment Rate */}
        <div
          onClick={() => onNavigate('forecast')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fulfillment Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800 tabular-nums">
              {fulfillmentRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({totalShippedQty.toLocaleString('id-ID')} pcs)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${fulfillmentRate}%` }}
            />
          </div>
        </div>

        {/* Outstanding Volume */}
        <div
          onClick={() => onNavigate('forecast')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Outstanding (Sisa)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800 tabular-nums">
              {loading ? '-' : totalOutstandingQty.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">PCS</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending pengiriman gudang</p>
        </div>
      </div>

      {/* Row: Active Shipments / Surat Jalan (Phase 3 highlight) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Surat Jalan & Pengiriman Terkini</h2>
            <p className="text-[11px] text-slate-500">Aktivitas armada dan dokumen pengiriman menuju Distribution Center</p>
          </div>
          <button
            onClick={() => onNavigate('shipment')}
            className="text-xs text-sky-800 hover:text-sky-900 font-semibold flex items-center gap-1"
          >
            Buka Modul Shipment <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">No. Surat Jalan</th>
                <th className="py-2.5 px-4">Customer & DC Tujuan</th>
                <th className="py-2.5 px-4">Ekspedisi / Armada</th>
                <th className="py-2.5 px-4">Tgl Kirim / ETA</th>
                <th className="py-2.5 px-4 text-right">Volume</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Belum ada dokumen surat jalan. Silakan buka modul Shipment untuk menerbitkan surat jalan baru.
                  </td>
                </tr>
              ) : (
                shipments.slice(0, 4).map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onNavigate('shipment')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-800">
                      {s.shipment_number}
                      {s.forecast_number && (
                        <span className="text-[10px] text-slate-400 font-sans font-normal block">
                          Ref: {s.forecast_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {s.customer?.customer_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {s.dc?.dc_name} ({s.dc?.city})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <span>{s.transporter_name}</span>
                      {s.vehicle_plate_number && (
                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          ({s.vehicle_plate_number})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{s.shipment_date}</div>
                      <span className="text-[10px] text-slate-400">ETA: {s.estimated_arrival_date}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {s.total_qty.toLocaleString('id-ID')} PCS
                    </td>
                    <td className="py-3 px-4">
                      <ShipmentStatusBadge status={s.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row: Product & Customer Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Overview: 3 Produk Akram */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Product Overview</h2>
              <p className="text-[11px] text-slate-500">Katalog SKU utama kurma Akram</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-sky-800 hover:text-sky-900 font-medium flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {products.slice(0, 3).map((prod) => (
              <div key={prod.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded">
                      {prod.sku}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{prod.product_name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{prod.description || 'Kurma Akram Berkualitas'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-600">Satuan: {prod.unit}</div>
                  <div className="mt-1">
                    <StatusBadge isActive={prod.is_active} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Overview: Indogrosir & Indomarco */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Customer Overview</h2>
              <p className="text-[11px] text-slate-500">Prinsipal dan rantai distribusi retail/wholesale</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-sky-800 hover:text-sky-900 font-medium flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {customers.map((cust) => {
              const custDcs = dcs.filter((d) => d.customer_id === cust.id);
              return (
                <div key={cust.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                        {cust.customer_code}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{cust.customer_name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm line-clamp-1">{cust.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-800 tabular-nums">
                      {custDcs.length} Distribution Centers
                    </div>
                    <div className="mt-1">
                      <StatusBadge isActive={cust.is_active} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row: System Status & Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">System Status</h2>
          <p className="text-[11px] text-slate-500 mb-4">Indikator kesiapan operasional sistem</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-700">Database</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-medium text-slate-700">Authentication</span>
              </div>
              <span className="text-xs font-semibold text-sky-700">
                Active ({user?.role})
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Environment</span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700">
                Production-Ready
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Engine Mode: {isSupabaseConfigured ? 'Supabase Live PostgreSQL' : 'Local Storage Sync (Ready)'}
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Audit Trail (Activity Logs)</h2>
              <p className="text-[11px] text-slate-500">Pencatatan riwayat perubahan master data, forecast & pengiriman</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-sky-800 hover:text-sky-900 font-medium flex items-center gap-1"
            >
              Lihat Log Lengkap <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">{log.description}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Module: {log.module} · User: {log.user_email || log.user_id}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
