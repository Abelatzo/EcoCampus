-- =============================================
-- ECOCAMPUS DB - Schema v1.0
-- Universidad Tecnológica de Ciudad Juárez
-- Programa Universidad Sustentable
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: usuarios
-- Extiende auth.users de Supabase con rol y datos extra
-- =============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante', 'administrador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: bote_mallas
-- Puntos de recolección en campus UTCJ
-- =============================================
CREATE TABLE IF NOT EXISTS public.bote_mallas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'disponible' CHECK (estatus IN ('disponible', 'saturado', 'en_atencion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(edificio, ubicacion)
);

-- =============================================
-- TABLA: reportes
-- Reportes de saturación vinculados a bote_mallas
-- =============================================
CREATE TABLE IF NOT EXISTS public.reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bote_malla_id UUID NOT NULL REFERENCES public.bote_mallas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  comentario TEXT,
  foto_url TEXT,
  estatus TEXT NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en_proceso', 'resuelto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bote_mallas_updated_at
  BEFORE UPDATE ON public.bote_mallas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reportes_updated_at
  BEFORE UPDATE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: sincronizar estatus bote_malla con reportes
-- =============================================
CREATE OR REPLACE FUNCTION sync_bote_malla_estatus()
RETURNS TRIGGER AS $$
BEGIN
  -- Nuevo reporte pendiente → bote_malla a saturado
  IF (TG_OP = 'INSERT' AND NEW.estatus = 'pendiente') THEN
    UPDATE public.bote_mallas SET estatus = 'saturado' WHERE id = NEW.bote_malla_id;
  END IF;
  -- Reporte en proceso → bote_malla a en_atencion
  IF (TG_OP = 'UPDATE' AND NEW.estatus = 'en_proceso' AND OLD.estatus = 'pendiente') THEN
    UPDATE public.bote_mallas SET estatus = 'en_atencion' WHERE id = NEW.bote_malla_id;
  END IF;
  -- Reporte resuelto → bote_malla regresa a disponible
  IF (TG_OP = 'UPDATE' AND NEW.estatus = 'resuelto') THEN
    UPDATE public.bote_mallas SET estatus = 'disponible' WHERE id = NEW.bote_malla_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_bote_malla_estatus
  AFTER INSERT OR UPDATE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION sync_bote_malla_estatus();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bote_mallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------
-- POLÍTICAS: usuarios
-- -----------------------------------------------
CREATE POLICY "usuarios: ver propio perfil"
  ON public.usuarios FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "usuarios: editar propio perfil"
  ON public.usuarios FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "usuarios: admin ve todos"
  ON public.usuarios FOR SELECT
  USING (get_user_rol() = 'administrador');

-- -----------------------------------------------
-- POLÍTICAS: bote_mallas
-- -----------------------------------------------
CREATE POLICY "bote_mallas: lectura autenticados"
  ON public.bote_mallas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "bote_mallas: escritura solo admin"
  ON public.bote_mallas FOR ALL
  USING (get_user_rol() = 'administrador');

-- -----------------------------------------------
-- POLÍTICAS: reportes
-- -----------------------------------------------
CREATE POLICY "reportes: lectura todos autenticados"
  ON public.reportes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "reportes: estudiante puede crear"
  ON public.reportes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    usuario_id = auth.uid()
  );

CREATE POLICY "reportes: admin ve todos"
  ON public.reportes FOR SELECT
  USING (get_user_rol() = 'administrador');

CREATE POLICY "reportes: admin puede actualizar"
  ON public.reportes FOR UPDATE
  USING (get_user_rol() = 'administrador');
