-- =============================================
-- ECOCAMPUS DB - Storage
-- Bucket para fotos de reportes (reportes.foto_url)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('reportes-fotos', 'reportes-fotos', true)
ON CONFLICT (id) DO NOTHING;

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
