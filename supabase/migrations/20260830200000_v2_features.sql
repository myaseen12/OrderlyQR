-- =========================================================
-- MIGRATION: V2 Features (Payments, Feedback, Reservations)
-- =========================================================

-- 1. Payment Fields on Orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'counter' CHECK (payment_method IN ('counter', 'online')),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_transaction_id text;

-- 2. Customer Feedback & Ratings Table
CREATE TABLE IF NOT EXISTS public.order_feedback (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

-- Feedback RLS Policies
CREATE POLICY "Public can submit feedback for their order"
  ON public.order_feedback FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_feedback.order_id
        AND orders.status = 'served'
    )
  );

CREATE POLICY "Public and members can view feedback"
  ON public.order_feedback FOR SELECT
  TO public
  USING (true);

-- 3. Table Reservations Module
CREATE TABLE IF NOT EXISTS public.table_reservations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  party_size integer NOT NULL CHECK (party_size > 0),
  reservation_time timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Reservations RLS Policies
CREATE POLICY "Public can request table reservations"
  ON public.table_reservations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Members can view and manage their restaurant reservations"
  ON public.table_reservations FOR ALL
  USING (public.is_member_of_restaurant(restaurant_id, auth.uid()));
