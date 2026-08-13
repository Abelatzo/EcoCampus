import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerActivos,
  estadoMapa,
  crearReporte,
  actualizarEstatus,
  editarReporte,
  eliminarReporte,
  historial
} from '../controllers/reportes.controller.js'

const router = Router()

router.get('/mapa', verificarAuth, estadoMapa)
router.get('/', verificarAuth, obtenerActivos)
router.post('/', verificarAuth, crearReporte)
router.patch('/:id/estatus', verificarAuth, actualizarEstatus)
router.patch('/:id', verificarAuth, editarReporte)
router.delete('/:id', verificarAuth, soloAdmin, eliminarReporte)
router.get('/historial', verificarAuth, soloAdmin, historial)

export default router