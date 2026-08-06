export const soloAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' })
  }
  next()
}