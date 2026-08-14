import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminEvents.scss'

const initialPosts = [
  {
    id: 1,
    type: 'Evento', typeClass: 'event', status: 'Próximo', statusClass: 'upcoming',
    title: 'Taller de reciclaje de PET',
    date: '28 de junio, 2026 · 10:00 AM', location: 'Edificio A — Aula 101',
    description: 'Aprende a clasificar y reutilizar botellas de PET. Actividad abierta a toda la comunidad universitaria.',
  },
  {
    id: 2,
    type: 'Actualización', typeClass: 'update', status: 'Publicado', statusClass: 'published',
    title: 'Estado de botes malla — Semana 24',
    date: '20 de junio, 2026', location: null,
    description: 'Se realizó revisión semanal de los 18 botes malla del campus. 15 en estado disponible...',
  },
  {
    id: 3,
    type: 'Evento', typeClass: 'event', status: 'Próximo', statusClass: 'upcoming',
    title: 'Día del Medio Ambiente UTCJ',
    date: '05 de julio, 2026 · 09:00 AM', location: 'Plaza principal del campus',
    description: 'Celebración institucional del Día Mundial del Medio Ambiente. Actividades de con...',
  },
  {
    id: 4,
    type: 'Información', typeClass: 'info', status: 'Publicado', statusClass: 'published',
    title: 'Nueva zona de reciclaje — Acceso norte',
    date: '15 de junio, 2026', location: null,
    description: 'Se habilitó una nueva estación de reciclaje en el acceso norte del campus, con contenedores diferenciados para PET, cartón y residuos genera...',
  },
]

const typeInfo = {
  Evento: { typeClass: 'event', status: 'Próximo', statusClass: 'upcoming' },
  Actualización: { typeClass: 'update', status: 'Publicado', statusClass: 'published' },
  Información: { typeClass: 'info', status: 'Publicado', statusClass: 'published' },
}

const filterMap = { Todos: null, Eventos: 'event', Actualizaciones: 'update', Información: 'info' }
const filters = Object.keys(filterMap)
const PAGE_SIZE = 4

let nextId = 100

export default function AdminEvents() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const [postList, setPostList] = useState(initialPosts)
  const [showModal, setShowModal] = useState(false)
  const [postType, setPostType] = useState('Evento')
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const [activeFilter, setActiveFilter] = useState('Todos')
  const [page, setPage] = useState(1)

  const [detailPost, setDetailPost] = useState(null)
  const [editPost, setEditPost] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const selectFilter = (f) => {
    setActiveFilter(f)
    setPage(1)
  }

  const filteredPosts = filterMap[activeFilter]
    ? postList.filter((p) => p.typeClass === filterMap[activeFilter])
    : postList

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

  const createPost = () => {
    if (!newTitle.trim()) return
    const info = typeInfo[postType]
    nextId += 1
    setPostList((prev) => [{
      id: nextId,
      type: postType,
      ...info,
      title: newTitle.trim(),
      date: newDate.trim() || 'Fecha por definir',
      location: newLocation.trim() || null,
      description: newDescription.trim() || 'Sin descripción adicional.',
    }, ...prev])
    closeNewPostModal()
  }

  const openEdit = (post) => {
    setEditPost(post)
    setEditTitle(post.title)
    setEditDate(post.date)
    setEditLocation(post.location || '')
    setEditDescription(post.description)
  }

  const saveEdit = () => {
    setPostList((prev) => prev.map((p) => (
      p.id === editPost.id
        ? { ...p, title: editTitle, date: editDate, location: editLocation.trim() || null, description: editDescription }
        : p
    )))
    setEditPost(null)
  }

  const confirmDelete = () => {
    setPostList((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
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

        <div className="toolbar">
          <div className="search-bar">
            <input placeholder="Buscar publicaciones..." />
          </div>
          <div className="filter-pills">
            {filters.map((f) => (
              <button key={f} className={`filter-pill ${activeFilter === f ? 'active' : ''}`} onClick={() => selectFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="btn new-post" onClick={() => setShowModal(true)}>+ Nueva publicación</button>
        </div>

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

        {filteredPosts.length > 0 && (
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
                  <span>Fecha y lugar (opcional para eventos)</span>
                  <input type="text" placeholder="DD/MM/AAAA" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div className="modal-subfield">
                  <span className="invisible-label">Lugar</span>
                  <input type="text" placeholder="Lugar (opcional)" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                </div>
              </label>

              <label className="modal-field">
                <span>Descripción / contenido</span>
                <textarea rows="4" placeholder="Escribe aquí el contenido de la publicación..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={closeNewPostModal}>Cancelar</button>
              <button className="btn primary" onClick={createPost}>Publicar ahora</button>
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
                  <span>Fecha</span>
                  <input type="text" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
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
              <button className="btn outline" onClick={() => setEditPost(null)}>Cancelar</button>
              <button className="btn primary" onClick={saveEdit}>Guardar cambios</button>
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
              <button className="btn outline" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn danger" onClick={confirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
