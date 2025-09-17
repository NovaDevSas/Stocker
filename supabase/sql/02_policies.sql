-- =====================================================
-- 02_policies.sql - Row Level Security Policies
-- =====================================================
-- Run as: service_role
-- Descripción: Políticas RLS optimizadas con multitenancy por empresa
-- y mejores prácticas de seguridad para Supabase

-- =====================================================
-- HABILITACIÓN DE RLS EN TODAS LAS TABLAS
-- =====================================================

-- Tablas principales
alter table if exists public.profiles enable row level security;
alter table if exists public.companies enable row level security;
alter table if exists public.app_roles enable row level security;
alter table if exists public.app_user_roles enable row level security;
alter table if exists public.company_user_roles enable row level security;

-- Catálogos y productos
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_media enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.product_suppliers enable row level security;

-- Inventario y movimientos
alter table if exists public.warehouses enable row level security;
alter table if exists public.inventory_levels enable row level security;
alter table if exists public.stock_movements enable row level security;
-- alter table if exists public.stock_adjustments enable row level security; -- Tabla no definida en esquema

-- Ventas y compras
alter table if exists public.customers enable row level security;
alter table if exists public.sales_orders enable row level security;
alter table if exists public.sales_order_items enable row level security;
alter table if exists public.purchase_orders enable row level security;
alter table if exists public.purchase_order_items enable row level security;

-- Deliveries y auditoría
alter table if exists public.deliveries enable row level security;
-- alter table if exists public.delivery_items enable row level security; -- Tabla no definida en esquema
alter table if exists public.audit_logs enable row level security;

-- Storage (se configura en 06_storage.sql)
-- alter table if exists storage.objects enable row level security;

-- =====================================================
-- FUNCIONES HELPER PARA POLÍTICAS
-- =====================================================

-- Función para verificar si el usuario es admin global
create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = user_id and p.is_admin = true
  );
$$;

-- Función para verificar si el usuario pertenece a una empresa
create or replace function public.user_belongs_to_company(company_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.company_user_roles cur
    where cur.user_id = user_id and cur.company_id = company_id
  );
$$;

-- Función para obtener las empresas del usuario
create or replace function public.get_user_companies(user_id uuid default auth.uid())
returns setof uuid
language sql
security definer
stable
as $$
  select cur.company_id
  from public.company_user_roles cur
  where cur.user_id = user_id;
$$;

-- =====================================================
-- POLÍTICAS PARA PROFILES
-- =====================================================

-- Los usuarios pueden ver su propio perfil
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

-- Los admins pueden ver todos los perfiles
create policy "profiles_select_admin" on public.profiles
for select using (public.is_admin());

-- Los usuarios pueden actualizar su propio perfil
create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

-- Los admins pueden actualizar cualquier perfil
create policy "profiles_update_admin" on public.profiles
for update using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA COMPANIES
-- =====================================================

-- Los usuarios pueden ver las empresas a las que pertenecen
create policy "companies_select_member" on public.companies
for select using (
  id in (select public.get_user_companies())
);

-- Los admins pueden ver todas las empresas
create policy "companies_select_admin" on public.companies
for select using (public.is_admin());

-- Solo los admins pueden crear empresas
create policy "companies_insert_admin" on public.companies
for insert with check (public.is_admin());

-- Solo los admins pueden actualizar empresas
create policy "companies_update_admin" on public.companies
for update using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA ROLES Y ASIGNACIONES
-- =====================================================

-- app_roles: lectura para autenticados, escritura solo admins
create policy "app_roles_select_auth" on public.app_roles
for select using (auth.uid() is not null);

create policy "app_roles_modify_admin" on public.app_roles
for all using (public.is_admin())
with check (public.is_admin());

-- app_user_roles: cada usuario ve sus roles, admins ven todo
create policy "app_user_roles_select_own" on public.app_user_roles
for select using (user_id = auth.uid());

create policy "app_user_roles_select_admin" on public.app_user_roles
for select using (public.is_admin());

create policy "app_user_roles_modify_admin" on public.app_user_roles
for all using (public.is_admin())
with check (public.is_admin());

-- company_user_roles: multitenancy por empresa
create policy "company_user_roles_select_own" on public.company_user_roles
for select using (user_id = auth.uid());

create policy "company_user_roles_select_company" on public.company_user_roles
for select using (
  company_id in (select public.get_user_companies())
);

create policy "company_user_roles_select_admin" on public.company_user_roles
for select using (public.is_admin());

create policy "company_user_roles_modify_admin" on public.company_user_roles
for all using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA CATÁLOGOS (MULTITENANCY)
-- =====================================================

