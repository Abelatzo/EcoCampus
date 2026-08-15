// Cierra sesion: limpia el token/usuario guardados y manda a /login.
// sessionStorage (no localStorage) para que la sesion no sobreviva entre
// pestañas/reinicios del navegador y no se acumulen sesiones huerfanas.
export function cerrarSesion(navigate) {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('usuario')
  navigate('/login')
}
