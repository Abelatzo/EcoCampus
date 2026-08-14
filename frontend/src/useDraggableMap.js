import { useCallback, useRef, useState } from 'react'

// Paneo por transform (no background-position): la imagen y los
// marcadores viven en el mismo contenedor transformado, así que un
// marcador puesto con left/top en % siempre queda pegado al punto real
// de la imagen sin importar cuánto se haya arrastrado el mapa.
export function useDraggableMap() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const drag = useRef(null)

  const clamp = useCallback((x, y) => {
    const container = containerRef.current?.getBoundingClientRect()
    const image = imageRef.current?.getBoundingClientRect()
    if (!container || !image) return { x, y }

    // getBoundingClientRect ya incluye el transform actual, así que el
    // tamaño "sin mover" de la imagen es el mismo (transform no escala).
    const imgW = image.width
    const imgH = image.height

    const minX = Math.min(0, container.width - imgW)
    const minY = Math.min(0, container.height - imgH)

    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }, [])

  const onPointerDown = useCallback((e) => {
    drag.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [offset])

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return
    const { startX, startY, startOffset } = drag.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    setOffset(clamp(startOffset.x + dx, startOffset.y + dy))
  }, [clamp])

  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  // Convierte un clic sobre la imagen (coordenadas de viewport) a
  // porcentaje (0-100) relativo a la imagen, para el modo "marcar edificio".
  const clientToImagePercent = useCallback((clientX, clientY) => {
    const image = imageRef.current?.getBoundingClientRect()
    if (!image) return null
    const x = ((clientX - image.left) / image.width) * 100
    const y = ((clientY - image.top) / image.height) * 100
    if (x < 0 || x > 100 || y < 0 || y > 100) return null
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
  }, [])

  return { offset, containerRef, imageRef, onPointerDown, onPointerMove, onPointerUp, clientToImagePercent }
}
