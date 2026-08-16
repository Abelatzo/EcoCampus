import { supabase } from '../config/supabase.js'

// QA 2026-08-16: misma condicion de carrera mitigada en verificarAuth y
// en reportes.controller.js -- bajo peticiones concurrentes al cliente de
// Supabase, el embed usuarios(nombre) a veces regresa null para un usuario
// que si existe. reportes.usuario_id es NOT NULL, asi que cualquier fila
// sin su embed esta rota; un reintento entero de la consulta casi siempre
// la resuelve.
const tieneEmbedUsuarioIncompleto = (filas) =>
  (filas || []).some((f) => !f.usuarios)

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

  // Cuenta cuantos reportes (de este periodo) han pasado por cada estatus
  // a lo largo de su vida -- no el estatus actual. Sin esto, "pendientes"
  // solo contaba los que siguen pendientes AHORA MISMO: un reporte ya
  // resuelto no sumaba a "pendientes" aunque obviamente paso por ahi antes
  // de resolverse, y un reporte que rebota pendiente->en_proceso->pendiente
  // se contaria distinto segun en que momento se consultara. Se cuenta
  // reporte_id distinto por estatus (un rebote no duplica el conteo).
  const idsEnRango = data.map((r) => r.id)
  const conteoPorEstatus = { pendiente: 0, en_proceso: 0, resuelto: 0, 'dañado': 0 }
  if (idsEnRango.length > 0) {
    const { data: historial, error: errorHistorial } = await supabase
      .from('reportes_historial_estatus')
      .select('reporte_id, estatus')
      .in('reporte_id', idsEnRango)

    if (errorHistorial) return res.status(500).json({ error: errorHistorial.message })

    const vistos = { pendiente: new Set(), en_proceso: new Set(), resuelto: new Set(), 'dañado': new Set() }
    for (const h of historial) vistos[h.estatus]?.add(h.reporte_id)
    for (const estatus of Object.keys(conteoPorEstatus)) conteoPorEstatus[estatus] = vistos[estatus].size
  }
  const { pendiente: pendientes, en_proceso, resuelto: resueltos, 'dañado': dañados } = conteoPorEstatus

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

  let { data, error } = await query
  if (!error && tieneEmbedUsuarioIncompleto(data)) {
    ({ data, error } = await query)
  }
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export const boteMallasAdmin = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select('id, estatus, updated_at, edificios (letra, pos_x, pos_y)')
    .order('created_at')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}