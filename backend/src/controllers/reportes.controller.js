import { supabase } from '../config/supabase.js'

// GET /api/reportes — todos los reportes activos (pendiente o en_proceso)
export const obtenerActivos = async (req, res) => {
  const { data, error } = await supabase
    .from('reportes')
    .select(`
      id,
      estatus,
      comentario,
      foto_url,
      created_at,
      bote_malla_id,
      usuario_id,
      bote_mallas (
        id,
        edificio,
        ubicacion,
        latitud,
        longitud,
        estatus
      )
    `)
    .in('estatus', ['pendiente', 'en_proceso'])
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/reportes/mapa — estado actual de todos los bote-mallas (para polling del mapa)
export const estadoMapa = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select('id, edificio, ubicacion, latitud, longitud, estatus')
    .order('edificio')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// POST /api/reportes — crear reporte
export const crearReporte = async (req, res) => {
  const { bote_malla_id, comentario, foto_url } = req.body

  if (!bote_malla_id) {
    return res.status(400).json({ error: 'bote_malla_id es requerido' })
  }

  // Verificar que no haya un reporte activo del mismo bote-malla
  const { data: existente } = await supabase
    .from('reportes')
    .select('id')
    .eq('bote_malla_id', bote_malla_id)
    .in('estatus', ['pendiente', 'en_proceso'])
    .single()

  if (existente) {
    return res.status(409).json({ error: 'Este bote-malla ya tiene un reporte activo' })
  }

  const { data, error } = await supabase
    .from('reportes')
    .insert({
      bote_malla_id,
      usuario_id: req.user.id,
      comentario: comentario || null,
      foto_url: foto_url || null,
      estatus: 'pendiente'
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// PATCH /api/reportes/:id/estatus — cambiar estatus de un reporte
export const actualizarEstatus = async (req, res) => {
  const { id } = req.params
  const { estatus } = req.body

  const estatusValidos = ['pendiente', 'en_proceso', 'resuelto']
  if (!estatus || !estatusValidos.includes(estatus)) {
    return res.status(400).json({ error: `estatus debe ser uno de: ${estatusValidos.join(', ')}` })
  }

  // Verificar que el reporte exista
  const { data: reporte, error: errorBuscar } = await supabase
    .from('reportes')
    .select('id, estatus, usuario_id')
    .eq('id', id)
    .single()

  if (errorBuscar || !reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' })
  }

  // Estudiante solo puede actualizar sus propios reportes pendientes
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

// GET /api/reportes/historial — todos los reportes resueltos (solo admin)
export const historial = async (req, res) => {
  const { desde, hasta, bote_malla_id } = req.query

  let query = supabase
    .from('reportes')
    .select(`
      id,
      estatus,
      comentario,
      foto_url,
      created_at,
      updated_at,
      bote_malla_id,
      usuario_id,
      bote_mallas (edificio, ubicacion)
    `)
    .eq('estatus', 'resuelto')
    .order('updated_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)
  if (bote_malla_id) query = query.eq('bote_malla_id', bote_malla_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}