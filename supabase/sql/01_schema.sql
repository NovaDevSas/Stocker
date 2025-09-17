-- 01_schema.sql - Esquema Stocker con mejores prácticas de Supabase
-- Script consolidado para Supabase (SQL)
-- Incluye: multitenancy (companies), delivery/domicilios, media (imagenes/videos), roles por empresa,
-- auditoría, pagos básicos, soft deletes, helpers, triggers automáticos y buenas prácticas para RLS y Storage.
-- Ejecutar en el SQL Editor de Supabase como service_role. Hacer backup antes de aplicar en producción.

-- ========================================
-- 1) EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ========================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ========================================
-- 2) FUNCIONES AUXILIARES
-- ========================================

-- Función genérica para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Función para crear perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- ========================================
-- 3) TABLAS PRINCIPALES
-- ========================================

-- Tabla companies (multi-tenant)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  email text,
  phone text,
  address text,
  logo_url text,
  signature_url text,
  default_currency text not null default 'COP',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_companies_tax_id on public.companies (tax_id) where tax_id is not null;

-- Profiles (user metadata) — vinculado a auth.users con trigger automático
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text,
  is_admin boolean not null default false,
  signature_url text,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_profiles_username on public.profiles (username) where username is not null;

-- Roles globales de la aplicación
create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  permissions jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Asignación de roles globales a usuarios
create table if not exists public.app_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.app_roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

-- Roles por empresa (company membership)
create table if not exists public.company_user_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','MANAGER','STAFF','VIEWER')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists idx_company_user_roles_company on public.company_user_roles (company_id);
create index if not exists idx_company_user_roles_user on public.company_user_roles (user_id);

-- ========================================
-- 4) HELPERS Y VISTAS PARA AUTORIZACIÓN
-- ========================================

-- Vista para obtener las empresas del usuario actual
create or replace view public.current_user_companies as
select c.id, c.name, cur.role
from public.company_user_roles cur
join public.companies c on c.id = cur.company_id
where cur.user_id = auth.uid() and c.is_active = true;

-- Función para verificar roles en empresa
create or replace function public.has_company_role(target_company uuid, target_role text)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.company_user_roles r
    where r.user_id = auth.uid() 
    and r.company_id = target_company 
    and r.role = target_role
  );
$$;

-- NOTA: La función is_admin() se define en 02_policies.sql

-- ========================================
-- 5) AUDITORÍA
-- ========================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_company_date on public.audit_logs (company_id, created_at desc);
create index if not exists idx_audit_logs_user_date on public.audit_logs (user_id, created_at desc);
create index if not exists idx_audit_logs_table_record on public.audit_logs (table_name, record_id);

-- ========================================
-- 6) TABLAS DE NEGOCIO
-- ========================================

-- Categorías con company_id
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_categories_company_name on public.categories (company_id, name) where name is not null;
create index if not exists idx_categories_parent on public.categories (parent_id);

-- Products con company_id, SKU por company
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sku text,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  min_stock integer not null default 0,
  max_stock integer,
  unit text not null default 'unit',
  barcode text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_products_company_sku on public.products (company_id, sku) where sku is not null and deleted_at is null;
create index if not exists idx_products_name on public.products (company_id, name) where deleted_at is null;
create index if not exists idx_products_barcode on public.products (barcode) where barcode is not null;

-- Product media (imagenes/videos)
create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  media_type text not null check (media_type in ('IMAGE','VIDEO','DOCUMENT','OTHER')),
  storage_path text not null, -- ruta en Supabase Storage
  original_name text,
  mime_type text,
  file_size bigint,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_media_product on public.product_media (product_id);
create unique index if not exists ux_product_media_primary on public.product_media (product_id) where is_primary = true;

-- Warehouses con company_id
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  location text,
  address text,
  manager_id uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_warehouses_company_code on public.warehouses (company_id, code) where code is not null;

-- Inventory levels por almacén
create table if not exists public.inventory_levels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  available_quantity integer generated always as (quantity - reserved_quantity) stored,
  last_movement_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id)
);

