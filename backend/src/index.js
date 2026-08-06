import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import boteMallasRoutes from './routes/boteMallas.routes.js'
import reportesRoutes from './routes/reportes.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/bote-mallas', boteMallasRoutes)
app.use('/api/reportes', reportesRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'EcoCampus API corriendo' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})