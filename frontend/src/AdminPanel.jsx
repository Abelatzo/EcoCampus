import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './AdminPanel.scss'

const statusMap = {
  pendiente: { label: 'Pendiente', statusClass: 'pending' },
  en_proceso: { label: 'En proceso', statusClass: 'progress' },
  resuelto: { label: 'Resuelto', statusClass: 'resolved' },
  dañado: { label: 'Dañado', statusClass: 'damaged' },
}

const estatusPointMap = {
  disponible: { label: 'Disponible', statusClass: 'available' },
  saturado: { label: 'Saturado', statusClass: 'full' },
  dañado: { label: 'Dañado', statusClass: 'damaged' },
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [stats, setStats] = useState(null)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [lastReports, setLastReports] = useState([])
  const [points, setPoints] = useState([])
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  const API = import.meta.env.VITE_API_URL

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [statsRes, reportesRes, botesRes, usuariosRes, eventosRes] = await Promise.all([
        fetch(`${API}/api/admin/estadisticas`, { headers }),
        fetch(`${API}/api/admin/reportes`, { headers }),
        fetch(`${API}/api/admin/bote-mallas`, { headers }),
        fetch(`${API}/api/usuarios`, { headers }),
        fetch(`${API}/api/eventos`, { headers }),
      ])

      const statsData = await statsRes.json()
      const reportesData = await reportesRes.json()
      const botesData = await botesRes.json()
      const usuariosData = await usuariosRes.json()
      const eventosData = await eventosRes.json()

      setStats(statsData)
      setTotalUsuarios(Array.isArray(usuariosData) ? usuariosData.length : 0)
      setLastReports(Array.isArray(reportesData) ? reportesData.slice(0, 5) : [])
      setPoints(Array.isArray(botesData) ? botesData.slice(0, 5) : [])
      setEventos(Array.isArray(eventosData) ? eventosData.slice(0, 4) : [])
    } catch (err) {
      console.error('Error cargando panel:', err)
    } finally {
      setLoading(false)
    }
  }

  const barChart = stats ? [
    { label: 'Pendiente', value: stats.pendientes || 0, color: 'orange' },
    { label: 'En proceso', value: stats.en_proceso || 0, color: 'blue' },
    { label: 'Resuelto', value: stats.resueltos || 0, color: 'green' },
  ] : []

  const chartMax = barChart.length > 0 ? Math.max(...barChart.map(b => b.value), 1) : 1

  // Actividad reciente simulada con últimos reportes
  const activityReciente = lastReports.map(r => ({
    text: `Nuevo reporte · ${r.titulo || r.comentario || 'Sin título'} · Edif. ${r.bote_mallas?.edificio || '?'}`,
    time: new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
  }))

  const statCards = [
    { icon: '👥', label: 'Usuarios registrados', value: totalUsuarios, accent: 'green' },
    { icon: '📋', label: 'Reportes totales', value: stats?.total || 0, accent: 'orange' },
    { icon: '✅', label: 'Reportes resueltos', value: stats?.resueltos || 0, accent: 'blue' },
    { icon: '📍', label: 'Puntos ecológicos', value: points.length, accent: 'red' },
  ]

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando panel...</div>

  return (
    <div className="panel-app admin">
      <header className="topbar">
        <div className="left">
          <div className="logo">🌿 <span>EcoCampus</span></div>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <nav className="nav">
          <Link to="/admin" className="nav-item">Mapa</Link>
          <Link to="/admin/reports" className="nav-item">Reportes</Link>
          <Link to="/admin/events" className="nav-item">Eventos</Link>
          <Link to="/admin/users" className="nav-item">Usuarios</Link>
          <Link to="/admin/panel" className="nav-item active">Panel</Link>
        </nav>
        <div className="right">
          <div className="username">Admin</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Panel Administrativo</h2>
          <p className="subtitle">Resumen general del sistema EcoCampus — UTCJ</p>
        </div>

        <div className="stats-grid">
          {statCards.map((s) => (
            <div key={s.label} className={`stat-card ${s.accent}`}>
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-text">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mid-grid">
          <div className="panel-card chart-card">
            <h3>Reportes por estado</h3>
            <p className="card-subtitle">Últimos 30 días</p>
            <div className="bar-chart">
              {barChart.map((b) => (
                <div key={b.label} className="bar-col">
                  <span className="bar-value">{b.value}</span>
                  <div className={`bar ${b.color}`} style={{ height: `${(b.value / chartMax) * 100}%` }} />
                  <span className="bar-label">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="card-header-row">
              <h3>Últimos reportes</h3>
              <Link to="/admin/reports" className="view-all">Ver todos →</Link>
            </div>
            <ul className="list">
              {lastReports.length === 0 && <li className="list-row">No hay reportes.</li>}
              {lastReports.map((r) => {
                const s = statusMap[r.estatus] || { label: r.estatus, statusClass: 'pending' }
                return (
                  <li key={r.id} className={`list-row ${s.statusClass}`}>
                    <div className="list-text">
                      <div className="list-title">{r.titulo || r.comentario || 'Sin título'}</div>
                      <div className="list-sub">Edif. {r.bote_mallas?.edificio || '?'}</div>
                    </div>
                    <span className={`pill ${s.statusClass}`}>{s.label}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="bottom-grid">
          <div className="panel-card">
            <h3>Estado de puntos ecológicos</h3>
            <ul className="list simple">
              {points.length === 0 && <li className="list-row">No hay puntos.</li>}
              {points.map((p) => {
                const s = estatusPointMap[p.estatus] || { label: p.estatus, statusClass: 'available' }
                return (
                  <li key={p.id} className={`list-row ${s.statusClass}`}>
                    <div className="list-title">{p.edificio} · {p.ubicacion}</div>
                    <span className={`pill ${s.statusClass}`}>{s.label}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel-card">
            <div className="card-header-row">
              <h3>Eventos publicados</h3>
            </div>
            <ul className="list simple">
              {eventos.length === 0 && <li className="list-row">No hay eventos.</li>}
              {eventos.map((e) => (
                <li key={e.id} className="list-row">
                  <div className="list-text">
                    <div className="list-title">{e.titulo}</div>
                    <div className="list-sub">{new Date(e.fecha_evento).toLocaleDateString('es-MX')}</div>
                  </div>
                  <span className="pill active">{e.tipo}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-card">
            <h3>Actividad reciente</h3>
            <ul className="list activity">
              {activityReciente.length === 0 && <li className="list-row">Sin actividad reciente.</li>}
              {activityReciente.map((a, i) => (
                <li key={i} className="list-row">
                  <div className="list-text">
                    <div className="list-title">{a.text}</div>
                    <div className="list-sub">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
