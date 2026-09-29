import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User, UserRole } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { email: string; full_name: string; role: UserRole; is_active: boolean }) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('SALES');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.full_name);
      setRole(user.role);
      setIsActive(user.is_active);
    } else {
      setEmail('');
      setFullName('');
      setRole('SALES');
      setIsActive(true);
    }
    setError(null);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      setError('Email pengguna wajib diisi.');
      return;
    }
    if (!trimmedName) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    try {
      await onSave({
        email: trimmedEmail,
        full_name: trimmedName,
        role,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data pengguna.');
    }
  };

  const roleDescriptions: Record<UserRole, string> = {
    ADMIN: 'Akses penuh tanpa batas ke seluruh modul, konfigurasi, dan master data.',
    MANAGEMENT: 'Akses monitoring dashboard eksekutif dan view master data (read-only).',
    SALES: 'Akses dashboard, customer master, serta forecast alokasi.',
    WAREHOUSE: 'Akses dashboard, katalog produk, dan pengelolaan shipment.',
    LOGISTICS: 'Akses monitoring pengiriman, status DC, dan armada.',
    RECEIVING: 'Akses monitoring dan verifikasi penerimaan barang di DC tujuan.',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      subtitle="Manajemen hak akses role-based control (RBAC)"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-800 hover:bg-sky-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {user ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Perusahaan <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            disabled={!!user}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@akram.id"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Budi Pratama"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Hak Akses (Role) <span className="text-rose-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700 focus:bg-white transition-all font-medium"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGEMENT">MANAGEMENT</option>
            <option value="SALES">SALES</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="LOGISTICS">LOGISTICS</option>
            <option value="RECEIVING">RECEIVING</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1.5 p-2 bg-slate-50 rounded border border-slate-100">
            {roleDescriptions[role]}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800">Status Akun</span>
            <p className="text-[11px] text-slate-400">Izinkan login ke sistem</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </form>
    </Modal>
  );
};