create index if not exists idx_inventory_levels_product on public.inventory_levels (product_id);
create index if not exists idx_inventory_levels_warehouse on public.inventory_levels (warehouse_id);
create index if not exists idx_inventory_levels_low_stock on public.inventory_levels (product_id) where available_quantity <= 0;

-- Suppliers con company_id
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  tax_id text,
  email text,
  phone text,
  address text,
  contact_person text,
  payment_terms text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suppliers_company on public.suppliers (company_id);

-- Relación productos-proveedores
create table if not exists public.product_suppliers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_sku text,
  cost numeric(12,2),
  lead_time_days integer,
  min_order_quantity integer,
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, supplier_id)
);

-- Customers con company_id y direcciones (para domicilios)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  tax_id text,
  email text,
  phone text,
  customer_type text not null default 'INDIVIDUAL' check (customer_type in ('INDIVIDUAL','BUSINESS')),
  credit_limit numeric(12,2) default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_company on public.customers (company_id);
create index if not exists idx_customers_email on public.customers (email) where email is not null;

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  label text, -- e.g. "Casa", "Oficina"
  address text not null,
  city text,
  state text,
  postal_code text,
  country text default 'Colombia',
  lat numeric(10,7),
  lng numeric(10,7),
  delivery_instructions text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer on public.customer_addresses (customer_id);
create unique index if not exists ux_customer_addresses_primary on public.customer_addresses (customer_id) where is_primary = true;

-- ========================================
-- 7) MOVIMIENTOS DE STOCK
-- ========================================

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  movement_type text not null check (movement_type in ('IN','OUT','ADJUST','TRANSFER')),
  quantity integer not null check (quantity > 0),
  reference_type text, -- 'PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER'
  reference_id uuid, -- ID de la orden/documento relacionado
  unit_cost numeric(12,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product_warehouse on public.stock_movements (product_id, warehouse_id, created_at desc);
create index if not exists idx_stock_movements_reference on public.stock_movements (reference_type, reference_id);

-- ========================================
-- 8) ÓRDENES DE VENTA
-- ========================================

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_address_id uuid references public.customer_addresses(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','CONFIRMED','PICKING','READY_FOR_SHIPMENT','IN_TRANSIT','DELIVERED','CANCELLED')),
  created_by uuid not null references auth.users(id) on delete restrict,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'COP',
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING','PARTIAL','PAID','REFUNDED')),
  delivery_date timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_sales_orders_company_number on public.sales_orders (company_id, order_number);
create index if not exists idx_sales_orders_customer on public.sales_orders (customer_id);
create index if not exists idx_sales_orders_status on public.sales_orders (company_id, status);
create index if not exists idx_sales_orders_date on public.sales_orders (company_id, created_at desc);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  line_total numeric(12,2) generated always as (quantity * unit_price * (1 - discount_percent / 100)) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_order_items_order on public.sales_order_items (sales_order_id);
create index if not exists idx_sales_order_items_product on public.sales_order_items (product_id);

-- ========================================
-- 9) ÓRDENES DE COMPRA
-- ========================================

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number text not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','CONFIRMED','PARTIAL_RECEIVED','RECEIVED','CANCELLED')),
  created_by uuid not null references auth.users(id) on delete restrict,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'COP',
  expected_date timestamptz,
  received_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_purchase_orders_company_number on public.purchase_orders (company_id, order_number);
create index if not exists idx_purchase_orders_supplier on public.purchase_orders (supplier_id);
create index if not exists idx_purchase_orders_status on public.purchase_orders (company_id, status);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0,
  received_quantity integer not null default 0 check (received_quantity >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_order_items_order on public.purchase_order_items (purchase_order_id);

-- ========================================
-- 10) DELIVERIES / DOMICILIOS
-- ========================================

