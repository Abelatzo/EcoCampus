-- =============================================
-- ECOCAMPUS DB - Restructura reportes/bote_mallas por edificio
-- Correr directo en Supabase SQL Editor (proyecto ya deployado con schema v1.0)
-- Ya incluido en schema.sql (v2.0) para futuros deploys desde cero
-- =============================================
-- Motivo: el frontend real (main) ya no liga un reporte a un bote_malla
-- físico específico. El estudiante elige EDIFICIO + título obligatorio +
-- ubicación libre opcional + descripción opcional. bote_mallas pasa a ser
-- "puntos ecológicos" gestionados por admin en el mapa, desacoplados de
-- los reportes. Además se agrega el estado 'dañado' a reportes.
--
-- reportes y bote_mallas solo tenían datos de prueba placeholder (ver
-- comentario de seed.sql sobre GPS pendiente) -> se recrean desde cero
-- en vez de hacer ALTER + backfill.

BEGIN;

-- 1. Quitar el trigger/función que sincronizaba estatus bote_malla <-> reporte
--    (ya no aplica: reportes deja de tener FK a bote_mallas)
DROP TRIGGER IF EXISTS trg_sync_bote_malla_estatus ON public.reportes;
DROP FUNCTION IF EXISTS sync_bote_malla_estatus();

-- 2. Recrear reportes y bote_mallas desde cero (solo tenían datos de prueba)
DROP TABLE IF EXISTS public.reportes;
DROP TABLE IF EXISTS public.bote_mallas;

-- 3. Catálogo de edificios (letra única, hasta la Q; el plantel no tiene
--    edificio 'P', se omite a propósito)
CREATE TABLE IF NOT EXISTS public.edificios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letra TEXT NOT NULL UNIQUE CHECK (letra ~ '^[A-Q]$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.edificios (letra) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'),
  ('J'), ('K'), ('L'), ('M'), ('N'), ('O'), ('Q')
ON CONFLICT (letra) DO NOTHING;

-- 4. bote_mallas: puntos ecológicos del mapa, admin-managed, ligados a edificio
CREATE TABLE public.bote_mallas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio_id UUID NOT NULL REFERENCES public.edificios(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  tipo TEXT NOT NULL DEFAULT 'bote_malla' CHECK (tipo IN ('bote_malla', 'contenedor_externo', 'punto_reciclaje')),
  estatus TEXT NOT NULL DEFAULT 'disponible' CHECK (estatus IN ('disponible', 'pendiente', 'en_proceso', 'dañado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(edificio_id, nombre)
);

-- 5. reportes: título obligatorio, edificio en vez de bote_malla, estado 'dañado'
CREATE TABLE public.reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio_id UUID NOT NULL REFERENCES public.edificios(id) ON DELETE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ubicacion TEXT,
  descripcion TEXT,
  foto_url TEXT,
  estatus TEXT NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en_proceso', 'resuelto', 'dañado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Índices
CREATE INDEX idx_bote_mallas_edificio_id ON public.bote_mallas(edificio_id);
CREATE INDEX idx_reportes_edificio_id ON public.reportes(edificio_id);
CREATE INDEX idx_reportes_usuario_id ON public.reportes(usuario_id);

-- 7. Triggers updated_at (la función update_updated_at() ya existe desde schema.sql)
CREATE TRIGGER trg_bote_mallas_updated_at
  BEFORE UPDATE ON public.bote_mallas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reportes_updated_at
  BEFORE UPDATE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. RLS (get_user_rol() ya existe desde schema.sql)
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bote_mallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edificios: lectura autenticados"
  ON public.edificios FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "edificios: admin inserta"
  ON public.edificios FOR INSERT
  WITH CHECK (get_user_rol() = 'administrador');

CREATE POLICY "edificios: admin actualiza"
  ON public.edificios FOR UPDATE
  USING (get_user_rol() = 'administrador');

CREATE POLICY "edificios: admin elimina"
  ON public.edificios FOR DELETE
  USING (get_user_rol() = 'administrador');

CREATE POLICY "bote_mallas: lectura autenticados"
  ON public.bote_mallas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "bote_mallas: admin inserta"
  ON public.bote_mallas FOR INSERT
  WITH CHECK (get_user_rol() = 'administrador');

CREATE POLICY "bote_mallas: admin actualiza"
  ON public.bote_mallas FOR UPDATE
  USING (get_user_rol() = 'administrador');

CREATE POLICY "bote_mallas: admin elimina"
  ON public.bote_mallas FOR DELETE
  USING (get_user_rol() = 'administrador');

CREATE POLICY "reportes: lectura todos autenticados"
  ON public.reportes FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "reportes: estudiante puede crear"
  ON public.reportes FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL AND
    usuario_id = (select auth.uid())
  );

CREATE POLICY "reportes: actualizar propio pendiente o admin"
  ON public.reportes FOR UPDATE
  USING (
    get_user_rol() = 'administrador' OR
    (usuario_id = (select auth.uid()) AND estatus = 'pendiente')
  )
  WITH CHECK (
    get_user_rol() = 'administrador' OR
    usuario_id = (select auth.uid())
  );

CREATE POLICY "reportes: admin elimina"
  ON public.reportes FOR DELETE
  USING (get_user_rol() = 'administrador');

COMMIT;

-- Después de correr esto: ejecutar seed.sql para repoblar edificios (ya
-- lo hace este script, líneas arriba) y bote_mallas de prueba.
