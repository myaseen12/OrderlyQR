-- =========================================================
-- MIGRATION: V3 Platform Architecture (Branches, Inventory, CRM, Loyalty, Audit, Feature Flags)
-- =========================================================

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage their restaurant branches"
  ON public.branches FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));

CREATE POLICY "Public can view active branches"
  ON public.branches FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Order Source Field on Orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_source text DEFAULT 'qr' CHECK (order_source IN ('qr', 'counter', 'waiter', 'online', 'phone')),
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- 3. Customer CRM & Loyalty Table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  points integer DEFAULT 0 NOT NULL,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'vip')),
  total_spent numeric(10,2) DEFAULT 0.00 NOT NULL,
  visit_count integer DEFAULT 1 NOT NULL,
  last_visit timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_customer_phone_per_restaurant UNIQUE (restaurant_id, phone)
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view and manage restaurant customer CRM"
  ON public.customer_profiles FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));

-- 4. Inventory & Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text DEFAULT 'unit' NOT NULL,
  current_stock numeric(10,2) DEFAULT 0.00 NOT NULL,
  min_stock_alert numeric(10,2) DEFAULT 5.00 NOT NULL,
  unit_cost numeric(10,2) DEFAULT 0.00 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage inventory items"
  ON public.inventory_items FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));

-- 5. Audit Logging Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));

-- 6. Restaurant Feature Flags & Settings
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enable_loyalty boolean DEFAULT true NOT NULL,
  enable_reservations boolean DEFAULT true NOT NULL,
  enable_inventory boolean DEFAULT true NOT NULL,
  enable_ai boolean DEFAULT true NOT NULL,
  enable_payments boolean DEFAULT true NOT NULL,
  enable_multi_branch boolean DEFAULT true NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view restaurant settings"
  ON public.restaurant_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Members can manage restaurant settings"
  ON public.restaurant_settings FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));
