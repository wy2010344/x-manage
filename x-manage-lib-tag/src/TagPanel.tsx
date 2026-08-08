import { useState } from 'react'
import type { TweetTag } from './types'
import { getAllTags, updateTag, deleteTag } from './tagStore'

interface Props {
  tags: TweetTag[]
  setTags: (tags: TweetTag[]) => void
  showToast: (msg: string) => void
}

function groupByAuthor(ts: TweetTag[]): [string, TweetTag[]][] {
  const map = new Map<string, TweetTag[]>()
  for (const t of ts) { if (!map.has(t.authorHandle)) map.set(t.authorHandle, []); map.get(t.authorHandle)!.push(t) }
  return Array.from(map.entries())
}

export function TagPanel({ tags, setTags, showToast }: Props) {
  const [filter, setFilter] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleSaveEdit = async (id: string) => { const text = editText.trim(); if (!text) return; await updateTag(id, { tag: text }); setEditId(null); setTags(await getAllTags()); showToast('已更新标签') }
  const handleDelete = async (id: string) => { await deleteTag(id); setTags(await getAllTags()); showToast('已删除标签') }

  const kw = filter.trim().toLowerCase()
  const filtered = kw
    ? tags.filter(t => t.tag.toLowerCase().includes(kw) || t.authorHandle.toLowerCase().includes(kw))
    : tags
  const groups = groupByAuthor(filtered)

  return (
    <div>
      <input className="x-manage-input" type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="过滤标签或用户名…" style={{ marginBottom: 12 }} />
      {groups.length === 0 ? (
        <div className="x-manage-empty">
          <div className="x-manage-empty-icon">🏷️</div>
          <div>{tags.length === 0 ? '暂无标签' : '无匹配结果'}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{tags.length === 0 ? '在推文上点击「+标签」按钮添加' : '换个关键词试试'}</div>
        </div>
      ) : (
        <div className="x-manage-word-list">
          {groups.map(([authorHandle, authorTags]) => (
            <div key={authorHandle} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#a4b0be', fontWeight: 600, marginBottom: 4, padding: '0 4px' }}>{authorHandle}</div>
              {authorTags.map(t => (
                <div key={t.id} className="x-manage-word-item">
                  {editId === t.id ? (
                    <><input className="x-manage-input" type="text" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(t.id); if (e.key === 'Escape') setEditId(null) }} autoFocus style={{ flex: 1 }} /><div className="x-manage-word-actions"><button className="x-manage-btn x-manage-btn-primary x-manage-btn-sm" onClick={() => handleSaveEdit(t.id)}>保存</button><button className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" onClick={() => setEditId(null)}>取消</button></div></>
                  ) : (
                    <><span className="x-manage-word-text">{t.tag}</span><div className="x-manage-word-actions">{t.tweetUrl && <a href={t.tweetUrl} target="_blank" rel="noopener noreferrer" className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" style={{ textDecoration: 'none' }}>跳转</a>}<button className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" onClick={() => { setEditId(t.id); setEditText(t.tag) }}>编辑</button><button className="x-manage-btn x-manage-btn-danger x-manage-btn-sm" onClick={() => handleDelete(t.id)}>删除</button></div></>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
