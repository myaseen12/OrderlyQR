-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Custom Types and Enums
create type user_role as enum ('owner', 'admin', 'kitchen_staff');
create type order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled');

---------------------------------------------------------
-- PROFILES
---------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role user_role default 'kitchen_staff'::user_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

---------------------------------------------------------
-- RESTAURANTS
---------------------------------------------------------
create table public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  whatsapp_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on restaurants
alter table public.restaurants enable row level security;

---------------------------------------------------------
-- RESTAURANT MEMBERS
---------------------------------------------------------
create table public.restaurant_members (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role user_role not null default 'kitchen_staff'::user_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (restaurant_id, user_id)
);

-- Enable RLS on restaurant_members
alter table public.restaurant_members enable row level security;

---------------------------------------------------------
-- TABLES
---------------------------------------------------------
create table public.restaurant_tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_number text not null,
  qr_token text not null unique,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (restaurant_id, table_number)
);

-- Enable RLS on restaurant_tables
alter table public.restaurant_tables enable row level security;

---------------------------------------------------------
-- CATEGORIES
---------------------------------------------------------
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (restaurant_id, name)
);

-- Enable RLS on categories
alter table public.categories enable row level security;

---------------------------------------------------------
-- MENU ITEMS
---------------------------------------------------------
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_available boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on menu_items
alter table public.menu_items enable row level security;

---------------------------------------------------------
-- ADDONS (Extensibility Requirement)
---------------------------------------------------------
create table public.addon_groups (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  min_selection integer default 0 not null check (min_selection >= 0),
  max_selection integer default 1 not null check (max_selection >= min_selection),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.addon_groups enable row level security;

create table public.addon_items (
  id uuid default uuid_generate_v4() primary key,
  addon_group_id uuid references public.addon_groups(id) on delete cascade not null,
  name text not null,
  price numeric(10, 2) default 0.00 not null check (price >= 0),
  is_available boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.addon_items enable row level security;

create table public.menu_item_addons (
  menu_item_id uuid references public.menu_items(id) on delete cascade not null,
  addon_group_id uuid references public.addon_groups(id) on delete cascade not null,
  primary key (menu_item_id, addon_group_id)
);

alter table public.menu_item_addons enable row level security;

---------------------------------------------------------
-- ORDERS
---------------------------------------------------------
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  order_number varchar(20) not null, -- Monospace receipt layout (e.g. #ORD-0145)
  customer_name text,
  customer_phone text,
  status order_status default 'pending'::order_status not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= subtotal),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;

---------------------------------------------------------
-- ORDER ITEMS
---------------------------------------------------------
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name_snapshot text not null, -- Historical snapshot
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0), -- Historical snapshot
  quantity integer not null check (quantity > 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on order_items
alter table public.order_items enable row level security;

---------------------------------------------------------
-- ORDER ITEM ADDONS
---------------------------------------------------------
create table public.order_item_addons (
  id uuid default uuid_generate_v4() primary key,
  order_item_id uuid references public.order_items(id) on delete cascade not null,
  addon_item_id uuid references public.addon_items(id) on delete set null,
  addon_name_snapshot text not null,
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on order_item_addons
alter table public.order_item_addons enable row level security;


---------------------------------------------------------
-- INDEXES FOR PERFORMANCE AND DATA INTEGRITY
---------------------------------------------------------
create index idx_restaurants_slug on public.restaurants(slug);
create index idx_restaurant_members_user on public.restaurant_members(user_id);
create index idx_restaurant_members_restaurant on public.restaurant_members(restaurant_id);
create index idx_restaurant_tables_restaurant on public.restaurant_tables(restaurant_id);
create index idx_restaurant_tables_qr_token on public.restaurant_tables(qr_token);
create index idx_categories_restaurant on public.categories(restaurant_id);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_menu_items_category on public.menu_items(category_id);
create index idx_orders_restaurant on public.orders(restaurant_id);
create index idx_orders_table on public.orders(table_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_item_addons_item on public.order_item_addons(order_item_id);


---------------------------------------------------------
-- SECURE HELPER FUNCTIONS
---------------------------------------------------------

-- Check if user is a member of the given restaurant
create or replace function public.is_member_of_restaurant(restaurant_id uuid, user_id uuid)
returns boolean security definer stable as $$
begin
  return exists (
    select 1 
    from public.restaurant_members 
    where restaurant_members.restaurant_id = $1 
      and restaurant_members.user_id = $2
  );
end;
$$ language plpgsql;

-- Check if member has specific role(s) in the restaurant
create or replace function public.has_restaurant_role(restaurant_id uuid, user_id uuid, required_roles user_role[])
returns boolean security definer stable as $$
begin
  return exists (
    select 1 
    from public.restaurant_members 
    where restaurant_members.restaurant_id = $1 
      and restaurant_members.user_id = $2 
      and restaurant_members.role = any($3)
  );
end;
$$ language plpgsql;


---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
---------------------------------------------------------

-- 1. Profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Restaurants
create policy "Restaurants are publicly readable"
  on public.restaurants for select
  to public
  using (true);

create policy "Authenticated users can register a restaurant"
  on public.restaurants for insert
  to authenticated
  with check (true);

create policy "Owners and admins can update restaurant details"
  on public.restaurants for update
  using (public.has_restaurant_role(id, auth.uid(), array['owner'::user_role, 'admin'::user_role]));

-- 3. Restaurant Members
create policy "Members can view membership directory of their restaurant"
  on public.restaurant_members for select
  using (public.is_member_of_restaurant(restaurant_id, auth.uid()));

create policy "Users can insert their own memberships"
  on public.restaurant_members for insert
  with check (auth.uid() = user_id);

create policy "Owners can manage memberships"
  on public.restaurant_members for update, delete
  using (public.has_restaurant_role(restaurant_id, auth.uid(), array['owner'::user_role]));

-- 4. Restaurant Tables
create policy "Tables are publicly readable"
  on public.restaurant_tables for select
  to public
  using (true);

create policy "Owners and admins can manage tables"
  on public.restaurant_tables for all
  using (public.has_restaurant_role(restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role]));

-- 5. Categories
create policy "Categories are publicly readable"
  on public.categories for select
  to public
  using (is_active = true or public.is_member_of_restaurant(restaurant_id, auth.uid()));

create policy "Owners and admins can manage categories"
  on public.categories for all
  using (public.has_restaurant_role(restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role]));

-- 6. Menu Items
create policy "Menu items are publicly readable"
  on public.menu_items for select
  to public
  using (is_available = true or public.is_member_of_restaurant(restaurant_id, auth.uid()));

create policy "Owners and admins can manage menu items"
  on public.menu_items for all
  using (public.has_restaurant_role(restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role]));

-- Addon Policies
create policy "Addon groups are publicly readable"
  on public.addon_groups for select to public using (true);

create policy "Owners and admins can manage addon groups"
  on public.addon_groups for all using (public.has_restaurant_role(restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role]));

