import React, { useState, useEffect, useRef } from 'react';
import { getSystemAlerts, SystemAlert } from '../../services/alertService';
import { getLogisticsNotifications } from '../../services/invoiceService';
import { LogisticsNotification } from '../../types';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  Truck,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  X,
  Volume2,
} from 'lucide-react';
import { NavItemKey } from '../layout/Sidebar';

interface NotificationBellProps {
  onNavigate: (route: NavItemKey) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'dispatch'>('alerts');
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dispatches, setDispatches] = useState<LogisticsNotification[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [alertList, notifList] = await Promise.all([
        getSystemAlerts(),
        getLogisticsNotifications(),
      ]);
      setAlerts(alertList);
      setDispatches(notifList);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadAlerts = alerts.filter((a) => !readAlertIds.has(a.id));
  const unreadCount = unreadAlerts.length;

  const markAllAsRead = () => {
    const allIds = new Set(alerts.map((a) => a.id));
    setReadAlertIds(allIds);
  };

  const markAsRead = (id: string) => {
    setReadAlertIds((prev) => new Set([...prev, id]));
  };

  const handleAction = (alert: SystemAlert) => {
    markAsRead(alert.id);
    setIsOpen(false);
    onNavigate(alert.actionRoute as NavItemKey);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Pusat Notifikasi & Alert"
        title="Notifikasi & Peringatan Operasional"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
          {/* Top Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Pusat Peringatan &amp; Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
              >
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-colors cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Alert Operasional ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-colors cursor-pointer ${
                activeTab === 'dispatch'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              WhatsApp Dispatch ({dispatches.length})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {activeTab === 'alerts' ? (
              alerts.length > 0 ? (
                alerts.map((alert) => {
                  const isRead = readAlertIds.has(alert.id);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        isRead ? 'opacity-60 bg-white' : 'bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-slate-900 leading-snug">
                            {alert.title}
                          </h4>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                          {alert.description}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <button
                            onClick={() => handleAction(alert)}
                            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 text-[11px] cursor-pointer"
                          >
                            <span>{alert.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Semua Jalur Aman</p>
                  <p className="text-[11px]">Tidak ada peringatan kritis operasional.</p>
                </div>
              )
            ) : (
              /* Dispatch log list */
              dispatches.map((notif) => (
                <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-800 truncate">{notif.recipient_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('invoices');
              }}
              className="text-[11px] font-semibold text-sky-800 hover:text-sky-900 cursor-pointer"
            >
              Buka Semua Log Dispatch &amp; Notifikasi &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
