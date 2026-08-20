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

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

// Reinicio programado: el proceso a veces queda en un estado stale despues
// de un rato (conexion a Supabase, cache interno, etc.) que ningun redeploy
// de codigo limpia -- solo un restart manual del servicio lo arreglaba
// (ver QA 2026-08-15/16). En vez de esperar a que alguien lo note, el
// proceso se cierra solo cada tanto; la politica de restart de Railway
// (reinicia ante un proceso que termina) lo vuelve a levantar limpio.
// Sale con codigo 1 (no 0) a proposito -- un exit "exitoso" no siempre
// dispara el restart automatico segun la politica configurada.
const RESTART_MS = 6 * 60 * 60 * 1000
setTimeout(() => {
  console.log('Reinicio programado, cerrando el servidor...')
  server.close(() => process.exit(1))
  // Por si alguna conexion queda colgada y server.close() nunca llama al
  // callback, se fuerza la salida de todos modos.
  setTimeout(() => process.exit(1), 10 * 1000)
}, RESTART_MS)

// QA 2026-08-16: se quita el heartbeat de Supabase (corria cada 60s desde
// el 2026-08-15) -- el plan de Supabase de este proyecto es "trial", y con
// horas de polling constante del frontend (mapa + reportes cada 15s, x2
// pantallas) mas este heartbeat mas las pruebas directas via Postman, el
// patron real observado (la MISMA sesion valida alternando 200/401 en la
// MISMA ruta) apunta mas a agotar el limite de conexiones/requests del
// plan que a una conexion individual stale -- el heartbeat sumaba carga
// en vez de ayudar. Si el problema reaparece, revisar el dashboard de
// Supabase (Database > limite de conexiones, o throttling en el plan) en
// vez de agregar mas trafico de diagnostico.