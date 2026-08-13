import { supabase } from '../config/supabase.js'

export const estadisticas = async (req, res) => {
  const { desde, hasta } = req.query

  let query = supabase
    .from('reportes')
    .select('id, estatus, created_at, updated_at, edificios(letra)')

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const total = data.length
  const pendientes = data.filter(r => r.estatus === 'pendiente').length
  const en_proceso = data.filter(r => r.estatus === 'en_proceso').length
  const resueltos = data.filter(r => r.estatus === 'resuelto').length
  const dañados = data.filter(r => r.estatus === 'dañado').length

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

  const porZona = data.reduce((acc, r) => {
    const letra = r.edificios?.letra || 'Desconocido'
    acc[letra] = (acc[letra] || 0) + 1
    return acc
  }, {})

  res.json({
    total,
    pendientes,
    en_proceso,
    resueltos,
    dañados,
    tiempo_promedio_atencion_min: tiempoPromedio,
    por_zona: porZona
  })
}

export const reportesAdmin = async (req, res) => {
  const { desde, hasta, estatus, edificio, usuario_id } = req.query

  let edificio_id = null
  if (edificio) {
    const { data: ed } = await supabase
      .from('edificios')
      .select('id')
      .eq('letra', edificio.toUpperCase())
      .single()
    if (!ed) return res.status(400).json({ error: `Edificio '${edificio}' no válido` })
    edificio_id = ed.id
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
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)
  if (estatus) query = query.eq('estatus', estatus)
  if (edificio_id) query = query.eq('edificio_id', edificio_id)
  if (usuario_id) query = query.eq('usuario_id', usuario_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export const boteMallasAdmin = async (req, res) => {
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