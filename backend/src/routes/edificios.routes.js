import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { obtenerEdificios } from '../controllers/edificios.controller.js'

const router = Router()

router.get('/', verificarAuth, obtenerEdificios)

export default router