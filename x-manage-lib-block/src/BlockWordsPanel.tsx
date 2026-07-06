import { useState, useCallback } from 'react'
import type { BlockWord } from './types'

interface Props {
  words: BlockWord[]
  onAdd: (word: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onToggle: (id: string) => Promise<void>
}

export function BlockWordsPanel({ words, onAdd, onRemove, onToggle }: Props) {
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
              <span className="x-manage-word-text">{w.word}</span>
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
