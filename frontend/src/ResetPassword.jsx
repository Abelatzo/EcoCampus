import { useState } from 'react'
import { Link } from 'react-router-dom'
import './ForgotPassword.scss'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!password || !confirmPassword || password !== confirmPassword) return
    setSubmitted(true)
  }

  return (
    <div className="forgot-page login-page">
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
          {!submitted && (
            <div className="stepper">
              <div className="step completed">
                <span>1</span>
                <small>Correo</small>
              </div>
              <div className="line" />
              <div className="step completed">
                <span>2</span>
                <small>Confirmación</small>
              </div>
              <div className="line" />
              <div className="step active">
                <span>3</span>
                <small>Nueva clave</small>
              </div>
            </div>
          )}

          {!submitted ? (
            <>
              <h2>Crea tu nueva contraseña</h2>
              <p className="muted">Elige una contraseña segura para proteger tu cuenta de EcoCampus.</p>

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="label-text">Nueva contraseña</span>
                  <input
                    type="password"
                    placeholder="**********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span className="label-text">Confirmar contraseña</span>
                  <input
                    type="password"
                    placeholder="**********"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>

                <div className="password-rules">
                  <p>La contraseña debe tener:</p>
                  <ul>
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Al menos una letra mayúscula y un número</li>
                    <li>• Al menos un carácter especial (@!#%...)</li>
                  </ul>
                </div>

                <button className="btn primary" type="submit">Guardar nueva contraseña</button>
                <div className="divider" />
                <Link to="/login" className="btn outline" role="button">← Volver al inicio de sesión</Link>
              </form>
            </>
          ) : (
            <>
              <div className="success-preview">
                <div className="success-icon">✓</div>
                <h2>¡Contraseña actualizada!</h2>
                <p className="muted">Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión con tu nueva clave.</p>
                <div className="info-box">
                  <div className="info-icon">🔒</div>
                  <div>Por seguridad, cerramos todas las sesiones activas asociadas a tu cuenta.</div>
                </div>
              </div>
              <Link to="/login" className="btn primary" role="button">Ir al inicio de sesión</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
