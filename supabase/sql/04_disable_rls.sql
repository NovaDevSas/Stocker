-- 04_disable_rls.sql
-- Script para desactivar RLS temporalmente durante desarrollo
-- ADVERTENCIA: Solo usar en desarrollo, NUNCA en producción
-- Ejecutar como service_role en el SQL Editor de Supabase

-- Desactivar RLS en todas las tablas públicas
-- NOTA: Ejecutar como service_role en Supabase SQL Editor
alter table if exists public.profiles disable row level security;
alter table if exists public.companies disable row level security;
alter table if exists public.app_roles disable row level security;
alter table if exists public.app_user_roles disable row level security;
alter table if exists public.company_user_roles disable row level security;
alter table if exists public.categories disable row level security;
alter table if exists public.products disable row level security;
alter table if exists public.product_media disable row level security;
alter table if exists public.warehouses disable row level security;
alter table if exists public.inventory_levels disable row level security;
alter table if exists public.suppliers disable row level security;
alter table if exists public.product_suppliers disable row level security;
alter table if exists public.customers disable row level security;
alter table if exists public.customer_addresses disable row level security;
alter table if exists public.sales_orders disable row level security;
alter table if exists public.sales_order_items disable row level security;
alter table if exists public.purchase_orders disable row level security;
alter table if exists public.purchase_order_items disable row level security;
alter table if exists public.stock_movements disable row level security;
alter table if exists public.deliveries disable row level security;
alter table if exists public.delivery_events disable row level security;
alter table if exists public.couriers disable row level security;
alter table if exists public.audit_logs disable row level security;

-- Desactivar RLS en Storage
-- NOTA: Comentado porque requiere permisos de propietario especiales
-- alter table if exists storage.objects disable row level security;

-- Mensaje de confirmación
select 'RLS desactivado en todas las tablas. RECORDAR: Solo para desarrollo!' as status;

-- Instrucciones de uso
select '
=== INSTRUCCIONES ===
1. RLS está ahora DESACTIVADO
2. Puedes realizar todas las operaciones sin restricciones
3. Tu usuario del seed puede acceder a todo
4. EJECUTAR 05_enable_rls.sql cuando termines el desarrollo
5. NUNCA usar esto en producción
' as instrucciones;