-- =============================================
-- ECOCAMPUS DB - Índices reportes
-- Correr directo en Supabase SQL Editor (proyecto ya deployado con schema v1.0)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================

CREATE INDEX IF NOT EXISTS idx_reportes_bote_malla_id ON public.reportes(bote_malla_id);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON public.reportes(usuario_id);
