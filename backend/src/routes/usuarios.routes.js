import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerUsuarios,
  obtenerUsuario,
  cambiarRol,
  editarUsuario,
  desactivarUsuario
} from '../controllers/usuarios.controller.js'

const router = Router()

router.get('/', verificarAuth, soloAdmin, obtenerUsuarios)
router.get('/:id', verificarAuth, obtenerUsuario)
router.patch('/:id/rol', verificarAuth, soloAdmin, cambiarRol)
router.patch('/:id', verificarAuth, editarUsuario)
router.delete('/:id', verificarAuth, soloAdmin, desactivarUsuario)

export default router