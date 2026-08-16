import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.scss'

export default function Register() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Completa todos los campos')
      return
    }
    if (!/^al[0-9]+@utcj\.edu\.mx$/i.test(email.trim())) {
      setError('Usa tu correo institucional con formato al + matrícula (ej. al24311267@utcj.edu.mx)')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudo crear la cuenta')
        return
      }

      setSuccess('Cuenta creada correctamente. Redirigiendo a inicio de sesión...')
      setTimeout(() => navigate('/login'), 1500)
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

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

          <form onSubmit={handleRegister} className="register-form">
            <div className="grid">
              <label className="field">
                <span className="label-text">Nombre completo</span>
                <input type="text" placeholder="Ej. Diego Araiza López" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>

              <label className="field">
                <span className="label-text">Correo institucional</span>
                <input type="email" placeholder="usuario@utcj.edu.mx" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              <label className="field">
                <span className="label-text">Contraseña</span>
                <input type="password" placeholder="**********" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>

              <label className="field">
                <span className="label-text">Confirmar contraseña</span>
                <input type="password" placeholder="**********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </label>
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontSize: '14px' }}>{success}</p>}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <p className="footer-link">¿Ya tienes cuenta?  <Link to="/login">Inicia sesión</Link></p>
          </form>
        </div>

        <div className="credits-footer">
          <p>© 2026 EcoCampus — Universidad Tecnológica de Ciudad Juárez. Todos los derechos reservados.</p>
          <p>
            Diseñado y desarrollado por: Diego Armando Araiza López (UI/UX Design &amp; Frontend) · Julio Rafael Camacho Perea (Base de datos, Backend &amp; Despliegue) · Abel Andrés Barraza Ramírez (Backend &amp; Endpoints) · David Ahjuech Ramos (Integración de APIs)
          </p>
        </div>
      </div>
    </div>
  )
}
