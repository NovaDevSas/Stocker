-- 01_schema.sql — Esquema inicial de Stocker
-- Ejecuta este script primero en el SQL Editor de tu proyecto Supabase

-- Extensiones necesarias
create extension if not exists "pgcrypto";

-- Función y trigger para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tabla de perfiles (vinculada a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Productos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_name on public.products (name);
create index if not exists idx_products_sku on public.products (sku);

create or replace trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Proveedores
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- Relación producto-proveedor (N:M)
create table if not exists public.product_suppliers (
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, supplier_id)
);

-- Movimientos de inventario
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('IN','OUT','ADJUST')),
  quantity integer not null check (quantity > 0),
  notes text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product_date
  on public.stock_movements (product_id, created_at desc);

-- PATCHES 2025-08-24-b — Imágenes de productos y firmas en usuarios/empresas

-- Firma de usuario (profiles)
alter table if exists public.profiles
  add column if not exists signature_url text;

-- Empresas (Companies)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  email text,
  phone text,
  address text,
  logo_url text,
  signature_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_companies_tax_id on public.companies (tax_id) where tax_id is not null;

create or replace trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- Imágenes de productos (múltiples imágenes por producto)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images (product_id);
create index if not exists idx_product_images_sort on public.product_images (product_id, sort_order);
create unique index if not exists ux_product_images_primary on public.product_images (product_id) where is_primary;

create or replace trigger product_images_set_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

-- Almacenes (Warehouses)
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger warehouses_set_updated_at
before update on public.warehouses
for each row execute function public.set_updated_at();

-- Niveles de inventario por almacén y producto
create table if not exists public.inventory_levels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id)
);

create index if not exists idx_inventory_levels_product on public.inventory_levels (product_id);
create index if not exists idx_inventory_levels_warehouse on public.inventory_levels (warehouse_id);

create or replace trigger inventory_levels_set_updated_at
before update on public.inventory_levels
for each row execute function public.set_updated_at();

-- Clientes
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_customers_email on public.customers (email) where email is not null;

create or replace trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- Pedidos de venta (Sales Orders)
create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null check (status in ('DRAFT','CONFIRMED','SHIPPED','CANCELLED')),
  created_by uuid references auth.users(id) on delete set null,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_orders_customer_date on public.sales_orders (customer_id, created_at desc);

create or replace trigger sales_orders_set_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

-- Ítems de pedidos de venta
create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_order_items_order on public.sales_order_items (sales_order_id);
create index if not exists idx_sales_order_items_product on public.sales_order_items (product_id);

-- Órdenes de compra (Purchase Orders)
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null check (status in ('DRAFT','ORDERED','RECEIVED','CANCELLED')),
  created_by uuid references auth.users(id) on delete set null,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchase_orders_supplier_date on public.purchase_orders (supplier_id, created_at desc);

create or replace trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

-- Ítems de órdenes de compra
create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_order_items_order on public.purchase_order_items (purchase_order_id);
create index if not exists idx_purchase_order_items_product on public.purchase_order_items (product_id);

-- PATCHES 2025-08-24-c — Buckets de Storage
-- Nota: estos inserts son idempotentes gracias a ON CONFLICT DO NOTHING
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('user-signatures', 'user-signatures', false)
on conflict (id) do nothing;

-- PATCHES 2025-08-24-e — stock_movements: warehouse_id + trigger de sincronización con inventory_levels
-- Agrega la columna warehouse_id (idempotente)
alter table if exists public.stock_movements
  add column if not exists warehouse_id uuid references public.warehouses(id) on delete cascade;

-- Índice compuesto para consultas por producto+almacén+fecha
create index if not exists idx_stock_movements_prod_wh_date
  on public.stock_movements (product_id, warehouse_id, created_at desc);

-- Función: aplicar movimiento al nivel de inventario del par (producto, almacén)
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer as $$
declare
  v_current integer;
  v_new integer;
begin
  -- Si no hay almacén, no hacemos nada (permite datos antiguos sin warehouse_id)
  if new.warehouse_id is null then
    return null;
  end if;

  -- Bloqueamos la fila correspondiente para evitar carreras
  select quantity into v_current
  from public.inventory_levels
  where product_id = new.product_id and warehouse_id = new.warehouse_id
  for update;

  if v_current is null then
    v_current := 0;
  end if;

  if new.movement_type = 'IN' then
    v_new := v_current + new.quantity;
  elsif new.movement_type = 'OUT' then
    if v_current < new.quantity then
      raise exception 'Stock insuficiente para salida. Actual: %, Salida: %', v_current, new.quantity;
    end if;
    v_new := v_current - new.quantity;
  else
    -- ADJUST: interpretamos quantity como cantidad final absoluta
    v_new := new.quantity;
  end if;

  insert into public.inventory_levels (product_id, warehouse_id, quantity)
  values (new.product_id, new.warehouse_id, v_new)
  on conflict (product_id, warehouse_id)
  do update set quantity = excluded.quantity, updated_at = now();

  return null;