-- Categories: por empresa
create policy "categories_select_company" on public.categories
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "categories_modify_company" on public.categories
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Products: por empresa
create policy "products_select_company" on public.products
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "products_modify_company" on public.products
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Product Media: por empresa a través del producto
create policy "product_media_select_company" on public.product_media
for select using (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (p.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "product_media_modify_company" on public.product_media
for all using (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (public.user_belongs_to_company(p.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (public.user_belongs_to_company(p.company_id) or public.is_admin())
  )
);

-- Suppliers: por empresa
create policy "suppliers_select_company" on public.suppliers
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "suppliers_modify_company" on public.suppliers
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Product Suppliers: por empresa a través del producto
create policy "product_suppliers_select_company" on public.product_suppliers
for select using (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (p.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "product_suppliers_modify_company" on public.product_suppliers
for all using (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (public.user_belongs_to_company(p.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.products p
    where p.id = product_id
    and (public.user_belongs_to_company(p.company_id) or public.is_admin())
  )
);

-- =====================================================
-- POLÍTICAS PARA INVENTARIO (MULTITENANCY)
-- =====================================================

-- Warehouses: por empresa
create policy "warehouses_select_company" on public.warehouses
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "warehouses_modify_company" on public.warehouses
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Inventory Levels: por empresa a través del warehouse
create policy "inventory_levels_select_company" on public.inventory_levels
for select using (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (w.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "inventory_levels_modify_company" on public.inventory_levels
for all using (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (public.user_belongs_to_company(w.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (public.user_belongs_to_company(w.company_id) or public.is_admin())
  )
);

-- Stock Movements: por empresa a través del warehouse
create policy "stock_movements_select_company" on public.stock_movements
for select using (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (w.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "stock_movements_modify_company" on public.stock_movements
for all using (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (public.user_belongs_to_company(w.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.warehouses w
    where w.id = warehouse_id
    and (public.user_belongs_to_company(w.company_id) or public.is_admin())
  )
);

-- Stock Adjustments: TABLA NO DEFINIDA EN ESQUEMA - POLÍTICAS COMENTADAS
-- create policy "stock_adjustments_select_company" on public.stock_adjustments
-- for select using (
--   exists(
--     select 1 from public.warehouses w
--     where w.id = warehouse_id
--     and (w.company_id in (select public.get_user_companies()) or public.is_admin())
--   )
-- );

-- create policy "stock_adjustments_modify_company" on public.stock_adjustments
-- for all using (
--   exists(
--     select 1 from public.warehouses w
--     where w.id = warehouse_id
--     and (public.user_belongs_to_company(w.company_id) or public.is_admin())
--   )
-- ) with check (
--   exists(
--     select 1 from public.warehouses w
--     where w.id = warehouse_id
--     and (public.user_belongs_to_company(w.company_id) or public.is_admin())
--   )
-- );

-- =====================================================
-- POLÍTICAS PARA VENTAS Y COMPRAS (MULTITENANCY)
-- =====================================================

-- Customers: por empresa
create policy "customers_select_company" on public.customers
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "customers_modify_company" on public.customers
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Sales Orders: por empresa
create policy "sales_orders_select_company" on public.sales_orders
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "sales_orders_modify_company" on public.sales_orders
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Sales Order Items: por empresa a través de la orden
create policy "sales_order_items_select_company" on public.sales_order_items
for select using (
  exists(
    select 1 from public.sales_orders so
    where so.id = sales_order_id
    and (so.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "sales_order_items_modify_company" on public.sales_order_items
for all using (
  exists(
    select 1 from public.sales_orders so
    where so.id = sales_order_id
    and (public.user_belongs_to_company(so.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.sales_orders so
    where so.id = sales_order_id
    and (public.user_belongs_to_company(so.company_id) or public.is_admin())
  )
);

-- Purchase Orders: por empresa
create policy "purchase_orders_select_company" on public.purchase_orders
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "purchase_orders_modify_company" on public.purchase_orders
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Purchase Order Items: por empresa a través de la orden
create policy "purchase_order_items_select_company" on public.purchase_order_items
for select using (
  exists(
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
    and (po.company_id in (select public.get_user_companies()) or public.is_admin())
  )
);

create policy "purchase_order_items_modify_company" on public.purchase_order_items
for all using (
  exists(
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
    and (public.user_belongs_to_company(po.company_id) or public.is_admin())
  )
) with check (
  exists(
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
    and (public.user_belongs_to_company(po.company_id) or public.is_admin())
  )
);

-- =====================================================
-- POLÍTICAS PARA DELIVERIES (MULTITENANCY)
-- =====================================================

-- Deliveries: por empresa
create policy "deliveries_select_company" on public.deliveries
for select using (
  company_id in (select public.get_user_companies()) or public.is_admin()
);

create policy "deliveries_modify_company" on public.deliveries
for all using (
  public.user_belongs_to_company(company_id) or public.is_admin()
) with check (
  public.user_belongs_to_company(company_id) or public.is_admin()
);

-- Delivery Items: TABLA NO DEFINIDA EN ESQUEMA - POLÍTICAS COMENTADAS
-- create policy "delivery_items_select_company" on public.delivery_items
-- for select using (
--   exists(
--     select 1 from public.deliveries d
--     where d.id = delivery_id
--     and (d.company_id in (select public.get_user_companies()) or public.is_admin())
--   )
-- );

-- create policy "delivery_items_modify_company" on public.delivery_items
-- for all using (
--   exists(
--     select 1 from public.deliveries d
--     where d.id = delivery_id
--     and (public.user_belongs_to_company(d.company_id) or public.is_admin())
--   )
-- ) with check (
--   exists(
--     select 1 from public.deliveries d
--     where d.id = delivery_id
--     and (public.user_belongs_to_company(d.company_id) or public.is_admin())
--   )
-- );

-- =====================================================
-- POLÍTICAS PARA AUDITORÍA
-- =====================================================

-- Audit Log: solo lectura para admins
create policy "audit_log_select_admin" on public.audit_logs
for select using (public.is_admin());

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- NOTA: Las políticas de storage se movieron a 06_storage.sql
-- Ejecutar 06_storage.sql después de este script para configurar storage

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- NOTAS IMPORTANTES:
-- 1. Todas las políticas implementan multitenancy por empresa
-- 2. Los admins globales pueden acceder a todo
-- 3. Los usuarios solo ven datos de sus empresas asignadas
-- 4. Las funciones helper optimizan las consultas repetitivas
-- 5. Storage está organizado por carpetas de empresa/producto
-- 6. Para desarrollo, usar 04_disable_rls.sql temporalmente