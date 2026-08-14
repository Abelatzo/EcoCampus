import { createClient } from '@supabase/supabase-js'
import { Agent, fetch as undiciFetch } from 'undici'
import dotenv from 'dotenv'
dotenv.config()

// Proceso persistente (Railway) + fetch nativo reusa sockets keep-alive
// indefinidamente. Si Supabase/el pooler cierra una conexion inactiva sin
// avisar, el socket reciclado responde 200/204 sin llegar a ejecutar la
// query. Forzar reciclado de sockets antes de ese limite evita reusar una
// conexion muerta.
const agent = new Agent({ keepAliveTimeout: 10_000, keepAliveMaxTimeout: 10_000 })
const fetchConAgente = (url, options) => undiciFetch(url, { ...options, dispatcher: agent })

// Cliente admin — bypassa RLS, solo para operaciones internas del servidor
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { global: { fetch: fetchConAgente } }
)

// Cliente con contexto de usuario — respeta RLS
export const supabaseAsUser = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      fetch: fetchConAgente,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }
)