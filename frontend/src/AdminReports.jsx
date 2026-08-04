import { Link } from 'react-router-dom'
import './AdminReports.scss'

const reports = [
  {
    title: 'Contenedor lleno — planta baja',
    location: 'Edificio A · Plástico y aluminio',
    status: 'Pendiente',
    statusType: 'pending',
    author: 'daraiza959',
    description: 'El contenedor de la planta baja del Edificio A se encuentra completamente lleno. Se requiere vaciado urgente.',
    time: 'Hace 2 horas',
  },
  {
    title: 'Residuos en pasillo exterior',
    location: 'Edificio C · Piso 2',
    status: 'En proceso',
    statusType: 'in-progress',
    author: 'lgarcia',
    description: 'Residuos orgánicos y plástico en el pasillo exterior del segundo piso. Asignado a mantenimiento.',
    time: 'Ayer, 14:30',
  },
  {
    title: 'Bote de malla dañado',
    location: 'Edificio B · Entrada principal',
    status: 'Resuelto',
    statusType: 'resolved',
    author: 'ctorres',
    description: 'El bote de malla para PET presentaba rotura. Fue reemplazado por mantenimiento el martes.',
    time: 'Hace 3 días',
  },
]

const states = [
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Resuelto', type: 'resolved' },
]

export default function ReportsAdmin() {
  return (
    <div className="reports-app admin">
      <header className="topbar">
        <div className="logo-row">
          <div className="logo">🌿 <span>EcoCampus</span></div>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <nav className="nav">
          <Link to="/admin/map" className="nav-item">Mapa</Link>
          <Link to="/admin/reports" className="nav-item active">Reportes</Link>
          <Link to="/admin/events" className="nav-item">Eventos</Link>
          <Link to="/admin/users" className="nav-item">Usuarios</Link>
          <Link to="/admin/panel" className="nav-item">Panel</Link>
        </nav>
        <div className="right">
          <div className="username">Admin</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="container">
        <aside className="sidebar left">
          <h3>Filtrar por</h3>

          <div className="filter-group">
            <div className="filter-title">Estado</div>
            <button className="state-filter active">Todos</button>
            <button className="state-filter">Pendiente</button>
            <button className="state-filter">En proceso</button>
            <button className="state-filter">Resuelto</button>
          </div>

          <div className="filter-group">
            <div className="filter-title">Edificio</div>
            <label className="checkbox"><input type="checkbox" /> Todos</label>
            <label className="checkbox"><input type="checkbox" /> Edificio A</label>
            <label className="checkbox"><input type="checkbox" /> Edificio B</label>
            <label className="checkbox"><input type="checkbox" /> Edificio C</label>
            <label className="checkbox"><input type="checkbox" /> Edificio D</label>
            <label className="checkbox"><input type="checkbox" /> Biblioteca</label>
          </div>

          <div className="admin-tools">
            <div className="admin-tools-title">⚙ Admin</div>
            <button className="btn tool export">Exportar reportes (.csv)</button>
            <button className="btn tool delete">Eliminar seleccionados</button>
          </div>
        </aside>

        <main className="main-content">
          <div className="header-row">
            <div>
              <h2>Todos los Reportes</h2>
              <p className="count">47 reportes en total — vista de administrador</p>
            </div>
            <button className="btn new-report">+ Nuevo Reporte</button>
          </div>

          <div className="search-bar">
            <input placeholder="Buscar por título, edificio o usuario..." />
          </div>

          <div className="report-list">
            {reports.map((report) => (
              <article key={report.title} className="report-card">
                <div className={`status-side ${report.statusType}`} />
                <div className="card-content">
                  <div className="card-media">
                    <div className="image-placeholder">📷</div>
                  </div>
                  <div className="card-info">
                    <div className="card-header">
                      <div>
                        <h3>{report.title}</h3>
                        <p className="location">{report.location}</p>
                      </div>
                      <span className="report-time">{report.time}</span>
                    </div>

                    <div className="tags-row">
                      <span className={`pill ${report.statusType}`}>{report.status}</span>
                      <span className="pill author">👤 {report.author}</span>
                    </div>

                    <p className="description">{report.description}</p>

                    <div className="state-change">
                      <span className="state-change-label">Cambiar estado:</span>
                      <div className="state-change-options">
                        {states.map((s) => (
                          <button
                            key={s.type}
                            className={`state-btn ${s.type} ${report.statusType === s.type ? 'active' : ''}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="card-actions">
                      <div className="action-buttons">
                        <button className="btn outline">Ver detalle</button>
                        <button className="btn danger">🗑 Eliminar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}