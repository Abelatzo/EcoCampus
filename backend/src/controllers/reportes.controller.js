import { randomUUID } from 'crypto'
import { fileTypeFromBuffer } from 'file-type'
import { supabase } from '../config/supabase.js'

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

// Recalcula bote_mallas.estatus del edificio dado y lo escribe.
// El trigger de Postgres sync_bote_malla_edificio hace lo mismo, pero
// tanto el como este UPDATE explicito se han visto fallar de forma
// intermitente y aparentemente aleatoria via PostgREST (el UPDATE
// reporta exito pero afecta 0 filas) -- confirmado que NO es por
// edificio especifico, locks, ni tiempo de vida de la conexion (un
// UPDATE identico via conexion Postgres directa nunca falla). Sin poder
// aislar la causa exacta desde aqui, se mitiga con verificacion +
// reintento: se relee el estatus despues de escribir y, si no quedo
// como se esperaba, se reintenta hasta 3 veces.
const resincronizarBoteMalla = async (edificio_id) => {
  if (!edificio_id) return

  const { data: activos } = await supabase
    .from('reportes')
    .select('estatus')
    .eq('edificio_id', edificio_id)
    .neq('estatus', 'resuelto')

  const estatuses = (activos || []).map((r) => r.estatus)
  const nuevoEstatus = estatuses.includes('dañado')
    ? 'dañado'
    : estatuses.includes('pendiente')
      ? 'pendiente'
      : estatuses.includes('en_proceso')
        ? 'en_proceso'
        : 'disponible'

  for (let intento = 1; intento <= 3; intento++) {
    const { error } = await supabase
      .from('bote_mallas')
      .update({ estatus: nuevoEstatus })
      .eq('edificio_id', edificio_id)

    if (error) {
      console.error(`Resync bote_malla intento ${intento} fallo:`, error.message)
      continue
    }

    const { data: verificacion } = await supabase
      .from('bote_mallas')
      .select('estatus')
      .eq('edificio_id', edificio_id)
      .single()

    if (verificacion?.estatus === nuevoEstatus) return

    console.error(`Resync bote_malla intento ${intento}: escrito sin error pero no persistio (leido: ${verificacion?.estatus})`)
    await new Promise((r) => setTimeout(r, 200 * intento))
  }

  console.error(`Resync bote_malla para edificio ${edificio_id} fallo tras 3 intentos`)
}

// GET /api/reportes/mapa — estado agregado por edificio para el mapa (polling)
// El estatus viene de bote_mallas (mantenido por el trigger de sync), los
// reportes activos van anidados para el desplegable de multiples reportes.
export const estadoMapa = async (req, res) => {
  const { data, error } = await supabase
    .from('edificios')
    .select(`
      id,
      letra,
      pos_x,
      pos_y,
      bote_mallas (estatus),
      reportes (id, titulo, descripcion, estatus, created_at)
    `)
    .order('letra')

  if (error) return res.status(500).json({ error: error.message })

  const resultado = data.map((e) => {
    const boteMalla = Array.isArray(e.bote_mallas) ? e.bote_mallas[0] : e.bote_mallas
    return {
      edificio_id: e.id,
      letra: e.letra,
      pos_x: e.pos_x,
      pos_y: e.pos_y,
      estatus: boteMalla?.estatus || 'disponible',
      reportes: (e.reportes || [])
        .filter((r) => r.estatus !== 'resuelto')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    }
  })

  res.json(resultado)
}

// GET /api/reportes — reportes activos (pendiente o en_proceso)
// Se muestran los de TODOS los usuarios (no solo el propio) para que
// cualquiera pueda avanzar el estatus -- por eso se usa el cliente con
// service role: la tabla usuarios tiene RLS que solo deja leer la fila
// propia, y aqui necesitamos el nombre (no el email) de cada autor.
export const obtenerActivos = async (req, res) => {
  const { data, error } = await supabase
    .from('reportes')
    .select(`
      id,
      titulo,
      ubicacion,
      descripcion,
      foto_url,
      estatus,
      created_at,
      usuario_id,
      edificios (letra),
      usuarios (nombre)
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
  await resincronizarBoteMalla(edificio_id)
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

  // El estatus es un proceso colaborativo: cualquier usuario autenticado
  // puede avanzarlo (pendiente -> en_proceso -> resuelto), no solo quien
  // creo el reporte -- asi otros estudiantes que ven el bote atendido o
  // resuelto pueden actualizarlo sin depender del autor original.
  const { data: reporte, error: errorBuscar } = await supabase
    .from('reportes')
    .select('id, estatus, usuario_id, edificio_id')
    .eq('id', id)
    .single()

  if (errorBuscar || !reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' })
  }

  const { data, error } = await supabase
    .from('reportes')
    .update({ estatus })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  await resincronizarBoteMalla(reporte.edificio_id)
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

  const { data: reporte, error: errorBuscar } = await supabase
    .from('reportes')
    .select('id, edificio_id')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Reporte no encontrado' })

  const { error } = await supabase
    .from('reportes')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  await resincronizarBoteMalla(reporte.edificio_id)
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
