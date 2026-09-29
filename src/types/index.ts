export type UserRole =
  | 'ADMIN'
  | 'MANAGEMENT'
  | 'SALES'
  | 'WAREHOUSE'
  | 'LOGISTICS'
  | 'RECEIVING';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed / aggregated
  dc_count?: number;
}

export interface Product {
  id: string;
  sku: string;
  product_name: string;
  description?: string | null;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  region_code: string;
  region_name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  dc_count?: number;
}

export interface DistributionCenter {
  id: string;
  dc_code: string;
  dc_name: string;
  customer_id: string;
  region_id: string;
  city: string;
  province: string;
  address?: string | null;
  pic_name?: string | null;
  pic_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  region?: Region;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email?: string;
  user_role?: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DEACTIVATE' | 'ACTIVATE';
  module:
    | 'AUTH'
    | 'CUSTOMERS'
    | 'PRODUCTS'
    | 'REGIONS'
    | 'DISTRIBUTION_CENTERS'
    | 'USERS'
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
    | 'DISPATCH';
  record_id?: string | null;
  description: string;
  created_at: string;
}

export type ForecastStatus =
  | 'FORECAST'
  | 'PLANNED'
  | 'PARTIAL'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'OVERDUE'
  | 'CANCELLED';

export interface ForecastItem {
  id: string;
  forecast_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_forecast: number;
  qty_shipped: number;
  qty_received: number;
  unit: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Forecast {
  id: string;
  forecast_number: string;
  customer_id: string;
  dc_id: string;
  region_id: string;
  period: string; // e.g. "2026-09"
  forecast_date: string;
  target_delivery_date: string;
  notes?: string | null;
  status: ForecastStatus;
  total_qty: number;
  total_shipped: number;
  allocated_qty?: number;
  total_received: number;
  outstanding_qty: number;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  dc?: DistributionCenter;
  region?: Region;
  items?: ForecastItem[];
}

export interface ExcelForecastRow {
  rowNumber: number;
  customerCode: string;
  period: string;
  forecastDate: string;
  dcCode: string;
  sku: string;
  qty: number;
  targetDelivery: string;
  notes?: string;
  // Validation status
  isValid: boolean;
  errors: string[];
}

export interface AuthSession {
  user: User;
  token?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ==========================================
// PHASE 3: SHIPMENT & SURAT JALAN TYPES
// ==========================================

export type ShipmentStatus =
  | 'DRAFT'
  | 'READY_TO_DISPATCH'
  | 'IN_TRANSIT'
  | 'ARRIVED_DC'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  forecast_item_id?: string | null;
  product_id: string;
  sku: string;
  product_name: string;
  qty_shipped: number;
  unit: string;
  batch_number?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  shipment_number: string; // e.g. "SJ-202609-0001"
  forecast_id?: string | null;
  forecast_number?: string | null;
  customer_id: string;
  dc_id: string;
  region_id: string;
  shipment_date: string; // YYYY-MM-DD
  estimated_arrival_date: string; // YYYY-MM-DD
  actual_arrival_date?: string | null;
  origin_warehouse: string; // e.g. "Gudang Pusat Akram Cikarang"
  transporter_name: string; // e.g. "Dakota Cargo", "JNE Trucking", "Armada Sendiri"
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_plate_number?: string | null; // e.g. "B 9481 UXY"
  tracking_number_ref?: string | null; // No. Resi / AWB
  notes?: string | null;
  status: ShipmentStatus;
  total_qty: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: Customer;
  dc?: DistributionCenter;
  region?: Region;
  forecast?: Forecast;
  items?: ShipmentItem[];
}

export interface CreateShipmentPayload {
  forecast_id?: string;
  forecast_number?: string;
  customer_id: string;
  dc_id: string;
  region_id?: string;
  shipment_date: string;
  estimated_arrival_date: string;
  origin_warehouse: string;
  transporter_name: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_plate_number?: string;
  tracking_number_ref?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    forecast_item_id?: string;
    qty_shipped: number;
    unit?: string;
    batch_number?: string;
    expiry_date?: string;
    notes?: string;
  }>;
}

// ==========================================
// PHASE 4: TRACKING & RECEIVING (BAST) TYPES
// ==========================================

export type MilestoneType =
  | 'ORDER_CONFIRMED'
  | 'PICKING_LOADING'
  | 'DEPARTED_WAREHOUSE'
  | 'IN_TRANSIT_CHECKPOINT'
  | 'ARRIVED_DC_GATE'
  | 'UNLOADING_INSPECTION'
  | 'COMPLETED_RECEIVED'
  | 'EXCEPTION_DELAY';

