-- =====================================================
-- 07_avatars_bucket.sql - Bucket para Avatars de Usuario
-- =====================================================
-- Descripción: Script para crear el bucket de avatars y sus políticas
-- Ejecutar en: Supabase SQL Editor o psql

-- =====================================================
-- CREAR BUCKET DE AVATARS
-- =====================================================

-- Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- público para que las imágenes sean accesibles
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- POLÍTICAS DE ACCESO
-- =====================================================

-- Política de lectura: todos pueden ver avatars (bucket público)
CREATE POLICY "avatars_select_public" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Política de escritura: usuarios pueden subir/modificar solo sus propios avatars
CREATE POLICY "avatars_modify_own" ON storage.objects
FOR ALL USING (
  bucket_id = 'avatars' AND (
    auth.role() = 'service_role' OR
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
) WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.role() = 'service_role' OR
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
);

-- =====================================================
-- FUNCIÓN HELPER (OPCIONAL)
-- =====================================================

-- Función para obtener URL de avatar de usuario
CREATE OR REPLACE FUNCTION public.get_avatar_url(
  user_id uuid,
  avatar_filename text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'avatars/' || user_id::text || '/' || avatar_filename;
$$;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

-- ESTRUCTURA DE CARPETAS:
-- avatars/
--   ├── {user_id}/
--   │   └── avatar-{timestamp}.jpg

-- PARA EJECUTAR ESTE SCRIPT:
-- 1. Copia todo el contenido de este archivo
-- 2. Ve a tu proyecto en Supabase Dashboard
-- 3. Navega a SQL Editor
-- 4. Pega el código y ejecuta

-- VERIFICAR QUE FUNCIONÓ:
-- SELECT * FROM storage.buckets WHERE id = 'avatars';
-- SELECT * FROM storage.policies WHERE bucket_id = 'avatars';