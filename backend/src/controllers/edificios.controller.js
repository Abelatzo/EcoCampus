import { supabase } from '../config/supabase.js'

// GET /api/edificios — catálogo completo de edificios
export const obtenerEdificios = async (req, res) => {
  const { data, error } = await supabase
    .from('edificios')
    .select('id, letra, created_at')
    .order('letra')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}