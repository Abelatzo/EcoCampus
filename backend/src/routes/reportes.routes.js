import { Router } from 'express'
import multer from 'multer'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerActivos,
  estadoMapa,
  crearReporte,
  actualizarEstatus,
  editarReporte,
  eliminarReporte,
  historial,
  subirFoto
} from '../controllers/reportes.controller.js'

const router = Router()

const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('foto')

router.get('/mapa', verificarAuth, estadoMapa)
router.get('/', verificarAuth, obtenerActivos)
router.post('/', verificarAuth, crearReporte)
router.post('/foto', verificarAuth, (req, res, next) => {
  uploadFoto(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen supera el límite de 5MB' })
    }
    res.status(400).json({ error: 'Error al subir el archivo' })
  })
}, subirFoto)
router.patch('/:id/estatus', verificarAuth, actualizarEstatus)
router.patch('/:id', verificarAuth, editarReporte)
router.delete('/:id', verificarAuth, soloAdmin, eliminarReporte)
router.get('/historial', verificarAuth, soloAdmin, historial)

export default router