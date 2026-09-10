import { Client } from '@notionhq/client'

/**
 * Notion 客户端统一封装。
 * tokenOrUrl 兼容两种凭证：
 * - 以 http:// 或 https:// 开头 → 代理 URL：用官方 SDK，但覆写 request 将 SDK 规范化
 *   的请求对象（method 小写、path 不带 /v1/、query/body）POST 到代理，token/Notion-Version
 *   由代理端持有（与 chat-note 同款协议）
 * - 否则 → 官方 API Key：SDK 默认直连 https://api.notion.com
 */

export function isNotionProxyUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value ?? '').trim())
}

/** 从 Notion 页面链接或页面/数据库 ID 中解析出 UUID 格式 ID（官方 API 可用） */
export function parseNotionPageId(value: string): string | null {
  const v = String(value ?? '').trim()
  const hyphen = v.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (hyphen) return hyphen[1].toLowerCase()
  const compact = v.match(/([0-9a-f]{32})/i)
  if (!compact) return null
  const h = compact[1].toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** 从异常提取可读错误描述（兼容 SDK 的 APIResponseError 与结构相近的普通 Error） */
export function notionErrorMessage(e: unknown, fallback: string): string {
  const any = e as { code?: unknown; message?: unknown; status?: unknown }
  const code = typeof any?.code === 'string' ? any.code : ''
  const message = typeof any?.message === 'string' ? any.message : ''
  const detail = code && message ? `${code}: ${message}` : (code || message || '')
  return detail ? `${fallback}（${detail}）` : fallback
}

/**
 * 代理 POST 实现：优先使用油猴 GM_xmlhttpRequest（绕过页面 CSP / 跨域限制），
 * 回退到浏览器 fetch（Chrome 扩展 content script 需要 host_permissions 覆盖代理域）。
 * 返回 HTTPS status + 已解析 JSON。fetch 失败或 HTTP 错误由上层统一按错误抛。
 */
async function proxyPost(url: string, body: string): Promise<{ status: number; json: any }> {
  const gm = (globalThis as unknown as { GM_xmlhttpRequest?: (opts: {
    method: string
    url: string
    headers: Record<string, string>
    data: string
    onload: (res: { status: number; responseText: string }) => void
    onerror: (res: { status?: number; error?: string }) => void
    timeout?: number
  }) => void }).GM_xmlhttpRequest
  if (typeof gm === 'function') {
    return new Promise((resolve, reject) => {
      gm({
        method: 'POST',
        url,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        data: body,
        timeout: 30000,
        onload: res => {
          let json: any = {}
          try { json = JSON.parse(res.responseText || '{}') } catch { /* 保持空对象 */ }
          resolve({ status: res.status, json })
        },
        onerror: res => {
          const err: any = new Error(res?.error || `Network error while reaching proxy (HTTP ${res?.status ?? 0})`)
          err.status = res?.status || 0
          err.code = 'network_error'
          reject(err)
        },
      })
    })
  }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body })
  const json: any = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

/**
 * 创建统一 Notion 客户端：代理 URL 用「SDK + request 覆写」，API Key 用 SDK 默认直连。
 * 业务代码一律通过 SDK 高层 API（databases.query / pages.create / blocks.children.list…）调用，
 * 路径、方法、分页、错误类型全部由官方 SDK 规范化。
 */
export function createNotionClient(tokenOrUrl: string, notionVersion: string): Client {
  const tr = String(tokenOrUrl ?? '').trim()
  if (!tr) throw new Error('Notion sync is not configured')
  if (isNotionProxyUrl(tr)) {
    const client = new Client({ notionVersion })
    client.request = (async (data: any) => {
      const res = await proxyPost(tr, JSON.stringify(data))
      const json: any = res.json
      // 代理的错误形态有两种：
      // 1. 透传官方错误体：{ object:'error', code, status, message }
      // 2. chat-note 代理序列化的 SDK APIResponseError：{ name, code, status, body:'{...}' }
      // 且失败时 HTTP 仍是 200，必须主动解析并抛出，否则上层会把错误当成功数据用。
      let payload: any = json
      if (json?.name === 'APIResponseError') {
        try { payload = JSON.parse(json.body ?? '{}') } catch { payload = json }
      }
      const failed = res.status === 0 || res.status >= 400 || payload?.object === 'error'
      if (failed) {
        const err: any = new Error(payload?.message || `Notion request failed (HTTP ${res.status})`)
        err.status = typeof payload?.status === 'number' ? payload.status : res.status
        err.code = payload?.code || (res.status >= 400 ? 'proxy_http_error' : 'proxy_error')
        err.body = payload
        throw err
      }
      return json
    }) as Client['request']
    return client
  }
  return new Client({ auth: tr, notionVersion })
}

