import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
console.log('ANON KEY:', process.env.SUPABASE_ANON_KEY)
console.log('SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)

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