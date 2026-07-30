import React from 'react'
import { Link } from 'react-router-dom'
import './AdminUsers.scss'

const users = [
  { name: 'Araiza López Diego A.', email: 'daraiza959@utcj.edu.mx', career: 'Desarrollo de Software', role: 'Usuario', date: '12/06/2026' },
  { name: 'Barraza Ramírez Abel A.', email: 'abelbarraza@utcj.edu.mx', career: 'Desarrollo de Software', role: 'Usuario', date: '12/06/2026' },
  { name: 'García Martínez Laura', email: 'lgarcia@utcj.edu.mx', career: 'Mecatrónica', role: 'Usuario', date: '13/06/2026' },
  { name: 'Torres Reyes Carlos', email: 'ctorres@utcj.edu.mx', career: 'Administración', role: 'Usuario', date: '14/06/2026' },
  { name: 'Ramírez Ochoa Patricia', email: 'prochoam@utcj.edu.mx', career: 'Desarrollo de Software', role: 'Administrador', date: '01/06/2026' },
  { name: 'López Vega Sofía', email: 'slopezv@utcj.edu.mx', career: 'Contabilidad', role: 'Usuario', date: '15/06/2026' },
  { name: 'Mendoza Cruz Hugo', email: 'hmendoza@utcj.edu.mx', career: 'Logística', role: 'Usuario', date: '16/06/2026' },
  { name: 'Soto Ibarra Valeria', email: 'vsoto@utcj.edu.mx', career: 'Mecatrónica', role: 'Usuario', date: '17/06/2026' },
]

export default function AdminUsers() {
  return (
    <div className="users-app admin">
      <header className="topbar">
        <div className="left">
          <div className="logo">🌿 <span>EcoCampus</span></div>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <nav className="nav">
          <Link to="/admin" className="nav-item">Mapa</Link>
          <Link to="/admin/reports" className="nav-item">Reportes</Link>
          <Link to="/admin/events" className="nav-item">Eventos</Link>
          <Link to="/admin/users" className="nav-item active">Usuarios</Link>
          <Link to="/admin/panel" className="nav-item">Panel</Link>
        </nav>
        <div className="right">
          <div className="username">Admin</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <h2>Gestión de Usuarios</h2>
          <p className="subtitle">Administra los usuarios registrados en EcoCampus</p>
        </div>

        <div className="toolbar">
          <div className="search-bar">
            <input placeholder="Buscar por nombre, correo o carrera..." />
          </div>
          <div className="role-select">
            <select defaultValue="Todos">
              <option>Todos</option>
              <option>Usuario</option>
              <option>Administrador</option>
            </select>
          </div>
          <span className="count">124 usuarios registrados</span>
          <button className="btn new-user">+ Agregar usuario</button>
        </div>

        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Nombre completo</th>
                <th>Correo institucional</th>
                <th>Carrera</th>
                <th>Rol</th>
                <th>Fecha registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.email}>
                  <td className="col-num">{i + 1}</td>
                  <td>{u.name}</td>
                  <td className="email-cell">{u.email}</td>
                  <td>{u.career}</td>
                  <td>
                    <span className={`role-pill ${u.role === 'Administrador' ? 'admin' : 'user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.date}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn action edit">✎ Editar</button>
                      <button className={`btn action ${u.role === 'Administrador' ? 'demote' : 'promote'}`}>
                        {u.role === 'Administrador' ? '→ Usuario' : '→ Admin'}
                      </button>
                      <button className="btn action delete">🗑 Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <a href="#" className="page-link">← Anterior</a>
          <span className="page-count">Página 1 de 11</span>
          <a href="#" className="page-link">Siguiente →</a>
        </div>
      </div>
    </div>
  )
}