-- Revise RLS policy for selecting orders to prevent scraping historical customer data
DROP POLICY IF EXISTS "Customers can view their own order status" ON public.orders;
CREATE POLICY "Customers can view their own order status"
  ON public.orders FOR SELECT
  TO public
  USING (
    public.is_member_of_restaurant(restaurant_id, auth.uid()) 
    OR created_at > (now() - interval '24 hours')
  );

-- Revise RLS policy for order_items to only allow inserts if the parent order is still pending
DROP POLICY IF EXISTS "Customers can add items to their order" ON public.order_items;
CREATE POLICY "Customers can add items to their order"
  ON public.order_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.status = 'pending'
    )
  );

-- Revise RLS policy for order_item_addons to only allow inserts if the parent order is pending
DROP POLICY IF EXISTS "Customers can add addons to their order items" ON public.order_item_addons;
CREATE POLICY "Customers can add addons to their order items"
  ON public.order_item_addons FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_addons.order_item_id
        AND orders.status = 'pending'
    )
  );
