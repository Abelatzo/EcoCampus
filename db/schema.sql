-- =============================================
-- ECOCAMPUS DB - Schema v2.0
-- Universidad Tecnológica de Ciudad Juárez
-- Programa Universidad Sustentable
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: usuarios
-- Extiende auth.users de Supabase con rol y datos extra
-- =============================================
-- Correo institucional UTCJ: al + matricula + @utcj.edu.mx (ej. al24311267@utcj.edu.mx)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^al[0-9]+@utcj\.edu\.mx$'),
  rol TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante', 'administrador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: edificios
-- Catálogo fijo de edificios del campus UTCJ (A-Q). Los reportes se
-- levantan por edificio, no por punto físico individual.
-- =============================================
CREATE TABLE IF NOT EXISTS public.edificios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letra TEXT NOT NULL UNIQUE CHECK (letra ~ '^[A-Q]$'),
  -- Posicion en PORCENTAJE (0-100) sobre frontend/src/assets/ImagenMapa.jpeg,
  -- no coordenadas GPS -- el mapa es una imagen fija del campus, no geografico.
  pos_x DECIMAL(5,2) CHECK (pos_x IS NULL OR (pos_x >= 0 AND pos_x <= 100)),
  pos_y DECIMAL(5,2) CHECK (pos_y IS NULL OR (pos_y >= 0 AND pos_y <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: bote_mallas
-- Contenedor del estatus agregado de reportes de un edificio (una fila
-- por edificio). Los reportes solo eligen edificio, no un punto fisico
-- especifico -- esa aclaracion queda en reportes.descripcion como texto
-- libre. El estatus lo mantiene el trigger sync_bote_malla_edificio, no
-- se escribe manualmente.
-- =============================================
CREATE TABLE IF NOT EXISTS public.bote_mallas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio_id UUID NOT NULL UNIQUE REFERENCES public.edificios(id) ON DELETE CASCADE,
  estatus TEXT NOT NULL DEFAULT 'disponible' CHECK (estatus IN ('disponible', 'pendiente', 'en_proceso', 'dañado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: reportes
-- Reportes de estudiantes/admin, ligados a un edificio (no a un punto
-- físico específico). Título obligatorio; ubicación, descripción e
-- imagen opcionales.
-- =============================================
CREATE TABLE IF NOT EXISTS public.reportes (
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

-- =============================================
-- TABLA: eventos
-- Eventos, actualizaciones e información publicados por administradores
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

-- =============================================
-- ÍNDICES: FKs de bote_mallas y reportes (sin índice = scan completo en
-- queries por edificio o usuario)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bote_mallas_edificio_id ON public.bote_mallas(edificio_id);
CREATE INDEX IF NOT EXISTS idx_reportes_edificio_id ON public.reportes(edificio_id);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON public.reportes(usuario_id);

-- =============================================
-- ÍNDICES: eventos (filtros del feed por tipo/publicado, orden por fecha)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_publicado ON public.eventos(publicado);
CREATE INDEX IF NOT EXISTS idx_eventos_autor_id ON public.eventos(autor_id);

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bote_mallas_updated_at
  BEFORE UPDATE ON public.bote_mallas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reportes_updated_at
  BEFORE UPDATE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: sincronizar bote_mallas.estatus con los reportes del edificio
-- Prioridad: dañado > pendiente > en_proceso > disponible (sin reportes
-- activos). Corre en la misma transaccion que el write de reportes.
-- =============================================
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

CREATE TRIGGER trg_sync_bote_malla_edificio
  AFTER INSERT OR UPDATE OF estatus OR DELETE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION public.sync_bote_malla_edificio();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bote_mallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario autenticado
-- search_path fijo ('') y EXECUTE restringido a authenticated: evita hijack
-- via search_path y llamada directa anon a /rest/v1/rpc/get_user_rol
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_user_rol() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO authenticated;

-- -----------------------------------------------
-- POLÍTICAS: usuarios
-- -----------------------------------------------
-- SELECT consolidado en una sola policy (propio perfil o admin) para evitar
-- multiple_permissive_policies; auth.uid() envuelto en (select ...) para
-- que el planner lo evalúe una vez por query, no por fila
CREATE POLICY "usuarios: ver propio perfil o admin ve todos"
  ON public.usuarios FOR SELECT
  USING (id = (select auth.uid()) OR get_user_rol() = 'administrador');

CREATE POLICY "usuarios: insertar en registro"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()) AND rol = 'estudiante');

CREATE POLICY "usuarios: editar propio perfil"
  ON public.usuarios FOR UPDATE
  USING (id = (select auth.uid()));

-- Bloquea escalar rol via UPDATE: RLS solo filtra filas, no columnas.
-- Sin esto, el usuario podia auto-asignarse rol='administrador'.
REVOKE UPDATE ON public.usuarios FROM authenticated;
GRANT UPDATE (nombre, email, updated_at) ON public.usuarios TO authenticated;

CREATE POLICY "usuarios: admin elimina"
  ON public.usuarios FOR DELETE
  USING (get_user_rol() = 'administrador');

-- Cambio de rol vía backend: SECURITY DEFINER bypassa el REVOKE UPDATE
-- de la columna rol, por eso valida admin dentro del body (si no,
-- cualquier authenticated podria auto-escalarse o cambiar rol ajeno)
CREATE OR REPLACE FUNCTION public.cambiar_rol_usuario(target_id UUID, nuevo_rol TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF public.get_user_rol() <> 'administrador' THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  UPDATE public.usuarios SET rol = nuevo_rol WHERE id = target_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cambiar_rol_usuario(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cambiar_rol_usuario(UUID, TEXT) TO authenticated;

-- -----------------------------------------------
-- POLÍTICAS: edificios
-- -----------------------------------------------
-- Catálogo fijo: lectura para cualquier autenticado, escritura solo admin
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

-- -----------------------------------------------
-- POLÍTICAS: bote_mallas
-- -----------------------------------------------
-- Solo lectura: el estatus lo escribe unicamente el trigger de sync
-- (corre bajo el service role del backend, bypassa RLS). No hay endpoint
-- que escriba bote_mallas directo, por eso no hace falta policy de
-- escritura para authenticated/admin.
CREATE POLICY "bote_mallas: lectura autenticados"
  ON public.bote_mallas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- -----------------------------------------------
-- POLÍTICAS: reportes
-- -----------------------------------------------
CREATE POLICY "reportes: lectura todos autenticados"
  ON public.reportes FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "reportes: estudiante puede crear"
  ON public.reportes FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL AND
    usuario_id = (select auth.uid())
  );

-- Un solo UPDATE: admin siempre, estudiante solo su propio reporte pendiente
-- (permite cancelar/editar antes de que entre en proceso)
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

-- -----------------------------------------------
-- POLÍTICAS: eventos
-- -----------------------------------------------
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
