import React, { useRef } from 'react';
import {
  Printer,
  Download,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Truck,
  Building2,
  Package,
  Layers,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Boxes,
  HelpCircle,
} from 'lucide-react';

export const UserGuidePdfPage: React.FC = () => {
  const guideRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar (Hidden on print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              <BookOpen className="w-3.5 h-3.5 text-sky-700" />
              DOKUMEN RESMI STANDAR OPERASIONAL (SOP)
            </span>
            <span className="text-xs text-slate-400 font-medium">Versi 1.0 &bull; Revisi 2026</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Buku Panduan Step-by-Step Penggunaan Aplikasi (PDF Ready)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Panduan komprehensif alur operasional rantai pasok dan distribusi Kurma Akram dari hulu ke hilir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh PDF Panduan</span>
          </button>
        </div>
      </div>

      {/* Instruction Tip for PDF saving (Hidden on print) */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 print:hidden">
        <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 leading-relaxed">
          <span className="font-bold">Tips Menyimpan Sebagai PDF:</span> Klik tombol{' '}
          <span className="font-semibold text-sky-950">&quot;Cetak / Unduh PDF Panduan&quot;</span> di atas, kemudian pada dialog print browser Anda, ubah pilihan{' '}
          <span className="font-bold">Destination / Tujuan</span> menjadi{' '}
          <span className="font-bold underline">&quot;Save as PDF&quot; (Simpan sebagai PDF)</span>, lalu klik Simpan. Dokumen ini telah diformat otomatis untuk tata letak kertas A4.
        </div>
      </div>

      {/* Main Printable Document Body */}
      <div
        ref={guideRef}
        className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:m-0 text-slate-800"
      >
        {/* Document Header / Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded bg-sky-900 text-white flex items-center justify-center font-bold text-sm">
                <Boxes className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="text-sm font-extrabold tracking-wider uppercase text-slate-900">
                PT AKRAM NIAGA NUSANTARA
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PANDUAN OPERASIONAL &amp; MANUAL PENGGUNA SISTEM
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Sistem Pelacakan &amp; Distribusi Nasional Kurma Akram (End-to-End Tahap 1 &ndash; 10)
            </p>
          </div>

          <div className="text-left sm:text-right text-[11px] font-mono text-slate-600 space-y-0.5 shrink-0 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div><span className="font-bold">No. Dokumen:</span> SOP-AKR-LOG-2026-V1</div>
            <div><span className="font-bold">Tanggal Terbit:</span> 25 September 2026</div>
            <div><span className="font-bold">Sifat:</span> Pedoman Kerja Resmi (SOP)</div>
            <div><span className="font-bold">Klasifikasi:</span> Confidential Internal</div>
          </div>
        </div>

        {/* Ringkasan Eksekutif & Diagram Alur */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            Alur Besar Operasional Rantai Pasok (Overview Rantai Pasok)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Aplikasi mengintegrasikan seluruh siklus hidup distribusi kurma, dimulai dari penyiapan Master Data, peramalan kebutuhan (*forecast*), penjadwalan armada truk pengiriman (*shipment*), pelacakan live GPS koridor jalan tol, serah terima berita acara DC (*BAST*), hingga pelaporan eksekutif manajemen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-semibold mb-6">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-800 font-mono block">LANGKAH 1</span>
              <div className="font-bold text-slate-900 mt-0.5">Master Data</div>
              <span className="text-[10px] text-slate-500 font-normal">Customer, SKU, 8 DC</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-800 font-mono block">LANGKAH 2</span>
              <div className="font-bold text-slate-900 mt-0.5">Forecast &amp; Excel</div>
              <span className="text-[10px] text-slate-500 font-normal">Alokasi &amp; Outstanding</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-800 font-mono block">LANGKAH 3</span>
              <div className="font-bold text-slate-900 mt-0.5">Surat Jalan</div>
              <span className="text-[10px] text-slate-500 font-normal">SJ-YYYYMM &amp; Ekspedisi</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-800 font-mono block">LANGKAH 4</span>
              <div className="font-bold text-slate-900 mt-0.5">Live Tracking</div>
              <span className="text-[10px] text-slate-500 font-normal">5 Milestone GPS Truk</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-800 font-mono block">LANGKAH 5</span>
              <div className="font-bold text-slate-900 mt-0.5">Receiving BAST</div>
              <span className="text-[10px] text-slate-500 font-normal">Inspeksi Baik/Rusak/Selisih</span>
            </div>
          </div>
        </section>

        {/* BAB 1: Tahap 1 - Master Data */}
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            Tahap 1: Penginputan &amp; Pemeliharaan Master Data
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Sebelum memulai transaksi operasional, pastikan data induk telah terdaftar dengan benar di modul Master Data:
          </p>

          <div className="space-y-3 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
                1. Master Customer (Pelanggan Grosir &amp; Ritel)
              </div>
              <p className="text-slate-600 pl-5 mb-1.5">
                Buka menu <span className="font-semibold text-slate-800">Master Data &rarr; Customers</span>. Pastikan 2 entitas pelanggan utama aktif:
              </p>
              <ul className="list-disc pl-9 text-slate-600 space-y-0.5">
                <li><span className="font-semibold">Indogrosir (Kode: IGR)</span> &mdash; PT Inti Cakrawala Citra (Jaringan perkulakan grosir).</li>
                <li><span className="font-semibold">Indomarco (Kode: IDM)</span> &mdash; PT Indomarco Prismatama (Jaringan ritel minimarket).</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
                2. Master Produk (3 SKU Kurma Akram)
              </div>
              <p className="text-slate-600 pl-5 mb-1.5">
                Buka menu <span className="font-semibold text-slate-800">Master Data &rarr; Products</span>. Pastikan 3 SKU resmi terdaftar:
              </p>
              <ul className="list-disc pl-9 text-slate-600 space-y-0.5">
                <li><span className="font-semibold">AKR-KHL-200</span>: Akram Khalas 200g (Pouch praktis kemasan satuan).</li>
                <li><span className="font-semibold">AKR-SHP</span>: Akram Share Pack (Kemasan keluarga multi-pouch).</li>
                <li><span className="font-semibold">AKR-KHR</span>: Akram Khalas Rigid (Kemasan toples rigid box premium).</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
                3. Master Distribution Center (8 DC Nasional) &amp; Wilayah
              </div>
              <p className="text-slate-600 pl-5 mb-1.5">
                Buka menu <span className="font-semibold text-slate-800">Master Data &rarr; Distribution Centers</span>. 8 DC mencakup seluruh koridor distribusi nasional:
              </p>
              <div className="pl-5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-700">
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IGR-JKT (Jakarta)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IDM-BDG (Bandung)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IDM-SMG (Semarang)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IGR-SBY (Surabaya)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IGR-MDN (Medan)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IDM-BPN (Balikpapan)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IDM-MKS (Makassar)</div>
                <div className="bg-white p-1.5 border border-slate-200 rounded">&bull; IGR-DPS (Denpasar)</div>
              </div>
            </div>
          </div>
        </section>

        {/* BAB 2: Tahap 2 & 3 - Forecast & Excel */}
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            Tahap 2 &amp; 3: Alur Input Forecast &amp; Impor Excel
          </h2>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Opsi A: Impor Massal melalui File Excel (.xlsx)</span>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Buka modul <span className="font-semibold text-slate-800">Forecast Management</span> di navigasi kiri.</li>
                <li>Klik tombol <span className="font-semibold text-sky-800">&quot;Import Excel&quot;</span> di pojok kanan atas.</li>
                <li>Unduh format resmi dengan menekan tautan <span className="font-semibold text-emerald-800">&quot;Download Template Format Excel&quot;</span>.</li>
                <li>Isi data target kuota per DC, SKU kurma, dan periode target (contoh: 2026-09).</li>
                <li>Unggah file kembali ke zona dropzone. Sistem akan melakukan validasi format otomatis. Klik <span className="font-semibold text-slate-800">&quot;Proses Impor&quot;</span>.</li>
              </ol>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Opsi B: Input Manual Formulir Satuan</span>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Klik tombol <span className="font-semibold text-sky-800">&quot;+ Buat Forecast Baru&quot;</span>.</li>
                <li>Pilih Customer (Indomarco/Indogrosir), pilih DC tujuan penerimaan, dan periode pengiriman.</li>
                <li>Masukkan jumlah alokasi masing-masing SKU produk kurma.</li>
                <li>Sistem otomatis men-generate nomor dokumen standar <span className="font-mono font-semibold">FORECAST-YYYYMM-XXXX</span>.</li>
              </ol>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg text-amber-900">
              <span className="font-bold block mb-0.5">Rumus Validasi Matematis Forecast Dashboard:</span>
              <div className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 my-1 text-center font-bold">
                Total Qty = Allocated / Shipped Qty + Outstanding Qty
              </div>
              <p className="text-[11px] text-amber-800">
                Status akan otomatis berpindah: <span className="font-semibold">FORECAST &rarr; PARTIAL &rarr; RECEIVED</span> seiring diterbitkannya Surat Jalan dan penyelesaian BAST di Distribution Center.
              </p>
            </div>
          </div>
        </section>

        {/* BAB 3: Tahap 4 - Shipment & Surat Jalan */}
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">4</span>
            Tahap 4: Perencanaan Pengiriman &amp; Penerbitan Surat Jalan
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Setelah kuota forecast terkonfirmasi, bagian gudang pusat menerbitkan Surat Jalan resmi untuk armada pengangkut:
          </p>

          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>Buka modul <span className="font-semibold text-slate-800">Shipment &amp; Surat Jalan</span>.</li>
            <li>Klik <span className="font-semibold text-sky-800">&quot;+ Rencana Pengiriman Baru&quot;</span>.</li>
            <li>Pilih nomor referensi Forecast yang memiliki sisa kuota *Outstanding*. Sistem akan otomatis mengunci DC tujuan dan rincian kuantitas produk.</li>
            <li>
              Lengkapi data armada logistik:
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li><span className="font-semibold">Ekspedisi:</span> PT Logistik Cepat Nusantara, Trans Mandiri Express, dll.</li>
                <li><span className="font-semibold">Tipe Truk:</span> Truk Box CDD (Colt Diesel Double), Fuso Box, atau Tronton Wingbox.</li>
                <li><span className="font-semibold">No. Polisi, Nama Sopir, dan No. Telepon Aktif.</span></li>
              </ul>
            </li>
            <li>Klik Simpan. Nomor Surat Jalan <span className="font-mono font-semibold">SJ-YYYYMM-XXXX</span> akan diterbitkan.</li>
            <li>Klik ikon <span className="font-semibold text-slate-800">Cetak Surat Jalan</span> untuk mencetak dokumen fisik pengantar 4 rangkap (Asli Gudang, Ekspedisi, Arsip DC, Keuangan).</li>
          </ol>
        </section>

        {/* BAB 4: Tahap 5 - Live Tracking */}
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">5</span>
            Tahap 5: Pelacakan Live GPS Milestone Armada Truk
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Armada yang sedang berjalan dipantau secara real-time melalui 5 tahapan checkpoint wajib:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono mb-3">
            <div className="p-2 border border-slate-200 rounded bg-slate-50 text-center">
              <div className="font-bold text-slate-900">1. PICKING</div>
              <div className="text-[10px] text-slate-500 font-sans">Gudang menyiapkan stok</div>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 text-center">
              <div className="font-bold text-slate-900">2. LOADING</div>
              <div className="text-[10px] text-slate-500 font-sans">Muat kargo ke truk</div>
            </div>
            <div className="p-2 border border-sky-300 rounded bg-sky-50 text-center">
              <div className="font-bold text-sky-900">3. IN_TRANSIT</div>
              <div className="text-[10px] text-sky-700 font-sans">Perjalanan tol koridor</div>
            </div>
            <div className="p-2 border border-amber-300 rounded bg-amber-50 text-center">
              <div className="font-bold text-amber-900">4. ARRIVED_DC</div>
              <div className="text-[10px] text-amber-700 font-sans">Tiba di gerbang DC</div>
            </div>
            <div className="p-2 border border-emerald-300 rounded bg-emerald-50 text-center">
              <div className="font-bold text-emerald-900">5. DELIVERED</div>
              <div className="text-[10px] text-emerald-700 font-sans">Bongkar muatan selesai</div>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Setiap update status memicu pencatatan waktu otomatis, log audit aktivitas, dan telemetri lokasi rute armada.
          </p>
        </section>

        {/* BAB 5: Tahap 6 - DC Receiving & BAST */}
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">6</span>
            Tahap 6: Pemeriksaan Fisik DC &amp; Berita Acara BAST
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Saat kargo tiba di Distribution Center, staf penerima (*Receiving Inspector*) melakukan pengecekan fisik menyeluruh:
          </p>

          <div className="space-y-3 text-xs leading-relaxed">
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
              <li>Buka modul <span className="font-semibold text-slate-800">DC Receiving &amp; BAST</span>.</li>
              <li>Pilih Surat Jalan yang berstatus <span className="font-semibold text-amber-700">ARRIVED_DC</span>.</li>
              <li>Klik <span className="font-semibold text-sky-800">&quot;Catat Penerimaan &amp; BAST&quot;</span>.</li>
              <li>
                Isi kuantitas pemeriksaan fisik untuk tiap SKU:
                <div className="grid grid-cols-3 gap-2 my-2 font-mono text-[11px]">
                  <div className="bg-emerald-50 p-2 border border-emerald-200 rounded text-emerald-900">
                    <span className="font-bold block">Qty Baik (Good)</span>
                    Produk utuh &amp; layak display
                  </div>
                  <div className="bg-rose-50 p-2 border border-rose-200 rounded text-rose-900">
                    <span className="font-bold block">Qty Rusak (Damaged)</span>
                    Kemasan bocor/penyok
                  </div>
                  <div className="bg-amber-50 p-2 border border-amber-200 rounded text-amber-900">
                    <span className="font-bold block">Qty Selisih (Shortage)</span>
                    Barang kurang muat
                  </div>
                </div>
              </li>
              <li>
                <span className="font-semibold text-slate-800">Formula Wajib BAST:</span> Sistem memvalidasi formula audit kargo secara ketat:
                <div className="font-mono text-[11px] bg-slate-100 p-2 rounded text-center font-bold text-slate-900 my-1">
                  Total Shipped = Total Good + Total Damaged + Total Shortage
                </div>
              </li>
              <li>Jika terdapat barang rusak atau selisih, sistem otomatis membuat tiket <span className="font-semibold text-rose-800">Klaim Kerusakan &amp; Retur</span> untuk tagihan klaim ke pihak ekspedisi logistik.</li>
              <li>Cetak dokumen fisik BAST resmi ber-barcode untuk ditandatangani Kepala Gudang DC dan Sopir Truk.</li>
            </ol>
          </div>
        </section>

        {/* BAB 6: Tahap 7, 8, 9, 10 - Management, Reports, Alerts & Security */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900 text-white text-xs flex items-center justify-center font-bold">7</span>
            Tahap 7 &ndash; 10: Pengendalian Manajemen, Laporan Excel &amp; Audit QA
          </h2>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Tahap 7: Management Dashboard &amp; Control Tower</span>
              <p className="text-slate-600">
                Pantau realisasi pemenuhan kuota nasional, perbandingan Indomarco vs Indogrosir, leaderboard efisiensi 8 DC, stok bebas ATP (*Available to Promise*), dan asisten AI Logistics Copilot.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Tahap 8: Pusat Laporan Excel (.xlsx) &amp; Ekspor CSV Audit (.csv)</span>
              <p className="text-slate-600">
                Buka menu <span className="font-semibold text-slate-800">Laporan &rarr; Executive Reports</span> atau gunakan tombol <span className="font-semibold text-emerald-800">Export CSV</span> di halaman Live Tracking, Surat Jalan, Master DC, dan Activity Logs untuk mengunduh data tabel pelacakan distribusi dalam format CSV berstandar RFC-4180 dengan encoding UTF-8 BOM siap rekonsiliasi audit offline.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Tahap 9: Notifikasi Multi-Channel &amp; Alert Kritis</span>
              <p className="text-slate-600">
                Peringatan otomatis muncul di lonceng notifikasi jika stok gudang pusat menipis di bawah *safety stock*, terjadi keterlambatan armada lebih dari 24 jam, atau adanya overdue pemenuhan forecast.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Tahap 10: System Testing &amp; Sertifikat Audit Keamanan</span>
              <p className="text-slate-600">
                Buka menu <span className="font-semibold text-slate-800">System Testing &amp; QA (T10)</span>. Klik &quot;Jalankan Semua Pengujian Sistem&quot; untuk menguji 10 tahapan sekaligus secara live dan mengunduh Sertifikat Audit Sistem bertaraf produksi.
              </p>
            </div>
          </div>
        </section>

        {/* Footer & Lembar Pengesahan Dokumen */}
        <div className="border-t-2 border-slate-900 pt-6 mt-10 text-xs">
          <div className="text-slate-600 font-semibold mb-4 text-center">
            LEMBAR PENGESAHAN PROSEDUR STANDAR OPERASIONAL (SOP) DISTRIBUSI
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-8">Disusun Oleh,</div>
              <div className="font-bold text-slate-900">Tim Rantai Pasok &amp; Logistik</div>
              <div className="text-[10px] text-slate-500">PT Akram Niaga Nusantara</div>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-8">Diperiksa Oleh,</div>
              <div className="font-bold text-slate-900">Supply Chain Manager</div>
              <div className="text-[10px] text-slate-500">Divisi Operasional &amp; QA</div>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-8">Disetujui Oleh,</div>
              <div className="font-bold text-slate-900">Direksi Operasional</div>
              <div className="text-[10px] text-slate-500">PT Akram Niaga Nusantara</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center mt-6">
            Dokumen ini dihasilkan secara otomatis oleh IDM Tracking System. Seluruh hak cipta dilindungi undang-undang.
          </div>
        </div>
      </div>
    </div>
  );
};
