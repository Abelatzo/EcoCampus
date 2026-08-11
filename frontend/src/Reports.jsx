import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useReports, CURRENT_USER } from './reportsStore'
import './Reports.scss'

const buildings = [
  'Edificio A', 'Edificio B', 'Edificio C', 'Edificio D', 'Edificio E', 'Edificio F',
  'Edificio G', 'Edificio H', 'Edificio I', 'Edificio J', 'Edificio K',
  'Edificio L', 'Edificio M', 'Edificio N', 'Edificio O', 'Edificio Q',
]
const buildingLetters = buildings.map((b) => b.replace('Edificio ', ''))

const reportStates = [
  { label: 'Pendiente', type: 'pending' },
  { label: 'En proceso', type: 'in-progress' },
  { label: 'Resuelto', type: 'resolved' },
  { label: 'Dañado', type: 'damaged' },
]

const PAGE_SIZE = 4

export default function Reports() {
  const { reports, addReport, updateReport } = useReports()
  const myReports = reports.filter((r) => r.author === CURRENT_USER)

  const [showModal, setShowModal] = useState(false)
  const [building, setBuilding] = useState(buildings[0])
  const [newTitle, setNewTitle] = useState('')
  const [newLocationDetail, setNewLocationDetail] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState(null)

  const [detailReport, setDetailReport] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [editReport, setEditReport] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [statusDraft, setStatusDraft] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [buildingDraft, setBuildingDraft] = useState([])
  const [buildingFilter, setBuildingFilter] = useState([])
  const [page, setPage] = useState(1)

  const toggleStatus = (type) => {
    setStatusDraft((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleBuilding = (letter) => {
    setBuildingDraft((prev) => (prev.includes(letter) ? prev.filter((b) => b !== letter) : [...prev, letter]))
  }

  const applyFilters = () => {
    setStatusFilter(statusDraft)
    setBuildingFilter(buildingDraft)
    setPage(1)
  }

  const filteredReportList = myReports.filter((r) =>
    (statusFilter.length === 0 || statusFilter.includes(r.statusType)) &&
    (buildingFilter.length === 0 || buildingFilter.includes(r.building))
  )

  const totalPages = Math.max(1, Math.ceil(filteredReportList.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageReportList = filteredReportList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const resetNewReportForm = () => {
    setBuilding(buildings[0])
    setNewTitle('')
    setNewLocationDetail('')
    setNewDescription('')
    setNewImage(null)
  }

  const closeNewReportModal = () => {
    setShowModal(false)
    resetNewReportForm()
  }

  const createReport = () => {
    if (!newTitle.trim()) return
    addReport({
      title: newTitle.trim(),
      location: newLocationDetail.trim() ? `${building} · ${newLocationDetail.trim()}` : building,
      building: building.replace('Edificio ', ''),
      status: 'Pendiente',
      statusType: 'pending',
      author: CURRENT_USER,
      description: newDescription.trim() || 'Sin descripción adicional.',
      image: newImage ? URL.createObjectURL(newImage) : null,
    })
    closeNewReportModal()
  }

  const openEdit = (report) => {
    setEditReport(report)
    setEditTitle(report.title)
    setEditDescription(report.description)
  }

  const saveEdit = () => {
    updateReport(editReport.id, { title: editTitle, description: editDescription })
    setEditReport(null)
  }

  return (
    <div className="reports-app">
      <header className="topbar">
        <div className="logo">🌿 <span>EcoCampus</span></div>
        <nav className="nav">
          <Link to="/map" className="nav-item">Mapa</Link>
          <Link to="/reports" className="nav-item active">Reportes</Link>
          <Link to="/events" className="nav-item">Eventos</Link>
        </nav>
        <div className="right">
          <div className="username">Diego A.</div>
          <div className="avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="container">
        <aside className="sidebar left">
          <h3>Filtrar por</h3>

          <div className="filter-group">
            <div className="filter-title">Estado</div>
            <label className="checkbox">
              <input type="checkbox" checked={statusDraft.length === 0} onChange={() => setStatusDraft([])} /> Todos
            </label>
            {reportStates.map((s) => (
              <label key={s.type} className="checkbox">
                <input type="checkbox" checked={statusDraft.includes(s.type)} onChange={() => toggleStatus(s.type)} /> {s.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">Edificio</div>
            <div className="building-grid">
              {buildingLetters.map((b) => (
                <label key={b} className="checkbox building">
                  <input type="checkbox" checked={buildingDraft.includes(b)} onChange={() => toggleBuilding(b)} /> {b}
                </label>
              ))}
            </div>
          </div>

          <button className="btn apply" onClick={applyFilters}>Aplicar filtros</button>
        </aside>

        <main className="main-content">
          <div className="header-row">
            <div>
              <h2>Mis Reportes</h2>
              <p className="count">{filteredReportList.length} reportes encontrados</p>
            </div>
            <button className="btn new-report" onClick={() => setShowModal(true)}>+ Nuevo Reporte</button>
          </div>

          <div className="search-bar">
            <input placeholder="Buscar en tus reportes..." />
          </div>

          <div className="report-list">
            {filteredReportList.length === 0 && <p className="no-results">No hay reportes con ese estado.</p>}
            {pageReportList.map((report) => (
              <article key={report.id} className="report-card">
                <div className={`status-side ${report.statusType}`} />
                <div className="card-content">
                  <div className="card-media">
                    {report.image ? <img src={report.image} alt="" className="report-image" /> : <div className="image-placeholder">📷</div>}
                  </div>
                  <div className="card-info">
                    <div className="card-header">
                      <div>
                        <h3>{report.title}</h3>
                        <p className="location">{report.location}</p>
                      </div>
                      <span className="report-time">{report.time}</span>
                    </div>
                    <span className={`pill ${report.statusType}`}>{report.status}</span>
                    <p className="description">{report.description}</p>
                    <div className="card-actions">
                      <div className="action-buttons">
                        <button className="btn outline" onClick={() => setDetailReport(report)}>Ver detalle</button>
                        {report.author === CURRENT_USER && (
                          <button className="btn primary" onClick={() => openEdit(report)}>Actualizar</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredReportList.length > 0 && (
            <div className="pagination">
              <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}>← Anterior</a>
              <span className="page-count">Página {currentPage} de {totalPages}</span>
              <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}>Siguiente →</a>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Reporte</h3>
              <button className="modal-close" onClick={closeNewReportModal}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Edificio</span>
                <div className="type-toggle">
                  {buildings.map((b) => (
                    <button
                      key={b}
                      className={`type-btn ${building === b ? 'active' : ''}`}
                      onClick={() => setBuilding(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </label>

              <label className="modal-field">
                <span>Título</span>
                <input type="text" placeholder="Ej. Contenedor lleno — planta baja" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Detalle de ubicación (opcional)</span>
                <input type="text" placeholder="Ej. Plástico y aluminio, entrada principal..." value={newLocationDetail} onChange={(e) => setNewLocationDetail(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Descripción</span>
                <textarea rows="4" placeholder="Describe el reporte..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Imagen (opcional)</span>
                <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0] || null)} />
                {newImage && <img src={URL.createObjectURL(newImage)} alt="Vista previa" className="image-preview" />}
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={closeNewReportModal}>Cancelar</button>
              <button className="btn primary" onClick={createReport}>Crear reporte</button>
            </div>
          </div>
        </div>
      )}

      {detailReport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Detalle del reporte</h3>
              <button className="modal-close" onClick={() => setDetailReport(null)}>✕</button>
            </div>

            <div className="modal-body">
              {detailReport.image && (
                <img
                  src={detailReport.image}
                  alt=""
                  className="image-preview clickable"
                  onClick={() => setLightboxImage(detailReport.image)}
                />
              )}

              <div className="modal-field">
                <span>Título</span>
                <p className="detail-text">{detailReport.title}</p>
              </div>

              <div className="modal-field">
                <span>Ubicación</span>
                <p className="detail-text">{detailReport.location}</p>
              </div>

              <div className="modal-field">
                <span>Estado</span>
                <span className={`pill ${detailReport.statusType}`}>{detailReport.status}</span>
              </div>

              <div className="modal-field">
                <span>Descripción</span>
                <p className="detail-text">{detailReport.description}</p>
              </div>

              <div className="modal-field">
                <span>Última actualización</span>
                <p className="detail-text">{detailReport.time}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn primary" onClick={() => setDetailReport(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {editReport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Actualizar reporte</h3>
              <button className="modal-close" onClick={() => setEditReport(null)}>✕</button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <span>Título</span>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </label>

              <label className="modal-field">
                <span>Descripción</span>
                <textarea rows="4" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn outline" onClick={() => setEditReport(null)}>Cancelar</button>
              <button className="btn primary" onClick={saveEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>✕</button>
          <img src={lightboxImage} alt="" className="lightbox-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
