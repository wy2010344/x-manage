import type { FavTweet } from './types'

const API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2023-06-01'

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function favToPageProperties(f: FavTweet) {
  return {
    ID: { title: [{ text: { content: f.id } }] },
    authorHandle: { rich_text: [{ text: { content: f.authorHandle } }] },
    authorName: { rich_text: [{ text: { content: f.authorName } }] },
    tweetId: { rich_text: [{ text: { content: f.tweetId } }] },
    tweetText: { rich_text: [{ text: { content: f.tweetText } }] },
    tweetUrl: { url: f.tweetUrl },
    createdAt: { number: f.createdAt },
    updatedAt: { number: f.updatedAt },
  }
}

function pageToFav(page: any): FavTweet | null {
  try {
    const p = page.properties
    return {
      id: p.ID?.title?.[0]?.text?.content || '',
      authorHandle: p.authorHandle?.rich_text?.[0]?.text?.content || '',
      authorName: p.authorName?.rich_text?.[0]?.text?.content || '',
      tweetId: p.tweetId?.rich_text?.[0]?.text?.content || '',
      tweetText: p.tweetText?.rich_text?.[0]?.text?.content || '',
      tweetUrl: p.tweetUrl?.url || '',
      createdAt: p.createdAt?.number || 0,
      updatedAt: p.updatedAt?.number || 0,
    }
  } catch { return null }
}

export async function verifyFavNotionToken(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/me`, { headers: headers(apiKey) })
    if (res.ok) return { ok: true }
    if (res.status === 401) return { ok: false, error: 'API Key 无效' }
    if (res.status === 403) return { ok: false, error: 'API Key 无权限' }
    return { ok: false, error: `Notion API 错误 (${res.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function verifyFavNotionDatabase(apiKey: string, databaseId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/databases/${databaseId}`, { headers: headers(apiKey) })
    if (res.ok) return { ok: true }
    if (res.status === 404) return { ok: false, error: '数据库不存在或未与 Integration 共享' }
    return { ok: false, error: `数据库验证错误 (${res.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function pullFavsFromNotion(apiKey: string, databaseId: string): Promise<{ ok: true; favs: FavTweet[] } | { ok: false; error: string }> {
  try {
    const favs: FavTweet[] = []
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
        const fav = pageToFav(page)
        if (fav && fav.id) favs.push(fav)
      }
      if (!data.has_more) break
      cursor = data.next_cursor
    }

    return { ok: true, favs }
  } catch {
    return { ok: false, error: '拉取数据时网络错误' }
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function pushFavsToNotion(apiKey: string, databaseId: string, favs: FavTweet[]): Promise<{ ok: true } | { ok: false; error: string }> {
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
    for (const fav of favs) {
      const existingPageId = existingMap.get(fav.id)
      if (existingPageId) {
        const r = await fetch(`${API_BASE}/pages/${existingPageId}`, {
          method: 'PATCH',
          headers: headers(apiKey),
          body: JSON.stringify({ properties: favToPageProperties(fav) }),
        })
        if (!r.ok) return { ok: false, error: `更新收藏 ${fav.id} 失败 (${r.status})` }
      } else {
        const r = await fetch(`${API_BASE}/pages`, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: favToPageProperties(fav),
          }),
        })
        if (!r.ok) return { ok: false, error: `创建收藏 ${fav.id} 失败 (${r.status})` }
      }
      idx++
      if (idx % 3 === 0) await sleep(1100)
    }

    return { ok: true }
  } catch {
    return { ok: false, error: '同步到 Notion 时网络错误' }
  }
}