export interface ChildDatabase {
  id: string
  title: string
}

/**
 * 检测根对象类型。Notion 支持两种「根」：
 * - 普通页面（page/child_page）：业务子库直接建在该页面下
 * - 数据库（database/child_database）：业务子库建在「每位用户一行」的记录页下
 */
export async function detectRootPageKind(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootPageId: string
}): Promise<{ kind: 'page' } | { kind: 'database' } | { error: string }> {
  try {
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    const b: any = await client.blocks.retrieve({ block_id: opts.rootPageId })
    if (b.type === 'page' || b.type === 'child_page') return { kind: 'page' }
    if (b.type === 'database' || b.type === 'child_database') return { kind: 'database' }
    return { error: `无法识别的 Notion 对象类型：${b.type}` }
  } catch (e) {
    return { error: notionErrorMessage(e, '无法访问根对象') }
  }
}

/** 从数据库 properties 中选一个适合存作者/用户名的列：优先即用列，否则回退到首个 title 列 */
function pickAuthorProperty(properties: Record<string, any>): string | null {
  const preferred = ['author', 'handle', 'user', '用户', '作者', '用户名', 'handle_']
  const entries = Object.entries(properties ?? {})
  for (const key of preferred) {
    const found = entries.find(([name, prop]) => name.toLowerCase() === key.toLowerCase() && (prop.type === 'title' || prop.type === 'rich_text'))
    if (found) return found[0]
  }
  const titleProp = entries.find(([, prop]) => prop.type === 'title')
  return titleProp ? titleProp[0] : null
}

/**
 * 在根数据库中定位「作者=author」的记录行（page），不存在则自动创建该行。
 * 数据库模式下每条记录代表一位用户，业务子库将建在返回的记录页之下。
 */
async function resolveAuthorRow(opts: {
  tokenOrUrl: string
  notionVersion: string
  databaseId: string
  author: string
}): Promise<{ ok: true; rowPageId: string } | { ok: false; error: string }> {
  try {
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    const db: any = await client.databases.retrieve({ database_id: opts.databaseId })
    const authorProp = pickAuthorProperty(db.properties)
    if (!authorProp) return { ok: false, error: '根数据库中未找到可用于作者索引的文本列' }
    const propType = db.properties[authorProp].type
    const filterName = propType === 'title' ? 'title' : 'rich_text'
    const q: any = await client.databases.query({
      database_id: opts.databaseId,
      filter: { property: authorProp, [filterName]: { equals: opts.author } },
      page_size: 1,
    })
    if (q.results?.length) return { ok: true, rowPageId: q.results[0].id }
    const props: any = propType === 'title'
      ? { [authorProp]: { title: [{ text: { content: opts.author } }] } }
      : { [authorProp]: { rich_text: [{ text: { content: opts.author } }] } }
    const row: any = await client.pages.create({ parent: { database_id: opts.databaseId }, properties: props })
    return { ok: true, rowPageId: row.id }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '在根数据库中定位作者失败') }
  }
}

