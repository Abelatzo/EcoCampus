import { supabase } from '../config/supabase.js'

export const verificarAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  // QA 2026-08-16: bajo carga concurrente alta (ej. el panel admin, que
  // dispara 5-7 requests a la vez con Promise.all) se observo esta consulta
  // regresando vacia para un usuario que sin duda existe -- confirmado
  // reproducible en logs de Railway: dos requests casi simultaneos al mismo
  // endpoint, mismo token, uno 200 y otro 401 (ver PR de QA). No se
  // encontro la causa exacta (no es RLS, no es el dato, Supabase no reporta
  // error en sus propios logs de Auth/Database) -- consistente con una
  // condicion de carrera en como se comparte el cliente de Supabase entre
  // requests concurrentes. Un solo reintento inmediato cubre el caso, ya
  // que la relectura casi siempre resuelve bien.
  let usuario = (await supabase
    .from('usuarios')
    .select('id, nombre, email, rol')
    .eq('id', user.id)
    .single()).data

  if (!usuario) {
    usuario = (await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('id', user.id)
      .single()).data
  }

  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no encontrado en el sistema' })
  }

  req.user = usuario
  next()
}