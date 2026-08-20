-- =============================================
-- ECOCAMPUS DB - Posicion de edificios en el mapa + bote_mallas 1:1
-- Correr directo en Supabase SQL Editor (proyecto ya deployado)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================
-- Decision de producto: los reportes solo eligen edificio (no un punto
-- fisico especifico), y la app usa una imagen fija del campus, no mapa
-- geografico real. Por eso:
--
-- 1. edificios gana pos_x/pos_y: posicion en PORCENTAJE (0-100) sobre la
--    imagen frontend/src/assets/ImagenMapa.jpeg, no coordenadas GPS.
-- 2. bote_mallas deja de ser "puntos fisicos gestionados por admin" y pasa
--    a ser "contenedor del estado agregado de reportes de un edificio":
--    una fila por edificio (UNIQUE(edificio_id)), sin nombre/latitud/
--    longitud/tipo -- esos datos ya no aplican, la fisica exacta del punto
--    (cual bote de malla dentro del edificio) queda en reportes.descripcion
--    como texto libre.
-- 3. Un trigger en reportes recalcula el estatus del bote_malla del
--    edificio afectado en cada INSERT/UPDATE/DELETE, con prioridad
--    dañado > pendiente > en_proceso > disponible. Corre en la misma
--    transaccion que el write de reportes -- no es un segundo viaje de
--    red, evita el bug de conexion stale ya documentado para procesos de
--    larga duracion.

BEGIN;

-- 1. Posicion de cada edificio en la imagen del mapa
ALTER TABLE public.edificios
  ADD COLUMN IF NOT EXISTS pos_x DECIMAL(5,2) CHECK (pos_x IS NULL OR (pos_x >= 0 AND pos_x <= 100)),
  ADD COLUMN IF NOT EXISTS pos_y DECIMAL(5,2) CHECK (pos_y IS NULL OR (pos_y >= 0 AND pos_y <= 100));

-- 2. bote_mallas: solo tenia datos de prueba placeholder, se recrea
DROP TRIGGER IF EXISTS trg_bote_mallas_updated_at ON public.bote_mallas;
DROP TABLE IF EXISTS public.bote_mallas;

CREATE TABLE public.bote_mallas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio_id UUID NOT NULL UNIQUE REFERENCES public.edificios(id) ON DELETE CASCADE,
  estatus TEXT NOT NULL DEFAULT 'disponible' CHECK (estatus IN ('disponible', 'pendiente', 'en_proceso', 'dañado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bote_mallas_edificio_id ON public.bote_mallas(edificio_id);

CREATE TRIGGER trg_bote_mallas_updated_at
  BEFORE UPDATE ON public.bote_mallas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.bote_mallas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bote_mallas: lectura autenticados"
  ON public.bote_mallas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Sin policies de escritura para authenticated/admin a proposito: el
-- estatus solo lo escribe el trigger de sync (corre bajo el mismo rol que
-- ejecuta el write en reportes, que siempre es el service role del
-- backend -- bypassa RLS). No queda ningun endpoint que escriba
-- bote_mallas directo.

-- 3. Seed: un bote_malla 'disponible' por cada edificio existente
INSERT INTO public.bote_mallas (edificio_id, estatus)
SELECT id, 'disponible' FROM public.edificios
ON CONFLICT (edificio_id) DO NOTHING;

-- 4. Trigger: recalcula el estatus del bote_malla del edificio afectado
-- cada vez que cambian los reportes de ese edificio.
CREATE OR REPLACE FUNCTION public.sync_bote_malla_edificio()
RETURNS TRIGGER AS $$
DECLARE
  v_edificio_id UUID;
  v_estatus TEXT;
BEGIN
  v_edificio_id := COALESCE(NEW.edificio_id, OLD.edificio_id);

  SELECT
    CASE
      WHEN bool_or(estatus = 'dañado') THEN 'dañado'
      WHEN bool_or(estatus = 'pendiente') THEN 'pendiente'
      WHEN bool_or(estatus = 'en_proceso') THEN 'en_proceso'
      ELSE 'disponible'
    END
  INTO v_estatus
  FROM public.reportes
  WHERE edificio_id = v_edificio_id AND estatus <> 'resuelto';

  UPDATE public.bote_mallas
  SET estatus = COALESCE(v_estatus, 'disponible')
  WHERE edificio_id = v_edificio_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

DROP TRIGGER IF EXISTS trg_sync_bote_malla_edificio ON public.reportes;
CREATE TRIGGER trg_sync_bote_malla_edificio
  AFTER INSERT OR UPDATE OF estatus OR DELETE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION public.sync_bote_malla_edificio();

COMMIT;

-- Nota: db/bote_mallas_tipo.sql queda obsoleto (la columna tipo que
-- agregaba ya no existe), se deja como registro historico de una
-- migracion ya aplicada, no se debe volver a correr.
