import { notionFetch } from 'x-manage-share'
import type { TweetTag } from './types'

const NOTION_VERSION = '2025-09-03'

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

/** tokenOrUrl 支持 Notion API Key 或代理 URL（代理转发请求，token 由代理持有） */
export async function verifyNotionToken(tokenOrUrl: string): Promise<{ ok: boolean; error?: string }> {
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

export async function verifyNotionDatabase(tokenOrUrl: string, databaseId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await notionFetch({ tokenOrUrl, method: 'GET', path: `/v1/databases/${databaseId}`, notionVersion: NOTION_VERSION })
    if (r.ok) return { ok: true }
    if (r.status === 404) return { ok: false, error: '数据库不存在或未与 Integration 共享' }
    return { ok: false, error: `数据库验证错误 (${r.status})` }
  } catch {
    return { ok: false, error: '无法连接到 Notion API' }
  }
}

export async function pullTagsFromNotion(tokenOrUrl: string, databaseId: string): Promise<{ ok: true; tags: TweetTag[] } | { ok: false; error: string }> {
  try {
    const tags: TweetTag[] = []
    let cursor: string | undefined

    while (true) {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor

      const r = await notionFetch({ tokenOrUrl, method: 'POST', path: `/v1/databases/${databaseId}/query`, body, notionVersion: NOTION_VERSION })
      if (!r.ok) return { ok: false, error: `拉取失败 (${r.status})` }

      for (const page of r.data.results) {
        const tag = pageToTag(page)
        if (tag && tag.id) tags.push(tag)
      }
      if (!r.data.has_more) break
      cursor = r.data.next_cursor
    }

    return { ok: true, tags }
  } catch {
    return { ok: false, error: '拉取数据时网络错误' }
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function pushTagsToNotion(tokenOrUrl: string, databaseId: string, tags: TweetTag[]): Promise<{ ok: true } | { ok: false; error: string }> {
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
    for (const tag of tags) {
      const existingPageId = existingMap.get(tag.id)
      if (existingPageId) {
        const r3 = await notionFetch({ tokenOrUrl, method: 'PATCH', path: `/v1/pages/${existingPageId}`, body: { properties: tagToPageProperties(tag) }, notionVersion: NOTION_VERSION })
        if (!r3.ok) return { ok: false, error: `更新标签 ${tag.id} 失败 (${r3.status})` }
      } else {
        const r3 = await notionFetch({ tokenOrUrl, method: 'POST', path: '/v1/pages', body: { parent: { database_id: databaseId }, properties: tagToPageProperties(tag) }, notionVersion: NOTION_VERSION })
        if (!r3.ok) return { ok: false, error: `创建标签 ${tag.id} 失败 (${r3.status})` }
      }
      idx++
      if (idx % 3 === 0) await sleep(1100)
    }

    return { ok: true }
  } catch {
    return { ok: false, error: '同步到 Notion 时网络错误' }
  }
}