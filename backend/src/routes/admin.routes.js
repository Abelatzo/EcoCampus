import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  estadisticas,
  reportesAdmin,
  boteMallasAdmin
} from '../controllers/admin.controller.js'

const router = Router()

router.use(verificarAuth, soloAdmin)

router.get('/estadisticas', estadisticas)
router.get('/reportes', reportesAdmin)
router.get('/bote-mallas', boteMallasAdmin)

export default router