import { useState } from 'react'
import type { TweetTag, NotionConfig, TagStorage } from './types'
import { addTag, getAllTags, importTags, updateTag, deleteTag } from './tagStore'
import { verifyNotionToken, verifyNotionDatabase, pullTagsFromNotion, pushTagsToNotion } from './notionSync'

interface Props {
  tags: TweetTag[]
  setTags: (tags: TweetTag[]) => void
  showToast: (msg: string) => void
  storage: TagStorage
  notionKey: string
  notionDbId: string
  setNotionKey: (v: string) => void
  setNotionDbId: (v: string) => void
}

function groupByAuthor(ts: TweetTag[]): [string, TweetTag[]][] {
  const map = new Map<string, TweetTag[]>()
  for (const t of ts) { if (!map.has(t.authorHandle)) map.set(t.authorHandle, []); map.get(t.authorHandle)!.push(t) }
  return Array.from(map.entries())
}

export function TagPanel({ tags, setTags, showToast, storage, notionKey, notionDbId, setNotionKey, setNotionDbId }: Props) {
  const [input, setInput] = useState('')
  const [handle, setHandle] = useState('')
  const [tweetUrl, setTweetUrl] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [syncing, setSyncing] = useState(false)

  const handleAdd = async () => {
    const text = input.trim(); if (!text || !handle.trim()) return
    if (tags.find(t => t.authorHandle === handle && t.tag.toLowerCase() === text.toLowerCase())) { showToast('该用户已有相同标签'); return }
    const tweetId = tweetUrl.split('/status/')[1]?.split('?')[0] || ''
    const now = Date.now()
    const newTag: TweetTag = { id: `${handle}_${tweetId}_${now}`, authorHandle: handle, authorName: handle.replace('/', ''), tweetId, tweetUrl, tag: text, createdAt: now, updatedAt: now }
    await addTag(newTag); setTags(await getAllTags()); setInput(''); showToast('已添加标签')
  }

  const handleSaveEdit = async (id: string) => { const text = editText.trim(); if (!text) return; await updateTag(id, { tag: text }); setEditId(null); setTags(await getAllTags()); showToast('已更新标签') }
  const handleDelete = async (id: string) => { await deleteTag(id); setTags(await getAllTags()); showToast('已删除标签') }

  const handleSaveNotion = async () => {
    if (!notionKey.trim()) { showToast('请输入 Notion API Key'); return }
    if (!notionDbId.trim()) { showToast('请输入 Database ID'); return }
    const tokenCheck = await verifyNotionToken(notionKey.trim())
    if (!tokenCheck.ok) { showToast(tokenCheck.error || 'API Key 验证失败'); return }
    const dbCheck = await verifyNotionDatabase(notionKey.trim(), notionDbId.trim())
    if (!dbCheck.ok) { showToast(dbCheck.error || '数据库验证失败'); return }
    const cfg: NotionConfig = { apiKey: notionKey.trim(), databaseId: notionDbId.trim() }
    await storage.setNotionConfig?.(cfg); showToast('Notion 配置已保存')
  }

  const handlePull = async () => {
    if (!notionKey.trim() || !notionDbId.trim()) { showToast('请先配置 Notion API Key 和 Database ID'); return }
    setSyncing(true); const result = await pullTagsFromNotion(notionKey.trim(), notionDbId.trim())
    if (result.ok) { const count = await importTags(result.tags); setTags(await getAllTags()); showToast(`已从 Notion 拉取并合并 ${count} 个标签`) }
    else showToast(result.error)
    setSyncing(false)
  }

  const handlePush = async () => {
    if (!notionKey.trim() || !notionDbId.trim()) { showToast('请先配置 Notion API Key 和 Database ID'); return }
    setSyncing(true); const result = await pushTagsToNotion(notionKey.trim(), notionDbId.trim(), tags)
    if (result.ok) showToast('已同步到 Notion'); else showToast(result.error)
    setSyncing(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>添加标签</div>
        <input className="x-manage-input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} placeholder="标签文字" style={{ marginBottom: 6 }} autoFocus />
        <input className="x-manage-input" type="text" value={handle} onChange={e => setHandle(e.target.value)} placeholder="@用户名（例如 /elonmusk）" style={{ marginBottom: 6 }} />
        <input className="x-manage-input" type="text" value={tweetUrl} onChange={e => setTweetUrl(e.target.value)} placeholder="推文链接（可选，点击标签可跳转）" style={{ marginBottom: 6 }} />
        <button className="x-manage-btn x-manage-btn-primary" onClick={handleAdd} disabled={!input.trim() || !handle.trim()}>添加标签</button>
      </div>
      {tags.length === 0 ? (
        <div className="x-manage-empty"><div className="x-manage-empty-icon">🏷️</div><div>暂无标签</div><div style={{ fontSize: 12, marginTop: 4 }}>在推文上点击「+标签」按钮添加，或在上方手动添加</div></div>
      ) : (
        <div className="x-manage-word-list">
          {groupByAuthor(tags).map(([authorHandle, authorTags]) => (
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
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
      <div>
        <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>Notion 同步</div>
        <div style={{ fontSize: 11, color: '#636e72', marginBottom: 8, lineHeight: 1.5 }}>在 Notion 中创建一个 Database，添加以下属性列：ID(title)、authorHandle、authorName、tweetId、tweetTag(url)、tag、createdAt、updatedAt（均为文本类型）。然后将 Database 分享给你的 Integration，在此填入 API Key 和 Database ID。</div>
        <input className="x-manage-input" type="password" value={notionKey} onChange={e => setNotionKey(e.target.value)} placeholder="Notion API Key" style={{ marginBottom: 6 }} />
        <input className="x-manage-input" type="text" value={notionDbId} onChange={e => setNotionDbId(e.target.value)} placeholder="Database ID" style={{ marginBottom: 8 }} />
        <div className="x-manage-io-buttons">
          <button className="x-manage-btn x-manage-btn-primary" onClick={handleSaveNotion} disabled={syncing}>保存配置</button>
          <button className={`x-manage-btn ${syncing ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handlePull} disabled={syncing}>{syncing ? '同步中…' : '从 Notion 拉取'}</button>
          <button className={`x-manage-btn ${syncing ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handlePush} disabled={syncing}>{syncing ? '同步中…' : '同步到 Notion'}</button>
        </div>
      </div>
    </div>
  )
}
