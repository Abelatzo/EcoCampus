import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import { obtenerEdificios, actualizarPosicion } from '../controllers/edificios.controller.js'

const router = Router()

router.get('/', verificarAuth, obtenerEdificios)
router.patch('/:id/posicion', verificarAuth, soloAdmin, actualizarPosicion)

export default router