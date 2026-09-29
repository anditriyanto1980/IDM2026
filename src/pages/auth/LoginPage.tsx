import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { INITIAL_USERS } from '../../constants/initialData';
import { Lock, Mail, Boxes, ShieldAlert, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('admin@akram.id');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan email Anda.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    try {
      await signIn(email, password);
      showToast('success', 'Berhasil Masuk', `Selamat datang kembali di IDM Tracking System.`);
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      showToast('error', 'Gagal Masuk', err.message);
    }
  };

  const handleSelectDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-900 text-white shadow-sm mb-3">
          <Boxes className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          IDM TRACKING SYSTEM
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Logistics & DC Allocation Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Perusahaan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@akram.id"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-sky-900 hover:bg-sky-800 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Role Tester for Evaluation & Acceptance Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2">
              Uji Coba Hak Akses Role (Quick Switch):
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {INITIAL_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.email)}
                  className={`px-2.5 py-1.5 text-[11px] rounded-md border text-left transition-colors ${
                    email === u.email
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-medium truncate">{u.role}</div>
                  <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Supabase Status Note */}
          <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Status Koneksi:</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-sky-500'
                }`}
              />
              {isSupabaseConfigured ? 'Supabase Connected' : 'Database Ready (Local Sync)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
