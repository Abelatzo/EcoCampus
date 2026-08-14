import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AdminEvents.scss'


const typeInfo = {
  evento: { type: 'Evento', typeClass: 'event' },
  actualizacion: { type: 'Actualización', typeClass: 'update' },
  informacion: { type: 'Información', typeClass: 'info' },
}
// Mapa inverso: de la etiqueta de UI al valor que espera el backend
const typeToBackend = {
  Evento: 'evento',
  'Actualización': 'actualizacion',
  'Información': 'informacion',
}

const filterMap = { Todos: null, Eventos: 'event', Actualizaciones: 'update', Información: 'info' }
const filters = Object.keys(filterMap)
const PAGE_SIZE = 4

// Convierte el registro que manda el backend a la forma que ya consume la UI
function mapEvento(e) {
  const info = typeInfo[e.tipo] || { type: e.tipo, typeClass: 'info' }
  return {
    id: e.id,
    tipo: e.tipo, // valor crudo del backend, lo necesitamos para editar/crear
    type: info.type,
    typeClass: info.typeClass,
    status: e.publicado ? 'Publicado' : 'Oculto',
    statusClass: e.publicado ? 'published' : 'hidden',
    publicado: e.publicado,
    title: e.titulo,
    fecha_evento: e.fecha_evento, // ISO crudo, lo necesitamos para precargar el datetime-local al editar
    date: e.fecha_evento
      ? new Date(e.fecha_evento).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
      : 'Fecha por definir',
    location: e.lugar || null,
    description: e.descripcion || 'Sin descripción adicional.',
  }
}

// Convierte un valor de <input type="datetime-local"> (ej. "2026-06-28T10:00")
// al ISO completo que exige el backend (ej. "2026-06-28T10:00:00Z")
function toISO(localDateTimeValue) {
  if (!localDateTimeValue) return null
  const d = new Date(localDateTimeValue)
  if (isNaN(d)) return null
  return d.toISOString()
}

