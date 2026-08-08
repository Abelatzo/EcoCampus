import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.scss'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales incorrectas')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))

      if (data.usuario.rol === 'administrador') {
        navigate('/admin')
      } else {
        navigate('/map')
      }

    } catch (err) {
      setError('Error al conectar con el servidor')
    }
  }

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

          <form onSubmit={handleLogin} className="login-form">
            <label className="field">
              <span className="label-text">Correo institucional</span>
              <input
                type="email"
                placeholder="usuario@utcj.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="label-text">Contraseña</span>
              <input
                type="password"
                placeholder="**********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

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
