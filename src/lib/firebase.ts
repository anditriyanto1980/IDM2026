import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_REGIONS,
  INITIAL_DCS,
  INITIAL_FORECASTS,
  INITIAL_SHIPMENTS,
  INITIAL_RECEIVING_INSPECTIONS,
  INITIAL_USERS,
} from '../constants/initialData';
import { STORAGE_KEYS } from './storage';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// Test Connection on Boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_health', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
      return false;
    }
    // If permission or document not found, connection itself reached server
    return true;
  }
}

// Seed initial master data to Firestore if collection is empty
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const custRef = collection(db, 'customers');
    const snapshot = await getDocs(query(custRef, limit(1)));
    if (!snapshot.empty) {
      return; // Already populated
    }

    const batch = writeBatch(db);

    // Seed Customers
    for (const c of INITIAL_CUSTOMERS) {
      batch.set(doc(db, 'customers', c.id), c);
    }
    // Seed Products
    for (const p of INITIAL_PRODUCTS) {
      batch.set(doc(db, 'products', p.id), p);
    }
    // Seed Regions
    for (const r of INITIAL_REGIONS) {
      batch.set(doc(db, 'regions', r.id), r);
    }
    // Seed 8 Distribution Centers
    for (const d of INITIAL_DCS) {
      batch.set(doc(db, 'distribution_centers', d.id), d);
    }
    // Seed Initial Forecasts
    for (const f of INITIAL_FORECASTS) {
      batch.set(doc(db, 'forecasts', f.id), f);
    }
    // Seed Initial Shipments
    for (const s of INITIAL_SHIPMENTS) {
      batch.set(doc(db, 'shipments', s.id), s);
    }
    // Seed Initial Inspections
    for (const b of INITIAL_RECEIVING_INSPECTIONS) {
      batch.set(doc(db, 'receiving_inspections', b.id), b);
    }

    await batch.commit();
    console.info('Firebase Firestore seeded successfully with master seeds.');
  } catch (e) {
    console.warn('Error during Firestore seed:', e);
  }
}

// Global Reset: Clear all Firestore data & local data
export async function resetAllData(reseedDefaults: boolean = false): Promise<void> {
  const collectionsToClear = [
    'customers',
    'products',
    'regions',
    'distribution_centers',
    'warehouses',
    'forecasts',
    'shipments',
    'receiving_inspections',
    'claims',
    'inventory',
    'stock_mutations',
    'invoices',
    'activity_logs',
    'milestones',
    'notifications',
  ];

  // 1. Clear Firestore Documents in chunks/batches
  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Could not clear collection ${colName}:`, err);
    }
  }

  // 2. Clear LocalStorage to empty arrays
  if (typeof window !== 'undefined') {
    localStorage.setItem('akram_cleared_no_data', 'true');
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, '[]');
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');
    localStorage.setItem(STORAGE_KEYS.REGIONS, '[]');
    localStorage.setItem(STORAGE_KEYS.DCS, '[]');
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, '[]');
    localStorage.setItem(STORAGE_KEYS.FORECASTS, '[]');
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.MILESTONES, '[]');
    localStorage.setItem(STORAGE_KEYS.RECEIVING_INSPECTIONS, '[]');
    localStorage.setItem(STORAGE_KEYS.CLAIMS, '[]');
    localStorage.setItem(STORAGE_KEYS.WAREHOUSE_INVENTORY, '[]');
    localStorage.setItem(STORAGE_KEYS.STOCK_MUTATIONS, '[]');
    localStorage.setItem(STORAGE_KEYS.TRANSPORTER_INVOICES, '[]');
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, '[]');
    localStorage.setItem(STORAGE_KEYS.LOGS, '[]');

    // Keep auth user safe
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
  }

  // 3. Reseed ONLY if explicitly requested by user
  if (reseedDefaults) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('akram_cleared_no_data');
    }
    await seedFirestoreIfEmpty();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(INITIAL_REGIONS));
      localStorage.setItem(STORAGE_KEYS.DCS, JSON.stringify(INITIAL_DCS));
      localStorage.setItem(STORAGE_KEYS.FORECASTS, JSON.stringify(INITIAL_FORECASTS));
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(INITIAL_SHIPMENTS));
      localStorage.setItem(STORAGE_KEYS.RECEIVING_INSPECTIONS, JSON.stringify(INITIAL_RECEIVING_INSPECTIONS));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }
}

export async function resetTotalNoData(): Promise<void> {
  return resetAllData(false);
}
