import { Link } from 'react-router-dom'
import './AdminPanel.scss'

const stats = [
  { icon: '👥', label: 'Usuarios registrados', value: '124', note: '+8 esta semana', accent: 'green' },
  { icon: '📋', label: 'Reportes totales', value: '47', note: '12 pendientes', accent: 'orange' },
  { icon: '✅', label: 'Reportes resueltos', value: '31', note: '65% del total', accent: 'blue' },
  { icon: '📍', label: 'Puntos ecológicos', value: '18', note: '3 con incidencia', accent: 'red' },
]

const barChart = [
  { label: 'Pendiente', value: 12, color: 'orange' },
  { label: 'En proceso', value: 4, color: 'blue' },
  { label: 'Resuelto', value: 31, color: 'green' },
]
const chartMax = 32

const lastReports = [
  { title: 'Contenedor lleno', location: 'Edif. A', status: 'Pendiente', statusClass: 'pending' },
  { title: 'Residuos en pasillo', location: 'Edif. C', status: 'En proceso', statusClass: 'progress' },
  { title: 'Bote dañado', location: 'Edif. B', status: 'Resuelto', statusClass: 'resolved' },
  { title: 'Mal olor — área verde', location: 'Jardín', status: 'Pendiente', statusClass: 'pending' },
  { title: 'Latas sin recolectar', location: 'Edif. D', status: 'En proceso', statusClass: 'progress' },
]

const points = [
  { title: 'Bote malla A1 · Edif. A', status: 'Disponible', statusClass: 'available' },
  { title: 'Bote malla B2 · Edif. B', status: 'Lleno', statusClass: 'full' },
  { title: 'Contenedor · Acceso', status: 'Disponible', statusClass: 'available' },
  { title: 'Bote malla C3 · Edif. C', status: 'Dañado', statusClass: 'damaged' },
  { title: 'Bote malla D1 · Edif. D', status: 'Disponible', statusClass: 'available' },
]

const eventsPublished = [
  { title: 'Taller de reciclaje PET', date: '28 Jun 2026', status: 'Activo', statusClass: 'active' },
  { title: 'Día del Medio Ambiente', date: '05 Jul 2026', status: 'Próximo', statusClass: 'upcoming' },
  { title: 'Limpieza campus norte', date: '12 Jul 2026', status: 'Próximo', statusClass: 'upcoming' },
  { title: 'Feria Sustentable UTCJ', date: '20 Jul 2026', status: 'Borrador', statusClass: 'draft' },
]

const activity = [
  { text: 'Reporte resuelto · Bote dañado Edif. B', time: 'Hace 1 hora' },
  { text: 'Nuevo usuario registrado · lgarcia', time: 'Hace 2 horas' },
  { text: 'Estado actualizado · En proceso (Edif. C)', time: 'Hace 3 horas' },
  { text: 'Evento publicado · Taller de reciclaje', time: 'Ayer, 10:30' },
  { text: 'Nuevo reporte · Contenedor lleno Edif. A', time: 'Ayer, 08:15' },
]

export default function AdminPanel() {
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
          {stats.map((s) => (
            <div key={s.label} className={`stat-card ${s.accent}`}>
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-text">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-note">{s.note}</div>
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
                  <div
                    className={`bar ${b.color}`}
                    style={{ height: `${(b.value / chartMax) * 100}%` }}
                  />
                  <span className="bar-label">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="card-header-row">
              <h3>Últimos reportes</h3>
              <a href="#" className="view-all">Ver todos →</a>
            </div>
            <ul className="list">
              {lastReports.map((r) => (
                <li key={r.title} className={`list-row ${r.statusClass}`}>
                  <div className="list-text">
                    <div className="list-title">{r.title}</div>
                    <div className="list-sub">{r.location}</div>
                  </div>
                  <span className={`pill ${r.statusClass}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bottom-grid">
          <div className="panel-card">
            <h3>Estado de puntos ecológicos</h3>
            <ul className="list simple">
              {points.map((p) => (
                <li key={p.title} className={`list-row ${p.statusClass}`}>
                  <div className="list-title">{p.title}</div>
                  <span className={`pill ${p.statusClass}`}>{p.status}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-card">
            <div className="card-header-row">
              <h3>Eventos publicados</h3>
              <button className="btn new-event">+ Evento</button>
            </div>
            <ul className="list simple">
              {eventsPublished.map((e) => (
                <li key={e.title} className="list-row">
                  <div className="list-text">
                    <div className="list-title">{e.title}</div>
                    <div className="list-sub">{e.date}</div>
                  </div>
                  <span className={`pill ${e.statusClass}`}>{e.status}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-card">
            <h3>Actividad reciente</h3>
            <ul className="list activity">
              {activity.map((a) => (
                <li key={a.id} className="list-row">
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