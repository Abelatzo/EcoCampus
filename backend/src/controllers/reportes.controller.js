import { randomUUID } from 'crypto'
import { fileTypeFromBuffer } from 'file-type'
import { supabase, supabaseAsUser } from '../config/supabase.js'

const MIME_A_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// POST /api/reportes/foto — subir foto de un reporte
// El Content-Type que manda el navegador es spoofeable; se detecta el
// MIME real por firma binaria (magic bytes) antes de aceptar el archivo.
export const subirFoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' })
  }

  const tipo = await fileTypeFromBuffer(req.file.buffer)
  if (!tipo || !MIME_A_EXT[tipo.mime]) {
    return res.status(400).json({ error: 'Archivo inválido: solo se permiten imágenes JPEG, PNG o WEBP' })
  }

  const nombreArchivo = `${req.user.id}/${randomUUID()}.${MIME_A_EXT[tipo.mime]}`

  const { error } = await supabase.storage
    .from('reportes-fotos')
    .upload(nombreArchivo, req.file.buffer, { contentType: tipo.mime })

  if (error) return res.status(500).json({ error: error.message })

  const { data } = supabase.storage.from('reportes-fotos').getPublicUrl(nombreArchivo)

  res.status(201).json({ foto_url: data.publicUrl })
}

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

// GET /api/reportes/mapa — estado actual de todos los bote-mallas (polling)
export const estadoMapa = async (req, res) => {
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

// GET /api/reportes — reportes activos (pendiente o en_proceso)
export const obtenerActivos = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const client = supabaseAsUser(token)

  const { data, error } = await client
    .from('reportes')
    .select(`
      id,
      titulo,
      ubicacion,
      descripcion,
      foto_url,
      estatus,
      created_at,
      edificios (letra),
      usuarios (nombre, email)
    `)
    .in('estatus', ['pendiente', 'en_proceso'])
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// POST /api/reportes — crear reporte
export const crearReporte = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'El cuerpo de la petición es requerido' })
  }

  const { edificio, titulo, ubicacion, descripcion, foto_url, estatus } = req.body

  if (!edificio || !titulo) {
    return res.status(400).json({ error: 'edificio y titulo son requeridos' })
  }

  const edificio_id = await resolverEdificio(edificio)
  if (!edificio_id) {
    return res.status(400).json({ error: `Edificio '${edificio}' no válido` })
  }

  // Solo admin puede establecer estatus inicial distinto de pendiente
  const estatusInicial = req.user.rol === 'administrador' && estatus
    ? estatus
    : 'pendiente'

  const estatusValidos = ['pendiente', 'en_proceso', 'resuelto', 'dañado']
  if (!estatusValidos.includes(estatusInicial)) {
    return res.status(400).json({ error: `estatus debe ser uno de: ${estatusValidos.join(', ')}` })
  }

  const { data, error } = await supabase
    .from('reportes')
    .insert({
      edificio_id,
      usuario_id: req.user.id,
      titulo,
      ubicacion: ubicacion || null,
      descripcion: descripcion || null,
      foto_url: foto_url || null,
      estatus: estatusInicial
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PATCH /api/reportes/:id/estatus — cambiar estatus
export const actualizarEstatus = async (req, res) => {
  const { id } = req.params
  const { estatus } = req.body

  const estatusValidos = ['pendiente', 'en_proceso', 'resuelto', 'dañado']
  if (!estatus || !estatusValidos.includes(estatus)) {
    return res.status(400).json({ error: `estatus debe ser uno de: ${estatusValidos.join(', ')}` })
  }

  const { data: reporte, error: errorBuscar } = await supabase
    .from('reportes')
    .select('id, estatus, usuario_id')
    .eq('id', id)
    .single()

  if (errorBuscar || !reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' })
  }

  if (req.user.rol !== 'administrador') {
    if (reporte.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No puedes modificar reportes de otros usuarios' })
    }
    if (reporte.estatus !== 'pendiente') {
      return res.status(403).json({ error: 'Solo puedes modificar reportes en estado pendiente' })
    }
  }

  const { data, error } = await supabase
    .from('reportes')
    .update({ estatus })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// PATCH /api/reportes/:id — editar titulo/descripcion/ubicacion
export const editarReporte = async (req, res) => {
  const { id } = req.params
  const { titulo, descripcion, ubicacion } = req.body

  if (!titulo && !descripcion && !ubicacion) {
    return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar' })
  }

  const { data: reporte, error: errorBuscar } = await supabase
    .from('reportes')
    .select('id, usuario_id, estatus')
    .eq('id', id)
    .single()

  if (errorBuscar || !reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' })
  }

  if (req.user.rol !== 'administrador') {
    if (reporte.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No puedes editar reportes de otros usuarios' })
    }
    if (reporte.estatus !== 'pendiente') {
      return res.status(403).json({ error: 'Solo puedes editar reportes en estado pendiente' })
    }
  }

  const campos = {}
  if (titulo) campos.titulo = titulo
  if (descripcion !== undefined) campos.descripcion = descripcion
  if (ubicacion !== undefined) campos.ubicacion = ubicacion

  const { error } = await supabase
    .from('reportes')
    .update(campos)
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  const { data, error: errorSelect } = await supabase
    .from('reportes')
    .select('id, titulo, ubicacion, descripcion, estatus, foto_url, created_at, edificios(letra)')
    .eq('id', id)
    .single()

  if (errorSelect) return res.status(500).json({ error: errorSelect.message })
  res.json(data)
}

// DELETE /api/reportes/:id — eliminar reporte (solo admin)
export const eliminarReporte = async (req, res) => {
  const { id } = req.params

  const { error: errorBuscar } = await supabase
    .from('reportes')
    .select('id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Reporte no encontrado' })

  const { error } = await supabase
    .from('reportes')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Reporte eliminado correctamente' })
}

// GET /api/reportes/historial — reportes resueltos (solo admin)
export const historial = async (req, res) => {
  const { desde, hasta, edificio } = req.query

  let edificio_id = null
  if (edificio) {
    edificio_id = await resolverEdificio(edificio)
    if (!edificio_id) {
      return res.status(400).json({ error: `Edificio '${edificio}' no válido` })
    }
  }

  let query = supabase
    .from('reportes')
    .select(`
      id,
      titulo,
      ubicacion,
      descripcion,
      foto_url,
      estatus,
      created_at,
      updated_at,
      edificios (letra),
      usuarios (nombre, email)
    `)
    .eq('estatus', 'resuelto')
    .order('updated_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)
  if (edificio_id) query = query.eq('edificio_id', edificio_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
