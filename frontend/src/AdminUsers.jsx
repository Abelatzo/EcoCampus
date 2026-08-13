import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminUsers.scss'

const initialUsers = [
  { id: 1, name: 'Araiza López Diego A.', email: 'daraiza959@utcj.edu.mx', role: 'Usuario', date: '12/06/2026' },
  { id: 2, name: 'Barraza Ramírez Abel A.', email: 'abelbarraza@utcj.edu.mx', role: 'Usuario', date: '12/06/2026' },
  { id: 3, name: 'García Martínez Laura', email: 'lgarcia@utcj.edu.mx', role: 'Usuario', date: '13/06/2026' },
  { id: 4, name: 'Torres Reyes Carlos', email: 'ctorres@utcj.edu.mx', role: 'Usuario', date: '14/06/2026' },
  { id: 5, name: 'Ramírez Ochoa Patricia', email: 'prochoam@utcj.edu.mx', role: 'Administrador', date: '01/06/2026' },
  { id: 6, name: 'López Vega Sofía', email: 'slopezv@utcj.edu.mx', role: 'Usuario', date: '15/06/2026' },
  { id: 7, name: 'Mendoza Cruz Hugo', email: 'hmendoza@utcj.edu.mx', role: 'Usuario', date: '16/06/2026' },
  { id: 8, name: 'Soto Ibarra Valeria', email: 'vsoto@utcj.edu.mx', role: 'Usuario', date: '17/06/2026' },
]

const PAGE_SIZE = 8

export default function AdminUsers() {
  const [userList, setUserList] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [page, setPage] = useState(1)

  const [editUser, setEditUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const [roleChangeTarget, setRoleChangeTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredUsers = userList.filter((u) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    const matchesRole = roleFilter === 'Todos' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleFilter = (value) => {
    setRoleFilter(value)
    setPage(1)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
  }

  const saveEdit = () => {
    setUserList((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, name: editName, email: editEmail } : u)))
    setEditUser(null)
  }

  const confirmRoleChange = () => {
    setUserList((prev) => prev.map((u) => (
      u.id === roleChangeTarget.id ? { ...u, role: u.role === 'Administrador' ? 'Usuario' : 'Administrador' } : u
    )))
    setRoleChangeTarget(null)
  }

  const confirmDelete = () => {
    setUserList((prev) => prev.filter((u) => u.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

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
            <input placeholder="Buscar por nombre o correo..." value={search} onChange={(e) => handleSearch(e.target.value)} />
          </div>
          <div className="role-select">
            <select value={roleFilter} onChange={(e) => handleRoleFilter(e.target.value)}>
              <option>Todos</option>
              <option>Usuario</option>
              <option>Administrador</option>
            </select>
          </div>
          <span className="count">{filteredUsers.length} usuarios registrados</span>
        </div>

        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Nombre completo</th>
                <th>Correo institucional</th>
                <th>Rol</th>
                <th>Fecha registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.length === 0 && (
                <tr><td colSpan={6} className="no-results">No se encontraron usuarios.</td></tr>
              )}
              {pageUsers.map((u, i) => (
                <tr key={u.id}>
                  <td className="col-num">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td>{u.name}</td>
                  <td className="email-cell">{u.email}</td>
                  <td>
                    <span className={`role-pill ${u.role === 'Administrador' ? 'admin' : 'user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.date}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn action edit" onClick={() => openEdit(u)}>✎ Editar</button>
                      <button
                        className={`btn action ${u.role === 'Administrador' ? 'demote' : 'promote'}`}
                        onClick={() => setRoleChangeTarget(u)}
                      >
                        {u.role === 'Administrador' ? '→ Usuario' : '→ Admin'}
                      </button>
                      <button className="btn action delete" onClick={() => setDeleteTarget(u)}>🗑 Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}>← Anterior</a>
          <span className="page-count">Página {currentPage} de {totalPages}</span>
          <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}>Siguiente →</a>
        </div>
      </div>

      {editUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar usuario</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Nombre completo</span>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Correo institucional</span>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setEditUser(null)}>Cancelar</button>
              <button className="btn primary" onClick={saveEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {roleChangeTarget && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>{roleChangeTarget.role === 'Administrador' ? 'Quitar permisos de administrador' : 'Convertir en administrador'}</h3>
              <button className="modal-close" onClick={() => setRoleChangeTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="confirm-text">
                {roleChangeTarget.role === 'Administrador'
                  ? <>¿Seguro que quieres quitarle los permisos de administrador a <strong>{roleChangeTarget.name}</strong>?</>
                  : <>¿Seguro que quieres convertir a <strong>{roleChangeTarget.name}</strong> en administrador? Tendrá acceso completo al panel de gestión.</>}
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setRoleChangeTarget(null)}>Cancelar</button>
              <button className="btn primary" onClick={confirmRoleChange}>Sí, continuar</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>Eliminar usuario</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="confirm-text">
                ¿Seguro que quieres eliminar a <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
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
