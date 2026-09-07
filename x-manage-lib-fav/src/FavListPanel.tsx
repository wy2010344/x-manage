import { useState } from 'react'
import type { FavTweet } from './types'
import { getAllFavs, removeFav } from './favStore'

interface Props {
  favs: FavTweet[]
  setFavs: (favs: FavTweet[]) => void
  showToast: (msg: string) => void
}

export function FavListPanel({ favs, setFavs, showToast }: Props) {
  const [filter, setFilter] = useState('')

  const handleDelete = async (id: string) => {
    await removeFav(id)
    setFavs(await getAllFavs())
    showToast('已删除收藏')
  }

  const kw = filter.trim().toLowerCase()
  const filtered = kw
    ? favs.filter(f => f.tweetText.toLowerCase().includes(kw) || f.authorHandle.toLowerCase().includes(kw) || f.authorName.toLowerCase().includes(kw))
    : favs

  return (
    <div>
      <input className="x-manage-input" type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="过滤正文/作者…" style={{ marginBottom: 12 }} />
      {filtered.length === 0 ? (
        <div className="x-manage-empty">
          <div className="x-manage-empty-icon">⭐</div>
          <div>{favs.length === 0 ? '暂无收藏' : '无匹配结果'}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{favs.length === 0 ? '在推文上点击星标按钮收藏' : '换个关键词试试'}</div>
        </div>
      ) : (
        <div className="x-manage-word-list">
          {filtered.map(f => (
            <div key={f.id} className="x-manage-word-item" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                <span className="x-manage-word-text" style={{ fontWeight: 600, color: '#fbbf24', flexShrink: 0 }}>★ {f.authorName || f.authorHandle}</span>
                <div className="x-manage-word-actions">
                  {f.tweetUrl && <a href={f.tweetUrl} target="_blank" rel="noopener noreferrer" className="x-manage-btn x-manage-btn-secondary x-manage-btn-sm" style={{ textDecoration: 'none' }}>跳转</a>}
                  <button className="x-manage-btn x-manage-btn-danger x-manage-btn-sm" onClick={() => handleDelete(f.id)}>删除</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--xm-text-secondary)', lineHeight: 1.5, padding: '4px 0', wordBreak: 'break-word', width: '100%' }}>
                {f.tweetText.length > 140 ? `${f.tweetText.slice(0, 140)}…` : f.tweetText}
              </div>
              <div style={{ fontSize: 10, color: 'var(--xm-text-muted)' }}>
                <span>{f.authorHandle}</span> · <span>{new Date(f.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}