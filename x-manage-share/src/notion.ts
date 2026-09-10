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
      const res = await fetch(tr, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(data),
      })
      const json: any = await res.json().catch(() => ({}))
      // 代理的错误形态有两种：
      // 1. 透传官方错误体：{ object:'error', code, status, message }
      // 2. chat-note 代理序列化的 SDK APIResponseError：{ name, code, status, body:'{...}' }
      // 且失败时 HTTP 仍是 200，必须主动解析并抛出，否则上层会把错误当成功数据用。
      let payload: any = json
      if (json?.name === 'APIResponseError') {
        try { payload = JSON.parse(json.body ?? '{}') } catch { payload = json }
      }
      if (!res.ok || payload?.object === 'error') {
        const err: any = new Error(payload?.message || `Notion request failed (HTTP ${res.status})`)
        err.status = typeof payload?.status === 'number' ? payload.status : res.status
        err.code = payload?.code || (res.ok ? 'proxy_error' : 'proxy_http_error')
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

/** 列出根页面下所有直接子数据库（child_database 块），用于自动复用/自动建库 */
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
    return { ok: false, error: notionErrorMessage(e, '读取根页面失败') }
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
    const client = createNotionClient(opts.tokenOrUrl, opts.notionVersion)
    const r: any = await client.databases.create({
      parent: { type: 'page_id', page_id: opts.rootPageId },
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