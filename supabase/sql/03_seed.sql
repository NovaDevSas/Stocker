-- 03_seed.sql — Datos de ejemplo para pruebas
-- Ejecuta este script después de 01 y 02 en el SQL Editor de Supabase

-- Crea un perfil admin para tu usuario autenticado actual
-- Reemplaza <YOUR_AUTH_USER_ID> por el UUID de auth.users de tu cuenta
-- Puedes obtenerlo con: select auth.uid(); (desde el SQL Editor autenticado)
insert into public.profiles (id, display_name, is_admin)
values ('6fa7c5cb-1a40-415b-a21d-fb13891bdce5', 'Administrador', true)
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