import React from 'react';
import { NavItemKey } from '../../components/layout/Sidebar';
import { TrendingUp, Truck, Navigation, PackageCheck, FileBarChart, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ComingSoonPageProps {
  moduleKey: NavItemKey;
  onBackToDashboard: () => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ moduleKey, onBackToDashboard }) => {
  const moduleDetails: Record<
    string,
    { title: string; subtitle: string; icon: React.ReactNode; phase: string; points: string[] }
  > = {
    forecast: {
      title: 'Forecast Import & Management',
      subtitle: 'Modul sentral import forecast kebutuhan produk Akram per customer, periode, dan target delivery.',
      icon: <TrendingUp className="w-8 h-8 text-sky-600" />,
      phase: 'Tahap Berikutnya: PHASE 2',
      points: [
        'Import Forecast Excel (Customer, Periode, Tanggal Forecast, DC, Wilayah, SKU, Qty Forecast, Target Delivery).',
        'Penomoran otomatis: FORECAST-202609-0001.',
        'Kalkulasi alokasi vs outstanding per SKU Akram Khalas 200g, Share Pack, dan Khalas Rigid.',
        'Status otomatis: FORECAST, PLANNED, PARTIAL, IN TRANSIT, RECEIVED, OVERDUE.',
      ],
    },
    shipment: {
      title: 'Shipment Allocation & Planning',
      subtitle: 'Perencanaan pengiriman parsial/penuh berdasarkan kuota forecast yang disetujui.',
      icon: <Truck className="w-8 h-8 text-emerald-600" />,
      phase: 'Direncanakan pada PHASE 3',
      points: [
        'Forecast tidak otomatis dianggap barang terkirim (Aturan audit trail tanpa angka berdiri sendiri).',
        'Pembuatan Shipment ID unik (contoh: SHP-20260925-0001).',
        'Pencatatan No Surat Jalan, tanggal kirim, target terima, dan armada logistik.',
      ],
    },
    tracking: {
      title: 'Live Shipment Tracking & Milestones',
      subtitle: 'Monitoring timeline posisi pengiriman dari gudang pusat hingga DC nasional.',
      icon: <Navigation className="w-8 h-8 text-indigo-600" />,
      phase: 'Direncanakan pada PHASE 3',
      points: [
        'Milestone visual: Forecast Created → Planned → Allocation → Picking → Loading → Shipped → In Transit → Arrived DC → Received.',
        'Tracking realtime tanpa perlu konfirmasi manual antar divisi.',
      ],
    },
    receiving: {
      title: 'DC Receiving & Verification',
      subtitle: 'Verifikasi fisik barang tiba di Distribution Center Indogrosir dan Indomarco.',
      icon: <PackageCheck className="w-8 h-8 text-teal-600" />,
      phase: 'Direncanakan pada PHASE 4',
      points: [
        'Pencatatan Qty Good & Qty Damaged saat bongkar muat di DC.',
        'Upload bukti Berita Acara Serah Terima (BAST) dan foto surat jalan bertanda tangan.',
      ],
    },
    reports: {
      title: 'Executive Logistics & Fulfillment Reports',
      subtitle: 'Laporan kinerja rantai pasok dan persentase forecast fulfillment nasional.',
      icon: <FileBarChart className="w-8 h-8 text-amber-600" />,
      phase: 'Direncanakan pada PHASE 4',
      points: [
        'Forecast Fulfillment Gauge (Forecast, Shipped, Received, Outstanding).',
        'Analisis performa DC dan ketepatan waktu pengiriman antar wilayah.',
      ],
    },
  };

  const current = moduleDetails[moduleKey] || {
    title: 'Modul Segera Hadir',
    subtitle: 'Fitur ini dijadwalkan pada fase pengembangan berikutnya sesuai dokumen PRD.',
    icon: <TrendingUp className="w-8 h-8 text-slate-500" />,
    phase: 'Coming Soon',
    points: ['Pengembangan modular bertahap sesuai prioritas bisnis.'],
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs mb-4">
          {current.icon}
        </div>

        <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-md mb-3">
          {current.phase}
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed mb-6">
          {current.subtitle}
        </p>

        {/* Feature roadmap points */}
        <div className="text-left bg-slate-50 border border-slate-200/80 rounded-xl p-5 mb-6 max-w-xl mx-auto">
          <div className="text-xs font-semibold text-slate-800 mb-3 uppercase tracking-wider">
            Cakupan Spesifikasi PRD:
          </div>
          <div className="space-y-2.5">
            {current.points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard Utama</span>
        </button>
      </div>
    </div>
  );
};
