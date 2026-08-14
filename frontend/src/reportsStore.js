import { createContext, useContext, useState, useEffect } from 'react'

export const ReportsContext = createContext(null)

export function useReports() {
  return useContext(ReportsContext)
}

const ESTATUS_MAP = {
  pendiente: { label: 'Pendiente', type: 'pending' },
  en_proceso: { label: 'En proceso', type: 'in-progress' },
  resuelto: { label: 'Resuelto', type: 'resolved' },
  'dañado': { label: 'Dañado', type: 'damaged' },
}

export const TYPE_TO_ESTATUS = Object.fromEntries(
  Object.entries(ESTATUS_MAP).map(([estatus, v]) => [v.type, estatus])
)

function mapReporte(r, currentEmail) {
  const estado = ESTATUS_MAP[r.estatus] || { label: r.estatus, type: 'pending' }
  const letra = r.edificios?.letra
  return {
    id: r.id,
    title: r.titulo,
    location: letra
      ? (r.ubicacion ? `Edificio ${letra} · ${r.ubicacion}` : `Edificio ${letra}`)
      : (r.ubicacion || 'Sin ubicación'),
    building: letra || null,
    status: estado.label,
    statusType: estado.type,
    author: r.usuarios?.nombre || 'Desconocido',
    isMine: currentEmail ? r.usuarios?.email === currentEmail : false,
    description: r.descripcion || 'Sin descripción adicional.',
    time: r.created_at
      ? new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    image: r.foto_url || null,
  }
}

export function useReportsState() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const API = import.meta.env.VITE_API_URL
  const esAdmin = usuario?.rol === 'administrador'
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const fetchReportes = async () => {
    if (!token) return
    setLoading(true)
    setErrorMsg('')
    try {
      const endpoint = esAdmin ? '/api/admin/reportes' : '/api/reportes'
      const res = await fetch(`${API}${endpoint}`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setReports(Array.isArray(data) ? data.map((r) => mapReporte(r, usuario?.email)) : [])
    } catch (err) {
      setErrorMsg('No se pudieron cargar los reportes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(fetchReportes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subirFoto = async (image) => {
    const form = new FormData()
    form.append('foto', image)
    const res = await fetch(`${API}/api/reportes/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error ${res.status}`)
    }
    const data = await res.json()
    return data.foto_url
  }

  const addReport = async (report) => {
    setErrorMsg('')
    try {
      const foto_url = report.image ? await subirFoto(report.image) : null
      const res = await fetch(`${API}/api/reportes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          edificio: report.building,
          titulo: report.title,
          ubicacion: report.locationDetail || null,
          descripcion: report.description,
          estatus: report.estatus || undefined,
          foto_url,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      await fetchReportes()
    } catch (err) {
      setErrorMsg('No se pudo crear el reporte: ' + err.message)
    }
  }

  const updateReport = async (id, changes) => {
    setErrorMsg('')
    try {
      if (changes.statusType) {
        const res = await fetch(`${API}/api/reportes/${id}/estatus`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ estatus: TYPE_TO_ESTATUS[changes.statusType] }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Error ${res.status}`)
        }
      } else {
        const body = {}
        if (changes.title !== undefined) body.titulo = changes.title
        if (changes.description !== undefined) body.descripcion = changes.description
        const res = await fetch(`${API}/api/reportes/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Error ${res.status}`)
        }
      }
      await fetchReportes()
    } catch (err) {
      setErrorMsg('No se pudo actualizar el reporte: ' + err.message)
    }
  }

  const deleteReport = async (id) => {
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/reportes/${id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setErrorMsg('No se pudo eliminar el reporte: ' + err.message)
    }
  }

  const deleteReports = async (ids) => {
    setErrorMsg('')
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`${API}/api/reportes/${id}`, { method: 'DELETE', headers }))
      )
      const fallo = results.some((res) => !res.ok)
      setReports((prev) => prev.filter((r) => !ids.includes(r.id)))
      if (fallo) throw new Error('Algunos reportes no se pudieron eliminar')
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return { reports, loading, errorMsg, addReport, updateReport, deleteReport, deleteReports, refetch: fetchReportes }
}
