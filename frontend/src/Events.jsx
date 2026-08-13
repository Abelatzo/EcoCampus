import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Events.scss'

const events = [
  {
    type: 'Evento',
    typeClass: 'event',
    status: 'Próximo',
    statusClass: 'upcoming',
    title: 'Taller de reciclaje de PET',
    date: '28 de junio, 2026 · 10:00 AM',
    location: 'Edificio A — Aula 101',
    description:
      'Aprende a clasificar y reutilizar botellas de PET. Actividad abierta a toda la comunidad universitaria. Habrá dinámica práctica y material informativo sobre el impacto del reciclaje en el campus.',
  },
  {
    type: 'Actualización',
    typeClass: 'update',
    status: 'Publicado',
    statusClass: 'published',
    title: 'Estado de botes malla — Semana 24',
    date: '20 de junio, 2026',
    location: null,
    description:
      'Se realizó revisión semanal de los 18 botes malla del campus. 15 en estado disponible, 2 con capacidad al límite (Edif. B y D) y 1 reportado como dañado (Edif. C) con reparación programada para el lunes.',
  },
  {
    type: 'Evento',
    typeClass: 'event',
    status: 'Próximo',
    statusClass: 'upcoming',
    title: 'Día del Medio Ambiente UTCJ',
    date: '05 de julio, 2026 · 09:00 AM',
    location: 'Plaza principal del campus',
    description:
      'Celebración institucional del Día Mundial del Medio Ambiente. Actividades de concientización, exposición de proyectos sustentables de alumnos y entrega de reconocimientos al programa Universidad Sustentable.',
  },
  {
    type: 'Información',
    typeClass: 'info',
    status: 'Publicado',
    statusClass: 'published',
    title: 'Nueva zona de reciclaje — Acceso norte',
    date: '15 de junio, 2026',
    location: null,
    description:
      'Se habilitó una nueva estación de reciclaje en el acceso norte del campus, con contenedores diferenciados para PET, cartón y residuos generales. El punto ya está visible en el mapa interactivo de EcoCampus.',
  },
]

const filterMap = { Todos: null, Eventos: 'event', Actualizaciones: 'update', Información: 'info' }
const filters = Object.keys(filterMap)
const PAGE_SIZE = 4

export default function Events() {
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [detailEvent, setDetailEvent] = useState(null)
  const [page, setPage] = useState(1)

  const selectFilter = (f) => {
    setActiveFilter(f)
    setPage(1)
  }

  const filteredEvents = filterMap[activeFilter]
    ? events.filter((ev) => ev.typeClass === filterMap[activeFilter])
    : events

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="events-app">
      <header className="topbar">
        <div className="logo-row">
          <div className="logo">🌿 <span>EcoCampus</span></div>
        </div>
        <nav className="nav">
          <Link to="/map" className="nav-item">Mapa</Link>
          <Link to="/reports" className="nav-item">Reportes</Link>
          <Link to="/events" className="nav-item active">Eventos</Link>
        </nav>
        <div className="right">
          <div className="username">Diego A.</div>
          <div className="avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Eventos y Actualizaciones</h2>
          <p className="subtitle">Mantente informado sobre las actividades ecológicas del campus</p>
        </div>

        <div className="toolbar">
          <div className="search-bar">
            <input placeholder="Buscar eventos o publicaciones..." />
          </div>
          <div className="filter-pills">
            {filters.map((f) => (
              <button key={f} className={`filter-pill ${activeFilter === f ? 'active' : ''}`} onClick={() => selectFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="events-grid">
          {pageEvents.length === 0 && <p className="no-results">No hay publicaciones de este tipo.</p>}
          {pageEvents.map((ev) => (
            <article key={ev.title} className={`event-card ${ev.typeClass}`}>
              <div className="card-top-bar" />
              <div className="card-body">
                <div className="tags-row">
                  <span className={`tag ${ev.typeClass}`}>{ev.type}</span>
                  <span className={`tag ${ev.statusClass}`}>{ev.status}</span>
                </div>

                <h3>{ev.title}</h3>

                <div className="meta">
                  <span className="meta-item">📅 {ev.date}</span>
                  {ev.location && <span className="meta-item">📍 {ev.location}</span>}
                </div>

                <hr className="divider" />

                <p className="description">{ev.description}</p>

                <button className="btn outline" onClick={() => setDetailEvent(ev)}>Ver más →</button>
              </div>
            </article>
          ))}
        </div>

        {filteredEvents.length > 0 && (
          <div className="pagination">
            <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}>← Anterior</a>
            <span className="page-count">Página {currentPage} de {totalPages}</span>
            <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}>Siguiente →</a>
          </div>
        )}
      </div>

      {detailEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{detailEvent.title}</h3>
              <button className="modal-close" onClick={() => setDetailEvent(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-field row">
                <span className={`tag ${detailEvent.typeClass}`}>{detailEvent.type}</span>
                <span className={`tag ${detailEvent.statusClass}`}>{detailEvent.status}</span>
              </div>

              <div className="modal-field">
                <span>Fecha</span>
                <p className="detail-text">📅 {detailEvent.date}</p>
              </div>

              {detailEvent.location && (
                <div className="modal-field">
                  <span>Ubicación</span>
                  <p className="detail-text">📍 {detailEvent.location}</p>
                </div>
              )}

              <div className="modal-field">
                <span>Descripción</span>
                <p className="detail-text">{detailEvent.description}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn primary" onClick={() => setDetailEvent(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
