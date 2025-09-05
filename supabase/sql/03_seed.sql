-- 03_seed.sql — Datos de ejemplo para pruebas
-- Ejecuta este script después de 01 y 02 en el SQL Editor de Supabase

-- Admin por UID (ajusta si tu UID cambia)
insert into public.profiles (id, display_name, is_admin)
values ('c37b9084-2035-491a-aebd-15d0c189d778', 'Administrador', true)
on conflict (id) do update set is_admin = true;

-- Categorías de prueba
insert into public.categories (name, description) values
  ('Electrónica', 'Dispositivos y componentes'),
  ('Ropa', 'Prendas y accesorios'),
  ('Hogar', 'Artículos del hogar')
on conflict (name) do nothing;

-- Productos de prueba
insert into public.products (name, sku, price)
values
  ('Teclado mecánico', 'SKU-KEY-001', 59.90),
  ('Camiseta básica', 'SKU-TSHIRT-001', 12.50),
  ('Taza cerámica', 'SKU-MUG-001', 6.99)
on conflict (sku) do nothing;

-- Proveedores de prueba
insert into public.suppliers (name, email)
values
  ('Proveedor A', 'proveedorA@example.com'),
  ('Proveedor B', 'proveedorB@example.com')
on conflict do nothing;