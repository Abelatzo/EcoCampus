import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import campusMap from './assets/ImagenMapa.jpeg'
import { useDraggableMap } from './useDraggableMap'
import { useReports } from './reportsStore'
import EdificioMarcadores from './EdificioMarcadores'
import { cerrarSesion } from './session'
import './MapView.scss'

const reportStates = [
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Disponible', type: 'resolved' },
  { label: 'Dañado', type: 'damaged' },
]

const statusDotClass = { pending: 'orange', 'in-progress': 'blue', resolved: 'green', damaged: 'red' }
// El filtro de "Estado del reporte" usa los tipos de reportes (pending/in-progress/
// resolved/damaged); el estado agregado del edificio (bote_mallas.estatus) usa otro
// vocabulario (pendiente/en_proceso/disponible/dañado). Mapeo entre ambos para poder
// filtrar los marcadores del mapa con el mismo checkbox.
const FILTER_TYPE_TO_ESTATUS = { pending: 'pendiente', 'in-progress': 'en_proceso', resolved: 'disponible', damaged: 'dañado' }
const MAX_ACTIVE_REPORTS = 6
const POLL_MS = 15000

export default function MapView() {
  const navigate = useNavigate()
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const { reports } = useReports()
  const { offset, containerRef, imageRef, onPointerDown, onPointerMove, onPointerUp } = useDraggableMap()
  const [statusDraft, setStatusDraft] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [edificios, setEdificios] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const token = sessionStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    let activo = true
    const fetchMapa = async () => {
      try {
        const res = await fetch(`${API}/api/reportes/mapa`, { headers })
        if (!res.ok) return
        const data = await res.json()
        if (activo) setEdificios(Array.isArray(data) ? data : [])
      } catch {
        // el proximo poll reintenta
      }
    }
    queueMicrotask(fetchMapa)
    const interval = setInterval(fetchMapa, POLL_MS)
    return () => { activo = false; clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleStatus = (type) => {
    setStatusDraft((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const activeReports = reports.filter((r) => r.statusType !== 'resolved')
  const filteredReports = (statusFilter.length === 0
    ? activeReports
    : activeReports.filter((r) => statusFilter.includes(r.statusType))
  ).filter((r) =>
    normalizedSearch === '' ||
    r.title.toLowerCase().includes(normalizedSearch) ||
    (r.building || '').toLowerCase().includes(normalizedSearch)
  ).slice(0, MAX_ACTIVE_REPORTS)

  // bote_mallas.estatus es un agregado (dañado > pendiente > en_proceso >
  // disponible) del edificio completo, pero al filtrar el usuario espera ver
  // el edificio si CUALQUIERA de sus reportes coincide con el filtro, no solo
  // si el agregado (el peor caso) coincide -- ej: un edificio con un reporte
  // pendiente y uno en_proceso muestra el agregado "pendiente", pero debe
  // seguir apareciendo si se filtra por "en proceso".
  const statusFilterEstatus = statusFilter.map((t) => FILTER_TYPE_TO_ESTATUS[t] || t)
  const edificioCoincideFiltro = (e) =>
    statusFilterEstatus.length === 0 ||
    statusFilterEstatus.includes(e.estatus) ||
    e.reportes.some((r) => statusFilterEstatus.includes(r.estatus))
  const edificiosVisibles = edificios
    .filter(edificioCoincideFiltro)
    .filter((e) =>
      normalizedSearch === '' ||
      (e.letra || '').toLowerCase().includes(normalizedSearch) ||
      e.reportes.some((r) => r.titulo.toLowerCase().includes(normalizedSearch))
    )

  const edificiosConAlerta = edificios.filter((e) => e.estatus !== 'disponible').length

  return (
    <div className="map-app">
      <header className="topbar">
        <div className="left">
          <div className="logo">🌿 <span>EcoCampus</span></div>
        </div>
        <nav className="nav">
          <Link to="/map" className="nav-item active">Mapa</Link>
          <Link to="/reports" className="nav-item">Reportes</Link>
          <Link to="/events" className="nav-item">Eventos</Link>
        </nav>
        <button className="right user-menu" onClick={() => cerrarSesion(navigate)} title="Cerrar sesión">
          <div className="username">{usuario?.nombre || 'Usuario'}</div>
          <div className="avatar" aria-hidden="true" />
        </button>
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
        </aside>

        <main className="map-area">
          <div className="map-search">
            <input
              placeholder="Buscar edificio o punto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="map-canvas" ref={containerRef} role="img" aria-label="Mapa interactivo del campus">
            <div
              className="map-layer"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img ref={imageRef} src={campusMap} className="map-image" alt="" draggable={false} />
              <EdificioMarcadores edificios={edificiosVisibles} />
            </div>
          </div>

          <div className="bottom-bar">
            <div className="legend">
              <span>Leyenda:</span>
              <span className="dot green" /> Disponible
              <span className="dot orange" /> Pendiente
              <span className="dot blue" /> En proceso
              <span className="dot red" /> Dañado
            </div>
            <div className="stats">Edificios con alerta: {edificiosConAlerta} &nbsp;|&nbsp; Reportes activos: {activeReports.length}</div>
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
    </div>
  )
}
