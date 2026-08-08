import { Router } from 'express'
import { verificarAuth } from '../middlewares/auth.js'
import { soloAdmin } from '../middlewares/roles.js'
import {
  obtenerEventos,
  obtenerEvento,
  crearEvento,
  editarEvento,
  togglePublicado,
  eliminarEvento
} from '../controllers/eventos.controller.js'

const router = Router()

// Lectura — cualquier autenticado (el RLS filtra publicado=false para estudiantes)
router.get('/', verificarAuth, obtenerEventos)
router.get('/:id', verificarAuth, obtenerEvento)

// Escritura — solo admin
router.post('/', verificarAuth, soloAdmin, crearEvento)
router.patch('/:id', verificarAuth, soloAdmin, editarEvento)
router.patch('/:id/publicado', verificarAuth, soloAdmin, togglePublicado)
router.delete('/:id', verificarAuth, soloAdmin, eliminarEvento)

export default router