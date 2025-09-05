-- 02_policies.sql — Políticas RLS iniciales de Stocker
-- Ejecuta este script DESPUÉS de 01_schema.sql en el SQL Editor de Supabase
-- IMPORTANTE: Ejecutar TODO este archivo seleccionando "Run as: service_role" en el SQL Editor de Supabase
-- Si no tienes acceso a service_role, contacta al administrador del proyecto

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_suppliers enable row level security;
alter table public.stock_movements enable row level security;
-- Habilitar RLS en tablas adicionales del esquema
alter table public.warehouses enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.customers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

-- Perfiles: cada usuario gestiona solo su perfil
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Categorías/Productos: lectura abierta, escritura solo administradores
create policy "categories_read_all" on public.categories
for select using (true);

create policy "products_read_all" on public.products
for select using (true);

create policy "categories_write_admin" on public.categories
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

create policy "products_write_admin" on public.products
for all using (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Proveedores y relaciones: lectura autenticados, escritura solo admins
create policy "suppliers_read_auth" on public.suppliers
for select using (auth.role() = 'authenticated');

create policy "suppliers_write_admin" on public.suppliers
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

create policy "product_suppliers_read_auth" on public.product_suppliers
for select using (auth.role() = 'authenticated');

create policy "product_suppliers_write_admin" on public.product_suppliers
for all using (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Movimientos: lectura autenticados, escritura solo admins
create policy "stock_movements_read_auth" on public.stock_movements
for select using (auth.role() = 'authenticated');

create policy "stock_movements_write_admin" on public.stock_movements
for all using (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- PATCHES 2025-08-24-b — RLS para empresas e imágenes de productos
alter table public.companies enable row level security;
alter table public.product_images enable row level security;

-- Companies
create policy "companies_read_auth" on public.companies
for select using (auth.role() = 'authenticated');

create policy "companies_write_admin" on public.companies
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Product images
create policy "product_images_read_auth" on public.product_images
for select using (auth.role() = 'authenticated');

create policy "product_images_write_admin" on public.product_images
for all using (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Warehouses: lectura autenticados, escritura solo admins
create policy "warehouses_read_auth" on public.warehouses
for select using (auth.role() = 'authenticated');

create policy "warehouses_write_admin" on public.warehouses
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Inventory levels
create policy "inventory_levels_read_auth" on public.inventory_levels
for select using (auth.role() = 'authenticated');

create policy "inventory_levels_write_admin" on public.inventory_levels
for all using (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  auth.uid() is not null and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Customers
create policy "customers_read_auth" on public.customers
for select using (auth.role() = 'authenticated');

create policy "customers_write_admin" on public.customers
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Sales orders
create policy "sales_orders_read_auth" on public.sales_orders
for select using (auth.role() = 'authenticated');

create policy "sales_orders_write_admin" on public.sales_orders
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Sales order items
create policy "sales_order_items_read_auth" on public.sales_order_items
for select using (auth.role() = 'authenticated');

create policy "sales_order_items_write_admin" on public.sales_order_items
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Purchase orders
create policy "purchase_orders_read_auth" on public.purchase_orders
for select using (auth.role() = 'authenticated');

create policy "purchase_orders_write_admin" on public.purchase_orders
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Purchase order items
create policy "purchase_order_items_read_auth" on public.purchase_order_items
for select using (auth.role() = 'authenticated');

create policy "purchase_order_items_write_admin" on public.purchase_order_items
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- PATCHES 2025-08-24-c — Políticas de Storage
-- IMPORTANTE: Para esta sección específica, si obtienes error "must be owner of table objects":
-- 1. Ejecuta SOLO esta sección como service_role en el SQL Editor
-- 2. O descomenta la línea "set role supabase_storage_admin;" de abajo
set role supabase_storage_admin;
alter table storage.objects enable row level security;

-- Product images bucket: lectura autenticados, escritura solo admins
create policy "storage_product_images_read_auth" on storage.objects
for select using (
  bucket_id = 'product-images' and auth.role() = 'authenticated'
);

create policy "storage_product_images_write_admin" on storage.objects
for all using (
  bucket_id = 'product-images' and exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  )
) with check (
  bucket_id = 'product-images' and exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  )
);

-- Company assets bucket: lectura autenticados, escritura solo admins
create policy "storage_company_assets_read_auth" on storage.objects
for select using (
  bucket_id = 'company-assets' and auth.role() = 'authenticated'
);

create policy "storage_company_assets_write_admin" on storage.objects
for all using (
  bucket_id = 'company-assets' and exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  )
) with check (
  bucket_id = 'company-assets' and exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  )
);

-- User signatures bucket: lectura usuario dueño o admin; escritura dueño o admin
create policy "storage_user_signatures_read_own_or_admin" on storage.objects
for select using (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or exists(
      select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
    )
  )
);