// Convierte un ISO del backend al formato que espera <input type="datetime-local">
function toDatetimeLocal(isoValue) {
  if (!isoValue) return ''
  const d = new Date(isoValue)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminEvents() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const [postList, setPostList] = useState(initialPosts)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const [postList, setPostList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [postType, setPostType] = useState('Evento')
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const [activeFilter, setActiveFilter] = useState('Todos')
  const [page, setPage] = useState(1)

  const [searchQuery, setSearchQuery] = useState('')
  const [detailPost, setDetailPost] = useState(null)
  const [editPost, setEditPost] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

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
      setPostList(Array.isArray(data) ? data.map(mapEvento) : [])
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

  let filteredPosts = filterMap[activeFilter]
    ? postList.filter((p) => p.typeClass === filterMap[activeFilter])
    : postList

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filteredPosts = filteredPosts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.date && p.date.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    )
  }

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagePosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const resetNewPostForm = () => {
    setPostType('Evento')
    setNewTitle('')
    setNewDate('')
    setNewLocation('')
    setNewDescription('')
  }

  const closeNewPostModal = () => {
    setShowModal(false)
    resetNewPostForm()
  }

  const createPost = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    setErrorMsg('')
    try {
      const body = {
        tipo: typeToBackend[postType],
        titulo: newTitle.trim(),
        fecha_evento: toISO(newDate),
        lugar: newLocation.trim() || null,
        descripcion: newDescription.trim() || null,
        publicado: true,
      }
      const res = await fetch(`${API}/api/eventos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const created = await res.json()
      setPostList((prev) => [mapEvento(created), ...prev])
      closeNewPostModal()
    } catch (err) {
      setErrorMsg('No se pudo crear la publicación: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (post) => {
    setEditPost(post)
    setEditTitle(post.title)
    setEditDate(toDatetimeLocal(post.fecha_evento))
    setEditLocation(post.location || '')
    setEditDescription(post.description)
  }

  const saveEdit = async () => {
    if (!editPost) return
    setSaving(true)
    setErrorMsg('')
    try {
      const body = {
        titulo: editTitle.trim(),
        fecha_evento: toISO(editDate),
        lugar: editLocation.trim() || null,
        descripcion: editDescription.trim() || null,
      }
      const res = await fetch(`${API}/api/eventos/${editPost.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      await fetchEventos()
      setEditPost(null)
    } catch (err) {
      setErrorMsg('No se pudo guardar la edición: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/eventos/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      setPostList((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setErrorMsg('No se pudo eliminar la publicación: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

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
          <div className="username">{usuario?.nombre || 'Admin'}</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Gestión de Eventos y Publicaciones</h2>
          <p className="subtitle">Publica, edita y elimina eventos, actualizaciones e información para la comunidad</p>
        </div>

        {errorMsg && <p className="error-banner">{errorMsg}</p>}

        <div className="toolbar">
          <div className="search-bar">
            <input
              placeholder="Buscar publicaciones..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            />
          </div>
          <div className="filter-pills">
            {filters.map((f) => (
              <button key={f} className={`filter-pill ${activeFilter === f ? 'active' : ''}`} onClick={() => selectFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="btn new-post" onClick={() => setShowModal(true)}>+ Nueva publicación</button>
        </div>

        {loading && <p className="loading-text">Cargando publicaciones...</p>}

        {!loading && (
          <div className="posts-list">
            {pagePosts.length === 0 && <p className="no-results">No hay publicaciones de este tipo.</p>}
            {pagePosts.map((p) => (
              <article key={p.id} className={`post-row ${p.typeClass}`}>
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
                  <button className="btn action preview" onClick={() => setDetailPost(p)}>Ver más</button>
                  <button className="btn action edit" onClick={() => openEdit(p)}>✎ Editar</button>
                  <button className="btn action delete" onClick={() => setDeleteTarget(p)}>🗑 Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredPosts.length > 0 && (
          <div className="pagination">
            <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}>← Anterior</a>
            <span className="page-count">Página {currentPage} de {totalPages}</span>
            <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}>Siguiente →</a>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nueva publicación</h3>
              <button className="modal-close" onClick={closeNewPostModal}>✕</button>
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
                <input type="text" placeholder="Ej. Taller de reciclaje de PET..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </label>

              <label className="modal-field row">
                <div className="modal-subfield">
                  <span>Fecha y hora (opcional para eventos)</span>
                  <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div className="modal-subfield">
                  <span>Lugar (opcional)</span>
                  <input type="text" placeholder="Lugar (opcional)" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                </div>
              </label>

              <label className="modal-field">
                <span>Descripción / contenido</span>
                <textarea rows="4" placeholder="Escribe aquí el contenido de la publicación..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={closeNewPostModal} disabled={saving}>Cancelar</button>
              <button className="btn primary" onClick={createPost} disabled={saving}>{saving ? 'Publicando...' : 'Publicar ahora'}</button>
            </div>
          </div>
        </div>
      )}

      {detailPost && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{detailPost.title}</h3>
              <button className="modal-close" onClick={() => setDetailPost(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-field row">
                <span className={`tag ${detailPost.typeClass}`}>{detailPost.type}</span>
                <span className={`tag ${detailPost.statusClass}`}>{detailPost.status}</span>
              </div>

              <div className="modal-field">
                <span>Fecha</span>
                <p className="detail-text">📅 {detailPost.date}</p>
              </div>

              {detailPost.location && (
                <div className="modal-field">
                  <span>Ubicación</span>
                  <p className="detail-text">📍 {detailPost.location}</p>
                </div>
              )}

              <div className="modal-field">
                <span>Descripción</span>
                <p className="detail-text">{detailPost.description}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn primary" onClick={() => setDetailPost(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {editPost && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar publicación</h3>
              <button className="modal-close" onClick={() => setEditPost(null)}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Título</span>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </label>

              <label className="modal-field row">
                <div className="modal-subfield">
                  <span>Fecha y hora</span>
                  <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="modal-subfield">
                  <span>Lugar (opcional)</span>
                  <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                </div>
              </label>

              <label className="modal-field">
                <span>Descripción / contenido</span>
                <textarea rows="4" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setEditPost(null)} disabled={saving}>Cancelar</button>
              <button className="btn primary" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>Eliminar publicación</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="confirm-text">
                ¿Seguro que quieres eliminar la publicación <strong>"{deleteTarget.title}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancelar</button>
              <button className="btn danger" onClick={confirmDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}