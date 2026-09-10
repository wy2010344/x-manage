import { useState } from 'react'
import type { TweetTag, NotionConfig, TagStorage } from './types'
import { getAllTags, importTags } from './tagStore'
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

export function NotionPanel({ tags, setTags, showToast, storage, notionKey, notionDbId, setNotionKey, setNotionDbId }: Props) {
  const [syncing, setSyncing] = useState(false)

  const handleSaveNotion = async () => {
    if (!notionKey.trim()) { showToast('请填写访问凭证（API Key 或代理 URL）'); return }
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
      <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>Notion 同步</div>
      <div style={{ fontSize: 11, color: '#636e72', marginBottom: 8, lineHeight: 1.5 }}>在 Notion 中创建一个 Database，添加以下属性列：ID(title)、authorHandle、authorName、tweetId、tweetUrl(url)、tag、createdAt、updatedAt（均为文本类型）。然后将 Database 分享给你的 Integration，在下方填入 API Key（或代理 URL）和 Database ID。填写以 http(s):// 开头的代理 URL 时将自动走代理转发。</div>
      <input className="x-manage-input" type="password" value={notionKey} onChange={e => setNotionKey(e.target.value)} placeholder="Notion API Key 或代理 URL" style={{ marginBottom: 6 }} />
      <input className="x-manage-input" type="text" value={notionDbId} onChange={e => setNotionDbId(e.target.value)} placeholder="Database ID" style={{ marginBottom: 8 }} />
      <div className="x-manage-io-buttons">
        <button className="x-manage-btn x-manage-btn-sm x-manage-btn-primary" onClick={handleSaveNotion} disabled={syncing}>保存配置</button>
        <button className={`x-manage-btn x-manage-btn-sm ${syncing ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handlePull} disabled={syncing}>{syncing ? '同步中…' : '从 Notion 拉取'}</button>
        <button className={`x-manage-btn x-manage-btn-sm ${syncing ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handlePush} disabled={syncing}>{syncing ? '同步中…' : '同步到 Notion'}</button>
      </div>
    </div>
  )
}
