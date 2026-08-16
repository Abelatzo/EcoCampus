import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// QA 2026-08-16: se probo "Connection: close" (2026-08-15) para descartar
// un socket keep-alive stale, pero el problema persistio -- y el plan de
// Supabase de este proyecto es "trial", donde forzar una conexion nueva en
// cada request (en vez de reusar del pool) probablemente suma presion a un
// limite de conexiones ya ajustado en vez de ayudar. Se revierte.

// Cliente admin — bypassa RLS, solo para operaciones internas del servidor
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Cliente con contexto de usuario — respeta RLS
export const supabaseAsUser = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }
)
