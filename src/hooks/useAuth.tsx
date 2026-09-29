import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStored, setStored, STORAGE_KEYS, initStorageIfEmpty } from '../lib/storage';
import { logActivity } from '../services/auditLogService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchUser: (targetUser: User) => Promise<void>;
  canAccess: (
    module:
      | 'CUSTOMERS'
      | 'PRODUCTS'
      | 'REGIONS'
      | 'DCS'
      | 'USERS'
      | 'LOGS'
      | 'SETTINGS'
      | 'FORECASTS'
      | 'SHIPMENTS'
      | 'TRACKING'
      | 'RECEIVING'
      | 'REPORTS'
      | 'CLAIMS'
      | 'BATCHES'
      | 'INVENTORY'
      | 'CONTROL_TOWER'
      | 'INVOICES'
      | 'TESTING'
      | 'GUIDE',
    action?: 'view' | 'edit'
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initStorageIfEmpty();

    const checkSession = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Find user in users table or create basic representation
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();

            if (data) {
              setUser(data as User);
              setStored(STORAGE_KEYS.CURRENT_USER, data);
              setLoading(false);
              return;
            }
          }
        }

        // Fallback to local session persistence
        const cachedUser = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
        if (cachedUser) {
          setUser(cachedUser);
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen to Supabase auth state change if active
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setStored(STORAGE_KEYS.CURRENT_USER, null);
        } else if (session?.user) {
          const { data } = await client
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();
          if (data) {
            setUser(data as User);
            setStored(STORAGE_KEYS.CURRENT_USER, data);
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        throw new Error('Email tidak boleh kosong.');
      }
      if (password !== undefined && password.trim() === '') {
        throw new Error('Password tidak boleh kosong.');
      }

      // Try Supabase auth first if configured
      if (isSupabaseConfigured && supabase && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password,
          });

          if (!error && data.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('email', trimmedEmail)
              .single();

            const loggedInUser: User = profile || {
              id: data.user.id,
              email: data.user.email || trimmedEmail,
              full_name: data.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
              role: (data.user.user_metadata?.role as UserRole) || 'ADMIN',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            setUser(loggedInUser);
            setStored(STORAGE_KEYS.CURRENT_USER, loggedInUser);

            await logActivity({
              userId: loggedInUser.id,
              userEmail: loggedInUser.email,
              userRole: loggedInUser.role,
              action: 'LOGIN',
              module: 'AUTH',
              description: `User ${loggedInUser.email} logged in successfully via Supabase Auth`,
            });
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase sign-in error, falling back to local credentials check:', supabaseErr);
        }
      }

      // Check registered users in storage
      const users = getStored<User[]>(STORAGE_KEYS.USERS, []);
      const matched = users.find((u) => u.email.toLowerCase() === trimmedEmail);

      if (!matched) {
        throw new Error('Email atau kata sandi tidak valid.');
      }

      if (!matched.is_active) {
        throw new Error('Akun Anda telah dinonaktifkan. Hubungi administrator.');
      }

      setUser(matched);
      setStored(STORAGE_KEYS.CURRENT_USER, matched);

      await logActivity({
        userId: matched.id,
        userEmail: matched.email,
        userRole: matched.role,
        action: 'LOGIN',
        module: 'AUTH',
        description: `User ${matched.email} (${matched.role}) logged in successfully`,
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const currentUser = user;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }

    if (currentUser) {
      await logActivity({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'LOGOUT',
        module: 'AUTH',
        description: `User ${currentUser.email} logged out`,
      });
    }

    setUser(null);
    setStored(STORAGE_KEYS.CURRENT_USER, null);
  };

  const switchUser = async (targetUser: User) => {
    setUser(targetUser);
    setStored(STORAGE_KEYS.CURRENT_USER, targetUser);
    await logActivity({
      userId: targetUser.id,
      userEmail: targetUser.email,
      userRole: targetUser.role,
      action: 'LOGIN',
      module: 'AUTH',
      description: `Switched active profile to ${targetUser.email} (${targetUser.role})`,
    });
  };

  // RBAC Permission Engine for Phase 1, 2, 3, 4, 5 & 6
  const canAccess = (
    module:
      | 'CUSTOMERS'
      | 'PRODUCTS'
      | 'REGIONS'
      | 'DCS'
      | 'USERS'
      | 'LOGS'
      | 'SETTINGS'
      | 'FORECASTS'
      | 'SHIPMENTS'
      | 'TRACKING'
      | 'RECEIVING'
      | 'REPORTS'
      | 'CLAIMS'
      | 'BATCHES'
      | 'INVENTORY'
      | 'CONTROL_TOWER'
      | 'INVOICES'
      | 'TESTING'
      | 'GUIDE',
    action: 'view' | 'edit' = 'view'
  ): boolean => {
    if (!user) return false;
    const role = user.role;

    // ADMIN has unrestricted access
    if (role === 'ADMIN') return true;

    // GUIDE and TESTING are accessible for all internal roles
    if (module === 'GUIDE' || (module === 'TESTING' && action === 'view')) {
      return true;
    }

    // MANAGEMENT has view access to all operational & reporting dashboards, plus can approve invoices
    if (role === 'MANAGEMENT') {
      if (module === 'INVOICES' && action === 'edit') return true;
      if (action === 'edit') return false;
      return true; // view only
    }

    // CONTROL_TOWER is accessible for viewing by all authenticated staff
    if (module === 'CONTROL_TOWER' && action === 'view') {
      return true;
    }

    // REPORTS and BATCHES modules are viewable by all authenticated internal staff
    if ((module === 'REPORTS' || module === 'BATCHES') && action === 'view') {
      return true;
    }

    // SALES: Customers & Forecasts (view & edit), Shipments, Tracking, Receiving, Claims & Inventory ATP (view)
    if (role === 'SALES') {
      if (module === 'CUSTOMERS' || module === 'FORECASTS') return true;
      if (action === 'view' && (module === 'PRODUCTS' || module === 'DCS' || module === 'SHIPMENTS' || module === 'TRACKING' || module === 'RECEIVING' || module === 'CLAIMS' || module === 'INVENTORY')) return true;
      return false;
    }

    // WAREHOUSE: Products, Shipments, Claims, Batches, Inventory & Stock Mutations (view & edit), Tracking & Receiving (view & edit), Forecasts & DCs (view)
    if (role === 'WAREHOUSE') {
      if (module === 'PRODUCTS' || module === 'SHIPMENTS' || module === 'TRACKING' || module === 'RECEIVING' || module === 'CLAIMS' || module === 'BATCHES' || module === 'INVENTORY') return true;
      if (action === 'view' && (module === 'DCS' || module === 'FORECASTS' || module === 'INVOICES')) return true;
      return false;
    }

    // LOGISTICS: DCs, Regions, Shipments, Tracking, Claims, Invoices (view & edit), Forecasts, Products, Receiving & Inventory (view)
    if (role === 'LOGISTICS') {
      if (module === 'DCS' || module === 'REGIONS' || module === 'SHIPMENTS' || module === 'TRACKING' || module === 'CLAIMS' || module === 'INVOICES') return true;
      if (action === 'view' && (module === 'PRODUCTS' || module === 'CUSTOMERS' || module === 'FORECASTS' || module === 'RECEIVING' || module === 'INVENTORY')) return true;
      return false;
    }

    // RECEIVING: Receiving & Claims (view & edit BAST/inspections & claim initiation), DCs, Forecasts, Shipments & Tracking (view)
    if (role === 'RECEIVING') {
      if (module === 'RECEIVING' || module === 'CLAIMS') return true;
      if ((module === 'DCS' || module === 'FORECASTS' || module === 'PRODUCTS' || module === 'SHIPMENTS' || module === 'TRACKING' || module === 'INVENTORY') && action === 'view') return true;
      return false;
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, switchUser, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
