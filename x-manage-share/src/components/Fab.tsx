import { useEffect, useRef, useState, useCallback } from 'react'

const BTN_SIZE = 44
/** 展开时与视口边缘的间距 */
const EDGE = 8
/** 折叠小圆标尺寸（始终在可视区内，避免被滚动条遮挡） */
const COLLAPSED_SIZE = 24
/** 折叠小圆标与视口边缘的间距，右侧留出滚动条余量 */
const COLLAPSED_EDGE_LEFT = 8
const COLLAPSED_EDGE_RIGHT = 20
const COLLAPSED_RADIUS = 10

interface Props {
  defaultPos: { top: number; left: number }
  onPosChange: (pos: { top: number; left: number }) => void
  onClick: () => void
}

function dockSide(left: number) {
  return left + BTN_SIZE / 2 >= window.innerWidth / 2 ? 'right' : 'left'
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function Fab({ defaultPos, onPosChange, onClick }: Props) {
  const [pos, setPos] = useState(defaultPos)
  const [hover, setHover] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ sx: 0, sy: 0, st: 0, sl: 0, active: false })
  const collapseTimer = useRef<number | null>(null)
  const expanded = hover || dragging

  const side = dockSide(pos.left)
  const size = expanded ? BTN_SIZE : COLLAPSED_SIZE
  const edge = !expanded && side === 'right' ? COLLAPSED_EDGE_RIGHT : EDGE
  const left = side === 'right' ? Math.max(0, window.innerWidth - size - edge) : EDGE
  const top = clamp(pos.top, 0, window.innerHeight - size)
  const icon = expanded ? 20 : 14

  // 外部位置（含异步加载的停靠位置）变化时同步，并吸附到最近边缘。
  // 只吸附显示、不回调持久化——停靠位置记忆仅由拖拽落点上写，
  // 避免挂载时用占位 initialPos 覆盖存储里的真实停靠位置。
  useEffect(() => {
    const t = clamp(defaultPos.top, 0, window.innerHeight - BTN_SIZE)
    const l = dockSide(defaultPos.left) === 'right' ? Math.max(0, window.innerWidth - BTN_SIZE - EDGE) : EDGE
    setPos({ top: t, left: l })
  }, [defaultPos])

  const down = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const btn = e.currentTarget
    dragRef.current = { sx: e.clientX, sy: e.clientY, st: pos.top, sl: pos.left, active: true }
    setDragging(true)
    if (collapseTimer.current) { clearTimeout(collapseTimer.current); collapseTimer.current = null }
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
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setPos(prev => {
      const l = dockSide(prev.left) === 'right' ? window.innerWidth - BTN_SIZE - EDGE : EDGE
      const snapped = { top: clamp(prev.top, 0, window.innerHeight - BTN_SIZE), left: l }
      onPosChange(snapped)
      return snapped
    })
    if (collapseTimer.current) { clearTimeout(collapseTimer.current) }
    collapseTimer.current = setTimeout(() => setHover(false), 300)
  }, [onPosChange])

  const handleClick = () => {
    if (dragging) return
    if (!expanded) { setHover(true); return }
    onClick()
  }

  return (
    <button
      id="x-manage-fab"
      className={dragging ? 'dragging' : ''}
      style={{
        top,
        left,
        width: size,
        height: size,
        borderRadius: expanded ? 14 : COLLAPSED_RADIUS,
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerEnter={() => { setHover(true); if (collapseTimer.current) { clearTimeout(collapseTimer.current); collapseTimer.current = null } }}
      onPointerLeave={() => { if (!dragging) setHover(false) }}
      onClick={handleClick}
      title="X Content Manage"
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  )
}
