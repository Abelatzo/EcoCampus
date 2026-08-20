-- =============================================
-- ECOCAMPUS DB - Storage
-- Bucket para fotos de reportes (reportes.foto_url)
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reportes-fotos', 'reportes-fotos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- allowed_mime_types de Supabase Storage solo valida el Content-Type que
-- manda el cliente al subir -- es spoofeable (un .exe renombrado a
-- foto.jpg con Content-Type: image/jpeg falso lo pasa). Es un primer
-- filtro, NO reemplaza la validación real.
--
-- Recomendación del profesor (via Abel): antes de subir el archivo a este
-- bucket, el backend debe leer los primeros bytes y detectar el MIME real
-- por firma binaria (magic bytes), no confiar en el Content-Type del
-- cliente ni en la extensión del nombre de archivo. En Node, la librería
-- `file-type` (https://www.npmjs.com/package/file-type) hace esto:
--   const { fileTypeFromBuffer } = await import('file-type')
--   const tipo = await fileTypeFromBuffer(buffer)
--   if (!tipo || !['image/jpeg','image/png','image/webp'].includes(tipo.mime)) rechazar
-- Pendiente: implementar en backend/src/controllers (subida de foto_url).

-- Lectura pública (fotos se muestran en reportes a cualquiera con el link)
CREATE POLICY "reportes-fotos: lectura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reportes-fotos');

-- Escritura solo autenticados, dentro de su propia carpeta (auth.uid()/archivo.ext)
CREATE POLICY "reportes-fotos: escritura autenticados"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reportes-fotos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
