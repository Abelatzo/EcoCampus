import { Link } from 'react-router-dom'
import { useState } from 'react'
import './ForgotPassword.scss'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  const resendEmail = (event) => {
    event.preventDefault()
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
          <div className="stepper">
            <div className={`step ${submitted ? 'completed' : 'active'}`}>
              <span>1</span>
              <small>Correo</small>
            </div>
            <div className="line" />
            <div className={`step ${submitted ? 'active' : ''}`}>
              <span>2</span>
              <small>Confirmación</small>
            </div>
            <div className="line" />
            <div className="step">
              <span>3</span>
              <small>Nueva clave</small>
            </div>
          </div>

          {!submitted ? (
            <>
              <h2>¿Olvidaste tu contraseña?</h2>
              <p className="muted">Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu acceso.</p>

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="label-text">Correo institucional</span>
                  <input
                    type="email"
                    placeholder="usuario@utcj.edu.mx"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <button className="btn primary" type="submit">Enviar instrucciones</button>
                <div className="divider" />
                <Link to="/login" className="btn outline" role="button">← Volver al inicio de sesión</Link>
              </form>
            </>
          ) : (
            <>
              <h2>Revisa tu correo</h2>
              <p className="muted">Enviamos un enlace de recuperación a:</p>
              <div className="email-pill">{email || 'usuario@utcj.edu.mx'}</div>
              <p className="info-text">El enlace expira en 30 minutos. Si no lo ves en tu bandeja, revisa la carpeta de spam.</p>

              <form className="login-form" onSubmit={resendEmail}>
                <button className="btn primary" type="submit">Reenviar correo</button>
                <div className="divider" />
                <Link to="/login" className="btn outline" role="button">← Volver al inicio de sesión</Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
