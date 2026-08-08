-- =============================================
-- ECOCAMPUS DB - Columna tipo en bote_mallas
-- Correr directo en Supabase SQL Editor (proyecto ya deployado con schema v1.0)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================

ALTER TABLE public.bote_mallas
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'bote_malla'
  CHECK (tipo IN ('bote_malla', 'contenedor_externo', 'punto_reciclaje'));
