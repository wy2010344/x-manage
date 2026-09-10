import { notionFetch } from 'x-manage-share'
import type { FavTweet } from './types'

const NOTION_VERSION = '2023-06-01'

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

/** tokenOrUrl 支持 Notion API Key 或代理 URL（代理转发请求，token 由代理持有） */
export async function verifyFavNotionToken(tokenOrUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await notionFetch({ tokenOrUrl, method: 'GET', path: '/v1/users/me', notionVersion: NOTION_VERSION })
    if (r.ok) return { ok: true }
    if (r.status === 401) return { ok: false, error: '访问凭证无效' }
    if (r.status === 403) return { ok: false, error: '访问凭证无权限' }
    return { ok: false, error: `Notion API 错误 (${r.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function verifyFavNotionDatabase(tokenOrUrl: string, databaseId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await notionFetch({ tokenOrUrl, method: 'GET', path: `/v1/databases/${databaseId}`, notionVersion: NOTION_VERSION })
    if (r.ok) return { ok: true }
    if (r.status === 404) return { ok: false, error: '数据库不存在或未与 Integration 共享' }
    return { ok: false, error: `数据库验证错误 (${r.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function pullFavsFromNotion(tokenOrUrl: string, databaseId: string): Promise<{ ok: true; favs: FavTweet[] } | { ok: false; error: string }> {
  try {
    const favs: FavTweet[] = []
    let cursor: string | undefined

    while (true) {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor

      const r = await notionFetch({ tokenOrUrl, method: 'POST', path: `/v1/databases/${databaseId}/query`, body, notionVersion: NOTION_VERSION })
      if (!r.ok) return { ok: false, error: `拉取失败 (${r.status})` }

      for (const page of r.data.results) {
        const fav = pageToFav(page)
        if (fav && fav.id) favs.push(fav)
      }
      if (!r.data.has_more) break
      cursor = r.data.next_cursor
    }

    return { ok: true, favs }
  } catch {
    return { ok: false, error: '拉取数据时网络错误' }
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function pushFavsToNotion(tokenOrUrl: string, databaseId: string, favs: FavTweet[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await notionFetch({ tokenOrUrl, method: 'POST', path: `/v1/databases/${databaseId}/query`, body: { page_size: 100 }, notionVersion: NOTION_VERSION })
    if (!r.ok) return { ok: false, error: `同步前查询失败 (${r.status})` }

    const existingMap = new Map<string, string>()
    for (const page of r.data.results) {
      const id = page.properties?.ID?.title?.[0]?.text?.content
      if (id) existingMap.set(id, page.id)
    }

    let cursor = r.data.next_cursor
    while (cursor) {
      const r2 = await notionFetch({ tokenOrUrl, method: 'POST', path: `/v1/databases/${databaseId}/query`, body: { page_size: 100, start_cursor: cursor }, notionVersion: NOTION_VERSION })
      if (!r2.ok) break
      for (const page of r2.data.results) {
        const id = page.properties?.ID?.title?.[0]?.text?.content
        if (id) existingMap.set(id, page.id)
      }
      cursor = r2.data.has_more ? r2.data.next_cursor : undefined
    }

    let idx = 0
    for (const fav of favs) {
      const existingPageId = existingMap.get(fav.id)
      if (existingPageId) {
        const r3 = await notionFetch({ tokenOrUrl, method: 'PATCH', path: `/v1/pages/${existingPageId}`, body: { properties: favToPageProperties(fav) }, notionVersion: NOTION_VERSION })
        if (!r3.ok) return { ok: false, error: `更新收藏 ${fav.id} 失败 (${r3.status})` }
      } else {
        const r3 = await notionFetch({ tokenOrUrl, method: 'POST', path: '/v1/pages', body: { parent: { database_id: databaseId }, properties: favToPageProperties(fav) }, notionVersion: NOTION_VERSION })
        if (!r3.ok) return { ok: false, error: `创建收藏 ${fav.id} 失败 (${r3.status})` }
      }
      idx++
      if (idx % 3 === 0) await sleep(1100)
    }

    return { ok: true }
  } catch {
    return { ok: false, error: '同步到 Notion 时网络错误' }
  }
}