create policy "Addon items are publicly readable"
  on public.addon_items for select to public using (true);

create policy "Owners and admins can manage addon items"
  on public.addon_items for all using (
    exists (
      select 1 from public.addon_groups
      where addon_groups.id = addon_items.addon_group_id
        and public.has_restaurant_role(addon_groups.restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role])
    )
  );

create policy "Menu item addons are publicly readable"
  on public.menu_item_addons for select to public using (true);

create policy "Owners and admins can manage menu item addons"
  on public.menu_item_addons for all using (
    exists (
      select 1 from public.menu_items
      where menu_items.id = menu_item_addons.menu_item_id
        and public.has_restaurant_role(menu_items.restaurant_id, auth.uid(), array['owner'::user_role, 'admin'::user_role])
    )
  );

-- 7. Orders
create policy "Members can view and manage their restaurant's orders"
  on public.orders for all
  using (public.is_member_of_restaurant(restaurant_id, auth.uid()));

-- Customers placing orders
create policy "Customers can place orders"
  on public.orders for insert
  to public
  with check (
    -- Prevent ordering for cross-restaurant tables: The table must belong to the specified restaurant
    exists (
      select 1 
      from public.restaurant_tables 
      where restaurant_tables.id = table_id 
        and restaurant_tables.restaurant_id = restaurant_id
        and restaurant_tables.is_active = true
    )
  );

create policy "Customers can view their own order status"
  on public.orders for select
  to public
  using (
    public.is_member_of_restaurant(restaurant_id, auth.uid()) 
    or created_at > (now() - interval '24 hours')
  );

-- 8. Order Items
create policy "Members can view and manage order items"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders 
      where orders.id = order_items.order_id 
        and public.is_member_of_restaurant(orders.restaurant_id, auth.uid())
    )
  );

create policy "Customers can add items to their order"
  on public.order_items for insert
  to public
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.status = 'pending'
    )
  );

create policy "Customers can view their order items"
  on public.order_items for select
  to public
  using (true);

-- 9. Order Item Addons
create policy "Members can manage order item addons"
  on public.order_item_addons for all
  using (
    exists (
      select 1 from public.order_items
      join public.orders on orders.id = order_items.order_id
      where order_items.id = order_item_addons.order_item_id
        and public.is_member_of_restaurant(orders.restaurant_id, auth.uid())
    )
  );

create policy "Customers can add addons to their order items"
  on public.order_item_addons for insert
  to public
  with check (
    exists (
      select 1 from public.order_items
      join public.orders on orders.id = order_items.order_id
      where order_items.id = order_item_addons.order_item_id
        and orders.status = 'pending'
    )
  );

create policy "Customers can view their order item addons"
  on public.order_item_addons for select
  to public
  using (true);


---------------------------------------------------------
-- TRIGGERS & AUTOMATION
---------------------------------------------------------

-- Automatically create profile on auth user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'kitchen_staff'::user_role);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatically update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_menu_items_modtime
  before update on public.menu_items
  for each row execute procedure public.update_updated_at_column();

create trigger update_orders_modtime
  before update on public.orders
  for each row execute procedure public.update_updated_at_column();

---------------------------------------------------------
-- ORDER FEEDBACK & RATINGS
---------------------------------------------------------
create table if not exists public.order_feedback (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_feedback enable row level security;

create policy "Public can submit feedback for their order"
  on public.order_feedback for insert to public
  with check (exists (select 1 from public.orders where orders.id = order_feedback.order_id and orders.status = 'served'));

create policy "Public and members can view feedback"
  on public.order_feedback for select to public using (true);

---------------------------------------------------------
-- TABLE RESERVATIONS
---------------------------------------------------------
create table if not exists public.table_reservations (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text not null,
  party_size integer not null check (party_size > 0),
  reservation_time timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.table_reservations enable row level security;

create policy "Public can request table reservations"
  on public.table_reservations for insert to public with check (true);

create policy "Members can view and manage their restaurant reservations"
  on public.table_reservations for all
  using (public.is_member_of_restaurant(restaurant_id, auth.uid()));
