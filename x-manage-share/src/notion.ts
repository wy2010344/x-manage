/**
 * Notion HTTP 请求统一封装 + 页面/数据库自动探测逻辑。
 * tokenOrUrl 兼容两种凭证，由调用侧无需关心是哪种：
 * - 以 http:// 或 https:// 开头 → 代理 URL：POST 到该代理（body 为 Notion SDK 风格的
 *   { method, path, query, body }），token/Notion-Version 由代理端持有
 * - 否则 → 官方 API Key：直连 https://api.notion.com
 */
const NOTION_API = 'https://api.notion.com'

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

export interface NotionFetchOptions {
  tokenOrUrl: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** 官方 API 相对路径，如 /v1/users/me、/v1/databases/xxx/query */
  path: string
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  notionVersion: string
}

export interface NotionFetchResult {
  ok: boolean
  status: number
  data: any
}

export async function notionFetch(opts: NotionFetchOptions): Promise<NotionFetchResult> {
  const tokenOrUrl = opts.tokenOrUrl.trim()
  let res: Response
  if (isNotionProxyUrl(tokenOrUrl)) {
    // 代理端与 chat-note 一致：期望 SDK 规范化格式（小写 method + 不带 /v1/ 前缀的 path），
    // token/Notion-Version 由代理持有。直接传 /v1/xxx + 大写 method 会拼出无效 URL。
    const proxyMethod = opts.method.toLowerCase()
    const proxyPath = opts.path.replace(/^\/v1\//, '')
    res = await fetch(tokenOrUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ method: proxyMethod, path: proxyPath, query: opts.query, body: opts.body }),
    })
  } else {
    const url = new URL(`${NOTION_API}${opts.path}`)
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, String(v))
    }
    res = await fetch(url, {
      method: opts.method,
      headers: {
        Authorization: `Bearer ${tokenOrUrl}`,
        'Notion-Version': opts.notionVersion,
        'Content-Type': 'application/json',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  }
  let data: any = {}
  try { data = await res.json() } catch { /* 非 JSON 响应时保持空对象 */ }
  return { ok: res.ok, status: res.status, data }
}

export interface ChildDatabase {
  id: string
  title: string
}

/** 从 Notion 响应里提取可读的错误描述，用于诊断（代理模式 data 可能是后端包装的结构） */
function extractError(data: any, fallback: string): string {
  const d = data?.error ?? data?.data?.error ?? data
  if (Array.isArray(d)) return fallback
  const code = typeof d?.code === 'string' ? d.code : ''
  const message = typeof d?.message === 'string' ? d.message : ''
  const detail = code && message ? `${code}: ${message}` : (code || message || '')
  return detail ? `${fallback}（${detail}）` : fallback
}

/** 列出根页面下所有直接子数据库（child_database 块），用于自动复用/自动建库 */
export async function listChildDatabases(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootPageId: string
}): Promise<{ ok: true; databases: ChildDatabase[] } | { ok: false; error: string }> {
  const databases: ChildDatabase[] = []
  let cursor: string | undefined
  try {
    while (true) {
      const query: Record<string, unknown> = { page_size: 100 }
      if (cursor) query.start_cursor = cursor
      const r = await notionFetch({
        tokenOrUrl: opts.tokenOrUrl,
        method: 'GET',
        path: `/v1/blocks/${opts.rootPageId}/children`,
        query,
        notionVersion: opts.notionVersion,
      })
      if (!r.ok) return { ok: false, error: extractError(r.data, `读取根页面失败 (${r.status})`) }
      for (const b of r.data.results ?? []) {
        if (b.type === 'child_database' && b.child_database) {
          const titleRaw = b.child_database.title
          const title = Array.isArray(titleRaw)
            ? titleRaw.map((x: any) => x.plain_text ?? '').join('')
            : String(titleRaw ?? '')
          databases.push({ id: b.id, title })
        }
      }
      if (!r.data.has_more) break
      cursor = r.data.next_cursor
    }
    return { ok: true, databases }
  } catch {
    return { ok: false, error: '读取根页面时网络错误' }
  }
}

/** 在根页面下查找标题匹配的子数据库；不存在则自动创建，返回其 database_id */
export async function ensureNotionDatabase(opts: {
  tokenOrUrl: string
  notionVersion: string
  rootPageId: string
  title: string
  properties: Record<string, unknown>
}): Promise<{ ok: true; databaseId: string } | { ok: false; error: string }> {
  const list = await listChildDatabases(opts)
  if (!list.ok) return list
  const found = list.databases.find(d => d.title === opts.title)
  if (found) return { ok: true, databaseId: found.id }
  try {
    const r = await notionFetch({
      tokenOrUrl: opts.tokenOrUrl,
      method: 'POST',
      path: '/v1/databases',
      body: {
        parent: { type: 'page_id', page_id: opts.rootPageId },
        title: [{ type: 'text', text: { content: opts.title } }],
        properties: opts.properties,
      },
      notionVersion: opts.notionVersion,
    })
    if (!r.ok) return { ok: false, error: extractError(r.data, `创建数据库失败 (${r.status})`) }
    return { ok: true, databaseId: r.data.id }
  } catch {
    return { ok: false, error: '创建数据库时网络错误' }
  }
}

/** 上次增量推送的时间戳（本地缓存，用于「定期自动推送」的去重游标） */
export function readLastPushedAt(key: string): number {
  try { return Number(localStorage.getItem(key) || '0') } catch { return 0 }
}

export function writeLastPushedAt(key: string, ts: number): void {
  try { localStorage.setItem(key, String(ts)) } catch { /* 隐私模式等场景静默失败 */ }
}