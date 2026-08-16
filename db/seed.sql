-- =============================================
-- ECOCAMPUS DB - Seed data
-- edificios: catálogo fijo A-Q del campus UTCJ
-- bote_mallas: una fila por edificio (estatus agregado de reportes)
-- =============================================
-- NOTA: pos_x/pos_y quedan NULL (placeholder) hasta que se marquen desde
-- AdminMapView (modo "marcar edificio").
-- DECISIÓN (2026-08-13): solo se dan de alta edificios de letra alfabética
-- (A-Q). 'Cafetería' y 'Guardería' del seed anterior no encajan en el
-- catálogo (letra única) y quedan descartados permanentemente, no solo
-- pendientes.
-- NOTA: el edificio 'P' no existe en el plantel UTCJ, se omite a propósito.

INSERT INTO public.edificios (letra) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'),
  ('J'), ('K'), ('L'), ('M'), ('N'), ('O'), ('Q')
ON CONFLICT (letra) DO NOTHING;

INSERT INTO public.bote_mallas (edificio_id, estatus)
SELECT id, 'disponible' FROM public.edificios
ON CONFLICT (edificio_id) DO NOTHING;
