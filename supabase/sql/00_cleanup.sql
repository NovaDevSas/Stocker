-- 00_cleanup.sql
-- Script para limpiar completamente la base de datos Stocker
-- ADVERTENCIA: Este script eliminará TODOS los datos y estructuras
-- Ejecutar SOLO en desarrollo, NUNCA en producción
-- Ejecutar como service_role en el SQL Editor de Supabase

-- NOTA: Ejecutar este script como service_role en Supabase SQL Editor
-- No es necesario cambiar roles si ya estás ejecutando como service_role

-- 1) Eliminar políticas de Storage
drop policy if exists "storage_user_signatures_read_own_or_admin" on storage.objects;
drop policy if exists "storage_user_signatures_write_own_or_admin" on storage.objects;
drop policy if exists "storage_company_assets_read_auth" on storage.objects;
drop policy if exists "storage_company_assets_write_admin" on storage.objects;
drop policy if exists "storage_product_images_read_auth" on storage.objects;
drop policy if exists "storage_product_images_write_admin" on storage.objects;

-- 2) Eliminar objetos de Storage
delete from storage.objects where bucket_id in ('user-signatures', 'company-assets', 'product-media');

-- 3) Eliminar buckets de Storage
delete from storage.buckets where id in ('user-signatures', 'company-assets', 'product-media');

-- 4) Eliminar todas las políticas RLS de tablas públicas
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "categories_read_all" on public.categories;
drop policy if exists "categories_write_admin" on public.categories;
drop policy if exists "products_read_all" on public.products;
drop policy if exists "products_write_admin" on public.products;
drop policy if exists "suppliers_read_auth" on public.suppliers;
drop policy if exists "suppliers_write_admin" on public.suppliers;
drop policy if exists "product_suppliers_read_auth" on public.product_suppliers;
drop policy if exists "product_suppliers_write_admin" on public.product_suppliers;
drop policy if exists "stock_movements_read_auth" on public.stock_movements;
drop policy if exists "stock_movements_write_admin" on public.stock_movements;
drop policy if exists "companies_read_auth" on public.companies;
drop policy if exists "companies_write_admin" on public.companies;
-- NOTA: product_images no existe en el esquema actual, se usa product_media
drop policy if exists "product_media_read_auth" on public.product_media;
drop policy if exists "product_media_write_admin" on public.product_media;
drop policy if exists "warehouses_read_auth" on public.warehouses;
drop policy if exists "warehouses_write_admin" on public.warehouses;
drop policy if exists "inventory_levels_read_auth" on public.inventory_levels;
drop policy if exists "inventory_levels_write_admin" on public.inventory_levels;
drop policy if exists "customers_read_auth" on public.customers;
drop policy if exists "customers_write_admin" on public.customers;
drop policy if exists "customer_addresses_read_auth" on public.customer_addresses;
drop policy if exists "customer_addresses_write_admin" on public.customer_addresses;
drop policy if exists "sales_orders_read_auth" on public.sales_orders;
drop policy if exists "sales_orders_write_admin" on public.sales_orders;
drop policy if exists "sales_order_items_read_auth" on public.sales_order_items;
drop policy if exists "sales_order_items_write_admin" on public.sales_order_items;
drop policy if exists "purchase_orders_read_auth" on public.purchase_orders;
drop policy if exists "purchase_orders_write_admin" on public.purchase_orders;
drop policy if exists "purchase_order_items_read_auth" on public.purchase_order_items;
drop policy if exists "purchase_order_items_write_admin" on public.purchase_order_items;
drop policy if exists "deliveries_read_auth" on public.deliveries;
drop policy if exists "deliveries_write_admin" on public.deliveries;
drop policy if exists "couriers_read_auth" on public.couriers;
drop policy if exists "couriers_write_admin" on public.couriers;
drop policy if exists "app_roles_read_auth" on public.app_roles;
drop policy if exists "app_roles_insert_admin" on public.app_roles;
drop policy if exists "app_roles_update_admin" on public.app_roles;
drop policy if exists "app_roles_delete_admin" on public.app_roles;
drop policy if exists "app_user_roles_read_admin" on public.app_user_roles;
drop policy if exists "app_user_roles_read_own" on public.app_user_roles;
drop policy if exists "app_user_roles_insert_admin" on public.app_user_roles;
drop policy if exists "app_user_roles_update_admin" on public.app_user_roles;
drop policy if exists "app_user_roles_delete_admin" on public.app_user_roles;
drop policy if exists "company_user_roles_read_auth" on public.company_user_roles;
drop policy if exists "company_user_roles_write_admin" on public.company_user_roles;
drop policy if exists "audit_logs_read_auth" on public.audit_logs;

-- 5) Eliminar triggers
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists companies_set_updated_at on public.companies;
drop trigger if exists categories_set_updated_at on public.categories;
drop trigger if exists products_set_updated_at on public.products;
drop trigger if exists product_media_set_updated_at on public.product_media;
drop trigger if exists warehouses_set_updated_at on public.warehouses;
drop trigger if exists inventory_levels_set_updated_at on public.inventory_levels;
drop trigger if exists suppliers_set_updated_at on public.suppliers;
drop trigger if exists customers_set_updated_at on public.customers;
drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
drop trigger if exists sales_orders_set_updated_at on public.sales_orders;
drop trigger if exists couriers_set_updated_at on public.couriers;
drop trigger if exists set_updated_at_app_roles on public.app_roles;
drop trigger if exists stock_movements_apply on public.stock_movements;
drop trigger if exists stock_movements_sync_update on public.stock_movements;
drop trigger if exists stock_movements_sync_delete on public.stock_movements;
drop trigger if exists products_audit on public.products;

-- 6) Eliminar tablas en orden correcto (respetando foreign keys)
drop table if exists public.delivery_events cascade;
drop table if exists public.deliveries cascade;
drop table if exists public.couriers cascade;
drop table if exists public.sales_order_items cascade;
drop table if exists public.sales_orders cascade;
drop table if exists public.purchase_order_items cascade;
drop table if exists public.purchase_orders cascade;
drop table if exists public.customer_addresses cascade;
drop table if exists public.customers cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.inventory_levels cascade;
drop table if exists public.product_suppliers cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.product_media cascade;
-- NOTA: product_images no existe en el esquema actual, se elimina con product_media
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.warehouses cascade;
drop table if exists public.company_user_roles cascade;
drop table if exists public.app_user_roles cascade;
drop table if exists public.app_roles cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.profiles cascade;
drop table if exists public.companies cascade;

-- 7) Eliminar funciones
drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.has_company_role(uuid, text) cascade;
drop function if exists public.apply_stock_movement() cascade;
drop function if exists public.sync_stock_movement_update_delete() cascade;
drop function if exists public.audit_products_change() cascade;
drop function if exists public.is_admin(uuid) cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.user_belongs_to_company(uuid, uuid) cascade;
drop function if exists public.get_user_companies(uuid) cascade;
drop function if exists public.get_product_image_url(uuid, text) cascade;
drop function if exists public.get_company_asset_url(uuid, text) cascade;
drop function if exists public.get_user_signature_url(uuid, text) cascade;
drop function if exists public.cleanup_product_images() cascade;

-- 8) Eliminar vistas
drop view if exists public.current_user_companies cascade;

-- 9) Eliminar usuarios de auth (CUIDADO: esto eliminará todos los usuarios)
-- Descomenta solo si quieres eliminar TODOS los usuarios
-- delete from auth.users;

-- Script completado

-- Mensaje de confirmación
select 'Base de datos limpiada completamente. Ejecutar scripts 01, 02, 03 y 06 para recrear.' as status;