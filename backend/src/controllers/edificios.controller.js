import { supabase } from '../config/supabase.js'

// GET /api/edificios — catálogo completo de edificios
export const obtenerEdificios = async (req, res) => {
  const { data, error } = await supabase
    .from('edificios')
    .select('id, letra, pos_x, pos_y, created_at')
    .order('letra')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// PATCH /api/edificios/:id/posicion — fijar posición en el mapa (solo admin)
// pos_x/pos_y son porcentaje (0-100) sobre la imagen del campus, no GPS.
export const actualizarPosicion = async (req, res) => {
  const { id } = req.params
  const { pos_x, pos_y } = req.body

  if (pos_x === undefined || pos_y === undefined) {
    return res.status(400).json({ error: 'pos_x y pos_y son requeridos' })
  }
  if (typeof pos_x !== 'number' || typeof pos_y !== 'number' || pos_x < 0 || pos_x > 100 || pos_y < 0 || pos_y > 100) {
    return res.status(400).json({ error: 'pos_x y pos_y deben ser números entre 0 y 100' })
  }

  const { data, error } = await supabase
    .from('edificios')
    .update({ pos_x, pos_y })
    .eq('id', id)
    .select('id, letra, pos_x, pos_y')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Edificio no encontrado' })
  res.json(data)
}