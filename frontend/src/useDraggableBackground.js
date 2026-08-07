import { useCallback, useRef, useState } from 'react'

export function useDraggableBackground(initial = { x: 50, y: 50 }) {
  const [position, setPosition] = useState(initial)
  const drag = useRef(null)

  const onPointerDown = useCallback((e) => {
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: position,
      rect: e.currentTarget.getBoundingClientRect(),
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [position])

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return
    const { startX, startY, startPos, rect } = drag.current
    const dxPct = ((e.clientX - startX) / rect.width) * 100
    const dyPct = ((e.clientY - startY) / rect.height) * 100
    setPosition({
      x: Math.min(100, Math.max(0, startPos.x - dxPct)),
      y: Math.min(100, Math.max(0, startPos.y - dyPct)),
    })
  }, [])

  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  return { position, onPointerDown, onPointerMove, onPointerUp }
}
