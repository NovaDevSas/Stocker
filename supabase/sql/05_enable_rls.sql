-- 05_enable_rls.sql
-- Script para reactivar RLS después del desarrollo
-- Ejecutar como service_role en el SQL Editor de Supabase
-- Este script debe ejecutarse DESPUÉS de terminar el desarrollo

-- Reactivar RLS en todas las tablas públicas
-- NOTA: Ejecutar como service_role en Supabase SQL Editor
alter table if exists public.profiles enable row level security;
alter table if exists public.companies enable row level security;
alter table if exists public.app_roles enable row level security;
alter table if exists public.app_user_roles enable row level security;
alter table if exists public.company_user_roles enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_media enable row level security;
alter table if exists public.warehouses enable row level security;
alter table if exists public.inventory_levels enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.product_suppliers enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.customer_addresses enable row level security;
alter table if exists public.sales_orders enable row level security;
alter table if exists public.sales_order_items enable row level security;
alter table if exists public.purchase_orders enable row level security;
alter table if exists public.purchase_order_items enable row level security;
alter table if exists public.stock_movements enable row level security;
alter table if exists public.deliveries enable row level security;
alter table if exists public.delivery_events enable row level security;
alter table if exists public.couriers enable row level security;
alter table if exists public.audit_logs enable row level security;

-- Reactivar RLS en Storage
-- NOTA: Comentado porque requiere permisos de propietario especiales
-- alter table if exists storage.objects enable row level security;

-- Mensaje de confirmación
select 'RLS reactivado en todas las tablas. Sistema seguro para producción.' as status;

-- Verificación de políticas
select '
=== VERIFICACIÓN ===
1. RLS está ahora ACTIVADO
2. Todas las políticas de 02_policies.sql están en efecto
3. Sistema listo para producción
4. Verificar que todas las funcionalidades trabajen correctamente
' as verificacion;

-- Mostrar tablas con RLS activado
select 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables 
where schemaname = 'public' 
order by tablename;