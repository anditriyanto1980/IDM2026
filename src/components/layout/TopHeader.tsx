import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Database, UserCheck, Shield, ChevronDown, Menu, BookOpen, Trash2, Cloud } from 'lucide-react';
import { INITIAL_USERS } from '../../constants/initialData';
import { NotificationBell } from '../notifications/NotificationBell';
import { ResetAllDataModal } from '../common/ResetAllDataModal';
import { NavItemKey } from './Sidebar';

interface TopHeaderProps {
  currentRouteTitle: string;
  currentBreadcrumb?: string[];
  onOpenMobileMenu: () => void;
  onOpenDbSettings: () => void;
  onNavigate?: (route: NavItemKey) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRouteTitle,
  currentBreadcrumb = ['Sistem', 'Dashboard'],
  onOpenMobileMenu,
  onOpenDbSettings,
  onNavigate = () => {},
}) => {
  const { user, signOut, switchUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-hidden">
          {currentBreadcrumb.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              <span className={idx === currentBreadcrumb.length - 1 ? 'text-slate-900 font-semibold truncate' : 'hover:text-slate-700 truncate'}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Notifications + Database status pill + User Role Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell with Badge and Alerts */}
        <NotificationBell onNavigate={onNavigate} />

        {/* Panduan PDF SOP Button */}
        <button
          onClick={() => onNavigate('guide')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 transition-colors font-medium cursor-pointer"
          title="Buka Buku Panduan Operasional & Cetak PDF"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Panduan PDF</span>
        </button>

        {/* Reset Data Button */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 transition-colors font-semibold cursor-pointer"
          title="Reset atau Kosongkan Seluruh Data Firebase (TOTAL NO DATA)"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Reset Total (No Data)</span>
        </button>

        {/* Database indicator button */}
        <button
          onClick={onOpenDbSettings}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
          title="Klik untuk melihat status database Firebase Firestore"
        >
          <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500 animate-pulse" />
          <Cloud className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-medium text-slate-800">Firebase Firestore</span>
        </button>

        {/* User Account & Quick Role Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {user.full_name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tracking-tight">
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3" />
                      Role: {user.role}
                    </div>
                  </div>

                  {/* Quick role switcher for testing all roles */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Ganti Role Uji Coba:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {INITIAL_USERS.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u);
                            setShowUserDropdown(false);
                          }}
                          className={`px-2 py-1 rounded text-left truncate transition-colors ${
                            user.role === u.role
                              ? 'bg-slate-900 text-white font-medium'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {u.role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Sign Out)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ResetAllDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </header>
  );
};
