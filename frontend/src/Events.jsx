import React from 'react'
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

const filters = ['Todos', 'Eventos', 'Actualizaciones', 'Información']

export default function Events() {
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
            {filters.map((f, i) => (
              <button key={f} className={`filter-pill ${i === 0 ? 'active' : ''}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="events-grid">
          {events.map((ev) => (
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

                <button className="btn outline">Ver más →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}