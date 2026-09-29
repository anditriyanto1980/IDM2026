import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { logActivity } from './auditLogService';

export const getUsers = async (): Promise<User[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as User[];
      }
    } catch (err) {
      console.warn('Supabase fetch users failed:', err);
    }
  }

  return getStored<User[]>(STORAGE_KEYS.USERS, []);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find((u) => u.id === id) || null;
};

export const createUser = async (
  payload: { email: string; full_name: string; role: UserRole; is_active?: boolean },
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<User> => {
  const email = payload.email.trim().toLowerCase();
  const name = payload.full_name.trim();

  if (!email) throw new Error('Email pengguna wajib diisi.');
  if (!name) throw new Error('Nama lengkap wajib diisi.');
  if (!payload.role) throw new Error('Role pengguna wajib dipilih.');

  const existingList = getStored<User[]>(STORAGE_KEYS.USERS, []);
  if (existingList.some((u) => u.email.toLowerCase() === email)) {
    throw new Error(`Email "${email}" sudah terdaftar.`);
  }

  const newUser: User = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
    email,
    full_name: name,
    role: payload.role,
    avatar_url: null,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('users').insert([newUser]).select().single();
      if (error) throw error;
      if (data) {
        setStored(STORAGE_KEYS.USERS, [...existingList, data as User]);
      }
    } catch (err: any) {
      console.error('Supabase createUser error:', err);
      throw new Error(err.message || 'Gagal menyimpan user ke Supabase.');
    }
  } else {
    setStored(STORAGE_KEYS.USERS, [...existingList, newUser]);
  }

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'CREATE',
    module: 'USERS',
    recordId: newUser.id,
    description: `${operatorInfo?.userRole || 'ADMIN'} created user ${newUser.email} with role ${newUser.role}`,
  });

  return newUser;
};

export const updateUser = async (
  id: string,
  payload: Partial<{ full_name: string; role: UserRole; is_active: boolean }>,
  operatorInfo?: { userId?: string; userEmail?: string; userRole?: any }
): Promise<User> => {
  const existingList = getStored<User[]>(STORAGE_KEYS.USERS, []);
  const index = existingList.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('Pengguna tidak ditemukan.');

  const updated: User = {
    ...existingList[index],
    full_name: payload.full_name !== undefined ? payload.full_name.trim() : existingList[index].full_name,
    role: payload.role || existingList[index].role,
    is_active: payload.is_active !== undefined ? payload.is_active : existingList[index].is_active,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('users').update({
        full_name: updated.full_name,
        role: updated.role,
        is_active: updated.is_active,
        updated_at: updated.updated_at,
      }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Supabase updateUser error:', err);
    }
  }

  existingList[index] = updated;
  setStored(STORAGE_KEYS.USERS, existingList);

  await logActivity({
    userId: operatorInfo?.userId,
    userEmail: operatorInfo?.userEmail,
    userRole: operatorInfo?.userRole,
    action: 'UPDATE',
    module: 'USERS',
    recordId: id,
    description: `${operatorInfo?.userRole || 'ADMIN'} updated user ${updated.email} (${updated.role})`,
  });

  return updated;
};
