import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Reports.scss'

const reports = [
  {
    title: 'Contenedor lleno — planta baja',
    location: 'Edificio A · Plástico y aluminio',
    status: 'Pendiente',
    statusType: 'pending',
    description:
      'El contenedor de la planta baja del Edificio A se encuentra completamente lleno. Se requiere vaciado urgente antes del mediodía.',
    time: 'Hace 2 horas',
  },
  {
    title: 'Residuos en pasillo exterior',
    location: 'Edificio C · Piso 2',
    status: 'En proceso',
    statusType: 'in-progress',
    description:
      'Se encontraron residuos orgánicos y plástico en el pasillo exterior del segundo piso. Ya fue asignado a mantenimiento.',
    time: 'Ayer, 14:30',
  },
  {
    title: 'Bote de malla dañado',
    location: 'Edificio B · Entrada principal',
    status: 'Resuelto',
    statusType: 'resolved',
    description:
      'El bote de malla para PET presentaba rotura en la estructura. Fue reemplazado por el equipo de mantenimiento el martes.',
    time: 'Hace 3 días',
  },
]

const buildings = [
  'Edificio A', 'Edificio B', 'Edificio C', 'Edificio E', 'Edificio F',
  'Edificio G', 'Edificio H', 'Edificio I', 'Edificio J', 'Edificio K',
  'Edificio L', 'Edificio M', 'Edificio N', 'Edificio O', 'Edificio Q',
]

export default function Reports() {
  const [showModal, setShowModal] = useState(false)
  const [building, setBuilding] = useState(buildings[0])

  return (
    <div className="reports-app">
      <header className="topbar">
        <div className="logo">🌿 <span>EcoCampus</span></div>
        <nav className="nav">
          <Link to="/map" className="nav-item">Mapa</Link>
          <Link to="/reports" className="nav-item active">Reportes</Link>
          <Link to="/events" className="nav-item">Eventos</Link>
        </nav>
        <div className="right">
          <div className="username">Diego A.</div>
          <div className="avatar" aria-hidden="true" />
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
        </aside>

        <main className="main-content">
          <div className="header-row">
            <div>
              <h2>Mis Reportes</h2>
              <p className="count">{reports.length} reportes encontrados</p>
            </div>
            <button className="btn new-report" onClick={() => setShowModal(true)}>+ Nuevo Reporte</button>
          </div>

          <div className="search-bar">
            <input placeholder="Buscar en tus reportes..." />
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
                    <span className={`pill ${report.statusType}`}>{report.status}</span>
                    <p className="description">{report.description}</p>
                    <div className="card-actions">
                      <div className="action-buttons">
                        <button className="btn outline">Ver detalle</button>
                        <button className="btn primary">Actualizar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Reporte</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Edificio</span>
                <div className="type-toggle">
                  {buildings.map((b) => (
                    <button
                      key={b}
                      className={`type-btn ${building === b ? 'active' : ''}`}
                      onClick={() => setBuilding(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </label>

              <label className="modal-field">
                <span>Título</span>
                <input type="text" placeholder="Ej. Contenedor lleno — planta baja" />
              </label>

              <label className="modal-field">
                <span>Detalle de ubicación (opcional)</span>
                <input type="text" placeholder="Ej. Plástico y aluminio, entrada principal..." />
              </label>

              <label className="modal-field">
                <span>Descripción</span>
                <textarea rows="4" placeholder="Describe el reporte..." />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={() => setShowModal(false)}>Crear reporte</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}