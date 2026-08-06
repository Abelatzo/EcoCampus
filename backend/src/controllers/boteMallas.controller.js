import { supabase } from '../config/supabase.js'

export const obtenerTodos = async (req, res) => {
  const { data, error } = await supabase
    .from('bote_mallas')
    .select('*')
    .order('edificio')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export const obtenerUno = async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('bote_mallas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Bote-malla no encontrado' })
  res.json(data)
}

export const crear = async (req, res) => {
  const { edificio, ubicacion, latitud, longitud } = req.body

  if (!edificio || !ubicacion || !latitud || !longitud) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  const { data, error } = await supabase
    .from('bote_mallas')
    .insert({ edificio, ubicacion, latitud, longitud, estatus: 'disponible' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export const actualizar = async (req, res) => {
  const { id } = req.params
  const campos = req.body

  const { data, error } = await supabase
    .from('bote_mallas')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export const desactivar = async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('bote_mallas')
    .update({ estatus: 'disponible' })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Estatus actualizado', data })
}