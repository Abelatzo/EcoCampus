import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import campusMap from './assets/ImagenMapa.jpeg'
import { useDraggableMap } from './useDraggableMap'
import { useReports } from './reportsStore'
import EdificioMarcadores from './EdificioMarcadores'
import { cerrarSesion } from './session'
import './AdminMapView.scss'

const reportStates = [
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Disponible', type: 'resolved' },
  { label: 'Dañado', type: 'damaged' },
]

const statusDotClass = { pending: 'orange', 'in-progress': 'blue', resolved: 'green', damaged: 'red' }
const MAX_ACTIVE_REPORTS = 6
const POLL_MS = 15000

export default function AdminMapView() {
  const navigate = useNavigate()
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const { reports } = useReports()
  const { offset, containerRef, imageRef, onPointerDown, onPointerMove, onPointerUp, clientToImagePercent } = useDraggableMap()
  const [statusDraft, setStatusDraft] = useState([])
  const [statusFilter, setStatusFilter] = useState([])

  const [mapaData, setMapaData] = useState([])
  const [edificios, setEdificios] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [marcando, setMarcando] = useState(false)
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const token = sessionStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchEdificios = async () => {
    const res = await fetch(`${API}/api/edificios`, { headers })
    if (!res.ok) throw new Error('No se pudieron cargar los edificios')
    setEdificios(await res.json())
  }

  const fetchMapa = async () => {
    const res = await fetch(`${API}/api/reportes/mapa`, { headers })
    if (!res.ok) throw new Error('No se pudo cargar el estado del mapa')
    setMapaData(await res.json())
  }

  const cargarTodo = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      await Promise.all([fetchEdificios(), fetchMapa()])
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    queueMicrotask(cargarTodo)
    const interval = setInterval(() => { fetchMapa().catch(() => {}) }, POLL_MS)
    return () => clearInterval(interval)
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

  // En modo "marcando" no se filtra por busqueda: el admin necesita ver
  // todos los edificios ya marcados para no volver a marcar uno encima.
  const mapaDataVisible = marcando || normalizedSearch === ''
    ? mapaData
    : mapaData.filter((e) =>
        (e.letra || '').toLowerCase().includes(normalizedSearch) ||
        e.reportes.some((r) => r.titulo.toLowerCase().includes(normalizedSearch))
      )

  const toggleMarcando = () => {
    setMarcando((prev) => !prev)
    setEdificioSeleccionado('')
    setMensaje('')
  }

  const onMapLayerClick = async (e) => {
    if (!marcando || !edificioSeleccionado) return
    const pos = clientToImagePercent(e.clientX, e.clientY)
    if (!pos) return

    setMensaje('Guardando posición...')
    try {
      const res = await fetch(`${API}/api/edificios/${edificioSeleccionado}/posicion`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ pos_x: pos.x, pos_y: pos.y }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const actualizado = await res.json()
      setEdificios((prev) => prev.map((ed) => (ed.id === actualizado.id ? actualizado : ed)))
      const letra = edificios.find((ed) => ed.id === edificioSeleccionado)?.letra
      setMensaje(`Edificio ${letra} marcado ✓`)
      setEdificioSeleccionado('')
      fetchMapa().catch(() => {})
    } catch (err) {
      setMensaje('')
      setErrorMsg('No se pudo guardar la posición: ' + err.message)
    }
  }

  const edificiosOrdenados = [...edificios].sort((a, b) => a.letra.localeCompare(b.letra))
  const marcadosCount = edificios.filter((e) => e.pos_x != null && e.pos_y != null).length
  const edificiosConAlerta = mapaData.filter((e) => e.estatus !== 'disponible').length

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
        <button className="right user-menu" onClick={() => cerrarSesion(navigate)} title="Cerrar sesión">
          <div className="username">{usuario?.nombre || 'Admin'}</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </button>
      </header>

      {errorMsg && <p className="no-results" style={{ color: 'var(--red, #d9362e)', padding: '8px 24px' }}>{errorMsg}</p>}

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
            <button className={`btn tool ${marcando ? 'active-tool' : 'edit'}`} onClick={toggleMarcando}>
              📍 {marcando ? 'Cancelar marcado' : 'Marcar edificio'}
            </button>
            <div className="marker-progress">{marcadosCount} / {edificios.length} edificios marcados</div>

            {marcando && (
              <div className="mark-panel">
                <label className="form-field">
                  <span>Edificio a ubicar:</span>
                  <select value={edificioSeleccionado} onChange={(e) => setEdificioSeleccionado(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {edificiosOrdenados.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.letra} {ed.pos_x != null ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {edificioSeleccionado
                  ? <p className="mark-hint">Haz clic sobre el mapa en el punto exacto del edificio.</p>
                  : <p className="mark-hint">Elige un edificio de la lista.</p>}
                {mensaje && <p className="mark-msg">{mensaje}</p>}
              </div>
            )}
          </div>
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
              className={`map-layer ${marcando && edificioSeleccionado ? 'marking' : ''}`}
              style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onClick={onMapLayerClick}
            >
              <img ref={imageRef} src={campusMap} className="map-image" alt="" draggable={false} />
              <EdificioMarcadores edificios={mapaDataVisible} />
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
            <div className="stats">{loading ? 'Cargando...' : `Edificios con alerta: ${edificiosConAlerta} | Reportes activos: ${activeReports.length}`}</div>
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
