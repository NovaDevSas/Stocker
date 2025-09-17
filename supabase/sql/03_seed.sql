-- =====================================================
-- 03_seed.sql - Datos Iniciales del Sistema
-- =====================================================
-- Run as: service_role
-- Descripción: Datos de ejemplo compatibles con el nuevo esquema
-- multitenancy y mejores prácticas de Supabase

-- =====================================================
-- EMPRESA PRINCIPAL
-- =====================================================

-- Insertar empresa principal
insert into public.companies (id, name, email, phone, address, logo_url, default_currency)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Stocker Demo Company',
  'admin@stockerdemo.com',
  '+1-555-0123',
  '123 Business St, Demo City, DC 12345',
  null,
  'USD'
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone;

-- =====================================================
-- USUARIO ADMINISTRADOR
-- =====================================================

-- IMPORTANTE: El perfil se crea automáticamente cuando el usuario se registra
-- Este script solo actualiza el perfil existente para hacerlo administrador
-- NOTA: Ejecutar después de que el usuario esteban@gmail.com se haya registrado
update public.profiles 
set 
  display_name = 'Administrador Principal',
  username = 'admin',
  is_admin = true
where id = '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid;

-- =====================================================
-- ROLES DE APLICACIÓN
-- =====================================================

insert into public.app_roles (name, slug, description, permissions) values
  ('Gestor de Inventario', 'inventory_manager', 'Gestor de Inventario', '["inventory.read", "inventory.write", "products.read", "products.write"]'::jsonb),
  ('Gestor de Ventas', 'sales_manager', 'Gestor de Ventas', '["sales.read", "sales.write", "customers.read", "customers.write", "reports.sales"]'::jsonb),
  ('Operador de Almacén', 'warehouse_operator', 'Operador de Almacén', '["inventory.read", "stock_movements.read", "stock_movements.write", "deliveries.read"]'::jsonb),
  ('Contador', 'accountant', 'Contador', '["reports.read", "purchase_orders.read", "sales_orders.read", "financial.read"]'::jsonb),
  ('Solo Lectura', 'viewer', 'Solo Lectura', '["*.read"]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  permissions = excluded.permissions;

-- =====================================================
-- ASIGNACIÓN DE ROLES AL ADMINISTRADOR
-- =====================================================

-- Asignar roles de aplicación al administrador (solo si el usuario existe)
insert into public.app_user_roles (user_id, role_id)
select '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid, ar.id
from public.app_roles ar
where exists (
  select 1 from public.profiles p 
  where p.id = '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid
)
on conflict (user_id, role_id) do nothing;

-- Asignar administrador a la empresa principal (solo si el usuario existe)
insert into public.company_user_roles (user_id, company_id, role)
select 
  '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'OWNER'
where exists (
  select 1 from public.profiles p 
  where p.id = '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid
)
on conflict (company_id, user_id) do update set
  role = excluded.role;

-- =====================================================
-- ALMACENES
-- =====================================================

insert into public.warehouses (id, company_id, name, code, address, is_active, notes)
values 
  (
    gen_random_uuid(),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Almacén Principal',
    'WH-001',
    '123 Warehouse St, Demo City, DC 12345',
    true,
    'Almacén principal con capacidad para 10,000 unidades. Zonas: A, B, C. Sin control de temperatura.'
  ),
  (
    gen_random_uuid(),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Almacén Secundario',
    'WH-002',
    '456 Storage Ave, Demo City, DC 12346',
    true,
    'Almacén secundario con capacidad para 5,000 unidades. Zonas: X, Y. Con control de temperatura.'
  )
on conflict (company_id, code) where code is not null do update set
  name = excluded.name,
  address = excluded.address,
  notes = excluded.notes;

-- =====================================================
-- CATEGORÍAS DE PRODUCTOS
-- =====================================================

insert into public.categories (company_id, name, description, parent_id, sort_order, is_active)
values 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Electrónicos', 'Dispositivos y componentes electrónicos', null, 1, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Computadoras', 'Equipos de cómputo y accesorios', null, 2, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Ropa', 'Prendas de vestir y accesorios', null, 3, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Hogar', 'Artículos para el hogar', null, 4, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Oficina', 'Suministros de oficina', null, 5, true)
on conflict (company_id, name) where name is not null do update set
  description = excluded.description,
  sort_order = excluded.sort_order;

-- =====================================================
-- PROVEEDORES
-- =====================================================

insert into public.suppliers (id, company_id, name, contact_person, email, phone, address, tax_id, payment_terms, is_active)
values 
  (
    'b1b2c3d4-e5f6-7890-abcd-ef1234567891'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'TechSupply Corp',
    'Juan Pérez',
    'juan@techsupply.com',
    '+1-555-0100',
    '789 Tech Blvd, Tech City, TC 54321',
    'TAX-001-TECH',
    'Net 30',
    true
  ),
  (
    'b1b2c3d4-e5f6-7890-abcd-ef1234567892'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Fashion Wholesale',
    'María García',
    'maria@fashionwholesale.com',
    '+1-555-0200',
    '456 Fashion Ave, Style City, SC 98765',
    'TAX-002-FASH',
    'Net 15',
    true
  ),
  (
    'b1b2c3d4-e5f6-7890-abcd-ef1234567893'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Home Essentials Ltd',
    'Carlos López',
    'carlos@homeessentials.com',
    '+1-555-0300',
    '321 Home St, Comfort City, CC 13579',
    'TAX-003-HOME',
    'Net 45',
    true
  )
on conflict (id) do update set
  contact_person = excluded.contact_person,
  email = excluded.email,
  phone = excluded.phone;

-- =====================================================
-- PRODUCTOS DE EJEMPLO
-- =====================================================

-- Obtener IDs de categorías para los productos
with category_ids as (
  select name, id from public.categories 
  where company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
)
insert into public.products (company_id, category_id, name, sku, barcode, description, price, cost, is_active, min_stock)
select 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  c.id,
  p.name,
  p.sku,
  p.barcode,
  p.description,
  p.price,
  p.cost,
  p.is_active,
  p.min_stock
from category_ids c
cross join (
  values 
    ('Electrónicos', 'Teclado Mecánico RGB', 'TECH-KB-001', '1234567890123', 'Teclado mecánico con retroiluminación RGB', 89.99, 45.00, true, 10),
    ('Electrónicos', 'Mouse Inalámbrico', 'TECH-MS-001', '1234567890124', 'Mouse inalámbrico ergonómico', 29.99, 15.00, true, 20),
    ('Computadoras', 'Monitor 24" Full HD', 'COMP-MON-001', '1234567890125', 'Monitor LED 24 pulgadas Full HD', 199.99, 120.00, true, 5),
    ('Ropa', 'Camiseta Básica', 'CLOTH-TS-001', '1234567890126', 'Camiseta 100% algodón, talla M', 15.99, 8.00, true, 50),
    ('Ropa', 'Jeans Clásicos', 'CLOTH-JN-001', '1234567890127', 'Jeans azul clásico, talla 32', 49.99, 25.00, true, 25),
    ('Hogar', 'Taza Cerámica', 'HOME-MUG-001', '1234567890128', 'Taza de cerámica 350ml', 8.99, 4.50, true, 100),
    ('Oficina', 'Cuaderno A4', 'OFF-NB-001', '1234567890129', 'Cuaderno espiral A4, 100 hojas', 5.99, 2.50, true, 200)
) as p(category_name, name, sku, barcode, description, price, cost, is_active, min_stock)
where c.name = p.category_name
on conflict (company_id, sku) where sku is not null and deleted_at is null do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cost = excluded.cost;

-- =====================================================
-- CLIENTES DE EJEMPLO
-- =====================================================

insert into public.customers (id, company_id, name, email, phone, tax_id, credit_limit, is_active)
values 
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567891'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Retail Store ABC',
    'orders@retailabc.com',
    '+1-555-1000',
    'CUST-001-RET',
    5000.00,
    true
  ),
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567892'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Office Solutions Inc',
    'purchasing@officesolutions.com',
    '+1-555-2000',
    'CUST-002-OFF',
    10000.00,
    true
  ),
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567893'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Tech Startup XYZ',
    'admin@techxyz.com',
    '+1-555-3000',
    'CUST-003-TECH',
    2500.00,
    true
  )
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone,
  credit_limit = excluded.credit_limit;

