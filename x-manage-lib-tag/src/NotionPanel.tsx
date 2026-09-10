import { useState, useEffect } from 'react'
import { parseNotionPageId, listChildDatabases, readLastPushedAt } from 'x-manage-share'
import type { TweetTag, TagStorage } from './types'
import { getAllTags } from './tagStore'
import { NOTION_TAG_VERSION, pushTagsUnpushed, restoreTags } from './notionSync'

interface Props {
  tags: TweetTag[]
  setTags: (tags: TweetTag[]) => void
  showToast: (msg: string) => void
  storage: TagStorage
}

const LAST_PUSHED_KEY = 'x-manage-tags-lastPushedAt'

export function NotionPanel({ setTags, showToast, storage }: Props) {
  const [proxyUrl, setProxyUrl] = useState('')
  const [rootPageUrl, setRootPageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastPushedAt, setLastPushedAt] = useState(0)

  useEffect(() => {
    storage.getNotionSetup?.().then(s => {
      if (s) { setProxyUrl(s.proxyUrl); setRootPageUrl(s.rootPageId) }
    }).catch(() => {})
    setLastPushedAt(readLastPushedAt(LAST_PUSHED_KEY))
  }, [storage])

  const handleSave = async () => {
    const url = proxyUrl.trim()
    const rootPageId = parseNotionPageId(rootPageUrl)
    if (!url) { showToast('请填写代理 URL'); return }
    if (!/^https?:\/\//i.test(url)) { showToast('代理 URL 需以 http(s):// 开头'); return }
    if (!rootPageId) { showToast('无法解析根页面 ID（请粘贴 Notion 页面链接）'); return }
    setBusy(true)
    const probe = await listChildDatabases({ tokenOrUrl: url, notionVersion: NOTION_TAG_VERSION, rootPageId })
    if (!probe.ok) { showToast(`无法访问根页面：${probe.error}`); setBusy(false); return }
    await storage.setNotionSetup?.({ proxyUrl: url, rootPageId })
    showToast('Notion 配置已保存')
    setBusy(false)
  }

  const handlePush = async () => {
    setBusy(true)
    const r = await pushTagsUnpushed(storage)
    setLastPushedAt(readLastPushedAt(LAST_PUSHED_KEY))
    showToast(r.ok ? (r.message || `已推送 ${r.pushed} 条标签`) : (r.error || '推送失败'))
    setBusy(false)
  }

  const handleRestore = async () => {
    setBusy(true)
    const r = await restoreTags(storage)
    if (r.ok) {
      setTags(await getAllTags())
      showToast(`已从 Notion 恢复并合并 ${r.count} 条标签`)
    } else {
      showToast(r.error || '恢复失败')
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>Notion 同步（全局配置）</div>
      <div style={{ fontSize: 11, color: '#636e72', marginBottom: 8, lineHeight: 1.5 }}>
        全局配置（与「收藏」共用一份）。填入代理 URL 与根页面链接后，系统会按作者自动创建「标签 (@@handle)」子数据库，并每 30 分钟增量自动推送；遇到异常可用「从 Notion 恢复」拉取并合并回本地。
      </div>
      <input className="x-manage-input" type="text" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} placeholder="代理 URL，如 https://example.com/api/notion" style={{ marginBottom: 6 }} />
      <input className="x-manage-input" type="text" value={rootPageUrl} onChange={e => setRootPageUrl(e.target.value)} placeholder="根页面：Notion 页面链接或页面 ID" style={{ marginBottom: 8 }} />
      <div className="x-manage-io-buttons">
        <button className="x-manage-btn x-manage-btn-sm x-manage-btn-primary" onClick={handleSave} disabled={busy}>保存配置</button>
        <button className={`x-manage-btn x-manage-btn-sm ${busy ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handlePush} disabled={busy}>立即推送</button>
        <button className={`x-manage-btn x-manage-btn-sm ${busy ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={handleRestore} disabled={busy}>从 Notion 恢复</button>
      </div>
      {lastPushedAt > 0 && (
        <div style={{ fontSize: 11, color: '#636e72', marginTop: 8 }}>上次推送：{new Date(lastPushedAt).toLocaleString()}</div>
      )}
    </div>
  )
}