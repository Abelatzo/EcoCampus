import { useState } from 'react'
import { Link } from 'react-router-dom'
import campusMap from './assets/ImagenMapa.jpeg'
import { useDraggableBackground } from './useDraggableBackground'
import { useReports } from './reportsStore'
import './AdminMapView.scss'

const reportStates = [
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Disponible', type: 'resolved' },
  { label: 'Dañado', type: 'damaged' },
]

const statusDotClass = { pending: 'orange', 'in-progress': 'blue', resolved: 'green', damaged: 'red' }
const MAX_ACTIVE_REPORTS = 6

const buildingLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Q',
]

const pointStates = [
  { label: 'Disponible', type: 'resolved' },
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Dañado', type: 'damaged' },
]

const initialPoints = [
  { id: 1, name: 'Bote malla C3', building: 'C', status: 'Disponible', statusType: 'resolved' },
]

export default function AdminMapView() {
  const { reports } = useReports()
  const { position, onPointerDown, onPointerMove, onPointerUp } = useDraggableBackground()
  const [statusDraft, setStatusDraft] = useState([])
  const [statusFilter, setStatusFilter] = useState([])

  const [points, setPoints] = useState(initialPoints)

  const [editing, setEditing] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editBuilding, setEditBuilding] = useState('')
  const [editStatus, setEditStatus] = useState('resolved')

  const [showAddPoint, setShowAddPoint] = useState(false)
  const [newPointName, setNewPointName] = useState('')
  const [newPointBuilding, setNewPointBuilding] = useState(buildingLetters[0])
  const [newPointStatus, setNewPointStatus] = useState('resolved')

  const [showDeletePoints, setShowDeletePoints] = useState(false)
  const [pointToDelete, setPointToDelete] = useState(null)

  const toggleStatus = (type) => {
    setStatusDraft((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const activeReports = reports.filter((r) => r.statusType !== 'resolved')
  const filteredReports = (statusFilter.length === 0
    ? activeReports
    : activeReports.filter((r) => statusFilter.includes(r.statusType))
  ).slice(0, MAX_ACTIVE_REPORTS)

  const selectPointToEdit = (point) => {
    setSelectedPointId(point.id)
    setEditName(point.name)
    setEditBuilding(point.building)
    setEditStatus(point.statusType)
  }

  const openEditPoints = () => {
    if (points.length === 0) return
    selectPointToEdit(points[0])
    setEditing(true)
  }

  const saveEditedPoint = () => {
    const state = pointStates.find((s) => s.type === editStatus)
    setPoints((prev) => prev.map((p) => (
      p.id === selectedPointId ? { ...p, name: editName, building: editBuilding, status: state.label, statusType: state.type } : p
    )))
    setEditing(false)
  }

  const resetAddPointForm = () => {
    setNewPointName('')
    setNewPointBuilding(buildingLetters[0])
    setNewPointStatus('resolved')
  }

  const closeAddPoint = () => {
    setShowAddPoint(false)
    resetAddPointForm()
  }

  const createPoint = () => {
    if (!newPointName.trim()) return
    const state = pointStates.find((s) => s.type === newPointStatus)
    setPoints((prev) => [...prev, {
      id: Date.now(),
      name: newPointName.trim(),
      building: newPointBuilding,
      status: state.label,
      statusType: state.type,
    }])
    closeAddPoint()
  }

  const confirmDeletePoint = () => {
    setPoints((prev) => prev.filter((p) => p.id !== pointToDelete.id))
    setPointToDelete(null)
  }

  return (
    <div className="map-app admin">
      <header className="topbar">
        <div className="left">
          <div className="logo">🌿 <span>EcoCampus</span></div>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <nav className="nav">
          <Link to="/admin" className="nav-item active">Mapa</Link>
          <Link to="/admin/reports" className="nav-item">Reportes</Link>
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
          <h3>Filtros</h3>

          <div className="filter-group">
            <div className="filter-title">Estado del reporte</div>
            {reportStates.map((s) => (
              <label key={s.type} className="checkbox">
                <input type="checkbox" checked={statusDraft.includes(s.type)} onChange={() => toggleStatus(s.type)} /> {s.label}
              </label>
            ))}
          </div>

          <button className="btn apply" onClick={() => setStatusFilter(statusDraft)}>Aplicar filtros</button>

          <div className="admin-tools">
            <div className="admin-tools-title">⚙ Herramientas Admin</div>
            <button className="btn tool edit" onClick={openEditPoints}>✎ Editar punto ecológico</button>
            <button className="btn tool add" onClick={() => setShowAddPoint(true)}>+ Agregar nuevo punto</button>
            <button className="btn tool delete" onClick={() => setShowDeletePoints(true)}>🗑 Eliminar punto</button>
          </div>
        </aside>

        <main className="map-area">
          <div className="map-search">
            <input placeholder="Buscar edificio o punto..." />
          </div>

          <div className="map-canvas" role="img" aria-label="Mapa interactivo del campus">
            <div
              className="map-bg"
              style={{ backgroundImage: `url(${campusMap})`, backgroundPosition: `${position.x}% ${position.y}%` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />

            {editing && (
              <div className="popup edit" style={{left:'55%', top:'27%'}}>
                <div className="popup-title edit-title">✎ Editar punto ecológico</div>

                {points.length > 1 && (
                  <label className="form-field">
                    <span>Punto:</span>
                    <select
                      value={selectedPointId ?? ''}
                      onChange={(e) => {
                        const point = points.find((p) => p.id === Number(e.target.value))
                        if (point) selectPointToEdit(point)
                      }}
                    >
                      {points.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · Edif. {p.building}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="form-field">
                  <span>Nombre:</span>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Edificio:</span>
                  <select value={editBuilding} onChange={(e) => setEditBuilding(e.target.value)}>
                    {buildingLetters.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>

                <label className="form-field">
                  <span>Estado:</span>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    {pointStates.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
                  </select>
                </label>

                <div className="popup-actions">
                  <button className="btn small" onClick={saveEditedPoint}>Guardar</button>
                  <button className="btn small outline" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            )}

          </div>

          <div className="bottom-bar">
            <div className="legend">
              <span>Leyenda:</span>
              <span className="dot green" /> Disponible
              <span className="dot orange" /> Pendiente
              <span className="dot blue" /> En proceso
              <span className="dot red" /> Dañado
            </div>
            <div className="stats">Activos: 15 &nbsp;|&nbsp; Reportes abiertos: {activeReports.length}</div>
          </div>
        </main>

        <aside className="sidebar right">
          <h4>Reportes activos</h4>
          <ul className="near-list">
            {filteredReports.map((r) => (
              <li key={r.id} className={`status-${statusDotClass[r.statusType]}`}>
                <div className="text">
                  <div className="title">{r.title} · Edif. {r.building}</div>
                  <div className="status">{r.status}</div>
                </div>
              </li>
            ))}
            {filteredReports.length === 0 && <li className="empty">Sin reportes con ese estado.</li>}
          </ul>
        </aside>
      </div>

      {showAddPoint && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Agregar nuevo punto</h3>
              <button className="modal-close" onClick={closeAddPoint}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Edificio</span>
                <div className="type-toggle">
                  {buildingLetters.map((b) => (
                    <button
                      key={b}
                      className={`type-btn ${newPointBuilding === b ? 'active' : ''}`}
                      onClick={() => setNewPointBuilding(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </label>

              <label className="modal-field">
                <span>Nombre del punto</span>
                <input type="text" placeholder="Ej. Bote malla D2" value={newPointName} onChange={(e) => setNewPointName(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Estado inicial</span>
                <div className="type-toggle">
                  {pointStates.map((s) => (
                    <button
                      key={s.type}
                      className={`type-btn ${newPointStatus === s.type ? 'active' : ''}`}
                      onClick={() => setNewPointStatus(s.type)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={closeAddPoint}>Cancelar</button>
              <button className="btn primary" onClick={createPoint}>Agregar punto</button>
            </div>
          </div>
        </div>
      )}

      {showDeletePoints && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar punto</h3>
              <button className="modal-close" onClick={() => setShowDeletePoints(false)}>✕</button>
            </div>

            <div className="modal-body">
              {points.length === 0 && <p className="no-results">No hay puntos ecológicos registrados.</p>}
              {points.map((p) => (
                <div key={p.id} className="point-row">
                  <span>{p.name} · Edif. {p.building}</span>
                  <button className="btn danger" onClick={() => setPointToDelete(p)}>🗑 Eliminar</button>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setShowDeletePoints(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {pointToDelete && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>Eliminar punto ecológico</h3>
              <button className="modal-close" onClick={() => setPointToDelete(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="confirm-text">
                ¿Seguro que quieres eliminar el punto <strong>"{pointToDelete.name}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setPointToDelete(null)}>Cancelar</button>
              <button className="btn danger" onClick={confirmDeletePoint}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
