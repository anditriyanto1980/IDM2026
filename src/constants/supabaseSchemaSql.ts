export const SUPABASE_PHASE1_SQL = `-- ====================================================================
-- AKRAM DISTRIBUTION TRACKING SYSTEM - DATABASE SCHEMA (PHASE 1, 2, 3, 4, 5 & 6)
-- PostgreSQL / Supabase Migration
-- ====================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLE: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGEMENT', 'SALES', 'WAREHOUSE', 'LOGISTICS', 'RECEIVING')),
    avatar_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE TABLE: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE TABLE: products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE TABLE: regions
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code TEXT UNIQUE NOT NULL,
    region_name TEXT NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CREATE TABLE: distribution_centers
CREATE TABLE IF NOT EXISTS public.distribution_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dc_code TEXT UNIQUE NOT NULL,
    dc_name TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
    address TEXT NULL,
    pic_name TEXT NULL,
    pic_phone TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CREATE TABLE: forecasts (Phase 2)
CREATE TABLE IF NOT EXISTS public.forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    dc_id UUID NOT NULL REFERENCES public.distribution_centers(id) ON DELETE RESTRICT,
    region_id UUID NULL REFERENCES public.regions(id) ON DELETE SET NULL,
    period TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    target_delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'FORECAST' CHECK (status IN ('FORECAST', 'PLANNED', 'PARTIAL', 'IN_TRANSIT', 'RECEIVED', 'OVERDUE', 'CANCELLED')),
    notes TEXT NULL,
    total_qty INTEGER NOT NULL DEFAULT 0 CHECK (total_qty >= 0),
    total_shipped INTEGER NOT NULL DEFAULT 0 CHECK (total_shipped >= 0),
    total_received INTEGER NOT NULL DEFAULT 0 CHECK (total_received >= 0),
    outstanding_qty INTEGER NOT NULL DEFAULT 0 CHECK (outstanding_qty >= 0),
    created_by TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CREATE TABLE: forecast_items (Phase 2)
CREATE TABLE IF NOT EXISTS public.forecast_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_id UUID NOT NULL REFERENCES public.forecasts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_forecast INTEGER NOT NULL DEFAULT 0 CHECK (qty_forecast >= 0),
    qty_shipped INTEGER NOT NULL DEFAULT 0 CHECK (qty_shipped >= 0),
    qty_received INTEGER NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
    unit TEXT NOT NULL DEFAULT 'PCS',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CREATE TABLE: shipments (Phase 3)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_number TEXT UNIQUE NOT NULL,
    forecast_id UUID NULL REFERENCES public.forecasts(id) ON DELETE SET NULL,
    forecast_number TEXT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    dc_id UUID NOT NULL REFERENCES public.distribution_centers(id) ON DELETE RESTRICT,
    region_id UUID NULL REFERENCES public.regions(id) ON DELETE SET NULL,
    shipment_date DATE NOT NULL,
    estimated_arrival_date DATE NOT NULL,
    actual_arrival_date DATE NULL,
    origin_warehouse TEXT NOT NULL,
    transporter_name TEXT NOT NULL,
    driver_name TEXT NULL,
    driver_phone TEXT NULL,
    vehicle_plate_number TEXT NULL,
    tracking_number_ref TEXT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'READY_TO_DISPATCH' CHECK (status IN ('DRAFT', 'READY_TO_DISPATCH', 'IN_TRANSIT', 'ARRIVED_DC', 'DELIVERED', 'CANCELLED')),
    total_qty INTEGER NOT NULL DEFAULT 0 CHECK (total_qty >= 0),
    created_by TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CREATE TABLE: shipment_items (Phase 3)
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    forecast_item_id UUID NULL REFERENCES public.forecast_items(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_shipped INTEGER NOT NULL DEFAULT 0 CHECK (qty_shipped >= 0),
    unit TEXT NOT NULL DEFAULT 'PCS',
    batch_number TEXT NULL,
    expiry_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. CREATE TABLE: shipment_milestones (Phase 4 Tracking)
CREATE TABLE IF NOT EXISTS public.shipment_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    latitude NUMERIC(10, 6) NULL,
    longitude NUMERIC(10, 6) NULL
);

-- 12. CREATE TABLE: receiving_inspections (Phase 4 Receiving & BAST)
CREATE TABLE IF NOT EXISTS public.receiving_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bast_number TEXT UNIQUE NOT NULL,
    shipment_id UUID UNIQUE NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
    shipment_number TEXT NOT NULL,
    forecast_id UUID NULL REFERENCES public.forecasts(id) ON DELETE SET NULL,
    forecast_number TEXT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    dc_id UUID NOT NULL REFERENCES public.distribution_centers(id) ON DELETE RESTRICT,
    received_date DATE NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_role TEXT NOT NULL DEFAULT 'Petugas Inbound Receiving DC',
    receiver_nip TEXT NULL,
    driver_name TEXT NULL,
    warehouse_supervisor_name TEXT NULL,
    total_shipped_qty INTEGER NOT NULL DEFAULT 0,
    total_good_qty INTEGER NOT NULL DEFAULT 0,
    total_damaged_qty INTEGER NOT NULL DEFAULT 0,
    total_shortage_qty INTEGER NOT NULL DEFAULT 0,
    discrepancy_status TEXT NOT NULL DEFAULT 'CLEAN_PASS' CHECK (discrepancy_status IN ('CLEAN_PASS', 'PARTIAL_DAMAGE', 'SHORTAGE', 'REJECTED')),
    general_notes TEXT NULL,
    proof_attachment_name TEXT NULL,
    proof_attachment_url TEXT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. CREATE TABLE: receiving_inspection_items (Phase 4 BAST items)
CREATE TABLE IF NOT EXISTS public.receiving_inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.receiving_inspections(id) ON DELETE CASCADE,
    shipment_item_id UUID NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    qty_shipped INTEGER NOT NULL DEFAULT 0,
    qty_good INTEGER NOT NULL DEFAULT 0,
    qty_damaged INTEGER NOT NULL DEFAULT 0,
    qty_shortage INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'PCS',
    damage_reason TEXT NULL,
    expiry_date_verified DATE NULL,
    batch_number_verified TEXT NULL
);

-- 14. CREATE TABLE: central_warehouse_inventory
CREATE TABLE IF NOT EXISTS public.central_warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_code TEXT NOT NULL,
    warehouse_name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    stock_on_hand INTEGER NOT NULL DEFAULT 0,
    stock_reserved INTEGER NOT NULL DEFAULT 0,
    stock_available INTEGER NOT NULL DEFAULT 0,
    safety_stock INTEGER NOT NULL DEFAULT 5000,
    reorder_point INTEGER NOT NULL DEFAULT 10000,
    stock_status TEXT NOT NULL DEFAULT 'OPTIMAL',
    last_audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_wh_sku UNIQUE (warehouse_code, sku)
);

-- 15. CREATE TABLE: stock_mutations
CREATE TABLE IF NOT EXISTS public.stock_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mutation_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mutation_type TEXT NOT NULL CHECK (mutation_type IN ('INBOUND_PRODUCTION', 'OUTBOUND_SHIPMENT', 'RETURN_BAST', 'DAMAGE_DISPOSAL', 'ADJUSTMENT_AUDIT')),
    warehouse_code TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    reference_doc_type TEXT NOT NULL,
    reference_doc_number TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    notes TEXT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CREATE TABLE: transporter_invoices
CREATE TABLE IF NOT EXISTS public.transporter_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    transporter_name TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_month TEXT NOT NULL,
    total_shipments INTEGER NOT NULL DEFAULT 1,
    gross_freight_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    claim_deductions NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_payable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'PAID', 'DISPUTED')),
    payment_reference TEXT NULL,
    payment_date TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CREATE TABLE: transporter_invoice_items
CREATE TABLE IF NOT EXISTS public.transporter_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.transporter_invoices(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
    shipment_number TEXT NOT NULL,
    dc_name TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    shipped_date DATE NOT NULL,
    received_date DATE NULL,
    weight_or_boxes INTEGER NOT NULL,
    freight_rate NUMERIC(15,2) NOT NULL,
    freight_amount NUMERIC(15,2) NOT NULL,
    has_claim BOOLEAN NOT NULL DEFAULT FALSE,
    claim_deduction NUMERIC(15,2) NOT NULL DEFAULT 0,
    claim_number TEXT NULL
);

-- 18. CREATE TABLE: logistics_notifications
CREATE TABLE IF NOT EXISTS public.logistics_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL', 'SYSTEM')),
    recipient_name TEXT NOT NULL,
    recipient_contact TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DELIVERED',
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. CREATE TABLE: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id UUID NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_forecasts_period ON public.forecasts(period);
CREATE INDEX IF NOT EXISTS idx_forecasts_customer ON public.forecasts(customer_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_dc ON public.forecasts(dc_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON public.shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_dc ON public.shipments(dc_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_milestones_shipment ON public.shipment_milestones(shipment_id);
CREATE INDEX IF NOT EXISTS idx_inspections_shipment ON public.receiving_inspections(shipment_id);
CREATE INDEX IF NOT EXISTS idx_inspections_dc ON public.receiving_inspections(dc_id);
CREATE INDEX IF NOT EXISTS idx_inventory_wh_sku ON public.central_warehouse_inventory(warehouse_code, sku);
CREATE INDEX IF NOT EXISTS idx_mutations_wh_date ON public.stock_mutations(warehouse_code, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_transporter ON public.transporter_invoices(transporter_name);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiving_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiving_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_logistics()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'WAREHOUSE', 'LOGISTICS') AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_receiving()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'WAREHOUSE', 'RECEIVING') AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Read policies for authenticated users
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read distribution_centers" ON public.distribution_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read forecasts" ON public.forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read forecast_items" ON public.forecast_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read shipments" ON public.shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read shipment_items" ON public.shipment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read milestones" ON public.shipment_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read inspections" ON public.receiving_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read inspection_items" ON public.receiving_inspection_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read inventory" ON public.central_warehouse_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mutations" ON public.stock_mutations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read invoices" ON public.transporter_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read invoice_items" ON public.transporter_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read notifications" ON public.logistics_notifications FOR SELECT TO authenticated USING (true);

-- Manage policies
CREATE POLICY "Admin full access customers" ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access regions" ON public.regions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access distribution_centers" ON public.distribution_centers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access users" ON public.users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Logistics and Warehouse manage shipments" ON public.shipments FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics and Warehouse manage shipment_items" ON public.shipment_items FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics and Warehouse manage milestones" ON public.shipment_milestones FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics and Warehouse manage inventory" ON public.central_warehouse_inventory FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics and Warehouse manage mutations" ON public.stock_mutations FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics manage invoices" ON public.transporter_invoices FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics manage invoice_items" ON public.transporter_invoice_items FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Logistics manage notifications" ON public.logistics_notifications FOR ALL TO authenticated USING (public.can_manage_logistics()) WITH CHECK (public.can_manage_logistics());
CREATE POLICY "Receiving manage inspections" ON public.receiving_inspections FOR ALL TO authenticated USING (public.can_manage_receiving()) WITH CHECK (public.can_manage_receiving());
CREATE POLICY "Receiving manage inspection items" ON public.receiving_inspection_items FOR ALL TO authenticated USING (public.can_manage_receiving()) WITH CHECK (public.can_manage_receiving());
CREATE POLICY "Users can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
`;
