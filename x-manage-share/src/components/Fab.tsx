import { useRef, useState, useCallback } from 'react'

const BTN_SIZE = 56
const EDGE_MARGIN = 16

interface Props {
  defaultPos: { top: number; left: number }
  onPosChange: (pos: { top: number; left: number }) => void
  onClick: () => void
}

export function Fab({ defaultPos, onPosChange, onClick }: Props) {
  const [pos, setPos] = useState(defaultPos)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ sx: 0, sy: 0, st: 0, sl: 0, active: false })

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const down = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const btn = e.currentTarget
    dragRef.current = { sx: e.clientX, sy: e.clientY, st: pos.top, sl: pos.left, active: true }
    setDragging(true)
    btn.setPointerCapture(e.pointerId)
  }, [pos])

  const move = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return
    setPos({
      top: clamp(dragRef.current.st + e.clientY - dragRef.current.sy, 0, window.innerHeight - BTN_SIZE),
      left: clamp(dragRef.current.sl + e.clientX - dragRef.current.sx, 0, window.innerWidth - BTN_SIZE),
    })
  }, [])

  const up = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    setPos(prev => {
      const snap = prev.left + BTN_SIZE / 2 < window.innerWidth / 2 ? EDGE_MARGIN : window.innerWidth - BTN_SIZE - EDGE_MARGIN
      const snapped = { top: prev.top, left: snap }
      onPosChange(snapped)
      return snapped
    })
  }, [onPosChange])

  return (
    <button
      id="x-manage-fab"
      className={dragging ? 'dragging' : ''}
      style={{ top: pos.top, left: pos.left }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onClick={() => { if (!dragging) onClick() }}
      title="X Content Manage"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  )
}