/** 列出根对象下所有直接子数据库（child_database 块），用于自动复用/自动建库 */
export async function listChildDatabases(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootPageId: string
}): Promise<{ ok: true; databases: ChildDatabase[] } | { ok: false; error: string }> {
  const databases: ChildDatabase[] = []
  let cursor: string | undefined
  try {
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    while (true) {
      const r: any = await client.blocks.children.list({
        block_id: opts.rootPageId,
        page_size: 100,
        start_cursor: cursor,
      })
      for (const b of r.results ?? []) {
        if (b.type === 'child_database' && b.child_database) {
          const titleRaw = b.child_database.title
          const title = Array.isArray(titleRaw)
            ? titleRaw.map((x: any) => x.plain_text ?? '').join('')
            : String(titleRaw ?? '')
          databases.push({ id: b.id, title })
        }
      }
      if (!r.has_more) break
      cursor = r.next_cursor
    }
    return { ok: true, databases }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '读取根对象失败') }
  }
}

/**
 * 列出根下全部业务子库：
 * - 根是普通页面：该页面下的子库
 * - 根是数据库：先遍历所有记录行（每行=一位用户），收集每行下的子库
 */
export async function listAllChildDatabases(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootId: string
}): Promise<{ ok: true; databases: ChildDatabase[] } | { ok: false; error: string }> {
  const kind = await detectRootPageKind({ tokenOrUrl: opts.tokenOrUrl, notionVersion: opts.notionVersion, rootPageId: opts.rootId })
  if (kind.error) return { ok: false, error: kind.error }
  if (kind.kind === 'page') return listChildDatabases({ tokenOrUrl: opts.tokenOrUrl, notionVersion: opts.notionVersion, rootPageId: opts.rootId })

  const all: ChildDatabase[] = []
  let cursor: string | undefined
  try {
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    while (true) {
      const q: any = await client.databases.query({ database_id: opts.rootId, page_size: 100, start_cursor: cursor })
      for (const row of q.results ?? []) {
        const r = await listChildDatabases({ tokenOrUrl: opts.tokenOrUrl, notionVersion: opts.notionVersion, rootPageId: row.id })
        if (r.ok) all.push(...r.databases)
      }
      if (!q.has_more) break
      cursor = q.next_cursor
    }
    return { ok: true, databases: all }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '读取根数据库失败') }
  }
}

/**
 * 确保业务子库存在（不存在则自动创建）：
 * - 根是普通页面：直接在该页面下建/复用子库
 * - 根是数据库：先按 author 定位/创建该用户的记录行，再在记录页下建/复用子库
 */
export async function ensureNotionDatabase(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootPageId: string
  title: string
  properties: Record<string, unknown>
  /** 数据库根模式下必填：作者/用户名，用于定位该用户的记录行 */
  author?: string
}): Promise<{ ok: true; databaseId: string } | { ok: false; error: string }> {
  const kind = await detectRootPageKind(opts)
  if (kind.error) return { ok: false, error: kind.error }
  let hostPageId = opts.rootPageId
  if (kind.kind === 'database') {
    if (!opts.author) return { ok: false, error: '根对象是数据库，请提供作者以定位记录行' }
    const row = await resolveAuthorRow({ tokenOrUrl: opts.tokenOrUrl, notionVersion: opts.notionVersion, databaseId: opts.rootPageId, author: opts.author })
    if (!row.ok) return row
    hostPageId = row.rowPageId
  }
  const list = await listChildDatabases({ tokenOrUrl: opts.tokenOrUrl, notionVersion: opts.notionVersion, rootPageId: hostPageId })
  if (!list.ok) return list
  const found = list.databases.find(d => d.title === opts.title)
  if (found) return { ok: true, databaseId: found.id }
  try {
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    const r: any = await client.databases.create({
      parent: { type: 'page_id', page_id: hostPageId },
      title: [{ type: 'text', text: { content: opts.title } }],
      properties: opts.properties as any,
    })
    return { ok: true, databaseId: r.id }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '创建数据库失败') }
  }
}

/** 上次增量推送的时间戳（本地缓存，用于「定期自动推送」的去重游标） */
export function readLastPushedAt(key: string): number {
  try { return Number(localStorage.getItem(key) || '0') } catch { return 0 }
}

export function writeLastPushedAt(key: string, ts: number): void {
  try { localStorage.setItem(key, String(ts)) } catch { /* 隐私模式等场景静默失败 */ }
}