import { createNotionClient, ensureNotionDatabase, listChildDatabases, notionErrorMessage, readLastPushedAt, writeLastPushedAt } from 'x-manage-share'
import type { FavTweet, FavStorage } from './types'
import { getAllFavs, importFavs } from './favStore'

const NOTION_VERSION = '2023-06-01'
export { NOTION_VERSION as NOTION_FAV_VERSION }
/** 根页面下按作者自动建的子数据库命名：`收藏 (@@handle)` */
const DB_PREFIX = '收藏 (@'
const LAST_PUSHED_KEY = 'x-manage-favs-lastPushedAt'

function dbTitle(handle: string): string {
  return `${DB_PREFIX}${handle})`
}

const DB_SCHEMA = {
  ID: { title: {} },
  authorHandle: { rich_text: {} },
  authorName: { rich_text: {} },
  tweetId: { rich_text: {} },
  tweetText: { rich_text: {} },
  tweetUrl: { url: {} },
  createdAt: { number: {} },
  updatedAt: { number: {} },
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

async function pushRowsToDatabase(tokenOrUrl: string, databaseId: string, rows: FavTweet[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createNotionClient(tokenOrUrl, NOTION_VERSION)
    const existingMap = await fetchExistingPageIds(client, databaseId)

    let idx = 0
    for (const fav of rows) {
      const existingPageId = existingMap.get(fav.id)
      if (existingPageId) {
        await client.pages.update({ page_id: existingPageId, properties: favToPageProperties(fav) })
      } else {
        await client.pages.create({
          parent: { database_id: databaseId },
          properties: favToPageProperties(fav),
        })
      }
      idx++
      if (idx % 3 === 0) await new Promise(r => setTimeout(r, 1100))
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: notionErrorMessage(e, '推送收藏时请求失败') }
  }
}

async function pullRowsFromDatabase(tokenOrUrl: string, databaseId: string): Promise<FavTweet[]> {
  const rows: FavTweet[] = []
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
        const fav = pageToFav(page)
        if (fav && fav.id) rows.push(fav)
      }
      if (!r.has_more) break
      cursor = r.next_cursor
    }
  } catch { /* 单个库拉取失败时返回已取到的部分 */ }
  return rows
}

async function getSetup(storage: FavStorage) {
  const setup = await storage.getNotionSetup?.().catch(() => null)
  return setup && setup.proxyUrl.trim() && setup.rootPageId.trim() ? setup : null
}

/**
 * 增量推送到 Notion：在根页面下按作者自动建/复用 `收藏 (@handle)` 子数据库。
 * 只推送 updatedAt > 上次推送时间的行；成功后更新游标。
 */
export async function pushFavsUnpushed(storage: FavStorage): Promise<{ ok: boolean; pushed?: number; message?: string; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const last = readLastPushedAt(LAST_PUSHED_KEY)
  const all = await getAllFavs().catch(() => [])
  const pending = all.filter(f => f.updatedAt > last)
  if (!pending.length) return { ok: true, message: '无需推送' }

  const groups = new Map<string, FavTweet[]>()
  for (const f of pending) {
    const arr = groups.get(f.authorHandle) ?? []
    arr.push(f)
    groups.set(f.authorHandle, arr)
  }
  const maxUpdated = pending.reduce((m, f) => Math.max(m, f.updatedAt), 0)

  for (const [handle, rows] of groups) {
    const ens = await ensureNotionDatabase({
      tokenOrUrl: setup.proxyUrl,
      notionVersion: NOTION_VERSION,
      rootPageId: setup.rootPageId,
      title: dbTitle(handle),
      properties: DB_SCHEMA,
    })
    if (!ens.ok) return { ok: false, error: `${handle}: ${ens.error}` }
    const r = await pushRowsToDatabase(setup.proxyUrl, ens.databaseId, rows)
    if (!r.ok) return { ok: false, error: `${handle}: ${r.error}` }
  }

  writeLastPushedAt(LAST_PUSHED_KEY, maxUpdated)
  return { ok: true, pushed: pending.length }
}

/** 从 Notion 全量拉取所有 `收藏 (@` 作者库并合并到本地（手动恢复用） */
export async function restoreFavs(storage: FavStorage): Promise<{ ok: boolean; count?: number; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const list = await listChildDatabases({ tokenOrUrl: setup.proxyUrl, notionVersion: NOTION_VERSION, rootPageId: setup.rootPageId })
  if (!list.ok) return { ok: false, error: list.error }

  const dbs = list.databases.filter(d => d.title.startsWith(DB_PREFIX))
  const merged: FavTweet[] = []
  for (const db of dbs) {
    const rows = await pullRowsFromDatabase(setup.proxyUrl, db.id)
    merged.push(...rows)
  }
  const count = await importFavs(merged)
  return { ok: true, count }
}