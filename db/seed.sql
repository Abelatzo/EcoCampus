-- =============================================
-- ECOCAMPUS DB - Seed data
-- edificios: catálogo fijo A-Q del campus UTCJ
-- bote_mallas: levantamiento manual en campus UTCJ
-- =============================================
-- NOTA: latitud/longitud quedan NULL (placeholder). Diego debe actualizar
-- con GPS real por punto cuando tenga el mapa listo.
-- NOTA: 'Cafetería' y 'Guardería' del seed anterior no encajan en el
-- catálogo de edificios (letra única) que pide el frontend actual.
-- Quedan fuera hasta que se defina cómo representar puntos fuera de un
-- edificio con letra (¿tipo 'contenedor_externo' sin edificio_id?).
-- NOTA: el edificio 'P' no existe en el plantel UTCJ, se omite a propósito.

INSERT INTO public.edificios (letra) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'),
  ('J'), ('K'), ('L'), ('M'), ('N'), ('O'), ('Q')
ON CONFLICT (letra) DO NOTHING;

INSERT INTO public.bote_mallas (edificio_id, nombre)
SELECT id, nombre FROM public.edificios, (VALUES
  ('H', 'Planta alta'),
  ('H', 'Planta baja'),
  ('J', 'Entrada'),
  ('I', 'Planta alta'),
  ('I', 'Planta baja'),
  ('A', 'Puerta 1'),
  ('A', 'Puerta 2'),
  ('C', 'Puerta 1'),
  ('C', 'Puerta 2')
) AS v(letra, nombre)
WHERE edificios.letra = v.letra
ON CONFLICT (edificio_id, nombre) DO NOTHING;
