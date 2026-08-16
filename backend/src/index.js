import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import boteMallasRoutes from './routes/boteMallas.routes.js'
import reportesRoutes from './routes/reportes.routes.js'
import adminRoutes from './routes/admin.routes.js'
import usuariosRoutes from './routes/usuarios.routes.js'
import eventosRoutes from './routes/eventos.routes.js'
import edificiosRoutes from './routes/edificios.routes.js'
import { supabase } from './config/supabase.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Express genera ETag por defecto en res.json(); sin esto, el navegador
// puede revalidar y quedarse con una respuesta 304 vieja de antes de iniciar
// sesion (el endpoint no varia por Authorization) -- el mapa y los reportes
// se veian vacios hasta refrescar la pagina porque el poll traia el cache
// en vez de datos frescos. Estas rutas son todas privadas/por-usuario, no
// hay nada que valga la pena cachear.
app.set('etag', false)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/bote-mallas', boteMallasRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/eventos', eventosRoutes)
app.use('/api/edificios', edificiosRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'EcoCampus API corriendo' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

// Heartbeat: en un proceso persistente (Railway, no serverless), si el
// cliente de Supabase queda inactivo mucho tiempo, la conexion subyacente
// puede quedar stale sin que el cliente lo detecte (escrituras devuelven
// 200 sin persistir -- ver PR de conexion). Una query trivial periodica
// evita que el proceso llegue a estar inactivo el tiempo suficiente.
// No toca el fetch/transporte del cliente (eso fue lo que rompio los
// triggers en un intento anterior), solo lo mantiene en uso.
const HEARTBEAT_MS = 4 * 60 * 1000
setInterval(() => {
  supabase.from('edificios').select('id').limit(1).then(({ error }) => {
    if (error) console.error('Heartbeat de Supabase fallo:', error.message)
  })
}, HEARTBEAT_MS)