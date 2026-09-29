import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { Boxes } from 'lucide-react';
import { seedFirestoreIfEmpty, testFirestoreConnection } from './lib/firebase';

const RootApp: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center shadow-md animate-pulse">
            <Boxes className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-800 tracking-tight">
            AKRAM DISTRIBUTION TRACKING
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-sky-700 rounded-full animate-spin" />
            <span>Memeriksa sesi pengguna...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AppLayout />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ToastProvider>
  );
}
