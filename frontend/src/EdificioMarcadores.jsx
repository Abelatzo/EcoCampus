import { useEffect, useRef, useState } from 'react'

const ESTADO_COLOR = { pendiente: 'orange', en_proceso: 'blue', 'dañado': 'red' }
const ESTADO_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', 'dañado': 'Dañado' }

// Icono de alerta por edificio: solo se muestra si tiene reportes activos
// (bote_mallas.estatus !== 'disponible'). Si hay varios reportes, el
// numerito los cuenta y el clic despliega el detalle de cada uno.
export default function EdificioMarcadores({ edificios }) {
  const [abierto, setAbierto] = useState(null)
  const rootRef = useRef(null)

  useEffect(() => {
    const cerrarSiAfuera = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setAbierto(null)
    }
    document.addEventListener('pointerdown', cerrarSiAfuera)
    return () => document.removeEventListener('pointerdown', cerrarSiAfuera)
  }, [])

  const conAlerta = edificios.filter((e) => e.pos_x != null && e.pos_y != null && e.estatus !== 'disponible')

  return (
    <div ref={rootRef}>
      {conAlerta.map((e) => (
        <div
          key={e.edificio_id}
          className={`edificio-marker ${ESTADO_COLOR[e.estatus] || 'orange'}`}
          style={{ left: `${e.pos_x}%`, top: `${e.pos_y}%` }}
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); setAbierto(abierto === e.edificio_id ? null : e.edificio_id) }}
          title={`Edificio ${e.letra} · ${ESTADO_LABEL[e.estatus] || e.estatus}`}
        >
          <span className="edificio-marker-icon">⚠</span>
          {e.reportes.length > 1 && <span className="marker-badge">{e.reportes.length}</span>}

          {abierto === e.edificio_id && (
            <div className="marker-popover" onPointerDown={(ev) => ev.stopPropagation()}>
              <div className="marker-popover-title">
                Edificio {e.letra} · {ESTADO_LABEL[e.estatus] || e.estatus}
                <span className="marker-popover-count">{e.reportes.length} reporte{e.reportes.length !== 1 ? 's' : ''}</span>
              </div>
              <ul className="marker-report-list">
                {e.reportes.map((r) => (
                  <li key={r.id}>
                    <div className="marker-report-title">{r.titulo}</div>
                    {r.descripcion && <div className="marker-report-desc">{r.descripcion}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