create policy "storage_user_signatures_write_own_or_admin" on storage.objects
for all using (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or exists(
      select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
    )
  )
) with check (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or exists(
      select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
    )
  )
);

reset role;

-- PATCHES 2025-08-24-d — Limpieza de políticas (public.*) para re-ejecución idempotente
-- Si recibes "policy ... already exists", descomenta solo lo necesario y ejecuta como service_role
-- PUBLIC
-- drop policy if exists "profiles_select_own" on public.profiles;
-- drop policy if exists "profiles_insert_own" on public.profiles;
-- drop policy if exists "profiles_update_own" on public.profiles;
-- drop policy if exists "categories_read_all" on public.categories;
-- drop policy if exists "categories_write_admin" on public.categories;
-- drop policy if exists "products_read_all" on public.products;
-- drop policy if exists "products_write_admin" on public.products;
-- drop policy if exists "suppliers_read_auth" on public.suppliers;
-- drop policy if exists "suppliers_write_admin" on public.suppliers;
-- drop policy if exists "product_suppliers_read_auth" on public.product_suppliers;
-- drop policy if exists "product_suppliers_write_admin" on public.product_suppliers;
-- drop policy if exists "stock_movements_read_auth" on public.stock_movements;
-- drop policy if exists "stock_movements_write_admin" on public.stock_movements;
-- drop policy if exists "companies_read_auth" on public.companies;
-- drop policy if exists "companies_write_admin" on public.companies;
-- drop policy if exists "product_images_read_auth" on public.product_images;
-- drop policy if exists "product_images_write_admin" on public.product_images;
-- drop policy if exists "warehouses_read_auth" on public.warehouses;
-- drop policy if exists "warehouses_write_admin" on public.warehouses;
-- drop policy if exists "inventory_levels_read_auth" on public.inventory_levels;
-- drop policy if exists "inventory_levels_write_admin" on public.inventory_levels;
-- drop policy if exists "customers_read_auth" on public.customers;
-- drop policy if exists "customers_write_admin" on public.customers;
-- drop policy if exists "sales_orders_read_auth" on public.sales_orders;
-- drop policy if exists "sales_orders_write_admin" on public.sales_orders;
-- drop policy if exists "sales_order_items_read_auth" on public.sales_order_items;
-- drop policy if exists "sales_order_items_write_admin" on public.sales_order_items;
-- drop policy if exists "purchase_orders_read_auth" on public.purchase_orders;
-- drop policy if exists "purchase_orders_write_admin" on public.purchase_orders;
-- drop policy if exists "purchase_order_items_read_auth" on public.purchase_order_items;
-- drop policy if exists "purchase_order_items_write_admin" on public.purchase_order_items;

-- STORAGE
-- drop policy if exists "storage_product_images_read_auth" on storage.objects;
-- drop policy if exists "storage_product_images_write_admin" on storage.objects;
-- drop policy if exists "storage_company_assets_read_auth" on storage.objects;
-- drop policy if exists "storage_company_assets_write_admin" on storage.objects;
-- drop policy if exists "storage_user_signatures_read_own_or_admin" on storage.objects;
-- drop policy if exists "storage_user_signatures_write_own_or_admin" on storage.objects;
-- reset role;