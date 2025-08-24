-- 02_policies.sql — Políticas RLS iniciales de Stocker
-- Ejecuta este script DESPUÉS de 01_schema.sql en el SQL Editor de Supabase

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_suppliers enable row level security;
alter table public.stock_movements enable row level security;

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
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
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
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Movimientos: lectura autenticados, escritura solo admins
create policy "stock_movements_read_auth" on public.stock_movements
for select using (auth.role() = 'authenticated');

create policy "stock_movements_write_admin" on public.stock_movements
for all using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
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
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
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
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
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

-- PATCHES 2025-08-24-d — Limpieza de políticas (public.*) para re-ejecución idempotente
-- Ejecuta este bloque primero si obtienes errores de "policy ... already exists"
-- NOTA: Comentado por defecto para no borrar políticas al re-ejecutar todo el archivo
-- Copia y ejecuta estas líneas manualmente solo cuando las necesites

-- Perfiles
-- DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Categorías y Productos
-- DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
-- DROP POLICY IF EXISTS "products_read_all" ON public.products;
-- DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
-- DROP POLICY IF EXISTS "products_write_admin" ON public.products;

-- Proveedores y relaciones
-- DROP POLICY IF EXISTS "suppliers_read_auth" ON public.suppliers;
-- DROP POLICY IF EXISTS "suppliers_write_admin" ON public.suppliers;
-- DROP POLICY IF EXISTS "product_suppliers_read_auth" ON public.product_suppliers;
-- DROP POLICY IF EXISTS "product_suppliers_write_admin" ON public.product_suppliers;

-- Movimientos de stock
-- DROP POLICY IF EXISTS "stock_movements_read_auth" ON public.stock_movements;
-- DROP POLICY IF EXISTS "stock_movements_write_admin" ON public.stock_movements;

-- Empresas e imágenes de productos
-- DROP POLICY IF EXISTS "companies_read_auth" ON public.companies;
-- DROP POLICY IF EXISTS "companies_write_admin" ON public.companies;
-- DROP POLICY IF EXISTS "product_images_read_auth" ON public.product_images;
-- DROP POLICY IF EXISTS "product_images_write_admin" ON public.product_images;

-- Almacenes e inventario
-- DROP POLICY IF EXISTS "warehouses_read_auth" ON public.warehouses;
-- DROP POLICY IF EXISTS "warehouses_write_admin" ON public.warehouses;
-- DROP POLICY IF EXISTS "inventory_levels_read_auth" ON public.inventory_levels;
-- DROP POLICY IF EXISTS "inventory_levels_write_admin" ON public.inventory_levels;

-- Clientes y ventas
-- DROP POLICY IF EXISTS "customers_read_auth" ON public.customers;
-- DROP POLICY IF EXISTS "customers_write_admin" ON public.customers;
-- DROP POLICY IF EXISTS "sales_orders_read_auth" ON public.sales_orders;
-- DROP POLICY IF EXISTS "sales_orders_write_admin" ON public.sales_orders;
-- DROP POLICY IF EXISTS "sales_order_items_read_auth" ON public.sales_order_items;
-- DROP POLICY IF EXISTS "sales_order_items_write_admin" ON public.sales_order_items;

-- Compras
-- DROP POLICY IF EXISTS "purchase_orders_read_auth" ON public.purchase_orders;
-- DROP POLICY IF EXISTS "purchase_orders_write_admin" ON public.purchase_orders;
-- DROP POLICY IF EXISTS "purchase_order_items_read_auth" ON public.purchase_order_items;
-- DROP POLICY IF EXISTS "purchase_order_items_write_admin" ON public.purchase_order_items;

-- PATCHES 2025-08-24-e — Limpieza de políticas de Storage (ejecutar como service_role)
-- Sugerido: en el SQL Editor, selecciona "Run as: service_role". Alternativa: descomenta set role
-- set role supabase_storage_admin;
-- DROP POLICY IF EXISTS "storage_product_images_read_auth" ON storage.objects;
-- DROP POLICY IF EXISTS "storage_product_images_write_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "storage_company_assets_read_auth" ON storage.objects;
-- DROP POLICY IF EXISTS "storage_company_assets_write_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "storage_user_signatures_read_own_or_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "storage_user_signatures_write_own_or_admin" ON storage.objects;
-- reset role;