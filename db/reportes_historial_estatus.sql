-- =============================================
-- ECOCAMPUS DB - Historial de estatus de reportes
-- Correr directo en Supabase SQL Editor (proyecto ya deployado)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================
-- Motivo: las metricas del panel admin (GET /api/admin/estadisticas)
-- contaban el estatus ACTUAL de cada reporte, no cuantos reportes
-- pasaron por cada estatus a lo largo de su vida -- un reporte que rebota
-- pendiente -> en_proceso -> pendiente de nuevo no debe contar 2 veces
-- para "pendientes", y un reporte ya resuelto SI debe seguir contando
-- para "pendientes"/"en_proceso" si paso por ahi (aunque ya no sea
-- visible como activo). Sin un historial, esa informacion se pierde en
-- cada UPDATE porque reportes.estatus solo guarda el valor vigente.

BEGIN;

-- 1. Una fila por cada estatus que un reporte ha tenido, en orden
CREATE TABLE IF NOT EXISTS public.reportes_historial_estatus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporte_id UUID NOT NULL REFERENCES public.reportes(id) ON DELETE CASCADE,
  estatus TEXT NOT NULL CHECK (estatus IN ('pendiente', 'en_proceso', 'resuelto', 'dañado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_estatus_reporte_id ON public.reportes_historial_estatus(reporte_id);
CREATE INDEX IF NOT EXISTS idx_historial_estatus_estatus ON public.reportes_historial_estatus(estatus);

ALTER TABLE public.reportes_historial_estatus ENABLE ROW LEVEL SECURITY;

-- Solo lectura para admin (es dato de metricas, no algo que el estudiante
-- necesite ver directo). Sin policy de escritura: solo el trigger de abajo
-- escribe aqui, corre bajo el mismo rol que el UPDATE/INSERT en reportes
-- (service role del backend, bypassa RLS -- mismo patron que bote_mallas).
CREATE POLICY "reportes_historial_estatus: admin lee"
  ON public.reportes_historial_estatus FOR SELECT
  USING (get_user_rol() = 'administrador');

-- 2. Trigger: registra el estatus inicial al crear, y cada vez que cambia
CREATE OR REPLACE FUNCTION public.registrar_historial_estatus()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.reportes_historial_estatus (reporte_id, estatus)
  VALUES (NEW.id, NEW.estatus);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

DROP TRIGGER IF EXISTS trg_historial_estatus_insert ON public.reportes;
CREATE TRIGGER trg_historial_estatus_insert
  AFTER INSERT ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historial_estatus();

DROP TRIGGER IF EXISTS trg_historial_estatus_update ON public.reportes;
CREATE TRIGGER trg_historial_estatus_update
  AFTER UPDATE OF estatus ON public.reportes
  FOR EACH ROW
  WHEN (OLD.estatus IS DISTINCT FROM NEW.estatus)
  EXECUTE FUNCTION public.registrar_historial_estatus();

-- 3. Backfill: registrar el estatus actual de los reportes que ya existen,
-- para que las metricas no arranquen en cero para datos de antes de este
-- cambio. Solo un punto de datos por reporte existente (su estatus actual,
-- no su historial real que no se guardo) -- mejor que nada, y no se puede
-- reconstruir lo que nunca se registro.
INSERT INTO public.reportes_historial_estatus (reporte_id, estatus, created_at)
SELECT id, estatus, created_at FROM public.reportes
ON CONFLICT DO NOTHING;

COMMIT;
