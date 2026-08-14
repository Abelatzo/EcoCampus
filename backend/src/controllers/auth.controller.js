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

  if (errorInsert) {
    // Revertir el usuario de Auth para no dejarlo huerfano sin fila en usuarios
    await supabase.auth.admin.deleteUser(data.user.id)
    return res.status(500).json({ error: errorInsert.message })
  }

  res.status(201).json({ message: 'Usuario registrado correctamente' })
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' })
  }

  // No usamos redirectTo: el correo lleva el codigo OTP ({{ .Token }} en la
  // plantilla de Supabase) en vez de un enlace, para evitar que un escaner
  // de correo institucional (Safe Links, etc.) consuma el enlace de un solo
  // uso antes de que el usuario lo abra.
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  // No revelar si el correo existe o no en el sistema
  if (error) console.error('Error en resetPasswordForEmail:', error.message)

  res.json({ message: 'Si el correo existe en nuestro sistema, recibirás un código de recuperación' })
}

export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ error: 'Correo y código son requeridos' })
  }

  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })

  if (error || !data.session) {
    return res.status(400).json({ error: 'Código inválido o expirado' })
  }

  res.json({ token: data.session.access_token })
}

export const resetPassword = async (req, res) => {
  const { password } = req.body
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de recuperación no proporcionado' })
  }
  const token = authHeader.split(' ')[1]

  if (!password) {
    return res.status(400).json({ error: 'La nueva contraseña es requerida' })
  }
  if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial' })
  }

  const { data: { user }, error: errorToken } = await supabase.auth.getUser(token)
  if (errorToken || !user) {
    return res.status(401).json({ error: 'Enlace de recuperación inválido o expirado' })
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password })
  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Contraseña actualizada correctamente' })
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