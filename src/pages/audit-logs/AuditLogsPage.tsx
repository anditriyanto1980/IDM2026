import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types';
import { fetchActivityLogs } from '../../services/auditLogService';
import { exportAuditLogsToCsv } from '../../services/csvExportService';
import { useToast } from '../../hooks/useToast';
import { TableLoadingState, EmptyState } from '../../components/common/LoadingAndEmptyState';
import { Clock, Shield, Filter, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchModule && matchAction;
  });

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      showToast('warning', 'Tidak Ada Log', 'Tidak ada data log aktivitas yang sesuai filter untuk diekspor.');
      return;
    }
    exportAuditLogsToCsv(filteredLogs);
    showToast('success', 'Export CSV Audit Trail Berhasil', `${filteredLogs.length} catatan audit log operasional berhasil diunduh ke CSV.`);
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'LOGIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Activity Logs & Audit Trail</h1>
          <p className="text-xs text-slate-500">
            Jejak audit operasional seluruh tindakan (Login, Logout, Create, Update, Delete) pada sistem
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Ekspor seluruh jejak audit ke format CSV untuk audit offline dan arsip kepatuhan"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV Audit ({filteredLogs.length})</span>
          </button>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter:</span>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
        >
          <option value="all">Semua Modul</option>
          <option value="AUTH">AUTH</option>
          <option value="CUSTOMERS">CUSTOMERS</option>
          <option value="PRODUCTS">PRODUCTS</option>
          <option value="REGIONS">REGIONS</option>
          <option value="DISTRIBUTION_CENTERS">DISTRIBUTION_CENTERS</option>
          <option value="USERS">USERS</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
        >
          <option value="all">Semua Aksi</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>

        <div className="text-xs text-slate-400 ml-auto font-mono tabular-nums">
          {filteredLogs.length} total event
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <TableLoadingState message="Memuat rekaman log audit..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Tidak Ada Rekaman Log"
            description="Belum ada aktivitas tercatat untuk filter yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Modul</th>
                  <th className="px-4 py-3">Deskripsi Aktivitas</th>
                  <th className="px-4 py-3">Operator User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold border text-[10px] ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold whitespace-nowrap">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-sans font-medium">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span>{log.user_email || log.user_id}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
