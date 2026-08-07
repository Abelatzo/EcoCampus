-- =============================================
-- ECOCAMPUS DB - Formato de correo institucional en usuarios
-- Correr directo en Supabase SQL Editor (proyecto ya deployado con schema v1.0)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================
-- Correo institucional UTCJ: al + matricula + @utcj.edu.mx (ej. al24311267@utcj.edu.mx)
--
-- NOT VALID: hay filas de prueba existentes (Test@utcj.edu.mx, hacker@utcj.edu.mx)
-- que no siguen el formato. NOT VALID no las valida retroactivamente, pero
-- SI aplica el CHECK a todo INSERT/UPDATE nuevo desde este momento.

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_email_institucional
  CHECK (email ~* '^al[0-9]+@utcj\.edu\.mx$')
  NOT VALID;
