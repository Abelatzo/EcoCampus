import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminEvents.scss'

const posts = [
  {
    type: 'Evento', typeClass: 'event', status: 'Próximo', statusClass: 'upcoming',
    title: 'Taller de reciclaje de PET',
    date: '28 de junio, 2026 · 10:00 AM', location: 'Edificio A — Aula 101',
    description: 'Aprende a clasificar y reutilizar botellas de PET. Actividad abierta a toda la comunidad universitaria.',
    published: true,
  },
  {
    type: 'Actualización', typeClass: 'update', status: 'Publicado', statusClass: 'published',
    title: 'Estado de botes malla — Semana 24',
    date: '20 de junio, 2026', location: null,
    description: 'Se realizó revisión semanal de los 18 botes malla del campus. 15 en estado disponible...',
    published: true,
  },
  {
    type: 'Evento', typeClass: 'event', status: 'Próximo', statusClass: 'upcoming',
    title: 'Día del Medio Ambiente UTCJ',
    date: '05 de julio, 2026 · 09:00 AM', location: 'Plaza principal del campus',
    description: 'Celebración institucional del Día Mundial del Medio Ambiente. Actividades de con...',
    published: true,
  },
  {
    type: 'Información', typeClass: 'info', status: 'Publicado', statusClass: 'published',
    title: 'Nueva zona de reciclaje — Acceso norte',
    date: '15 de junio, 2026', location: null,
    description: 'Se habilitó una nueva estación de reciclaje en el acceso norte del campus, con contenedores diferenciados para PET, cartón y residuos genera...',
    published: true,
  },
]

const filters = ['Todos', 'Eventos', 'Actualizaciones', 'Información']

export default function AdminEvents() {
  const [showModal, setShowModal] = useState(false) // Visibilidad al iniciar el modal de nueva publicacion xd
  const [postType, setPostType] = useState('Evento')

  return (
    <div className="events-app admin">
      <header className="topbar">
        <div className="left">
          <div className="logo">🌿 <span>EcoCampus</span></div>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <nav className="nav">
          <Link to="/admin" className="nav-item">Mapa</Link>
          <Link to="/admin/reports" className="nav-item">Reportes</Link>
          <Link to="/admin/events" className="nav-item active">Eventos</Link>
          <Link to="/admin/users" className="nav-item">Usuarios</Link>
          <Link to="/admin/panel" className="nav-item">Panel</Link>
        </nav>
        <div className="right">
          <div className="username">Admin</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Gestión de Eventos y Publicaciones</h2>
          <p className="subtitle">Publica, edita y elimina eventos, actualizaciones e información para la comunidad</p>
        </div>

        <div className="toolbar">
          <div className="search-bar">
            <input placeholder="Buscar publicaciones..." />
          </div>
          <div className="filter-pills">
            {filters.map((f, i) => (
              <button key={f} className={`filter-pill ${i === 0 ? 'active' : ''}`}>{f}</button>
            ))}
          </div>
          <button className="btn new-post" onClick={() => setShowModal(true)}>+ Nueva publicación</button>
        </div>

        <div className="posts-list">
          {posts.map((p) => (
            <article key={p.title} className={`post-row ${p.typeClass}`}>
              <div className="row-side" />
              <div className="row-content">
                <div className="tags-row">
                  <span className={`tag ${p.typeClass}`}>{p.type}</span>
                  <span className={`tag ${p.statusClass}`}>{p.status}</span>
                </div>
                <h3>{p.title}</h3>
                <div className="meta">
                  <span className="meta-item">📅 {p.date}</span>
                  {p.location && <span className="meta-item">📍 {p.location}</span>}
                </div>
                <p className="description">{p.description}</p>
              </div>
              <div className="row-actions">
                <button className="btn action preview">👁 Vista previa</button>
                <button className="btn action edit">✎ Editar</button>
                <button className={`btn action ${p.published ? 'unpublish' : 'publish'}`}>
                  {p.published ? '⛔ Ocultar' : '▶ Publicar'}
                </button>
                <button className="btn action delete">🗑</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nueva publicación</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Tipo de publicación</span>
                <div className="type-toggle">
                  {['Evento', 'Actualización', 'Información'].map((t) => (
                    <button
                      key={t}
                      className={`type-btn ${postType === t ? 'active' : ''}`}
                      onClick={() => setPostType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </label>

              <label className="modal-field">
                <span>Título</span>
                <input type="text" placeholder="Ej. Taller de reciclaje de PET..." />
              </label>

              <label className="modal-field row">
                <div className="modal-subfield">
                  <span>Fecha y lugar (opcional para eventos)</span>
                  <input type="text" placeholder="DD/MM/AAAA" />
                </div>
                <div className="modal-subfield">
                  <span className="invisible-label">Lugar</span>
                  <input type="text" placeholder="Lugar (opcional)" />
                </div>
              </label>

              <label className="modal-field">
                <span>Descripción / contenido</span>
                <textarea rows="4" placeholder="Escribe aquí el contenido de la publicación..." />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={() => setShowModal(false)}>Publicar ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
