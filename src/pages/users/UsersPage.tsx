import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { getUsers, createUser, updateUser } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableLoadingState, EmptyState, ErrorState } from '../../components/common/LoadingAndEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UserModal } from '../../components/master/UserModal';
import { Plus, Edit2, Shield, UserCog, Power } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  const canEdit = currentUser?.role === 'ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
  }) => {
    setModalLoading(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, payload, {
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userRole: currentUser?.role,
        });
        showToast('success', 'Pengguna Diperbarui', `Akun ${payload.email} berhasil diperbarui.`);
      } else {
        await createUser(payload, {
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userRole: currentUser?.role,
        });
        showToast('success', 'Pengguna Ditambahkan', `Akun baru ${payload.email} (${payload.role}) berhasil didaftarkan.`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggleLoading(true);
    try {
      const newStatus = !toggleTarget.is_active;
      await updateUser(toggleTarget.id, { is_active: newStatus }, {
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        userRole: currentUser?.role,
      });
      showToast('success', 'Status Berubah', `Akun ${toggleTarget.email} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setToggleTarget(null);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsToggleLoading(false);
    }
  };

  const roleColor: Record<UserRole, string> = {
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    MANAGEMENT: 'bg-blue-50 text-blue-700 border-blue-200',
    SALES: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WAREHOUSE: 'bg-amber-50 text-amber-700 border-amber-200',
    LOGISTICS: 'bg-sky-50 text-sky-700 border-sky-200',
    RECEIVING: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Users & Roles (RBAC)</h1>
          <p className="text-xs text-slate-500">
            Pengelolaan akun tim operasional dan pembatasan hak akses berbasis peran
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <TableLoadingState message="Memuat daftar pengguna..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState
            title="Tidak Ada Pengguna"
            description="Belum ada pengguna yang terdaftar di sistem."
            actionLabel={canEdit ? 'Tambah Pengguna' : undefined}
            onAction={canEdit ? handleOpenAdd : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama & Email</th>
                  <th className="px-4 py-3">Hak Akses (Role)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Terdaftar Sejak</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${roleColor[u.role]}`}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge isActive={u.is_active} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                              title="Edit Pengguna"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => setToggleTarget(u)}
                                className={`p-1.5 rounded transition-colors ${
                                  u.is_active
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={selectedUser}
        isLoading={modalLoading}
      />

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? 'Nonaktifkan Akun?' : 'Aktifkan Akun?'}
        message={`Apakah Anda yakin ingin ${toggleTarget?.is_active ? 'menonaktifkan' : 'mengaktifkan kembali'} akses untuk ${toggleTarget?.email}?`}
        confirmLabel={toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={toggleTarget?.is_active}
        isLoading={isToggleLoading}
      />
    </div>
  );
};
