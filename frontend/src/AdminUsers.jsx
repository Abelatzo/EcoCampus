import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './AdminUsers.scss'

const PAGE_SIZE = 8

function mapUsuario(u) {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: u.rol === 'administrador' ? 'Administrador' : 'Usuario',
    date: u.created_at
      ? new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '',
  }
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null')
  const API = import.meta.env.VITE_API_URL
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [page, setPage] = useState(1)

  const [editUser, setEditUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const [roleChangeTarget, setRoleChangeTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchUsuarios = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/usuarios`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setUserList(Array.isArray(data) ? data.map(mapUsuario) : [])
    } catch (err) {
      setErrorMsg('No se pudieron cargar los usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    queueMicrotask(fetchUsuarios)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const saveEdit = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/usuarios/${editUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ nombre: editName, email: editEmail }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      setEditUser(null)
      await fetchUsuarios()
    } catch (err) {
      setErrorMsg('No se pudo actualizar el usuario: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmRoleChange = async () => {
    setErrorMsg('')
    try {
      const nuevoRol = roleChangeTarget.role === 'Administrador' ? 'estudiante' : 'administrador'
      const res = await fetch(`${API}/api/usuarios/${roleChangeTarget.id}/rol`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ rol: nuevoRol }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      setRoleChangeTarget(null)
      await fetchUsuarios()
    } catch (err) {
      setErrorMsg('No se pudo cambiar el rol: ' + err.message)
      setRoleChangeTarget(null)
    }
  }

  const confirmDelete = async () => {
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/usuarios/${deleteTarget.id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      setDeleteTarget(null)
      await fetchUsuarios()
    } catch (err) {
      setErrorMsg('No se pudo eliminar el usuario: ' + err.message)
      setDeleteTarget(null)
    }
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
          <div className="username">{usuario?.nombre || 'Admin'}</div>
          <div className="avatar admin-avatar" aria-hidden="true" />
        </div>
      </header>

      {errorMsg && <p className="no-results" style={{ color: 'var(--red, #d9362e)', padding: '8px 24px' }}>{errorMsg}</p>}

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
              {loading && (
                <tr><td colSpan={6} className="no-results">Cargando usuarios...</td></tr>
              )}
              {!loading && pageUsers.length === 0 && (
                <tr><td colSpan={6} className="no-results">No se encontraron usuarios.</td></tr>
              )}
              {pageUsers.map((u, i) => {
                const esUnoMismo = u.id === usuario?.id
                return (
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
                          disabled={esUnoMismo}
                          title={esUnoMismo ? 'No puedes cambiar tu propio rol' : ''}
                        >
                          {u.role === 'Administrador' ? '→ Usuario' : '→ Admin'}
                        </button>
                        <button
                          className="btn action delete"
                          onClick={() => setDeleteTarget(u)}
                          disabled={esUnoMismo}
                          title={esUnoMismo ? 'No puedes eliminar tu propia cuenta' : ''}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
              <button className="btn primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
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