create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  vehicle_type text,
  license_plate text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_couriers_company on public.couriers (company_id);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  courier_id uuid references public.couriers(id) on delete set null,
  pickup_address text,
  delivery_address text not null,
  customer_name text,
  customer_phone text,
  pickup_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  status text not null default 'PENDING' check (status in ('PENDING','ASSIGNED','PICKED','IN_TRANSIT','DELIVERED','FAILED','CANCELLED')),
  tracking_code text,
  tracking_data jsonb, -- para geo/tiempos/updates
  delivery_fee numeric(12,2) default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deliveries_company_date on public.deliveries (company_id, created_at desc);
create index if not exists idx_deliveries_courier on public.deliveries (courier_id);
create unique index if not exists ux_deliveries_tracking on public.deliveries (tracking_code) where tracking_code is not null;

create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  event_type text not null,
  description text,
  location text,
  lat numeric(10,7),
  lng numeric(10,7),
  event_time timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_delivery_events_delivery on public.delivery_events (delivery_id, event_time desc);

-- ========================================
-- 11) STORAGE BUCKETS
-- ========================================

-- NOTA: La configuración de storage buckets se movió a 06_storage.sql
-- Ejecutar 06_storage.sql después de este script para configurar buckets y políticas

-- ========================================
-- 12) TRIGGERS
-- ========================================

-- Trigger para crear perfil automáticamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Triggers para updated_at
drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists app_roles_set_updated_at on public.app_roles;
create trigger app_roles_set_updated_at
  before update on public.app_roles
  for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists product_media_set_updated_at on public.product_media;
create trigger product_media_set_updated_at
  before update on public.product_media
  for each row execute function public.set_updated_at();

drop trigger if exists warehouses_set_updated_at on public.warehouses;
create trigger warehouses_set_updated_at
  before update on public.warehouses
  for each row execute function public.set_updated_at();

drop trigger if exists inventory_levels_set_updated_at on public.inventory_levels;
create trigger inventory_levels_set_updated_at
  before update on public.inventory_levels
  for each row execute function public.set_updated_at();

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

drop trigger if exists sales_orders_set_updated_at on public.sales_orders;
create trigger sales_orders_set_updated_at
  before update on public.sales_orders
  for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

drop trigger if exists couriers_set_updated_at on public.couriers;
create trigger couriers_set_updated_at
  before update on public.couriers
  for each row execute function public.set_updated_at();

drop trigger if exists deliveries_set_updated_at on public.deliveries;
create trigger deliveries_set_updated_at
  before update on public.deliveries
  for each row execute function public.set_updated_at();

-- ========================================
-- 13) FUNCIONES DE STOCK
-- ========================================

-- Función para aplicar movimientos de stock
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer as $$
declare
  v_current integer;
  v_new integer;
begin
  -- Obtener cantidad actual
  select quantity into v_current
  from public.inventory_levels
  where product_id = new.product_id and warehouse_id = new.warehouse_id
  for update;

  if v_current is null then v_current := 0; end if;

  -- Calcular nueva cantidad
  if new.movement_type = 'IN' then
    v_new := v_current + new.quantity;
  elsif new.movement_type = 'OUT' then
    if v_current < new.quantity then
      raise exception 'Stock insuficiente. Disponible: %, Requerido: %', v_current, new.quantity;
    end if;
    v_new := v_current - new.quantity;
  else -- ADJUST
    v_new := new.quantity;
  end if;

  -- Actualizar o insertar nivel de inventario
  insert into public.inventory_levels (product_id, warehouse_id, quantity, last_movement_at)
  values (new.product_id, new.warehouse_id, v_new, now())
  on conflict (product_id, warehouse_id)
  do update set 
    quantity = excluded.quantity,
    last_movement_at = excluded.last_movement_at,
    updated_at = now();

  return new;
end;
$$;

-- Trigger para aplicar movimientos de stock
drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ========================================
-- FINALIZACIÓN
-- ========================================

-- Mensaje de confirmación
select 'Esquema Stocker creado exitosamente con mejores prácticas de Supabase' as status;
