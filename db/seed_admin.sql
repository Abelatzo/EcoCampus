-- =============================================
-- ECOCAMPUS DB - Promover usuario a administrador
-- =============================================
-- No se puede insertar directo en auth.users por SQL (Supabase Auth maneja
-- el hash de password y flujo de confirmación). Pasos:
--
-- 1. Crear el usuario de prueba via Supabase Dashboard > Authentication >
--    Add user (o via signup normal de la app) con un correo dedicado,
--    ej. admin.test@utcj.edu.mx
-- 2. El trigger/flujo de la app debe insertar la fila correspondiente en
--    public.usuarios con rol 'estudiante' por default.
-- 3. Correr este UPDATE para promoverlo a administrador:

UPDATE public.usuarios
SET rol = 'administrador'
WHERE email = 'admin.test@utcj.edu.mx';

-- Verificar:
-- SELECT id, nombre, email, rol FROM public.usuarios WHERE rol = 'administrador';
