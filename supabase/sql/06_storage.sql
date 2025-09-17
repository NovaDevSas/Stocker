-- =====================================================
-- 06_storage.sql - Configuración de Storage Buckets
-- =====================================================
-- Run as: service_role
-- Descripción: Configuración completa de buckets de storage
-- para imágenes de productos, assets de empresa y firmas de usuario

-- =====================================================
-- CREACIÓN DE BUCKETS
-- =====================================================

-- Bucket para imágenes de productos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket para assets de empresa (logos, documentos, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  false,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket para firmas de usuarios
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-signatures',
  'user-signatures',
  false,
  2097152, -- 2MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket para avatares de usuarios
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true, -- público para que las imágenes sean accesibles
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Las políticas de storage se pueden crear sin cambiar de rol

-- =====================================================
-- POLÍTICAS PARA PRODUCT-IMAGES BUCKET
-- =====================================================

-- Lectura: usuarios de la misma empresa pueden ver imágenes de productos
create policy "product_images_select_company" on storage.objects
for select using (
  bucket_id = 'product-images' and (
    public.is_admin() or
    exists(
      select 1 from public.products p
      where p.id::text = (storage.foldername(name))[1]
      and p.company_id in (select public.get_user_companies())
    )
  )
);

-- Escritura: usuarios autorizados pueden subir/modificar imágenes
create policy "product_images_modify_company" on storage.objects
for all using (
  bucket_id = 'product-images' and (
    public.is_admin() or
    exists(
      select 1 from public.products p
      where p.id::text = (storage.foldername(name))[1]
      and public.user_belongs_to_company(p.company_id)
    )
  )
) with check (
  bucket_id = 'product-images' and (
    public.is_admin() or
    exists(
      select 1 from public.products p
      where p.id::text = (storage.foldername(name))[1]
      and public.user_belongs_to_company(p.company_id)
    )
  )
);

-- =====================================================
-- POLÍTICAS PARA COMPANY-ASSETS BUCKET
-- =====================================================

-- Lectura: usuarios de la empresa pueden ver sus assets
create policy "company_assets_select_company" on storage.objects
for select using (
  bucket_id = 'company-assets' and (
    public.is_admin() or
    (storage.foldername(name))[1]::uuid in (select public.get_user_companies())
  )
);

-- Escritura: usuarios autorizados pueden gestionar assets de su empresa
create policy "company_assets_modify_company" on storage.objects
for all using (
  bucket_id = 'company-assets' and (
    public.is_admin() or
    public.user_belongs_to_company((storage.foldername(name))[1]::uuid)
  )
) with check (
  bucket_id = 'company-assets' and (
    public.is_admin() or
    public.user_belongs_to_company((storage.foldername(name))[1]::uuid)
  )
);

-- =====================================================
-- POLÍTICAS PARA USER-SIGNATURES BUCKET
-- =====================================================

-- Lectura: usuarios pueden ver su propia firma o admins pueden ver todas
create policy "user_signatures_select_own_or_admin" on storage.objects
for select using (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or public.is_admin()
  )
);

-- Escritura: usuarios pueden gestionar su propia firma o admins pueden gestionar todas
create policy "user_signatures_modify_own_or_admin" on storage.objects
for all using (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or public.is_admin()
  )
) with check (
  bucket_id = 'user-signatures' and (
    owner = auth.uid() or public.is_admin()
  )
);

-- =====================================================
-- POLÍTICAS PARA AVATARS BUCKET
-- =====================================================

-- Lectura: todos pueden ver avatars (bucket público)
create policy "avatars_select_public" on storage.objects
for select using (bucket_id = 'avatars');

