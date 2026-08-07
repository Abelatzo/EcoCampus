import { supabase } from '../config/supabase.js'

// GET /api/admin/estadisticas — resumen general del panel
export const estadisticas = async (req, res) => {
  const { desde, hasta } = req.query

  let query = supabase
    .from('reportes')
    .select('id, estatus, created_at, updated_at, bote_malla_id, bote_mallas(edificio)')

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const total = data.length
  const pendientes = data.filter(r => r.estatus === 'pendiente').length
  const en_proceso = data.filter(r => r.estatus === 'en_proceso').length
  const resueltos = data.filter(r => r.estatus === 'resuelto').length

  // Tiempo promedio de atención en minutos (solo reportes resueltos)
  const resueltosList = data.filter(r => r.estatus === 'resuelto')
  const tiempoPromedio = resueltosList.length > 0
    ? Math.round(
        resueltosList.reduce((acc, r) => {
          const inicio = new Date(r.created_at)
          const fin = new Date(r.updated_at)
          return acc + (fin - inicio) / 60000
        }, 0) / resueltosList.length
      )
    : null

  // Reportes agrupados por edificio
  const porZona = data.reduce((acc, r) => {
    const edificio = r.bote_mallas?.edificio || 'Desconocido'
    acc[edificio] = (acc[edificio] || 0) + 1
    return acc
  }, {})

  res.json({
    total,
    pendientes,
    en_proceso,
    resueltos,
    tiempo_promedio_atencion_min: tiempoPromedio,
    por_zona: porZona
  })
}

// GET /api/admin/reportes — historial completo con filtros
export const reportesAdmin = async (req, res) => {
  const { desde, hasta, estatus, bote_malla_id, usuario_id } = req.query

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
      bote_mallas (edificio, ubicacion),
      usuarios (nombre, email)
    `)
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)
  if (estatus) query = query.eq('estatus', estatus)
  if (bote_malla_id) query = query.eq('bote_malla_id', bote_malla_id)
  if (usuario_id) query = query.eq('usuario_id', usuario_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/admin/bote-mallas — listado completo con conteo de reportes
export const boteMallasAdmin = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select(`
      id,
      edificio,
      ubicacion,
      latitud,
      longitud,
      estatus,
      created_at,
      reportes (id, estatus)
    `)
    .order('edificio')

  if (error) return res.status(500).json({ error: error.message })

  const resultado = data.map(bm => ({
    ...bm,
    total_reportes: bm.reportes.length,
    reportes_activos: bm.reportes.filter(r =>
      r.estatus === 'pendiente' || r.estatus === 'en_proceso'
    ).length,
    reportes: undefined
  }))

  res.json(resultado)
}