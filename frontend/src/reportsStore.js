import { createContext, useContext, useState } from 'react'

export const CURRENT_USER = 'daraiza959'
export const ADMIN_USER = 'admin'

let nextId = 100

const initialReports = [
  {
    id: 1,
    title: 'Contenedor lleno — planta baja',
    location: 'Edificio A · Plástico y aluminio',
    building: 'A',
    status: 'Pendiente',
    statusType: 'pending',
    author: CURRENT_USER,
    description: 'El contenedor de la planta baja del Edificio A se encuentra completamente lleno. Se requiere vaciado urgente antes del mediodía.',
    time: 'Hace 2 horas',
    image: null,
  },
  {
    id: 2,
    title: 'Residuos en pasillo exterior',
    location: 'Edificio C · Piso 2',
    building: 'C',
    status: 'En proceso',
    statusType: 'in-progress',
    author: 'lgarcia',
    description: 'Se encontraron residuos orgánicos y plástico en el pasillo exterior del segundo piso. Ya fue asignado a mantenimiento.',
    time: 'Ayer, 14:30',
    image: null,
  },
  {
    id: 3,
    title: 'Bote de malla dañado',
    location: 'Edificio B · Entrada principal',
    building: 'B',
    status: 'Resuelto',
    statusType: 'resolved',
    author: 'ctorres',
    description: 'El bote de malla para PET presentaba rotura en la estructura. Fue reemplazado por el equipo de mantenimiento el martes.',
    time: 'Hace 3 días',
    image: null,
  },
  {
    id: 4,
    title: 'Bote dañado — estructura rota',
    location: 'Edificio B · Pasillo norte',
    building: 'B',
    status: 'Dañado',
    statusType: 'damaged',
    author: 'ctorres',
    description: 'El bote de malla presenta una rotura visible en la estructura metálica.',
    time: 'Hace 5 horas',
    image: null,
  },
  {
    id: 5,
    title: 'Mal olor — área verde',
    location: 'Edificio D · Jardín central',
    building: 'D',
    status: 'Pendiente',
    statusType: 'pending',
    author: 'lgarcia',
    description: 'Se percibe mal olor proveniente del área verde junto al Edificio D, posiblemente por residuos orgánicos acumulados.',
    time: 'Hace 8 horas',
    image: null,
  },
  {
    id: 6,
    title: 'Latas sin recolectar',
    location: 'Edificio K · Cafetería',
    building: 'K',
    status: 'En proceso',
    statusType: 'in-progress',
    author: CURRENT_USER,
    description: 'Latas de aluminio acumuladas fuera del contenedor de la cafetería del Edificio K.',
    time: 'Hace 1 día',
    image: null,
  },
]

export const ReportsContext = createContext(null)

export function useReports() {
  return useContext(ReportsContext)
}

export function useReportsState() {
  const [reports, setReports] = useState(initialReports)

  const addReport = (report) => {
    nextId += 1
    setReports((prev) => [{ id: nextId, time: 'Hace un momento', image: null, ...report }, ...prev])
  }

  const updateReport = (id, changes) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
  }

  const deleteReport = (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  const deleteReports = (ids) => {
    setReports((prev) => prev.filter((r) => !ids.includes(r.id)))
  }

  return { reports, addReport, updateReport, deleteReport, deleteReports }
}