-- Escritura: usuarios pueden subir/modificar solo sus propios avatars
create policy "avatars_modify_own" on storage.objects
for all using (
  bucket_id = 'avatars' and (
    public.is_admin() or
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
) with check (
  bucket_id = 'avatars' and (
    public.is_admin() or
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
);

-- =====================================================
-- FUNCIONES HELPER PARA STORAGE
-- =====================================================

-- Continuamos con las funciones helper

-- Función para obtener URL pública de imagen de producto
create or replace function public.get_product_image_url(
  product_id uuid,
  image_filename text
)
returns text
language sql
security definer
set search_path = public
as $$
  select 
    case 
      when exists(
        select 1 from public.products p
        where p.id = product_id
        and p.company_id in (select public.get_user_companies())
      ) then
        'product-images/' || product_id::text || '/' || image_filename
      else null
    end;
$$;

-- Función para obtener URL de asset de empresa
create or replace function public.get_company_asset_url(
  company_id uuid,
  asset_filename text
)
returns text
language sql
security definer
set search_path = public
as $$
  select 
    case 
      when public.user_belongs_to_company(company_id) or public.is_admin() then
        'company-assets/' || company_id::text || '/' || asset_filename
      else null
    end;
$$;

-- Función para obtener URL de firma de usuario
create or replace function public.get_user_signature_url(
  user_id uuid,
  signature_filename text
)
returns text
language sql
security definer
set search_path = public
as $$
  select 
    case 
      when user_id = auth.uid() or public.is_admin() then
        'user-signatures/' || user_id::text || '/' || signature_filename
      else null
    end;
$$;

-- Función para obtener URL de avatar de usuario
create or replace function public.get_avatar_url(
  user_id uuid,
  avatar_filename text
)
returns text
language sql
security definer
set search_path = public
as $$
  select 'avatars/' || user_id::text || '/' || avatar_filename;
$$;

-- =====================================================
-- TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Función para limpiar imágenes huérfanas cuando se elimina un producto
-- NOTA: Esta función se implementará cuando se cree la tabla product_images
-- create or replace function public.cleanup_product_images()
-- returns trigger
-- language plpgsql
-- security definer as $$
-- begin
--   -- Eliminar registros de product_images
--   delete from public.product_images 
--   where product_id = old.id;
--   
--   -- Nota: Los archivos físicos en storage deben limpiarse manualmente
--   -- o con un job programado que verifique archivos huérfanos
--   
--   return old;
-- end;
-- $$;

-- Trigger para limpiar imágenes al eliminar producto
-- drop trigger if exists cleanup_product_images_trigger on public.products;
-- create trigger cleanup_product_images_trigger
--   after delete on public.products
--   for each row execute function public.cleanup_product_images();

-- =====================================================
-- VISTAS PARA GESTIÓN DE STORAGE
-- =====================================================

-- Vista para listar imágenes de productos con URLs
-- NOTA: Esta vista se implementará cuando se cree la tabla product_images
-- create or replace view public.product_images_with_urls as
-- select 
--   pi.id,
--   pi.product_id,
--   pi.image_url,
--   pi.alt_text,
--   pi.is_primary,
--   pi.sort_order,
--   p.name as product_name,
--   p.sku,
--   p.company_id,
--   c.name as company_name,
--   pi.created_at,
--   pi.updated_at
-- from public.product_images pi
-- join public.products p on p.id = pi.product_id
-- join public.companies c on c.id = p.company_id
-- where p.company_id in (select public.get_user_companies())
-- order by pi.product_id, pi.sort_order;

-- Vista para assets de empresa
create or replace view public.company_assets_summary as
select 
  c.id as company_id,
  c.name as company_name,
  c.logo_url,
  count(so.id) as total_files,
  sum((so.metadata->>'size')::bigint) as total_size_bytes
from public.companies c
left join storage.objects so on (
  so.bucket_id = 'company-assets' and
  (storage.foldername(so.name))[1]::uuid = c.id
)
where c.id in (select public.get_user_companies())
group by c.id, c.name, c.logo_url
order by c.name;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- ESTRUCTURA DE CARPETAS RECOMENDADA:
-- 
-- product-images/
--   ├── {product_id}/
--   │   ├── main.jpg
--   │   ├── gallery-1.jpg
--   │   └── gallery-2.jpg
--
-- company-assets/
--   ├── {company_id}/
--   │   ├── logo.png
--   │   ├── certificate.pdf
--   │   └── signature.svg
--
-- user-signatures/
--   ├── {user_id}/
--   │   └── signature.png
--
-- avatars/
--   ├── {user_id}/
--   │   └── avatar.jpg

-- NOTAS IMPORTANTES:
-- 1. Los buckets tienen límites de tamaño y tipos MIME configurados
-- 2. Las políticas RLS respetan el multitenancy por empresa
-- 3. Las funciones helper facilitan la generación de URLs
-- 4. Los triggers automatizan la limpieza de metadatos
-- 5. Las vistas proporcionan información consolidada
-- 6. Ejecutar después de 01_schema.sql y 02_policies.sql

-- PRÓXIMOS PASOS:
-- 1. Configurar cliente de storage en la aplicación
-- 2. Implementar upload de archivos con validación
-- 3. Crear job para limpiar archivos huérfanos
-- 4. Configurar CDN si es necesario para producción