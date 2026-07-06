import { useEffect, useRef, useState } from 'react'
import type { TweetTag } from './types'
import { addTag, getTagsByAuthor, updateTag, deleteTag } from './tagStore'

interface Props {
  initial: { authorHandle: string; authorName: string; tweetId: string; tweetUrl: string } | null
  onClose: () => void
  onTagsChanged: () => void
  showToast: (msg: string) => void
}

export function TagDialog({ initial, onClose, onTagsChanged, showToast }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [authorTags, setAuthorTags] = useState<TweetTag[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => { if (initial) getTagsByAuthor(initial.authorHandle).then(setAuthorTags) }, [initial])
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose])

  if (!initial) return null

  const refresh = async () => { const t = await getTagsByAuthor(initial.authorHandle); setAuthorTags(t); onTagsChanged() }

  const handleAdd = async () => {
    const tag = text.trim(); if (!tag) return
    const now = Date.now()
    await addTag({ id: `${initial.authorHandle}_${initial.tweetId}_${now}`, authorHandle: initial.authorHandle, authorName: initial.authorName || initial.authorHandle.replace('/', ''), tweetId: initial.tweetId, tweetUrl: initial.tweetUrl, tag, createdAt: now, updatedAt: now })
    setText(''); inputRef.current?.focus(); showToast('已添加标签'); await refresh()
  }

  const handleSaveEdit = async (id: string) => { const tag = editText.trim(); if (!tag) return; await updateTag(id, { tag }); setEditId(null); showToast('已更新标签'); await refresh() }
  const handleDelete = async (id: string) => { await deleteTag(id); showToast('已删除标签'); await refresh() }

  return (
    <div className="x-manage-tag-dialog-backdrop" onClick={onClose}>
      <div className="x-manage-tag-dialog" onClick={e => e.stopPropagation()}>
        <div className="x-manage-tag-dialog-header"><span>标签管理 · {initial.authorHandle}</span><button className="x-manage-tag-dialog-close" onClick={onClose}>✕</button></div>
        <div className="x-manage-tag-dialog-body">
          <div className="x-manage-tag-dialog-field"><label>添加标签</label><div className="x-manage-tag-dialog-add-row"><input ref={inputRef} className="x-manage-input" type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} placeholder="输入标签文字" /><button className="x-manage-btn x-manage-btn-primary x-manage-btn-sm" onClick={handleAdd} disabled={!text.trim()}>添加</button></div></div>
          {authorTags.length === 0 ? <div className="x-manage-empty" style={{ padding: '20px 0', textAlign: 'center', color: '#636e72', fontSize: 13 }}>暂无标签</div> : (
            <div className="x-manage-tag-dialog-list">
              {authorTags.map(t => (
                <div key={t.id} className="x-manage-tag-dialog-item">
                  {editId === t.id ? (
                    <div className="x-manage-tag-dialog-item-edit"><input className="x-manage-input" type="text" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(t.id); if (e.key === 'Escape') setEditId(null) }} autoFocus /><button className="x-manage-btn x-manage-btn-primary x-manage-btn-sm" onClick={() => handleSaveEdit(t.id)}>保存</button><button className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" onClick={() => setEditId(null)}>取消</button></div>
                  ) : (
                    <><span className="x-manage-tag-dialog-item-label">{t.tag}</span><div className="x-manage-tag-dialog-item-actions">{t.tweetUrl && <a href={t.tweetUrl} target="_blank" rel="noopener noreferrer" className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" style={{ textDecoration: 'none' }}>跳转</a>}<button className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" onClick={() => { setEditId(t.id); setEditText(t.tag) }}>编辑</button><button className="x-manage-btn x-manage-btn-danger x-manage-btn-sm" onClick={() => handleDelete(t.id)}>删除</button></div></>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
