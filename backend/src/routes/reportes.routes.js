import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerActivos,
  estadoMapa,
  crearReporte,
  actualizarEstatus,
  historial
} from '../controllers/reportes.controller.js'

const router = Router()

// Ruta de polling para el mapa — cualquier autenticado
router.get('/mapa', verificarAuth, estadoMapa)

// Reportes activos — personal y admin
router.get('/', verificarAuth, obtenerActivos)

// Crear reporte — cualquier autenticado
router.post('/', verificarAuth, crearReporte)

// Cambiar estatus — autenticado (la lógica interna controla quién puede qué)
router.patch('/:id/estatus', verificarAuth, actualizarEstatus)

// Historial — solo admin
router.get('/historial', verificarAuth, soloAdmin, historial)

export default router