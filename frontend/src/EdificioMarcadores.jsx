import { useEffect, useRef, useState } from 'react'

const ESTADO_COLOR = { disponible: 'green', pendiente: 'orange', en_proceso: 'blue', 'dañado': 'red' }
const ESTADO_LABEL = { disponible: 'Disponible', pendiente: 'Pendiente', en_proceso: 'En proceso', 'dañado': 'Dañado' }

// Un marcador por edificio, siempre visible, coloreado segun bote_mallas.estatus
// (mismos colores que la leyenda del mapa). El triangulo de alerta solo se
// muestra cuando hay algo que atender; en disponible solo queda la letra.
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

  const marcados = edificios.filter((e) => e.pos_x != null && e.pos_y != null)

  return (
    <div ref={rootRef}>
      {marcados.map((e) => {
        const tieneReportes = e.reportes.length > 0
        return (
          <div
            key={e.edificio_id}
            className={`edificio-marker ${ESTADO_COLOR[e.estatus] || 'green'}`}
            style={{ left: `${e.pos_x}%`, top: `${e.pos_y}%`, cursor: tieneReportes ? 'pointer' : 'default' }}
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={(ev) => {
              ev.stopPropagation()
              if (tieneReportes) setAbierto(abierto === e.edificio_id ? null : e.edificio_id)
            }}
            title={`Edificio ${e.letra} · ${ESTADO_LABEL[e.estatus] || e.estatus}`}
          >
            {tieneReportes && <span className="edificio-marker-icon">⚠</span>}
            <span className="edificio-marker-letra">{e.letra}</span>
            {e.reportes.length > 1 && <span className="marker-badge">{e.reportes.length}</span>}

            {tieneReportes && abierto === e.edificio_id && (
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
        )
      })}
    </div>
  )
}
