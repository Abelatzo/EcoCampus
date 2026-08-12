import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerTodos,
  obtenerUno,
  crear,
  actualizar,
  desactivar,
  eliminar
} from '../controllers/boteMallas.controller.js'

const router = Router()

router.get('/', verificarAuth, obtenerTodos)
router.get('/:id', verificarAuth, obtenerUno)
router.post('/', verificarAuth, soloAdmin, crear)
router.put('/:id', verificarAuth, soloAdmin, actualizar)
router.patch('/:id/estatus', verificarAuth, soloAdmin, desactivar)
router.delete('/:id', verificarAuth, soloAdmin, eliminar)

export default router