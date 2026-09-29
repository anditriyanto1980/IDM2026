import { ActivityLog, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';

export const logActivity = async (params: {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  action: ActivityLog['action'];
  module: ActivityLog['module'];
  recordId?: string | null;
  description: string;
}): Promise<void> => {
  const newLog: ActivityLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: params.userId || 'system',
    user_email: params.userEmail || 'admin@akram.id',
    user_role: params.userRole || 'ADMIN',
    action: params.action,
    module: params.module,
    record_id: params.recordId || null,
    description: params.description,
    created_at: new Date().toISOString(),
  };

  // 1. If Supabase is connected, write to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('activity_logs').insert([
        {
          id: newLog.id,
          user_id: params.userId && params.userId !== 'system' ? params.userId : null,
          action: newLog.action,
          module: newLog.module,
          record_id: newLog.record_id,
          description: newLog.description,
          created_at: newLog.created_at,
        },
      ]);
    } catch (err) {
      console.warn('Failed to insert audit log to Supabase, saving to local storage:', err);
    }
  }

  // 2. Also keep local audit trail
  const logs = getStored<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  const updated = [newLog, ...logs].slice(0, 100); // keep recent 100 logs
  setStored(STORAGE_KEYS.LOGS, updated);
};

export const fetchActivityLogs = async (limit: number = 20): Promise<ActivityLog[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as ActivityLog[];
      }
    } catch (err) {
      console.warn('Supabase activity logs fetch error, falling back to local:', err);
    }
  }

  const logs = getStored<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  return logs.slice(0, limit);
};