-- =====================================================
-- DIRECCIONES DE CLIENTES
-- =====================================================

insert into public.customer_addresses (customer_id, company_id, label, address, city, state, postal_code, country)
values 
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567891'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Oficina Principal',
    '100 Retail Plaza',
    'Shopping City',
    'SC',
    '11111',
    'Estados Unidos'
  ),
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567892'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Sede Corporativa',
    '200 Business Park',
    'Corporate City',
    'CC',
    '22222',
    'Estados Unidos'
  ),
  (
    'c1b2c3d4-e5f6-7890-abcd-ef1234567893'::uuid,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'Oficina',
    '300 Innovation Dr',
    'Startup City',
    'ST',
    '33333',
    'Estados Unidos'
  )
on conflict (id) do update set
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  postal_code = excluded.postal_code;

-- =====================================================
-- NIVELES DE INVENTARIO INICIALES
-- =====================================================

-- Insertar niveles de inventario para productos en el almacén principal
with warehouse_main as (
  select id from public.warehouses 
  where company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid 
  and code = 'WH-001'
  limit 1
),
product_list as (
  select id, sku from public.products 
  where company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
)
insert into public.inventory_levels (warehouse_id, product_id, quantity, reserved_quantity, last_movement_at)
select 
  w.id,
  p.id,
  case 
    when p.sku like 'TECH-%' then 50
    when p.sku like 'COMP-%' then 20
    when p.sku like 'CLOTH-%' then 100
    when p.sku like 'HOME-%' then 200
    when p.sku like 'OFF-%' then 500
    else 25
  end as quantity,
  0 as reserved_quantity,
  now() as last_movement_at
