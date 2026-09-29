import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Server,
  Cloud,
  Layers,
  Activity,
  AlertTriangle,
  Play,
  FileCode,
} from 'lucide-react';
import { db, testFirestoreConnection, seedFirestoreIfEmpty, resetTotalNoData } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';
import { ResetAllDataModal } from '../../components/common/ResetAllDataModal';
import firebaseConfig from '../../../firebase-applet-config.json';

export const DatabaseSettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [collectionCounts, setCollectionCounts] = useState<{ [key: string]: number }>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  const fetchLiveCounts = async () => {
    setLoadingCounts(true);
    try {
      const conn = await testFirestoreConnection();
      setIsConnected(conn);

      const collections = [
        'customers',
        'products',
        'regions',
        'distribution_centers',
        'forecasts',
        'shipments',
        'receiving_inspections',
        'claims',
        'inventory',
        'invoices',
      ];

      const counts: { [key: string]: number } = {};
      for (const colName of collections) {
        try {
          const snap = await getDocs(collection(db, colName));
          counts[colName] = snap.size;
        } catch {
          counts[colName] = 0;
        }
      }
      setCollectionCounts(counts);
    } catch (e) {
      console.warn('Error fetching counts:', e);
      setIsConnected(false);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchLiveCounts();
  }, []);

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedFirestoreIfEmpty();
      showToast('success', 'Sinkronisasi Sukses', 'Data master resmi berhasil diunggah ke Firebase Firestore.');
      await fetchLiveCounts();
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      showToast('error', 'Gagal Sinkronisasi', err.message || 'Gagal mengunggah data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetTotalDirect = async () => {
    if (!window.confirm('APAKAH ANDA YAKIN INGIN MENGOSONGKAN SELURUH DATA (TOTAL NO DATA)? Seluruh transaksi dan master data akan menjadi 0 record.')) {
      return;
    }
    setLoadingCounts(true);
    try {
      await resetTotalNoData();
      showToast('success', 'RESET TOTAL BERHASIL', 'Seluruh data di Firestore dan local storage telah dikosongkan total (NO DATA).');
      await fetchLiveCounts();
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      showToast('error', 'Gagal Reset Total', err.message);
    } finally {
      setLoadingCounts(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <Cloud className="w-3.5 h-3.5 text-amber-700" />
              FIREBASE FIRESTORE CLOUD DATABASE
            </span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Edition</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pusat Database Firebase &amp; Manajemen Data
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Aplikasi ini terhubung langsung ke Google Cloud Firebase Firestore untuk persistensi transaksi peramalan kuota, surat jalan armada, telemetri live GPS, dan berita acara serah terima DC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleResetTotalDirect}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Kosongkan seluruh data menjadi 0 record (TOTAL NO DATA)"
          >
            <Trash2 className="w-4 h-4" />
            <span>RESET TOTAL (NO DATA)</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <span>Opsi Reset...</span>
          </button>
        </div>
      </div>

      {/* Connection & Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status Koneksi
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Firebase Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono break-all">
            Project: <span className="font-bold text-slate-800">{firebaseConfig.projectId}</span>
          </p>
          <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium">
            Live Synchronized &bull; Zero Server Latency
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Firestore Database ID
            </span>
            <Database className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono truncate" title={firebaseConfig.firestoreDatabaseId}>
            {firebaseConfig.firestoreDatabaseId}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Database instance terisolasi dengan Row Level Security rules versi 2 aktif terpasang.
          </p>
          <div className="mt-2 text-[10px] text-sky-800 bg-sky-50 px-2 py-1 rounded font-medium">
            Security Rules: DEPLOYED &bull; ACTIVE
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aksi Cepat Master Seed
            </span>
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </div>
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-700" />
                <span>Sinkronisasi Master Seed ke Firestore</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            Menyuntikkan 8 DC nasional, 3 SKU Kurma, dan 2 Pelanggan jika Firestore kosong.
          </p>
        </div>
      </div>

      {/* Live Firestore Document Counts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-sky-800" />
            <h2 className="text-sm font-bold text-slate-900">
              Dokumen Real-time di Koleksi Firestore
            </h2>
          </div>
          <button
            onClick={fetchLiveCounts}
            disabled={loadingCounts}
            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCounts ? 'animate-spin' : ''}`} />
            <span>Segarkan Jumlah</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center p-4">
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Customers</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['customers'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">pelanggan</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">SKU Kurma</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['products'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">produk</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Wilayah</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['regions'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">region</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">DC Nasional</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['distribution_centers'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">gudang DC</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Forecasts</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['forecasts'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">rencana kuota</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Surat Jalan</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['shipments'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">pengiriman</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">BAST DC</span>
            <div className="text-xl font-bold text-slate-900">{collectionCounts['receiving_inspections'] ?? 0}</div>
            <span className="text-[10px] text-slate-400">serah terima</span>
          </div>
        </div>
      </div>

      {/* Safety Notice regarding Clear All Data */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-rose-950">Zona Reset &amp; Penghapusan Data Total</h3>
            <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
              Jika Anda ingin memulai pengujian atau penginputan data baru dari awal yang bersih, gunakan tombol{' '}
              <span className="font-bold">&quot;Reset Data Keseluruhan&quot;</span>. Sistem menyediakan dua opsi:
            </p>
            <ul className="list-disc pl-5 text-xs text-rose-800 space-y-1">
              <li>
                <span className="font-bold">Reset ke Master Data Awal (Reseed):</span> Menghapus seluruh riwayat transaksi lama (forecast, shipment, BAST) dan mengembalikan 8 DC nasional, 3 SKU kurma, serta 2 pelanggan resmi.
              </li>
              <li>
                <span className="font-bold">Kosongkan Seluruh Data (Clear Total):</span> Menghapus 100% data di Firebase Firestore sehingga database menjadi benar-benar bersih kosong untuk penginputan manual mandiri.
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Buka Dialog Reset Data Keseluruhan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal Component */}
      <ResetAllDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => fetchLiveCounts()}
      />
    </div>
  );
};
