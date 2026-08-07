import { Link } from 'react-router-dom'
import './Login.scss'

export default function Login() {
  return (
    <div className="login-page">
      <div className="left-panel">
        <div className="logo-circle">
          <div className="leaf" aria-hidden="true" />
        </div>
        <h1 className="brand">EcoCampus</h1>
        <p className="subtitle">Gestión Ecológica del Campus UTCJ</p>
        <p className="tags">Reporta · Consulta · Participa</p>
      </div>

      <div className="right-panel">
        <div className="card">
          <h2>Bienvenido de nuevo</h2>
          <p className="muted">Inicia sesión con tu cuenta institucional</p>

          <form onSubmit={(e) => e.preventDefault()} className="login-form">
            <label className="field">
              <span className="label-text">Correo institucional</span>
              <input type="email" placeholder="usuario@utcj.edu.mx" />
            </label>

            <label className="field">
              <span className="label-text">Contraseña</span>
              <input type="password" placeholder="**********" />
            </label>

            <Link to="/forgot-password" className="forgot">¿Olvidaste tu contraseña?</Link>

            <button className="btn primary" type="submit">Iniciar sesión</button>

            <div className="divider" />

            <Link to="/register" className="btn outline" role="button">¿No tienes cuenta? Regístrate aquí</Link>
          </form>
        </div>
      </div>
    </div>
  )
}
