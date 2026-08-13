import { supabase } from '../config/supabase.js'

// GET /api/usuarios — listado de todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol, created_at')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/usuarios/:id — perfil de un usuario
export const obtenerUsuario = async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol, created_at')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(data)
}

// PATCH /api/usuarios/:id/rol — cambiar rol de un usuario (solo admin)
export const cambiarRol = async (req, res) => {
  const { id } = req.params
  const { rol } = req.body

  if (!rol || !['estudiante', 'administrador'].includes(rol)) {
    return res.status(400).json({ error: 'rol debe ser estudiante o administrador' })
  }

  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol' })
  }

  const { data, error } = await supabase.rpc('cambiar_rol_usuario', {
    target_id: id,
    nuevo_rol: rol
  })

  if (error) {
    if (error.message.includes('no autorizado')) {
      return res.status(403).json({ error: 'No tienes permiso para cambiar roles' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: 'Rol actualizado correctamente', rol })
}

// PATCH /api/usuarios/:id — editar nombre o email
export const editarUsuario = async (req, res) => {
  const { id } = req.params
  const { nombre, email } = req.body

  if (!nombre && !email) {
    return res.status(400).json({ error: 'Debes enviar nombre o email para actualizar' })
  }

  if (req.user.rol !== 'administrador' && req.user.id !== id) {
    return res.status(403).json({ error: 'No puedes editar perfiles de otros usuarios' })
  }

  // Verificar que el usuario existe
  const { data: existe } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', id)
    .single()

  if (!existe) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  const campos = {}
  if (nombre) campos.nombre = nombre
  if (email) campos.email = email

  const { error } = await supabase
    .from('usuarios')
    .update(campos)
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  const { data, error: errorSelect } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol')
    .eq('id', id)
    .single()

  if (errorSelect) return res.status(500).json({ error: errorSelect.message })
  res.json(data)
}

// DELETE /api/usuarios/:id — desactivar cuenta (solo admin)
export const desactivarUsuario = async (req, res) => {
  const { id } = req.params

  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' })
  }

  // Desactivar en Supabase Auth
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Usuario desactivado correctamente' })
}