/**
 * Notion HTTP 请求统一封装。
 * tokenOrUrl 兼容两种凭证，由调用侧无需关心是哪种：
 * - 以 http:// 或 https:// 开头 → 代理 URL：POST 到该代理（body 为 Notion SDK 风格的
 *   { method, path, body }），token/Notion-Version 由代理端持有
 * - 否则 → 官方 API Key：直连 https://api.notion.com
 */
const NOTION_API = 'https://api.notion.com'

export function isNotionProxyUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value ?? '').trim())
}

export interface NotionFetchOptions {
  tokenOrUrl: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** 官方 API 相对路径，如 /v1/users/me、/v1/databases/xxx/query */
  path: string
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
    res = await fetch(tokenOrUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ method: opts.method, path: opts.path, body: opts.body }),
    })
  } else {
    res = await fetch(`${NOTION_API}${opts.path}`, {
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