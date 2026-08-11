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

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no encontrado en el sistema' })
  }

  req.user = usuario
  next()
}