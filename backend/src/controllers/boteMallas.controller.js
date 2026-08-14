import { supabase } from '../config/supabase.js'

// GET /api/bote-mallas — estatus agregado por edificio
// El estatus lo mantiene el trigger sync_bote_malla_edificio, no se
// escribe manualmente (por eso ya no hay endpoints crear/actualizar/eliminar).
export const obtenerTodos = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select('id, estatus, updated_at, edificios (letra)')
    .order('created_at')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// GET /api/bote-mallas/:id
export const obtenerUno = async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('bote_mallas')
    .select('id, estatus, updated_at, edificios (letra)')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Punto ecológico no encontrado' })
  res.json(data)
}
