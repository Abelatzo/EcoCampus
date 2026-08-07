import { useState } from 'react'
import { Link } from 'react-router-dom'
import campusMap from './assets/ImagenMapa.jpeg'
import { useDraggableBackground } from './useDraggableBackground'
import './AdminMapView.scss'

export default function AdminMapView() {
  const [editing, setEditing] = useState(true)
  const { position, onPointerDown, onPointerMove, onPointerUp } = useDraggableBackground()

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

          <div className="admin-tools">
            <div className="admin-tools-title">⚙ Herramientas Admin</div>
            <button className="btn tool edit">✎ Editar punto ecológico</button>
            <button className="btn tool add">+ Agregar nuevo punto</button>
            <button className="btn tool delete">🗑 Eliminar punto</button>
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
                <div className="popup-title edit-title">✎ Editar punto · Edif. C</div>

                <label className="form-field">
                  <span>Nombre:</span>
                  <input type="text" placeholder="Bote malla C3" />
                </label>

                <label className="form-field">
                  <span>Estado:</span>
                  <select defaultValue="Disponible">
                    <option>Disponible</option>
                    <option>Pendiente/Lleno</option>
                    <option>En proceso</option>
                    <option>Dañado</option>
                  </select>
                </label>

                <div className="popup-actions">
                  <button className="btn small" onClick={() => setEditing(false)}>Guardar</button>
                  <button className="btn small outline" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            )}

          </div>

          <div className="bottom-bar">
            <div className="legend">
              <span>Leyenda:</span>
              <span className="dot green" /> Disponible
              <span className="dot orange" /> Pendiente/Lleno
              <span className="dot blue" /> En proceso
              <span className="dot red" /> Dañado
            </div>
            <div className="stats">Total 18 puntos &nbsp;|&nbsp; Activos: 15 &nbsp;|&nbsp; Con incidencia: 3 &nbsp;|&nbsp; Reportes abiertos: 4</div>
          </div>
        </main>

        <aside className="sidebar right">
          <h4>Puntos cercanos</h4>
          <ul className="near-list">
            <li className="status-green">
              <div className="text">
                <div className="title">Bote A1 · Edif. A</div>
                <div className="status">Disponible</div>
                <a href="#" className="edit-link">✎ Editar</a>
              </div>
            </li>
            <li className="status-orange">
              <div className="text">
                <div className="title">Bote C3 · Edif. C</div>
                <div className="status">Lleno</div>
                <a href="#" className="edit-link">✎ Editar</a>
              </div>
            </li>
            <li className="status-green">
              <div className="text">
                <div className="title">Contenedor · Acc.</div>
                <div className="status">Disponible</div>
                <a href="#" className="edit-link">✎ Editar</a>
              </div>
            </li>
            <li className="status-red">
              <div className="text">
                <div className="title">Bote D1 · Edif. D</div>
                <div className="status">Dañado</div>
                <a href="#" className="edit-link">✎ Editar</a>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  )
}