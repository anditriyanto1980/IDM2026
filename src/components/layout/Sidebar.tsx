import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Navigation,
  PackageCheck,
  FileBarChart,
  Users,
  Package,
  MapPin,
  Building2,
  UserCog,
  History,
  Database,
  X,
  Boxes,
  AlertCircle,
  Compass,
  Layers,
  Receipt,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export type NavItemKey =
  | 'dashboard'
  | 'control-tower'
  | 'forecast'
  | 'shipment'
  | 'tracking'
  | 'receiving'
  | 'inventory'
  | 'reports'
  | 'claims'
  | 'invoices'
  | 'customers'
  | 'products'
  | 'regions'
  | 'dcs'
  | 'users'
  | 'logs'
  | 'settings'
  | 'testing'
  | 'guide';

interface SidebarProps {
  currentKey: NavItemKey;
  onSelect: (key: NavItemKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentKey,
  onSelect,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const handleNavClick = (key: NavItemKey) => {
    onSelect(key);
    onCloseMobile();
  };

  const navItemClass = (key: NavItemKey) => {
    const isActive = currentKey === key;
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
      isActive
        ? 'bg-sky-800 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  const comingSoonClass = (key: NavItemKey) => {
    const isActive = currentKey === key;
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
      isActive
        ? 'bg-slate-800 text-white font-semibold'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
    }`;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-800 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Boxes className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
              IDM TRACKING
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Tracking System
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          aria-label="Tutup navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Operations */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operasional
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('control-tower')}
              className={navItemClass('control-tower')}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="font-semibold">Control Tower</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-900/60 text-emerald-300">
                AI
              </span>
            </button>

            <button
              onClick={() => handleNavClick('forecast')}
              className={navItemClass('forecast')}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Forecast</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('shipment')}
              className={navItemClass('shipment')}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Shipment</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('tracking')}
              className={navItemClass('tracking')}
            >
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 shrink-0" />
                <span>Tracking</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('receiving')}
              className={navItemClass('receiving')}
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4 shrink-0" />
                <span>Receiving</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('inventory')}
              className={navItemClass('inventory')}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Stok Gudang</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('reports')}
              className={navItemClass('reports')}
            >
              <div className="flex items-center gap-2.5">
                <FileBarChart className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('claims')}
              className={navItemClass('claims')}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Klaim &amp; Retur</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('invoices')}
              className={navItemClass('invoices')}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 shrink-0" />
                <span>Faktur &amp; Dispatch</span>
              </div>
            </button>
          </div>
        </div>

        {/* Master Data (Phase 1 Core) */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Master Data (Phase 1)
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('customers')}
              className={navItemClass('customers')}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Customers</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('products')}
              className={navItemClass('products')}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 shrink-0" />
                <span>Products</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('regions')}
              className={navItemClass('regions')}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Regions</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('dcs')}
              className={navItemClass('dcs')}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Distribution Centers</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('users')}
              className={navItemClass('users')}
            >
              <div className="flex items-center gap-2.5">
                <UserCog className="w-4 h-4 shrink-0" />
                <span>Users & Roles</span>
              </div>
            </button>
          </div>
        </div>

        {/* System & Audit Trail */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit & Integrasi
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('logs')}
              className={navItemClass('logs')}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 shrink-0" />
                <span>Activity Logs</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('settings')}
              className={navItemClass('settings')}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 shrink-0" />
                <span>Database & SQL</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('testing')}
              className={navItemClass('testing')}
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>System Testing & QA</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                T10
              </span>
            </button>

            <button
              onClick={() => handleNavClick('guide')}
              className={navItemClass('guide')}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Buku Panduan (PDF SOP)</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                PDF
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile Snippet */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center">
            {user?.role.slice(0, 2)}
          </div>
          <div className="overflow-hidden leading-tight">
            <div className="text-xs font-medium text-slate-800 truncate">{user?.email}</div>
            <div className="text-[10px] text-slate-500 font-mono">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
