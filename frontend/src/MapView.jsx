import { Link } from 'react-router-dom'
import campusMap from './assets/ImagenMapa.jpeg'
import { useDraggableBackground } from './useDraggableBackground'
import './MapView.scss'

export default function MapView() {
  const { position, onPointerDown, onPointerMove, onPointerUp } = useDraggableBackground()

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
        <div className="right">
          <div className="username">Diego A.</div>
          <div className="avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="container">
        <aside className="sidebar left">
          <h3>Filtros</h3>

          <div className="filter-group">
            <div className="filter-title">Tipo de punto</div>
            <label className="checkbox"><input type="checkbox" defaultChecked /> Todos</label>
            <label className="checkbox"><input type="checkbox" /> Botes malla (PET)</label>
            <label className="checkbox"><input type="checkbox" /> Contenedor externo</label>
            <label className="checkbox"><input type="checkbox" /> Punto de reciclaje</label>
          </div>

          <div className="filter-group">
            <div className="filter-title">Estado del reporte</div>
            <label className="checkbox"><input type="checkbox" /> Pendiente</label>
            <label className="checkbox"><input type="checkbox" /> En proceso</label>
            <label className="checkbox"><input type="checkbox" /> Resuelto</label>
          </div>

          <button className="btn apply">Aplicar filtros</button>
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

            {/* Example popup */}
            <div className="popup" style={{left:'55%', top:'27%'}}>
              <div className="popup-title">Bote malla — Edificio C</div>
              <div className="popup-body">Estado: Disponible<br/>Último reporte: hace 3h</div>
              <div className="popup-actions">
                <button className="btn small">Reportar</button>
                <button className="btn small outline">Ver reportes</button>
              </div>
            </div>

          </div>

          <div className="bottom-bar">
            <div className="legend">
              <span>Leyenda:</span>
              <span className="dot green" /> Disponible
              <span className="dot orange" /> Pendiente
              <span className="dot blue" /> En proceso
            </div>
            <div className="stats">Total de puntos ecológicos: 18 &nbsp;|&nbsp; Reportes activos: 4 &nbsp;|&nbsp; Resueltos hoy: 2</div>
          </div>
        </main>

        <aside className="sidebar right">
          <h4>Puntos cercanos</h4>
          <ul className="near-list">
            <li className="status-green">
              <div className="text">
                <div className="title">Bote A1 · Edif. A</div>
                <div className="status">Disponible</div>
              </div>
            </li>
            <li className="status-orange">
              <div className="text">
                <div className="title">Bote C3 · Edif. C</div>
                <div className="status">Lleno</div>
              </div>
            </li>
            <li className="status-green">
              <div className="text">
                <div className="title">Contenedor · Acc.</div>
                <div className="status">Disponible</div>
              </div>
            </li>
            <li className="status-blue">
              <div className="text">
                <div className="title">Bote B2 · Edif. B</div>
                <div className="status">En revisión</div>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  )
}