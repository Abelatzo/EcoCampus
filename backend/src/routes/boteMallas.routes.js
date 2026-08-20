import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { obtenerTodos, obtenerUno } from '../controllers/boteMallas.controller.js'

const router = Router()

router.get('/', verificarAuth, obtenerTodos)
router.get('/:id', verificarAuth, obtenerUno)

export default router
