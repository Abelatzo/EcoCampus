import { randomUUID } from 'crypto'
import { fileTypeFromBuffer } from 'file-type'
import { supabase } from '../config/supabase.js'
import { createClient } from '@supabase/supabase-js'

const MIME_A_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const BUCKET_FOTOS = 'reportes-fotos'

// Extrae el path dentro del bucket a partir de la URL publica que devuelve
// getPublicUrl (".../object/public/reportes-fotos/<path>") -- es lo que
// storage.remove() necesita, no la URL completa.
const pathDesdeFotoUrl = (foto_url) => {
  if (!foto_url) return null
  const marcador = `/object/public/${BUCKET_FOTOS}/`
  const i = foto_url.indexOf(marcador)
  return i === -1 ? null : foto_url.slice(i + marcador.length)
}

// Borra la foto del bucket si existe. No hay policy de DELETE por usuario
// (solo INSERT/SELECT), asi que corre con el cliente de service role. Si
// falla, se loguea pero no se interrumpe la operacion principal (borrar/
// resolver el reporte) por un problema de limpieza de storage.
const borrarFotoStorage = async (foto_url) => {
  const path = pathDesdeFotoUrl(foto_url)
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([path])
  if (error) console.error(`borrarFotoStorage fallo para '${path}':`, error.message)
}

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

// QA 2026-08-16: misma condicion de carrera que se aislo y mitigo en
// verificarAuth (ver middlewares/auth.js) -- bajo peticiones concurrentes
// al cliente de Supabase, el embed usuarios(nombre) a veces regresa null
// para un usuario que si existe ("Desconocido" en la UI). reportes.usuario_id
// es NOT NULL (siempre hay autor), asi que cualquier fila sin su embed
// esta rota -- un reintento entero de la consulta casi siempre la resuelve.
const tieneEmbedUsuarioIncompleto = (filas) =>
  (filas || []).some((f) => !f.usuarios)

// GET /api/reportes — reportes activos (todo excepto resuelto)
// Se muestran los de TODOS los usuarios (no solo el propio) para que
// cualquiera pueda avanzar el estatus -- por eso se usa el cliente con
// service role: la tabla usuarios tiene RLS que solo deja leer la fila
// propia, y aqui necesitamos el nombre (no el email) de cada autor.
// "dañado" se incluye a proposito: los estudiantes deben poder ver si
// un bote/malla esta dañado para ubicarlo o atenderlo. Solo "resuelto"
// se excluye, para no saturar la lista con reportes ya cerrados.
export const obtenerActivos = async (req, res) => {
  const clienteFresh = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
  
  const consulta = () => clienteFresh
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
  .neq('estatus', 'resuelto')
  .order('created_at', { ascending: false })

  let { data, error } = await consulta()
  if (!error && tieneEmbedUsuarioIncompleto(data)) {
    ({ data, error } = await consulta())
  }

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

  if (error) {
    console.error(
      `crearReporte fallo (usuario ${req.user.id}, edificio '${edificio}', estatus '${estatusInicial}'):`,
      error.code, error.message, error.details, error.hint
    )
    return res.status(500).json({ error: error.message })
  }
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
    .select('id, foto_url')
    .eq('id', id)
    .single()

  if (errorBuscar || !reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' })
  }

  // Un reporte resuelto solo sirve como dato historico en el panel -- la
  // foto ya no aporta nada y se queda ocupando el bucket para siempre si no
  // se borra aqui (no hay ningun otro lugar del codigo que lo haga).
  const debeBorrarFoto = estatus === 'resuelto' && !!reporte.foto_url

  // UPDATE y SELECT de la respuesta van por separado. Se comprobo contra la
  // base (Supabase SQL editor + logs de Railway/Supabase, PR de QA del
  // 2026-08-15) que el UPDATE en si siempre se guarda bien -- lo que fallaba
  // 100% de las veces (no intermitente) era combinar UPDATE+SELECT con los
  // embeds (edificios/usuarios) y .single() en una sola llamada: PostgREST
  // regresaba PGRST116 "0 rows" en el paso de armar el objeto con los joins
  // aun cuando el UPDATE si habia afectado la fila (se confirmaba actualizada
  // al releer despues). single() ademas lanza excepcion ante cualquier
  // desajuste de conteo de filas; se evita por completo leyendo como arreglo
  // y tomando el primer elemento.
  const { error: errorUpdate } = await supabase
    .from('reportes')
    .update(debeBorrarFoto ? { estatus, foto_url: null } : { estatus })
    .eq('id', id)

  if (errorUpdate) {
    console.error(
      `actualizarEstatus (update) fallo para reporte ${id} (usuario ${req.user.id}, estatus destino '${estatus}'):`,
      errorUpdate.code, errorUpdate.message, errorUpdate.details, errorUpdate.hint
    )
    return res.status(500).json({ error: 'No se pudo actualizar el estatus, intenta de nuevo en unos segundos' })
  }

  if (debeBorrarFoto) await borrarFotoStorage(reporte.foto_url)

  const { data: filas, error: errorSelect } = await supabase
    .from('reportes')
    .select('id, titulo, ubicacion, descripcion, foto_url, estatus, created_at, usuario_id, edificios (letra), usuarios (nombre)')
    .eq('id', id)

  if (errorSelect || !filas?.length) {
    console.error(
      `actualizarEstatus (select post-update) fallo para reporte ${id}:`,
      errorSelect?.code, errorSelect?.message, errorSelect?.details, errorSelect?.hint
    )
    // El estatus ya se guardo (el UPDATE de arriba no dio error); solo fallo
    // traer la fila para la respuesta -- se le avisa al cliente que refresque
    // en vez de reportar un fallo del cambio en si.
    return res.status(200).json({ estatus, advertencia: 'El estatus se actualizo pero no se pudo confirmar de inmediato, refresca para verlo' })
  }

  res.json(filas[0])
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
    .select('id, foto_url')
    .eq('id', id)
    .single()

  if (errorBuscar) return res.status(404).json({ error: 'Reporte no encontrado' })

  const { error } = await supabase
    .from('reportes')
    .delete()
    .eq('id', reporte.id)

  if (error) return res.status(500).json({ error: error.message })

  if (reporte.foto_url) await borrarFotoStorage(reporte.foto_url)

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

  let { data, error } = await query
  if (!error && tieneEmbedUsuarioIncompleto(data)) {
    ({ data, error } = await query)
  }
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
