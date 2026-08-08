import { Link } from 'react-router-dom'
import './Register.scss'

export default function Register() {
  return (
    <div className="register-page">
      <div className="left-panel">
        <div className="logo-circle">
          <div className="leaf" aria-hidden="true" />
        </div>
        <h1 className="brand">EcoCampus</h1>
        <p className="subtitle">Únete a la comunidad ecológica de la UTCJ</p>
      </div>

      <div className="right-panel">
        <div className="card">
          <h2>Crear cuenta</h2>
          <p className="muted">Completa tus datos para unirte a EcoCampus</p>

          <form onSubmit={(e) => e.preventDefault()} className="register-form">
            <div className="grid">
              <label className="field">
                <span className="label-text">Nombre completo</span>
                <input type="text" placeholder="Ej. Diego Araiza López" />
              </label>

              <label className="field">
                <span className="label-text">Correo institucional</span>
                <input type="email" placeholder="usuario@utcj.edu.mx" />
              </label>

              <label className="field">
                <span className="label-text">Contraseña</span>
                <input type="password" placeholder="**********" />
              </label>

              <label className="field">
                <span className="label-text">Confirmar contraseña</span>
                <input type="password" placeholder="**********" />
              </label>
            </div>

            <label className="terms">
              <input type="checkbox" />
              <span>Acepto los términos y condiciones de uso de EcoCampus</span>
            </label>

            <button className="btn primary" type="submit">Crear cuenta</button>

            <p className="footer-link">¿Ya tienes cuenta?  <Link to="/login">Inicia sesión</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
