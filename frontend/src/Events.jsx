import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Events.scss'

// Mapea el "tipo" que manda el backend (evento | actualizacion | informacion)
// a las etiquetas/clases que ya usa la UI (Evento | Actualización | Información)
const typeInfo = {
  evento: { type: 'Evento', typeClass: 'event' },
  actualizacion: { type: 'Actualización', typeClass: 'update' },
  informacion: { type: 'Información', typeClass: 'info' },
}

const filterMap = { Todos: null, Eventos: 'event', Actualizaciones: 'update', Información: 'info' }
const filters = Object.keys(filterMap)
const PAGE_SIZE = 4

// Convierte el registro que manda el backend a la forma que ya consume la UI
function mapEvento(e) {
  const info = typeInfo[e.tipo] || { type: e.tipo, typeClass: 'info' }
  return {
    id: e.id,
    type: info.type,
    typeClass: info.typeClass,
    status: e.publicado ? 'Publicado' : 'Oculto',
    statusClass: e.publicado ? 'published' : 'hidden',
    title: e.titulo,
    date: e.fecha_evento
      ? new Date(e.fecha_evento).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
      : 'Fecha por definir',
    location: e.lugar || null,
    description: e.descripcion || 'Sin descripción adicional.',
  }
}

export default function Events() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [activeFilter, setActiveFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailEvent, setDetailEvent] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchEventos()
  }, [])

  const fetchEventos = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/eventos`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setEvents(Array.isArray(data) ? data.map(mapEvento) : [])
    } catch (err) {
      setErrorMsg('No se pudieron cargar las publicaciones: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectFilter = (f) => {
    setActiveFilter(f)
    setPage(1)
  }

  let filteredEvents = filterMap[activeFilter]
    ? events.filter((ev) => ev.typeClass === filterMap[activeFilter])
    : events

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filteredEvents = filteredEvents.filter((ev) =>
      ev.title.toLowerCase().includes(q) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.date && ev.date.toLowerCase().includes(q)) ||
      (ev.type && ev.type.toLowerCase().includes(q))
    )
  }

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
          <div className="username">{usuario?.nombre || 'Usuario'}</div>
          <div className="avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Eventos y Actualizaciones</h2>
          <p className="subtitle">Mantente informado sobre las actividades ecológicas del campus</p>
        </div>

        {errorMsg && <p className="error-banner">{errorMsg}</p>}

        <div className="toolbar">
          <div className="search-bar">
            <input
              placeholder="Buscar eventos o publicaciones..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            />
          </div>
          <div className="filter-pills">
            {filters.map((f) => (
              <button key={f} className={`filter-pill ${activeFilter === f ? 'active' : ''}`} onClick={() => selectFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {loading && <p className="loading-text">Cargando publicaciones...</p>}

        {!loading && (
          <div className="events-grid">
            {pageEvents.length === 0 && <p className="no-results">No hay publicaciones de este tipo.</p>}
            {pageEvents.map((ev) => (
              <article key={ev.id} className={`event-card ${ev.typeClass}`}>
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
        )}

        {!loading && filteredEvents.length > 0 && (
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