end;
$$;

-- Trigger AFTER INSERT para aplicar movimientos
drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply
after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

-- Función: sincronizar inventory_levels en UPDATE y DELETE de stock_movements
create or replace function public.sync_stock_movement_update_delete()
returns trigger
language plpgsql
security definer as $$
declare
  v_current integer;
  v_new integer;
begin
  if tg_op = 'UPDATE' then
    -- Por simplicidad del MVP: no permitimos actualizar movimientos de tipo ADJUST
    if old.movement_type = 'ADJUST' or new.movement_type = 'ADJUST' then
      raise exception 'Actualizar movimientos ADJUST no está permitido. Elimine y cree uno nuevo.';
    end if;

    -- Revertir efecto del registro OLD sobre el par (producto, almacén) anterior
    if old.warehouse_id is not null then
      select quantity into v_current
      from public.inventory_levels
      where product_id = old.product_id and warehouse_id = old.warehouse_id
      for update;
      if v_current is null then v_current := 0; end if;

      if old.movement_type = 'IN' then
        v_new := v_current - old.quantity;
      else -- 'OUT'
        v_new := v_current + old.quantity;
      end if;
      if v_new < 0 then
        raise exception 'El ajuste dejaría inventario negativo para el par antiguo (producto %, almacén %).', old.product_id, old.warehouse_id;
      end if;

      insert into public.inventory_levels (product_id, warehouse_id, quantity)
      values (old.product_id, old.warehouse_id, v_new)
      on conflict (product_id, warehouse_id)
      do update set quantity = excluded.quantity, updated_at = now();
    end if;

    -- Aplicar efecto del registro NEW sobre el (producto, almacén) nuevo
    if new.warehouse_id is not null then
      select quantity into v_current
      from public.inventory_levels
      where product_id = new.product_id and warehouse_id = new.warehouse_id
      for update;
      if v_current is null then v_current := 0; end if;

      if new.movement_type = 'IN' then
        v_new := v_current + new.quantity;
      else -- 'OUT'
        if v_current < new.quantity then
          raise exception 'Stock insuficiente para salida tras actualización. Actual: %, Salida: %', v_current, new.quantity;
        end if;
        v_new := v_current - new.quantity;
      end if;

      insert into public.inventory_levels (product_id, warehouse_id, quantity)
      values (new.product_id, new.warehouse_id, v_new)
      on conflict (product_id, warehouse_id)
      do update set quantity = excluded.quantity, updated_at = now();
    end if;

    return null;
  elsif tg_op = 'DELETE' then
    -- Por simplicidad del MVP: no permitimos borrar movimientos de tipo ADJUST
    if old.movement_type = 'ADJUST' then
      raise exception 'Borrar movimientos ADJUST no está permitido.';
    end if;

    if old.warehouse_id is null then
      return null;
    end if;

    select quantity into v_current
    from public.inventory_levels
    where product_id = old.product_id and warehouse_id = old.warehouse_id
    for update;
    if v_current is null then v_current := 0; end if;

    if old.movement_type = 'IN' then
      v_new := v_current - old.quantity;
    else -- 'OUT'
      v_new := v_current + old.quantity;
    end if;

    if v_new < 0 then
      v_new := 0; -- no permitir negativos; normalizamos a 0
    end if;

    insert into public.inventory_levels (product_id, warehouse_id, quantity)
    values (old.product_id, old.warehouse_id, v_new)
    on conflict (product_id, warehouse_id)
    do update set quantity = excluded.quantity, updated_at = now();

    return null;
  end if;
  return null;
end;
$$;

-- Triggers para UPDATE y DELETE
drop trigger if exists stock_movements_sync_update on public.stock_movements;
create trigger stock_movements_sync_update
after update of product_id, warehouse_id, movement_type, quantity on public.stock_movements
for each row execute function public.sync_stock_movement_update_delete();

drop trigger if exists stock_movements_sync_delete on public.stock_movements;
create trigger stock_movements_sync_delete
after delete on public.stock_movements
for each row execute function public.sync_stock_movement_update_delete();