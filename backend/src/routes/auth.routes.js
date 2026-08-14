import { Router } from 'express'
import { registro, login, forgotPassword, resetPassword } from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', registro)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router