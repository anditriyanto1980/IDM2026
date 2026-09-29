import React, { useState, useEffect, useMemo } from 'react';
import {
  DiscrepancyClaim,
  ReceivingInspection,
  BatchTraceItem,
  CreateClaimPayload,
  ClaimStatus,
  ClaimResolutionType,
} from '../../types';
import {
  getClaims,
  createClaim,
  updateClaimResolution,
  getBastsEligibleForClaim,
} from '../../services/claimService';
import { getBatchTraceability } from '../../services/batchService';
import { ClaimStatusBadge } from '../../components/claims/ClaimStatusBadge';
import { CreateClaimModal } from '../../components/claims/CreateClaimModal';
import { ClaimDetailModal } from '../../components/claims/ClaimDetailModal';
import { BatchMovementModal } from '../../components/claims/BatchMovementModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  Boxes,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Eye,
  Layers,
} from 'lucide-react';

export const ClaimsPage: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'claims' | 'batches'>('claims');
  const [claims, setClaims] = useState<DiscrepancyClaim[]>([]);
  const [eligibleBasts, setEligibleBasts] = useState<ReceivingInspection[]>([]);
  const [batches, setBatches] = useState<BatchTraceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<DiscrepancyClaim | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBatchForMovement, setSelectedBatchForMovement] = useState<BatchTraceItem | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const canEditClaims = canAccess('CLAIMS', 'edit');

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimList, bastsList, batchList] = await Promise.all([
        getClaims({}),
        getBastsEligibleForClaim(),
        getBatchTraceability(),
      ]);
      setClaims(claimList);
      setEligibleBasts(bastsList);
      setBatches(batchList);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data Klaim',
        message: err?.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchParty = partyFilter === 'all' || c.responsible_party === partyFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.claim_number.toLowerCase().includes(q) ||
        c.bast_number.toLowerCase().includes(q) ||
        c.shipment_number.toLowerCase().includes(q) ||
        (c.customer?.customer_name && c.customer.customer_name.toLowerCase().includes(q)) ||
        (c.dc?.dc_name && c.dc.dc_name.toLowerCase().includes(q));

      return matchStatus && matchParty && matchSearch;
    });
  }, [claims, statusFilter, partyFilter, searchQuery]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return batches;
    return batches.filter(
      (b) =>
        b.batch_number.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.product_name.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  // KPIs
  const totalClaimLossAmount = claims.reduce((acc, c) => acc + (c.estimated_loss_amount || 0), 0);
  const settledClaimsCount = claims.filter((c) => c.status === 'SETTLED' || c.status === 'REPLACED').length;
  const investigatingClaimsCount = claims.filter((c) => c.status === 'INVESTIGATING' || c.status === 'SUBMITTED').length;

  const totalWarehouseStock = batches.reduce((acc, b) => acc + b.warehouse_stock_balance, 0);
  const freshBatchesCount = batches.filter((b) => b.shelf_life_status === 'FRESH').length;

  const handleCreateClaimSuccess = (newClaim: DiscrepancyClaim) => {
    showToast({
      type: 'success',
      title: 'Klaim Berhasil Diterbitkan',
      message: `Berkas klaim ${newClaim.claim_number} berhasil dicatat untuk investigasi.`,
    });
    loadData();
  };

  const handleUpdateResolution = async (
    claimId: string,
    resolution: {
      status: ClaimStatus;
      resolution_type?: ClaimResolutionType;
      replacement_shipment_number?: string;
      resolution_notes?: string;
    }
  ) => {
    try {
      const updated = await updateClaimResolution(claimId, resolution, {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
      });
      showToast({
        type: 'success',
        title: 'Status Klaim Diperbarui',
        message: `Klaim ${updated.claim_number} kini berstatus ${updated.status}.`,
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Klaim',
        message: err?.message || 'Terjadi kesalahan sistem.',
      });
      throw err;
    }
  };

  const getResponsiblePartyBadge = (party: string) => {
    switch (party) {
      case 'TRANSPORTER':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Ekspedisi (Armada)</span>;
      case 'ORIGIN_WAREHOUSE':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">Gudang Asal (Akram)</span>;
      case 'DESTINATION_DC':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">DC Penerima</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Force Majeure</span>;
    }
  };

  const getShelfLifeBadge = (status: BatchTraceItem['shelf_life_status']) => {
    switch (status) {
      case 'FRESH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Fresh (Sangat Baik)</span>;
      case 'GOOD':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">Aman (Good)</span>;
      case 'WARNING':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Perhatian (&lt;90 hari)</span>;
      case 'CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">Kritis (&lt;30 hari)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Discrepancy Claims &amp; Batch Traceability
              </h1>
              <p className="text-xs text-slate-500">
                Penyelesaian klaim selisih/barang rusak serah terima BAST DC, pertanggungjawaban ganti rugi ekspedisi, serta penelusuran batch kurma
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canEditClaims && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Ajukan Klaim BAST</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Klaim Aktif (Investigasi)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {investigatingClaimsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Menunggu konfirmasi pertanggungjawaban
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Kerugian Diklaim</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 font-mono">
            Rp {totalClaimLossAmount.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Estimasi nilai fisik barang rusak
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Klaim Selesai (Settled)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {settledClaimsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Penggantian barang / credit note tuntas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Stok Batch Gudang Pusat</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalWarehouseStock.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {freshBatchesCount} batch masa simpan prima (PCS)
          </div>
        </div>
      </div>

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'claims'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Berkas Klaim Kerusakan &amp; Retur BAST</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'claims' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {claims.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'batches'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Penelusuran Batch &amp; Masa Simpan (FEFO)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'batches' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {batches.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter input controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'claims' ? 'Cari No. Klaim, BAST, SJ, customer, DC...' : 'Cari Nomor Batch, SKU, nama kurma...'}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {activeTab === 'claims' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Semua Status Klaim</option>
                <option value="INVESTIGATING">Investigasi (Under Review)</option>
                <option value="APPROVED">Disetujui (Approved)</option>
                <option value="REPLACED">Barang Pengganti Terkirim</option>
                <option value="SETTLED">Selesai (Settled)</option>
                <option value="REJECTED">Ditolak (Rejected)</option>
              </select>

              <select
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Semua Pihak Penanggung Jawab</option>
                <option value="TRANSPORTER">Pihak Ekspedisi (Transport)</option>
                <option value="ORIGIN_WAREHOUSE">Gudang Asal Akram</option>
                <option value="DESTINATION_DC">Distribution Center Penerima</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Claims List */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Daftar Berkas Klaim Kerusakan &amp; Retur ({filteredClaims.length} Dokumen)
            </h3>
            <span className="text-xs text-slate-500">
              Penyelesaian melalui Credit Note atau Pengiriman Barang Pengganti
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat dokumen klaim...</span>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Tidak Ada Berkas Klaim yang Aktif
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seluruh barang kiriman diterima dengan baik atau belum ada laporan klaim kerusakan baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No. Klaim &amp; Ref. BAST</th>
                    <th className="px-4 py-3">Customer &amp; DC Tujuan</th>
                    <th className="px-4 py-3">Pihak Dituntut</th>
                    <th className="px-4 py-3 text-right">Qty Rusak</th>
                    <th className="px-4 py-3 text-right">Nilai Kerugian</th>
                    <th className="px-4 py-3">Penyelesaian (Resolution)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold font-mono text-slate-900">{c.claim_number}</div>
                        <div className="text-[11px] font-mono text-emerald-700">BAST: {c.bast_number}</div>
                        <div className="text-[10px] text-slate-400">SJ: {c.shipment_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{c.customer?.customer_name}</div>
                        <div className="text-slate-500 text-[11px]">{c.dc?.dc_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getResponsiblePartyBadge(c.responsible_party)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                        {c.total_damaged_qty.toLocaleString()} pcs
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        Rp {c.estimated_loss_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.resolution_type || '-'}</div>
                        {c.replacement_shipment_number && (
                          <div className="text-[10px] text-emerald-700 font-mono">
                            Ref: {c.replacement_shipment_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ClaimStatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedClaimForDetail(c);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail &amp; Selesaikan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Batch Traceability (FEFO) */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Penelusuran Batch &amp; Manajemen Masa Simpan (FEFO Shelf-Life)
              </h3>
              <p className="text-[11px] text-slate-500">
                Monitoring pergerakan kurma dari pabrik hingga DC per nomor lot/batch
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Total {filteredBatches.length} batch produksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nomor Batch &amp; Produk</th>
                  <th className="px-4 py-3">Tgl Produksi &amp; Expired</th>
                  <th className="px-4 py-3 text-right">Sisa Masa Simpan</th>
                  <th className="px-4 py-3 text-right">Total Produksi</th>
                  <th className="px-4 py-3 text-right">Terkirim ke DC</th>
                  <th className="px-4 py-3 text-right">Sisa Stok Gudang</th>
                  <th className="px-4 py-3 text-center">Status Kesegaran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.batch_number} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="font-mono text-emerald-800 font-bold">{b.batch_number}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{b.product_name} ({b.sku})</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">
                      <div>Prod: {b.production_date}</div>
                      <div className="text-slate-500">Exp: {b.expiry_date}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {b.remaining_shelf_life_days} Hari
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                      {b.total_produced_qty.toLocaleString()} pcs
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {b.total_shipped_qty.toLocaleString()} pcs
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {b.warehouse_stock_balance.toLocaleString()} pcs
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getShelfLifeBadge(b.shelf_life_status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedBatchForMovement(b);
                          setIsBatchModalOpen(true);
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lacak Alokasi DC</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Claim */}
      <CreateClaimModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        eligibleBasts={eligibleBasts}
        onSubmitClaim={async (payload) => {
          return await createClaim(payload, {
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
          });
        }}
        onSuccess={handleCreateClaimSuccess}
      />

      {/* Modal 2: Claim Detail & Settle */}
      <ClaimDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedClaimForDetail(null);
        }}
        claim={selectedClaimForDetail}
        onUpdateResolution={handleUpdateResolution}
        canEdit={canEditClaims}
      />

      {/* Modal 3: Batch Traceability Movement */}
      <BatchMovementModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedBatchForMovement(null);
        }}
        batch={selectedBatchForMovement}
      />
    </div>
  );
};
