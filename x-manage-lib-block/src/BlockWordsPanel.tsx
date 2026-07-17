import { useState, useCallback, useEffect, useRef } from 'react'
import type { BlockWord } from './types'

interface Props {
  words: BlockWord[]
  onAdd: (word: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onToggle: (id: string) => Promise<void>
  onMatchFieldChange: (id: string, field: 'both' | 'body' | 'author') => Promise<void>
  onCaseSensitiveChange: (id: string, cs: boolean) => Promise<void>
}

const FIELD_LABELS: Record<string, string> = {
  both: '正文+名',
  body: '正文',
  author: '显示名',
}

const FIELD_OPTIONS: { value: 'both' | 'body' | 'author'; label: string }[] = [
  { value: 'both', label: '正文 + 显示名' },
  { value: 'body', label: '仅正文' },
  { value: 'author', label: '仅显示名' },
]

function FieldDropdown({ value, onChange }: { value: string; onChange: (v: 'both' | 'body' | 'author') => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // 借助 :popover-open 伪类监听 toggle 事件同步 React 状态
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const onToggle = () => setOpen(el.matches(':popover-open'))
    el.addEventListener('toggle', onToggle)
    return () => el.removeEventListener('toggle', onToggle)
  }, [])

  // 将 popover 定位到触发器下方，空间不足时自动翻到上方
  const updatePos = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return
    const t = triggerRef.current.getBoundingClientRect()
    const m = menuRef.current
    const mRect = m.getBoundingClientRect()
    const mh = mRect.height || 100
    let left = t.left
    let top = t.bottom + 2
    if (t.bottom + 2 + mh > window.innerHeight && t.top > mh) top = t.top - mh - 2
    if (left + mRect.width > window.innerWidth) left = window.innerWidth - mRect.width - 4
    if (left < 0) left = 4
    m.style.left = `${left}px`
    m.style.top = `${top}px`
    m.style.margin = '0'
  }, [])

  // popover 打开期间监听滚动/缩放，实时刷新位置
  useEffect(() => {
    if (!open) return
    updatePos()
    let rafId: number
    const onMove = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(updatePos) }
    window.addEventListener('scroll', onMove, { capture: true, passive: true })
    window.addEventListener('resize', updatePos)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onMove, { capture: true })
      window.removeEventListener('resize', updatePos)
    }
  }, [open, updatePos])

  return (
    <>
      <button ref={triggerRef} className="x-manage-field-trigger" onClick={() => {
        const m = menuRef.current
        if (!m) return
        updatePos()
        m.togglePopover()
      }}>
        {FIELD_LABELS[value] || value}
        <span className="x-manage-field-arrow">▾</span>
      </button>
      <div ref={menuRef} popover="auto" className="x-manage-field-menu"
        style={{ position: 'fixed', left: 0, top: 0, margin: 0, zIndex: 2147483647 }}>
        {FIELD_OPTIONS.map(opt => (
          <div key={opt.value} className={`x-manage-field-option${opt.value === value ? ' active' : ''}`}
            onClick={() => { onChange(opt.value); menuRef.current?.hidePopover() }}>{opt.label}</div>
        ))}
      </div>
    </>
  )
}

export function BlockWordsPanel({ words, onAdd, onRemove, onToggle, onMatchFieldChange, onCaseSensitiveChange }: Props) {
  const [input, setInput] = useState('')
  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) onAdd(input.trim()).then(() => setInput(''))
  }, [input, onAdd])

  return (
    <>
      <div className="x-manage-add-row">
        <input className="x-manage-input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="输入屏蔽词，按 Enter 添加" autoFocus />
        <button className="x-manage-btn x-manage-btn-primary" onClick={() => { if (input.trim()) onAdd(input.trim()).then(() => setInput('')) }}>添加</button>
      </div>
      {words.length === 0 ? (
        <div className="x-manage-empty">
          <div className="x-manage-empty-icon">⊘</div>
          <div>暂无屏蔽词</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>输入关键词后按 Enter 添加</div>
        </div>
      ) : (
        <div className="x-manage-word-list">
          {words.map(w => (
            <div key={w.id} className={`x-manage-word-item${!w.enabled ? ' disabled' : ''}`}>
              <label className="x-manage-toggle" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={w.enabled} onChange={() => onToggle(w.id)} />
                <span className="x-manage-toggle-slider" />
              </label>
              <span className="x-manage-word-text" title={w.word}>{w.word}</span>
              <FieldDropdown value={w.matchField} onChange={v => onMatchFieldChange(w.id, v)} />
              <button
                className={`x-manage-case-btn${w.caseSensitive ? ' active' : ''}`}
                title={w.caseSensitive ? '区分大小写' : '不区分大小写'}
                onClick={() => onCaseSensitiveChange(w.id, !w.caseSensitive)}
              >Aa</button>
              <div className="x-manage-word-actions">
                <button className="x-manage-btn x-manage-btn-danger x-manage-btn-sm" onClick={() => onRemove(w.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}