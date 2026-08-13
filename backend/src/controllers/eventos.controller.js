import { supabase, supabaseAsUser } from '../config/supabase.js'

// GET /api/eventos — listado de eventos
// Estudiantes ven solo publicados, admin ve todos (el RLS ya filtra en Supabase)
export const obtenerEventos = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const client = supabaseAsUser(token)
  const { tipo } = req.query

  let query = client
    .from('eventos')
    .select(`
      id,
      tipo,
      titulo,
      descripcion,
      fecha_evento,
      lugar,
      publicado,
      created_at,
      updated_at,
      autor_id,
      usuarios (nombre, email)
    `)
    .order('created_at', { ascending: false })

  if (tipo && ['evento', 'actualizacion', 'informacion'].includes(tipo)) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/eventos/:id — detalle de un evento
export const obtenerEvento = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const client = supabaseAsUser(token)
  const { id } = req.params

  const { data, error } = await client
    .from('eventos')
    .select(`
      id,
      tipo,
      titulo,
      descripcion,
      fecha_evento,
      lugar,
      publicado,
      created_at,
      updated_at,
      autor_id,
      usuarios (nombre, email)
    `)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Evento no encontrado' })
  res.json(data)
}

// POST /api/eventos — crear evento (solo admin)
export const crearEvento = async (req, res) => {
  const { tipo, titulo, descripcion, fecha_evento, lugar, publicado } = req.body

  if (!tipo || !titulo) {
    return res.status(400).json({ error: 'tipo y titulo son requeridos' })
  }
  let fechaParsed = null
if (fecha_evento) {
  fechaParsed = new Date(fecha_evento)
  if (isNaN(fechaParsed)) {
    return res.status(400).json({ error: 'fecha_evento inválida, usa formato ISO: 2026-06-28T10:00:00Z' })
  }
}

  if (!['evento', 'actualizacion', 'informacion'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser evento, actualizacion o informacion' })
  }

  const { data, error } = await supabase
    .from('eventos')
    .insert({
      tipo,
      titulo,
      descripcion: descripcion || null,
      fecha_evento: fechaParsed,
      lugar: lugar || null,
      publicado: publicado !== undefined ? publicado : true,
      autor_id: req.user.id
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PATCH /api/eventos/:id — editar evento (solo admin)
export const editarEvento = async (req, res) => {
  const { id } = req.params
  const { tipo, titulo, descripcion, fecha_evento, lugar, publicado } = req.body

  const campos = {}
  if (tipo) {
    if (!['evento', 'actualizacion', 'informacion'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser evento, actualizacion o informacion' })
    }
    campos.tipo = tipo
  }
  if (titulo) campos.titulo = titulo
  if (descripcion !== undefined) campos.descripcion = descripcion
  if (fecha_evento !== undefined) {
  if (fecha_evento === null) {
    campos.fecha_evento = null
  } else {
    const parsed = new Date(fecha_evento)
    if (isNaN(parsed)) {
      return res.status(400).json({ error: 'fecha_evento inválida, usa formato ISO: 2026-06-28T10:00:00Z' })
    }
    campos.fecha_evento = parsed
  }
}
  if (lugar !== undefined) campos.lugar = lugar
  if (publicado !== undefined) campos.publicado = publicado

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' })
  }

  const { error: errorBuscar } = await supabase
    .from('eventos')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Evento no encontrado' })

  const { error } = await supabase
    .from('eventos')
    .update(campos)
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  const { data, error: errorSelect } = await supabase
    .from('eventos')
    .select('id, tipo, titulo, descripcion, fecha_evento, lugar, publicado, updated_at')
    .eq('id', id)
    .single()

  if (errorSelect) return res.status(500).json({ error: errorSelect.message })
  res.json(data)
}

// PATCH /api/eventos/:id/publicado — ocultar o publicar (solo admin)
export const togglePublicado = async (req, res) => {
  const { id } = req.params
  const { publicado } = req.body

  if (typeof publicado !== 'boolean') {
    return res.status(400).json({ error: 'publicado debe ser true o false' })
  }

  const { error: errorBuscar } = await supabase
    .from('eventos')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Evento no encontrado' })

  const { error } = await supabase
    .from('eventos')
    .update({ publicado })
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: `Evento ${publicado ? 'publicado' : 'ocultado'} correctamente` })
}

// DELETE /api/eventos/:id — eliminar evento (solo admin)
export const eliminarEvento = async (req, res) => {
  const { id } = req.params

  const { error: errorBuscar } = await supabase
    .from('eventos')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Evento no encontrado' })

  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Evento eliminado correctamente' })
}