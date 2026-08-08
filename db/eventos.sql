-- =============================================
-- ECOCAMPUS DB - Tabla eventos
-- Correr directo en Supabase SQL Editor (proyecto ya deployado con schema v1.0)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- Requiere: update_updated_at() y get_user_rol() ya existentes (schema.sql)
-- =============================================

CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('evento', 'actualizacion', 'informacion')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_evento TIMESTAMPTZ,
  lugar TEXT,
  publicado BOOLEAN NOT NULL DEFAULT true,
  autor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_publicado ON public.eventos(publicado);
CREATE INDEX IF NOT EXISTS idx_eventos_autor_id ON public.eventos(autor_id);

CREATE TRIGGER trg_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Estudiantes ven solo publicados; admin ve todo (incluye borradores/ocultos)
CREATE POLICY "eventos: lectura publicados o admin ve todos"
  ON public.eventos FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL AND
    (publicado = true OR get_user_rol() = 'administrador')
  );

CREATE POLICY "eventos: admin publica"
  ON public.eventos FOR INSERT
  WITH CHECK (
    get_user_rol() = 'administrador' AND
    autor_id = (select auth.uid())
  );

CREATE POLICY "eventos: admin edita"
  ON public.eventos FOR UPDATE
  USING (get_user_rol() = 'administrador');

CREATE POLICY "eventos: admin elimina"
  ON public.eventos FOR DELETE
  USING (get_user_rol() = 'administrador');