from warehouse_main w
cross join product_list p
on conflict (warehouse_id, product_id) do update set
  quantity = excluded.quantity,
  reserved_quantity = excluded.reserved_quantity,
  last_movement_at = excluded.last_movement_at;

-- =====================================================
-- MOVIMIENTOS DE STOCK INICIALES
-- =====================================================

-- Registrar movimientos iniciales de stock (entrada inicial) - solo si el usuario existe
with warehouse_main as (
  select id from public.warehouses 
  where company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid 
  and code = 'WH-001'
  limit 1
),
product_list as (
  select id, sku from public.products 
  where company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
)
insert into public.stock_movements (warehouse_id, product_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
select 
  w.id,
  p.id,
  'IN',
  case 
    when p.sku like 'TECH-%' then 50
    when p.sku like 'COMP-%' then 20
    when p.sku like 'CLOTH-%' then 100
    when p.sku like 'HOME-%' then 200
    when p.sku like 'OFF-%' then 500
    else 25
  end as quantity,
  case 
    when p.sku = 'TECH-KB-001' then 45.00
    when p.sku = 'TECH-MS-001' then 15.00
    when p.sku = 'COMP-MON-001' then 120.00
    when p.sku = 'CLOTH-TS-001' then 8.00
    when p.sku = 'CLOTH-JN-001' then 25.00
    when p.sku = 'HOME-MUG-001' then 4.50
    when p.sku = 'OFF-NB-001' then 2.50
    else 10.00
  end as unit_cost,
  'INITIAL_STOCK',
  gen_random_uuid(),
  'Inventario inicial del sistema',
  '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid
from warehouse_main w
cross join product_list p
where exists (
  select 1 from public.profiles pr 
  where pr.id = '6f62a324-4158-4a2e-990e-aa100a6409a8'::uuid
);

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- NOTAS IMPORTANTES:
-- 1. Ajusta el UUID del administrador según tu usuario real
-- 2. Los datos son de ejemplo para pruebas y desarrollo
-- 3. Las cantidades de inventario son ficticias
-- 4. Los precios y costos son de ejemplo
-- 5. Ejecuta este script después de 01_schema.sql y 02_policies.sql
-- 6. Para limpiar y recargar, usa primero 00_cleanup.sql

-- PRÓXIMOS PASOS:
-- 1. Verificar que el usuario administrador existe en auth.users
-- 2. Probar el login con el usuario creado
-- 3. Verificar que las políticas RLS funcionan correctamente
-- 4. Ajustar datos según necesidades específicas del negocio