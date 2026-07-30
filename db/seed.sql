-- =============================================
-- ECOCAMPUS DB - Seed data
-- bote_mallas: levantamiento manual en campus UTCJ
-- =============================================
-- NOTA: latitud/longitud son placeholder (centro aprox. del campus).
-- Diego debe actualizar con GPS real por edificio cuando tenga el mapa listo.

INSERT INTO public.bote_mallas (edificio, ubicacion, latitud, longitud) VALUES
  ('Edificio H',  'Planta alta', 31.6660, -106.4370),
  ('Edificio H',  'Planta baja', 31.6660, -106.4370),
  ('Edificio J',  'Entrada',     31.6660, -106.4370),
  ('Edificio I',  'Planta alta', 31.6660, -106.4370),
  ('Edificio I',  'Planta baja', 31.6660, -106.4370),
  ('Cafetería',   'Exterior',    31.6660, -106.4370),
  ('Guardería',   'Atrás',       31.6660, -106.4370),
  ('Edificio A',  'Puerta 1',    31.6660, -106.4370),
  ('Edificio A',  'Puerta 2',    31.6660, -106.4370),
  ('Edificio C',  'Puerta 1',    31.6660, -106.4370),
  ('Edificio C',  'Puerta 2',    31.6660, -106.4370)
ON CONFLICT (edificio, ubicacion) DO NOTHING;
