import React, { useState } from 'react';
import { Sidebar, NavItemKey } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { ToastContainer } from '../components/common/ToastContainer';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { RegionsPage } from '../pages/regions/RegionsPage';
import { DistributionCentersPage } from '../pages/distribution-centers/DistributionCentersPage';
import { UsersPage } from '../pages/users/UsersPage';
import { AuditLogsPage } from '../pages/audit-logs/AuditLogsPage';
import { ComingSoonPage } from '../pages/coming-soon/ComingSoonPage';
import { DatabaseSettingsPage } from '../pages/settings/DatabaseSettingsPage';
import { ForecastPage } from '../pages/forecast/ForecastPage';
import { ShipmentsPage } from '../pages/shipment/ShipmentsPage';
import { TrackingPage } from '../pages/tracking/TrackingPage';
import { ReceivingPage } from '../pages/receiving/ReceivingPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { ClaimsPage } from '../pages/claims/ClaimsPage';
import { ControlTowerPage } from '../pages/control-tower/ControlTowerPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { InvoicesPage } from '../pages/invoices/InvoicesPage';
import { SystemTestingPage } from '../pages/testing/SystemTestingPage';
import { UserGuidePdfPage } from '../pages/guide/UserGuidePdfPage';

export const AppLayout: React.FC = () => {
  const [currentKey, setCurrentKey] = useState<NavItemKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getBreadcrumb = (key: NavItemKey): string[] => {
    switch (key) {
      case 'dashboard':
        return ['Sistem', 'Dashboard Utama'];
      case 'control-tower':
        return ['Operasional', 'Control Tower & AI Copilot'];
      case 'customers':
        return ['Master Data', 'Customers'];
      case 'products':
        return ['Master Data', 'Products'];
      case 'regions':
        return ['Master Data', 'Regions'];
      case 'dcs':
        return ['Master Data', 'Distribution Centers'];
      case 'users':
        return ['Pengaturan', 'Users & Roles'];
      case 'logs':
        return ['Audit', 'Activity Logs'];
      case 'settings':
        return ['Konfigurasi', 'Database & SQL'];
      case 'forecast':
        return ['Operasional', 'Forecast Management'];
      case 'shipment':
        return ['Operasional', 'Shipment & Surat Jalan'];
      case 'tracking':
        return ['Operasional', 'Live Tracking & Armada'];
      case 'receiving':
        return ['Operasional', 'DC Receiving & BAST'];
      case 'inventory':
        return ['Operasional', 'Stok Multi-Gudang & Mutasi'];
      case 'reports':
        return ['Laporan', 'Executive Reports & Analytics'];
      case 'claims':
        return ['Operasional', 'Klaim Kerusakan & Retur BAST'];
      case 'invoices':
        return ['Operasional', 'Faktur Tagihan Ekspedisi & Dispatch'];
      case 'testing':
        return ['Audit & QA', 'System Testing & Security Certification (Tahap 10)'];
      default:
        return ['Sistem', 'Dashboard'];
    }
  };

  const renderContent = () => {
    switch (currentKey) {
      case 'dashboard':
        return <DashboardPage onNavigate={(key) => setCurrentKey(key)} />;
      case 'control-tower':
        return <ControlTowerPage />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'regions':
        return <RegionsPage />;
      case 'dcs':
        return <DistributionCentersPage />;
      case 'users':
        return <UsersPage />;
      case 'logs':
        return <AuditLogsPage />;
      case 'settings':
        return <DatabaseSettingsPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'shipment':
        return <ShipmentsPage />;
      case 'tracking':
        return <TrackingPage />;
      case 'receiving':
        return <ReceivingPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'claims':
        return <ClaimsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'testing':
        return <SystemTestingPage />;
      case 'guide':
        return <UserGuidePdfPage />;
      default:
        return <DashboardPage onNavigate={(key) => setCurrentKey(key)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row font-sans">
      {/* Sidebar */}
      <Sidebar
        currentKey={currentKey}
        onSelect={(key) => setCurrentKey(key)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          currentRouteTitle={currentKey}
          currentBreadcrumb={getBreadcrumb(currentKey)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenDbSettings={() => setCurrentKey('settings')}
          onNavigate={(key) => setCurrentKey(key)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Toasts */}
      <ToastContainer />
    </div>
  );
};
