import { supabase } from '../config/supabase.js'

export const registro = async (req, res) => {
  const { nombre, email, password } = req.body

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return res.status(400).json({ error: error.message })

  const { error: errorInsert } = await supabase
    .from('usuarios')
    .insert({ id: data.user.id, nombre, email, rol: 'estudiante' })

  if (errorInsert) return res.status(500).json({ error: errorInsert.message })

  res.status(201).json({ message: 'Usuario registrado correctamente' })
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol')
    .eq('id', data.user.id)
    .single()

  res.json({
    token: data.session.access_token,
    usuario
  })
}