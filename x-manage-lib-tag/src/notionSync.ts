import type { TweetTag } from './types'

const API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2025-09-03'

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function tagToPageProperties(t: TweetTag) {
  return {
    ID: { title: [{ text: { content: t.id } }] },
    authorHandle: { rich_text: [{ text: { content: t.authorHandle } }] },
    authorName: { rich_text: [{ text: { content: t.authorName } }] },
    tweetId: { rich_text: [{ text: { content: t.tweetId } }] },
    tweetUrl: { url: t.tweetUrl },
    tag: { rich_text: [{ text: { content: t.tag } }] },
    createdAt: { number: t.createdAt },
    updatedAt: { number: t.updatedAt },
  }
}

function pageToTag(page: any): TweetTag | null {
  try {
    const p = page.properties
    return {
      id: p.ID?.title?.[0]?.text?.content || '',
      authorHandle: p.authorHandle?.rich_text?.[0]?.text?.content || '',
      authorName: p.authorName?.rich_text?.[0]?.text?.content || '',
      tweetId: p.tweetId?.rich_text?.[0]?.text?.content || '',
      tweetUrl: p.tweetUrl?.url || '',
      tag: p.tag?.rich_text?.[0]?.text?.content || '',
      createdAt: p.createdAt?.number || 0,
      updatedAt: p.updatedAt?.number || 0,
    }
  } catch { return null }
}

export async function verifyNotionToken(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/me`, { headers: headers(apiKey) })
    if (res.ok) return { ok: true }
    if (res.status === 401) return { ok: false, error: 'API Key 无效' }
    if (res.status === 403) return { ok: false, error: 'API Key 无权限' }
    return { ok: false, error: `Notion API 错误 (${res.status})` }
  } catch (e) {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function verifyNotionDatabase(apiKey: string, databaseId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/databases/${databaseId}`, { headers: headers(apiKey) })
    if (res.ok) return { ok: true }
    if (res.status === 404) return { ok: false, error: '数据库不存在或未与 Integration 共享' }
    return { ok: false, error: `数据库验证错误 (${res.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function pullTagsFromNotion(apiKey: string, databaseId: string): Promise<{ ok: true; tags: TweetTag[] } | { ok: false; error: string }> {
  try {
    const tags: TweetTag[] = []
    let cursor: string | undefined

    while (true) {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor

      const res = await fetch(`${API_BASE}/databases/${databaseId}/query`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify(body),
      })
      if (!res.ok) return { ok: false, error: `拉取失败 (${res.status})` }

      const data = await res.json()
      for (const page of data.results) {
        const tag = pageToTag(page)
        if (tag && tag.id) tags.push(tag)
      }
      if (!data.has_more) break
      cursor = data.next_cursor
    }

    return { ok: true, tags }
  } catch {
    return { ok: false, error: '拉取数据时网络错误' }
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function pushTagsToNotion(apiKey: string, databaseId: string, tags: TweetTag[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify({ page_size: 100 }),
    })
    if (!res.ok) return { ok: false, error: `同步前查询失败 (${res.status})` }

    const data = await res.json()
    const existingMap = new Map<string, string>()
    for (const page of data.results) {
      const id = page.properties?.ID?.title?.[0]?.text?.content
      if (id) existingMap.set(id, page.id)
    }

    let cursor = data.next_cursor
    while (cursor) {
      const r2 = await fetch(`${API_BASE}/databases/${databaseId}/query`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
      })
      if (!r2.ok) break
      const d2 = await r2.json()
      for (const page of d2.results) {
        const id = page.properties?.ID?.title?.[0]?.text?.content
        if (id) existingMap.set(id, page.id)
      }
      cursor = d2.has_more ? d2.next_cursor : undefined
    }

    let idx = 0
    for (const tag of tags) {
      const existingPageId = existingMap.get(tag.id)
      if (existingPageId) {
        const r = await fetch(`${API_BASE}/pages/${existingPageId}`, {
          method: 'PATCH',
          headers: headers(apiKey),
          body: JSON.stringify({ properties: tagToPageProperties(tag) }),
        })
        if (!r.ok) return { ok: false, error: `更新标签 ${tag.id} 失败 (${r.status})` }
      } else {
        const r = await fetch(`${API_BASE}/pages`, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: tagToPageProperties(tag),
          }),
        })
        if (!r.ok) return { ok: false, error: `创建标签 ${tag.id} 失败 (${r.status})` }
      }
      idx++
      if (idx % 3 === 0) await sleep(1100)
    }

    return { ok: true }
  } catch {
    return { ok: false, error: '同步到 Notion 时网络错误' }
  }
}
