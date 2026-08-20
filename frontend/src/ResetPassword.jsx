import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './ForgotPassword.scss'

export default function ResetPassword() {
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const token = location.state?.token || ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Completa ambos campos')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      setError('Mínimo 8 caracteres, una mayúscula, un número y un carácter especial')
      return
    }
    if (!token) {
      setError('Sesión de recuperación inválida o expirada. Solicita un nuevo código.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'No se pudo actualizar la contraseña')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setSaving(false)
    }
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

                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
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
