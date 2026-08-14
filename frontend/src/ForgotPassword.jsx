import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './ForgotPassword.scss'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const sendReset = async () => {
    setError('')
    setSending(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo enviar el código')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    sendReset()
  }

  const resendCode = (event) => {
    event.preventDefault()
    sendReset()
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setError('')
    if (!code.trim()) return
    setVerifying(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Código inválido o expirado')
      }
      navigate('/reset-password', { state: { token: data.token } })
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
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

                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button className="btn primary" type="submit" disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
                <div className="divider" />
                <Link to="/login" className="btn outline" role="button">← Volver al inicio de sesión</Link>
              </form>
            </>
          ) : (
            <>
              <h2>Revisa tu correo</h2>
              <p className="muted">Enviamos un código de recuperación a:</p>
              <div className="email-pill">{email || 'usuario@utcj.edu.mx'}</div>
              <p className="info-text">El código expira en unos minutos. Si no lo ves en tu bandeja, revisa la carpeta de spam.</p>

              <form className="login-form" onSubmit={handleVerifyCode}>
                <label className="field">
                  <span className="label-text">Código de 6 dígitos</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    required
                  />
                </label>

                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button className="btn primary" type="submit" disabled={verifying}>
                  {verifying ? 'Verificando...' : 'Verificar código'}
                </button>
                <button className="btn outline" type="button" onClick={resendCode} disabled={sending}>
                  {sending ? 'Enviando...' : 'Reenviar código'}
                </button>
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
