import { useState, useEffect } from 'react'
import { detectRootPageKind, parseNotionPageId, readLastPushedAt } from '../notion'

export interface NotionSyncModule {
  id: string
  label: string
  /** 该模块使用的 Notion API 版本 */
  version: string
  /** 该模块增量推送游标在 localStorage 的 key */
  lastPushedKey: string
  push: (storage: unknown) => Promise<{ ok: boolean; message?: string; pushed?: number; error?: string }>
  restore: (storage: unknown) => Promise<{ ok: boolean; count?: number; error?: string }>
}

export interface NotionHubStorage {
  getNotionSetup: () => Promise<{ proxyUrl: string; rootPageId: string } | null>
  setNotionSetup: (setup: { proxyUrl: string; rootPageId: string }) => Promise<void>
}

interface Props {
  storage: NotionHubStorage
  /** 各业务模块注入的同步器（标签/收藏…），共享同一份全局配置 */
  modules: NotionSyncModule[]
  showToast: (msg: string) => void
}

const FALLBACK_VERSION = '2022-06-28'

/**
 * 控制中心「Notion」顶层 tab：全局唯一 Notion 配置（代理 URL + 根页面）。
 * 各业务模块只注册自己的 push/restore，容器负责配置校验、游标显示与按钮编排。
 */
export function NotionHubPanel({ storage, modules, showToast }: Props) {
  const [proxyUrl, setProxyUrl] = useState('')
  const [rootPageUrl, setRootPageUrl] = useState('')
  const [lastPushed, setLastPushed] = useState<Record<string, number>>({})
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    storage.getNotionSetup().then(s => {
      if (s) { setProxyUrl(s.proxyUrl); setRootPageUrl(s.rootPageId) }
    }).catch(() => {})
    const snapshot: Record<string, number> = {}
    for (const m of modules) snapshot[m.id] = readLastPushedAt(m.lastPushedKey)
    setLastPushed(snapshot)
  }, [storage, modules])

  const handleSave = async () => {
    const url = proxyUrl.trim()
    const rootPageId = parseNotionPageId(rootPageUrl)
    if (!url) { showToast('请填写代理 URL'); return }
    if (!/^https?:\/\//i.test(url)) { showToast('代理 URL 需以 http(s):// 开头'); return }
    if (!rootPageId) { showToast('无法解析根页面 ID（请粘贴 Notion 页面链接）'); return }
    setBusyAction('save')
    const version = modules[0]?.version || FALLBACK_VERSION
    const kind = await detectRootPageKind({ tokenOrUrl: url, notionVersion: version, rootPageId })
    if (kind.error) { showToast(`无法访问根对象：${kind.error}`); setBusyAction(null); return }
    await storage.setNotionSetup({ proxyUrl: url, rootPageId })
    showToast('Notion 配置已保存')
    setBusyAction(null)
  }

  const handlePush = async (m: NotionSyncModule) => {
    setBusyAction(`push:${m.id}`)
    const r = await m.push(storage)
    if (r.ok) {
      const t = readLastPushedAt(m.lastPushedKey)
      setLastPushed(prev => ({ ...prev, [m.id]: t }))
      showToast(r.message || `${m.label}：已推送 ${r.pushed} 条`)
    } else {
      showToast(r.error || `${m.label}：推送失败`)
    }
    setBusyAction(null)
  }

  const handleRestore = async (m: NotionSyncModule) => {
    setBusyAction(`restore:${m.id}`)
    const r = await m.restore(storage)
    showToast(r.ok ? `${m.label}：已恢复并合并 ${r.count} 条` : (r.error || `${m.label}：恢复失败`))
    setBusyAction(null)
  }

  const isBusy = (act?: string) => busyAction !== null && (act === undefined || busyAction === act)

  return (
    <div>
      <div className="x-manage-filter-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span>Notion 同步（全局公共配置）</span>
      </div>
      <div style={{ fontSize: 11, color: '#636e72', marginBottom: 8, lineHeight: 1.5 }}>
        所有模块共享同一份配置。填入代理 URL 与根对象链接后，各模块（标签/收藏…）会自动建库并每 30 分钟增量推送；遇到异常可在下方按模块「从 Notion 恢复」拉取并合并回本地。
        <br />根对象支持两种：① 普通页面——直接在该页面下建固定 `标签` / `收藏` 子库；② 数据库——每条记录代表一位用户，业务子库（`标签` / `收藏`）建在当前登录账号对应的登记记录页之下。
      </div>
      <input className="x-manage-input" type="text" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} placeholder="代理 URL，如 https://example.com/api/notion" style={{ marginBottom: 6 }} />
      <input className="x-manage-input" type="text" value={rootPageUrl} onChange={e => setRootPageUrl(e.target.value)} placeholder="根对象：Notion 页面链接、数据库链接或 ID" style={{ marginBottom: 6 }} />
      <div className="x-manage-io-buttons">
        <button className="x-manage-btn x-manage-btn-sm x-manage-btn-primary" onClick={handleSave} disabled={isBusy()}>保存配置</button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modules.map(m => {
          const ts = lastPushed[m.id] || 0
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f7f7', border: '1px solid #ececec', borderRadius: 8, padding: '8px 10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>{m.label}</span>
              <span style={{ fontSize: 11, color: '#636e72' }}>{ts > 0 ? `上次推送 ${new Date(ts).toLocaleString()}` : '尚未推送'}</span>
              <div style={{ flex: 1 }} />
              <button className={`x-manage-btn x-manage-btn-sm ${isBusy(`push:${m.id}`) ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={() => handlePush(m)} disabled={isBusy()}>立即推送</button>
              <button className={`x-manage-btn x-manage-btn-sm ${isBusy(`restore:${m.id}`) ? 'x-manage-btn-secondary' : 'x-manage-btn-primary'}`} onClick={() => handleRestore(m)} disabled={isBusy()}>从 Notion 恢复</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}