export interface ShipmentMilestone {
  id: string;
  shipment_id: string;
  milestone_type: MilestoneType;
  title: string;
  location: string;
  notes?: string | null;
  timestamp: string;
  recorded_by: string;
  is_completed: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export type DiscrepancyStatus =
  | 'CLEAN_PASS'
  | 'PARTIAL_DAMAGE'
  | 'SHORTAGE'
  | 'REJECTED';

export interface ReceivingInspectionItem {
  id: string;
  inspection_id: string;
  shipment_item_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_shipped: number;
  qty_good: number;
  qty_damaged: number;
  qty_shortage: number;
  unit: string;
  damage_reason?: string | null;
  expiry_date_verified?: string | null;
  batch_number_verified?: string | null;
}

export interface ReceivingInspection {
  id: string;
  bast_number: string; // e.g. "BAST-202609-0001"
  shipment_id: string;
  shipment_number: string;
  forecast_id?: string | null;
  forecast_number?: string | null;
  customer_id: string;
  dc_id: string;
  received_date: string; // YYYY-MM-DD
  receiver_name: string;
  receiver_role: string;
  receiver_nip?: string | null;
  driver_name?: string | null;
  driver_plate_number?: string | null;
  warehouse_supervisor_name?: string | null;
  total_shipped_qty: number;
  total_good_qty: number;
  total_damaged_qty: number;
  total_shortage_qty: number;
  // Aliases for compatibility
  total_qty_shipped?: number;
  total_qty_good?: number;
  total_qty_damaged?: number;
  total_qty_shortage?: number;
  inspection_date?: string;
  notes?: string | null;
  receiving_duration_hours?: number;
  discrepancy_status: DiscrepancyStatus;
  general_notes?: string | null;
  proof_attachment_name?: string | null;
  proof_attachment_url?: string | null;
  signed_at: string;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: Customer;
  dc?: DistributionCenter;
  shipment?: Shipment;
  items: ReceivingInspectionItem[];
}

export interface CreateReceivingPayload {
  shipment_id: string;
  received_date: string;
  receiver_name: string;
  receiver_role?: string;
  receiver_nip?: string;
  driver_name?: string;
  warehouse_supervisor_name?: string;
  general_notes?: string;
  proof_attachment_name?: string;
  proof_attachment_url?: string;
  items: Array<{
    shipment_item_id: string;
    product_id: string;
    sku: string;
    product_name: string;
    qty_shipped: number;
    qty_good: number;
    qty_damaged: number;
    qty_shortage: number;
    unit: string;
    damage_reason?: string;
    expiry_date_verified?: string;
    batch_number_verified?: string;
  }>;
}

// ==========================================
// PHASE 6: CLAIMS & BATCH TRACEABILITY TYPES
// ==========================================

export type ClaimStatus =
  | 'SUBMITTED'
  | 'INVESTIGATING'
  | 'APPROVED'
  | 'REPLACED'
  | 'SETTLED'
  | 'REJECTED';

export type ClaimResolutionType =
  | 'REPLACEMENT_SHIPMENT'
  | 'CREDIT_NOTE'
  | 'INSURANCE_CLAIM'
  | 'REJECTED';

export type ResponsibleParty =
  | 'TRANSPORTER'
  | 'ORIGIN_WAREHOUSE'
  | 'DESTINATION_DC'
  | 'FORCE_MAJEURE';

export interface ClaimItem {
  id: string;
  claim_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_damaged: number;
  qty_shortage: number;
  unit_price_estimate: number;
  subtotal_loss_estimate: number;
  unit: string;
  damage_reason?: string | null;
  batch_number?: string | null;
}

export interface DiscrepancyClaim {
  id: string;
  claim_number: string; // e.g. "CLM-202609-0001"
  bast_id: string;
  bast_number: string;
  shipment_id: string;
  shipment_number: string;
  customer_id: string;
  dc_id: string;
  claim_date: string; // YYYY-MM-DD
  responsible_party: ResponsibleParty;
  total_damaged_qty: number;
  total_shortage_qty: number;
  estimated_loss_amount: number;
  resolution_type?: ClaimResolutionType | null;
  replacement_shipment_number?: string | null;
  status: ClaimStatus;
  investigation_notes?: string | null;
  resolution_notes?: string | null;
  evidence_photo_url?: string | null;
  settled_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: Customer;
  dc?: DistributionCenter;
  shipment?: Shipment;
  items: ClaimItem[];
}

export interface CreateClaimPayload {
  bast_id: string;
  claim_date: string;
  responsible_party: ResponsibleParty;
  investigation_notes?: string;
  items: Array<{
    product_id: string;
    sku: string;
    product_name: string;
    qty_damaged: number;
    qty_shortage: number;
    unit_price_estimate?: number;
    unit: string;
    damage_reason?: string;
    batch_number?: string;
  }>;
}

export interface BatchTraceItem {
  batch_number: string;
  sku: string;
  product_name: string;
  production_date: string;
  expiry_date: string;
  total_produced_qty: number;
  total_shipped_qty: number;
  total_received_good_qty: number;
  total_damaged_qty: number;
  warehouse_stock_balance: number;
  remaining_shelf_life_days: number;
  shelf_life_status: 'FRESH' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

// ==========================================
// PHASE 6: CONTROL TOWER, WAREHOUSE INVENTORY & FREIGHT INVOICING
// ==========================================

export type WarehouseLocationCode = 'WH_CIKARANG' | 'WH_MARUNDA' | 'WH_SURABAYA' | (string & {});

export interface WarehouseLocation {
  code: WarehouseLocationCode;
  name: string;
  city: string;
  province: string;
  type: 'CENTRAL_HUB' | 'BUFFER_HUB' | 'TRANSIT_HUB';
  capacity_boxes: number;
  pic_name: string;
  pic_phone: string;
}

export interface WarehouseInventory {
  id: string;
  warehouse_code: WarehouseLocationCode;
  warehouse_name: string;
  product_id: string;
  sku: string;
  product_name: string;
  unit: string;
  stock_on_hand: number; // Physical stock in warehouse
  stock_reserved: number; // Allocated to active approved forecasts / open shipments
  stock_available: number; // Available to Promise (ATP) = On Hand - Reserved
  safety_stock: number; // Minimum buffer threshold
  reorder_point: number; // Replenishment trigger point
  stock_status: 'OPTIMAL' | 'REORDER_POINT' | 'CRITICAL_LOW' | 'OVERSTOCK';
  last_audit_date: string;
  updated_at: string;
}

export type StockMutationType =
  | 'INBOUND_PRODUCTION'
  | 'OUTBOUND_SHIPMENT'
  | 'RETURN_BAST'
  | 'DAMAGE_DISPOSAL'
  | 'ADJUSTMENT_AUDIT';

export interface StockMutation {
  id: string;
  mutation_number: string; // e.g. "MUT-202609-0001"
  date: string;
  mutation_type: StockMutationType;
  warehouse_code: WarehouseLocationCode;
  product_id: string;
  sku: string;
  product_name: string;
  qty: number; // positive for inbound, negative for outbound/loss
  unit: string;
  reference_doc_type: 'SURAT_JALAN' | 'BAST' | 'PRODUCTION_BATCH' | 'AUDIT_BA';
  reference_doc_number: string;
  batch_number: string;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateStockMutationPayload {
  mutation_type: StockMutationType;
  warehouse_code: WarehouseLocationCode;
  product_id: string;
  sku: string;
  product_name: string;
  qty: number;
  unit: string;
  reference_doc_type: 'SURAT_JALAN' | 'BAST' | 'PRODUCTION_BATCH' | 'AUDIT_BA';
  reference_doc_number: string;
  batch_number: string;
  notes?: string;
}

export type TransporterInvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'PAID'
  | 'DISPUTED';

export interface TransporterInvoiceItem {
  id: string;
  invoice_id: string;
  shipment_id: string;
  shipment_number: string; // Surat Jalan Number
  dc_name: string;
  destination_city: string;
  shipped_date: string;
  received_date?: string | null;
  weight_or_boxes: number;
  freight_rate: number;
  freight_amount: number;
  has_claim: boolean;
  claim_deduction: number;
  claim_number?: string | null;
}

export interface TransporterInvoice {
  id: string;
  invoice_number: string; // e.g. "INV-DKT-202609-001"
  transporter_name: string;
  invoice_date: string;
  due_date: string;
  period_month: string; // "2026-09"
  total_shipments: number;
  gross_freight_amount: number;
  claim_deductions: number;
  net_payable_amount: number;
  status: TransporterInvoiceStatus;
  payment_reference?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: TransporterInvoiceItem[];
}

export type NotificationChannel = 'WHATSAPP' | 'EMAIL' | 'SYSTEM';
export type NotificationEventType =
  | 'FORECAST_APPROVED'
  | 'SHIPMENT_DISPATCHED'
  | 'TRANSIT_CHECKPOINT'
  | 'DC_ARRIVED'
  | 'BAST_COMPLETED'
  | 'CLAIM_RAISED'
  | 'STOCK_ALERT';

export interface LogisticsNotification {
  id: string;
  event_type: NotificationEventType;
  title: string;
  message: string;
  channel: NotificationChannel;
  recipient_name: string;
  recipient_contact: string; // Phone / WhatsApp number or email
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  reference_type: 'FORECAST' | 'SHIPMENT' | 'BAST' | 'CLAIM' | 'INVENTORY';
  reference_id: string;
  reference_number: string;
  sent_at: string;
}

export interface LogisticsCorridor {
  id: string;
  code: string;
  name: string;
  origin_hub: string;
  destination_region: string;
  covered_dcs: string[];
  distance_km: number;
  normal_transit_hours: number;
  active_trucks_count: number;
  delayed_trucks_count: number;
  corridor_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  status_note: string;
  toll_route: string;
}

export interface ControlTowerKPI {
  active_shipments_in_transit: number;
  total_boxes_on_the_road: number;
  national_otif_rate: number; // On-Time In-Full percentage
  avg_dc_receiving_hours: number;
  central_warehouse_atp_boxes: number;
  unsettled_claims_count: number;
  high_risk_corridors_count: number;
  pending_freight_invoices_count: number;
}

export interface AiLogisticsAdvice {
  id: string;
  title: string;
  category: 'BOTTLENECK' | 'DEMAND_SURGE' | 'REALLOCATION' | 'CARRIER_SLA';
  urgency: 'HIGH' | 'MEDIUM' | 'INFO';
  summary: string;
  recommendations: string[];
  affected_entities: string[];
  estimated_impact: string;
  created_at: string;
}





