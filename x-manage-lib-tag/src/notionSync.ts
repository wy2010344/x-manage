import { createNotionClient, ensureNotionDatabase, listAllChildDatabases, notionErrorMessage, readLastPushedAt, writeLastPushedAt } from 'x-manage-share'
import type { TweetTag, TagStorage } from './types'
import { getAllTags, importTags } from './tagStore'

const NOTION_VERSION = '2025-09-03'
export { NOTION_VERSION as NOTION_TAG_VERSION }
/** 根页面下按作者自动建的子数据库命名：`标签 (@@handle)` */
const DB_PREFIX = '标签 (@'
const LAST_PUSHED_KEY = 'x-manage-tags-lastPushedAt'

function dbTitle(handle: string): string {
  return `${DB_PREFIX}${handle})`
}

const DB_SCHEMA = {
  ID: { title: {} },
  authorHandle: { rich_text: {} },
  authorName: { rich_text: {} },
  tweetId: { rich_text: {} },
  tweetUrl: { url: {} },
  tag: { rich_text: {} },
  createdAt: { number: {} },
  updatedAt: { number: {} },
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

/** 查询现有页面 id → page_id 映射（ID 是主键，分页完整拉取） */
async function fetchExistingPageIds(client: any, databaseId: string): Promise<Map<string, string>> {
  const existing = new Map<string, string>()
  let cursor: string | undefined
  while (true) {
    const r = await client.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
    })
    for (const page of r.results ?? []) {
      const id = page.properties?.ID?.title?.[0]?.text?.content
      if (id) existing.set(id, page.id)
    }
    if (!r.has_more) break
    cursor = r.next_cursor
  }
  return existing
}

async function pushRowsToDatabase(tokenOrUrl: string, databaseId: string, rows: TweetTag[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createNotionClient(tokenOrUrl, NOTION_VERSION)
    const existingMap = await fetchExistingPageIds(client, databaseId)

    let idx = 0
    for (const tag of rows) {
      const existingPageId = existingMap.get(tag.id)
      if (existingPageId) {
        await client.pages.update({ page_id: existingPageId, properties: tagToPageProperties(tag) })
      } else {
        await client.pages.create({
          parent: { database_id: databaseId },
          properties: tagToPageProperties(tag),
        })
      }
      idx++
      if (idx % 3 === 0) await new Promise(r => setTimeout(r, 1100))
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '推送标签时请求失败') }
  }
}

async function pullRowsFromDatabase(tokenOrUrl: string, databaseId: string): Promise<TweetTag[]> {
  const rows: TweetTag[] = []
  let cursor: string | undefined
  try {
    const client = createNotionClient(tokenOrUrl, NOTION_VERSION)
    while (true) {
      const r = await client.databases.query({
        database_id: databaseId,
        page_size: 100,
        start_cursor: cursor,
      })
      for (const page of r.results ?? []) {
        const tag = pageToTag(page)
        if (tag && tag.id) rows.push(tag)
      }
      if (!r.has_more) break
      cursor = r.next_cursor
    }
  } catch { /* 单个库拉取失败时返回已取到的部分 */ }
  return rows
}

async function getSetup(storage: TagStorage) {
  const setup = await storage.getNotionSetup?.().catch(() => null)
  return setup && setup.proxyUrl.trim() && setup.rootPageId.trim() ? setup : null
}

/**
 * 增量推送到 Notion：在根页面下按作者自动建/复用 `标签 (@handle)` 子数据库。
 * 只推送 updatedAt > 上次推送时间的行；成功后更新游标。
 */
export async function pushTagsUnpushed(storage: TagStorage): Promise<{ ok: boolean; pushed?: number; message?: string; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const last = readLastPushedAt(LAST_PUSHED_KEY)
  const all = await getAllTags().catch(() => [])
  const pending = all.filter(t => t.updatedAt > last)
  if (!pending.length) return { ok: true, message: '无需推送' }

  const groups = new Map<string, TweetTag[]>()
  for (const t of pending) {
    const arr = groups.get(t.authorHandle) ?? []
    arr.push(t)
    groups.set(t.authorHandle, arr)
  }
  const maxUpdated = pending.reduce((m, t) => Math.max(m, t.updatedAt), 0)

  for (const [handle, rows] of groups) {
    const ens = await ensureNotionDatabase({
      tokenOrUrl: setup.proxyUrl,
      notionVersion: NOTION_VERSION,
      rootPageId: setup.rootPageId,
      title: dbTitle(handle),
      properties: DB_SCHEMA,
      author: handle,
    })
    if (!ens.ok) return { ok: false, error: `${handle}: ${ens.error}` }
    const r = await pushRowsToDatabase(setup.proxyUrl, ens.databaseId, rows)
    if (!r.ok) return { ok: false, error: `${handle}: ${r.error}` }
  }

  writeLastPushedAt(LAST_PUSHED_KEY, maxUpdated)
  return { ok: true, pushed: pending.length }
}

/** 从 Notion 全量拉取所有 `标签 (@` 作者库并合并到本地（手动恢复用；根为数据库时遍历所有记录行） */
export async function restoreTags(storage: TagStorage): Promise<{ ok: boolean; count?: number; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const list = await listAllChildDatabases({ tokenOrUrl: setup.proxyUrl, notionVersion: NOTION_VERSION, rootId: setup.rootPageId })
  if (!list.ok) return { ok: false, error: list.error }

  const dbs = list.databases.filter(d => d.title.startsWith(DB_PREFIX))
  const merged: TweetTag[] = []
  for (const db of dbs) {
    const rows = await pullRowsFromDatabase(setup.proxyUrl, db.id)
    merged.push(...rows)
  }
  const count = await importTags(merged)
  return { ok: true, count }
}