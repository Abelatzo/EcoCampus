-- =============================================
-- ECOCAMPUS DB - Ampliar formato de correo institucional en usuarios
-- Correr directo en Supabase SQL Editor (proyecto ya deployado)
-- Ya incluido en schema.sql para futuros deploys desde cero
-- =============================================
-- El CHECK anterior (usuarios_email_institucional) solo aceptaba
-- al + matricula + @utcj.edu.mx, pensado unicamente para alumnos.
-- Profesores y administrativos usan su nombre (ej. jperez@utcj.edu.mx),
-- sin empezar con "al" ni con los mismos digitos que los alumnos.
-- Regla real: cualquier correo que termine en @utcj.edu.mx es valido.
--
-- NOT VALID: igual que la constraint anterior, no revalida filas
-- existentes retroactivamente, pero SI aplica a todo INSERT/UPDATE
-- nuevo desde este momento.

ALTER TABLE public.usuarios DROP CONSTRAINT usuarios_email_institucional;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_email_institucional
  CHECK (email ~* '^[^\s@]+@utcj\.edu\.mx$')
  NOT VALID;
