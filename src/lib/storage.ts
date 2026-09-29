import {
  Customer,
  Product,
  Region,
  DistributionCenter,
  User,
  ActivityLog,
  Forecast,
  Shipment,
  ShipmentMilestone,
  ReceivingInspection,
  DiscrepancyClaim,
  WarehouseInventory,
  StockMutation,
  TransporterInvoice,
  LogisticsNotification,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_REGIONS,
  INITIAL_DCS,
  INITIAL_USERS,
  INITIAL_FORECASTS,
  INITIAL_SHIPMENTS,
  INITIAL_MILESTONES,
  INITIAL_RECEIVING_INSPECTIONS,
  INITIAL_CLAIMS,
  INITIAL_WAREHOUSE_INVENTORY,
  INITIAL_STOCK_MUTATIONS,
  INITIAL_TRANSPORTER_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_WAREHOUSES,
} from '../constants/initialData';

const STORAGE_KEYS = {
  CUSTOMERS: 'akram_db_customers_v1',
  PRODUCTS: 'akram_db_products_v1',
  REGIONS: 'akram_db_regions_v1',
  DCS: 'akram_db_dcs_v1',
  WAREHOUSES: 'akram_db_warehouses_v1',
  USERS: 'akram_db_users_v1',
  LOGS: 'akram_db_logs_v1',
  CURRENT_USER: 'akram_session_user_v1',
  FORECASTS: 'akram_db_forecasts_v1',
  SHIPMENTS: 'akram_db_shipments_v1',
  MILESTONES: 'akram_db_milestones_v1',
  RECEIVING_INSPECTIONS: 'akram_db_receiving_inspections_v1',
  CLAIMS: 'akram_db_claims_v1',
  WAREHOUSE_INVENTORY: 'akram_db_warehouse_inventory_v1',
  STOCK_MUTATIONS: 'akram_db_stock_mutations_v1',
  TRANSPORTER_INVOICES: 'akram_db_transporter_invoices_v1',
  NOTIFICATIONS: 'akram_db_notifications_v1',
};

// Initialize default data if not present
export const initStorageIfEmpty = () => {
  if (typeof window === 'undefined') return;

  // Always ensure USERS exists so authentication works smoothly
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  // Default login session to ADMIN for smooth first landing
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
  }

  // If user has performed a total reset or wants clean slate, ensure keys are empty arrays
  const isResetTotal = localStorage.getItem('akram_cleared_no_data') === 'true';
  if (isResetTotal) {
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) localStorage.setItem(STORAGE_KEYS.REGIONS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSES)) localStorage.setItem(STORAGE_KEYS.WAREHOUSES, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.DCS)) localStorage.setItem(STORAGE_KEYS.DCS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.FORECASTS)) localStorage.setItem(STORAGE_KEYS.FORECASTS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.SHIPMENTS)) localStorage.setItem(STORAGE_KEYS.SHIPMENTS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.MILESTONES)) localStorage.setItem(STORAGE_KEYS.MILESTONES, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.RECEIVING_INSPECTIONS)) localStorage.setItem(STORAGE_KEYS.RECEIVING_INSPECTIONS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) localStorage.setItem(STORAGE_KEYS.CLAIMS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSE_INVENTORY)) localStorage.setItem(STORAGE_KEYS.WAREHOUSE_INVENTORY, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_MUTATIONS)) localStorage.setItem(STORAGE_KEYS.STOCK_MUTATIONS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.TRANSPORTER_INVOICES)) localStorage.setItem(STORAGE_KEYS.TRANSPORTER_INVOICES, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
    return;
  }

  // If brand new session and not explicitly reset, initialize empty lists by default to start fresh
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGIONS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.DCS)) {
    localStorage.setItem(STORAGE_KEYS.DCS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSES)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FORECASTS)) {
    localStorage.setItem(STORAGE_KEYS.FORECASTS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIPMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.MILESTONES)) {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECEIVING_INSPECTIONS)) {
    localStorage.setItem(STORAGE_KEYS.RECEIVING_INSPECTIONS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) {
    localStorage.setItem(STORAGE_KEYS.CLAIMS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSE_INVENTORY)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSE_INVENTORY, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.STOCK_MUTATIONS)) {
    localStorage.setItem(STORAGE_KEYS.STOCK_MUTATIONS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSPORTER_INVOICES)) {
    localStorage.setItem(STORAGE_KEYS.TRANSPORTER_INVOICES, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
  }
};

export const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading key ${key} from storage:`, e);
    return fallback;
  }
};

export const setStored = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key} to storage:`, e);
  }
};

export { STORAGE_KEYS };
