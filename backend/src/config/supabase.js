import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// QA 2026-08-15: en produccion (Railway) se observaron respuestas donde los
// campos "de cola" del JSON (un embed anidado como usuarios(nombre)) llegaban
// null/incompletos mientras los campos de inicio del mismo objeto (id,
// usuario_id) siempre llegaban bien -- con la MISMA consulta exacta, vía
// Postman/curl directo a Supabase (conexion nueva cada vez, sin pasar por
// Node) nunca se pudo reproducir. Patron consistente con un socket
// keep-alive reciclado por el pool de conexiones de Node/undici quedando
// stale y entregando una respuesta anterior truncada. Se fuerza
// "Connection: close" para que cada request abra una conexion nueva en vez
// de reusar una del pool.
const HEADERS_SIN_KEEPALIVE = { Connection: 'close' }

// Cliente admin — bypassa RLS, solo para operaciones internas del servidor
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { global: { headers: HEADERS_SIN_KEEPALIVE } }
)

// Cliente con contexto de usuario — respeta RLS
export const supabaseAsUser = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
        ...HEADERS_SIN_KEEPALIVE
      }
    }
  }
)
