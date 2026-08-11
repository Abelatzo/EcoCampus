import { supabase } from '../config/supabase.js'

// Helper: resolver edificio_id desde letra
const resolverEdificio = async (letra) => {
  if (!letra) return null
  const { data } = await supabase
    .from('edificios')
    .select('id')
    .eq('letra', letra.toUpperCase())
    .single()
  return data?.id || null
}

// GET /api/bote-mallas — todos los puntos ecológicos
export const obtenerTodos = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select(`
      id,
      nombre,
      latitud,
      longitud,
      tipo,
      estatus,
      edificios (letra)
    `)
    .order('created_at')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/bote-mallas/:id — detalle de un punto
export const obtenerUno = async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('bote_mallas')
    .select(`
      id,
      nombre,
      latitud,
      longitud,
      tipo,
      estatus,
      edificios (letra)
    `)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Punto ecológico no encontrado' })
  res.json(data)
}

// POST /api/bote-mallas — crear punto ecológico (solo admin)
export const crear = async (req, res) => {
  const { edificio, nombre, latitud, longitud, tipo } = req.body

  if (!edificio || !nombre) {
    return res.status(400).json({ error: 'edificio y nombre son requeridos' })
  }

  const edificio_id = await resolverEdificio(edificio)
  if (!edificio_id) {
    return res.status(400).json({ error: `Edificio '${edificio}' no válido` })
  }

  const { data, error } = await supabase
    .from('bote_mallas')
    .insert({
      edificio_id,
      nombre,
      latitud: latitud || null,
      longitud: longitud || null,
      tipo: tipo || 'bote_malla',
      estatus: 'disponible'
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PUT /api/bote-mallas/:id — editar punto ecológico (solo admin)
export const actualizar = async (req, res) => {
  const { id } = req.params
  const { edificio, nombre, latitud, longitud, tipo } = req.body

  const { error: errorBuscar } = await supabase
    .from('bote_mallas')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Punto ecológico no encontrado' })

  const campos = {}
  if (edificio) {
    const edificio_id = await resolverEdificio(edificio)
    if (!edificio_id) return res.status(400).json({ error: `Edificio '${edificio}' no válido` })
    campos.edificio_id = edificio_id
  }
  if (nombre) campos.nombre = nombre
  if (latitud !== undefined) campos.latitud = latitud
  if (longitud !== undefined) campos.longitud = longitud
  if (tipo) campos.tipo = tipo

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' })
  }

  const { error } = await supabase
    .from('bote_mallas')
    .update(campos)
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  const { data, error: errorSelect } = await supabase
    .from('bote_mallas')
    .select('id, nombre, latitud, longitud, tipo, estatus, edificios(letra)')
    .eq('id', id)
    .single()

  if (errorSelect) return res.status(500).json({ error: errorSelect.message })
  res.json(data)
}

// PATCH /api/bote-mallas/:id/estatus — cambiar estatus (solo admin)
export const desactivar = async (req, res) => {
  const { id } = req.params
  const { estatus } = req.body

  const estatusValidos = ['disponible', 'pendiente', 'en_proceso', 'dañado']
  if (!estatus || !estatusValidos.includes(estatus)) {
    return res.status(400).json({ error: `estatus debe ser uno de: ${estatusValidos.join(', ')}` })
  }

  const { error: errorBuscar } = await supabase
    .from('bote_mallas')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Punto ecológico no encontrado' })

  const { error } = await supabase
    .from('bote_mallas')
    .update({ estatus })
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Estatus actualizado correctamente' })
}

// DELETE /api/bote-mallas/:id — eliminar punto ecológico (solo admin)
export const eliminar = async (req, res) => {
  const { id } = req.params

  const { error: errorBuscar } = await supabase
    .from('bote_mallas')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Punto ecológico no encontrado' })

  const { error } = await supabase
    .from('bote_mallas')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Punto ecológico eliminado correctamente' })
}