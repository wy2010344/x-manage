import { createNotionClient, ensureNotionDatabase, findAuthorRow, detectRootPageKind, notionErrorMessage, getCurrentUserHandle, readLastPushedAt, writeLastPushedAt } from 'x-manage-share'
import type { FavTweet, FavStorage } from './types'
import { getAllFavs, importFavs } from './favStore'

const NOTION_VERSION = '2023-06-01'
export { NOTION_VERSION as NOTION_FAV_VERSION }
/** 固定业务子数据库命名：`收藏`（登记账号记录页下唯一的收藏库） */
const DB_TITLE = '收藏'
const LAST_PUSHED_KEY = 'x-manage-favs-lastPushedAt'

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
 * 增量推送到 Notion：在登记账号记录页下建/复用固定 `收藏` 子数据库。
 * 只推送 updatedAt > 上次推送时间的行；成功后更新游标。
 * 根为页面时直接在页面下建库；根为数据库时按当前登录账号定位/创建登记记录行。
 */
export async function pushFavsUnpushed(storage: FavStorage): Promise<{ ok: boolean; pushed?: number; message?: string; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const last = readLastPushedAt(LAST_PUSHED_KEY)
  const all = await getAllFavs().catch(() => [])
  const pending = all.filter(f => f.updatedAt > last)
  if (!pending.length) return { ok: true, message: '无需推送' }

  const account = getCurrentUserHandle()
  const kind = await detectRootPageKind({ tokenOrUrl: setup.proxyUrl, notionVersion: NOTION_VERSION, rootPageId: setup.rootPageId })
  const isDatabaseRoot = kind.kind === 'database'

  let author: string | undefined
  if (isDatabaseRoot) {
    if (!account) return { ok: false, error: '根对象是数据库，需要当前登录账号作为登记账号，但读取当前账号失败' }
    author = account
  }

  const ens = await ensureNotionDatabase({
    tokenOrUrl: setup.proxyUrl,
    notionVersion: NOTION_VERSION,
    rootPageId: setup.rootPageId,
    title: DB_TITLE,
    properties: DB_SCHEMA,
    author,
  })
  if (!ens.ok) return { ok: false, error: ens.error }

  const maxUpdated = pending.reduce((m, f) => Math.max(m, f.updatedAt), 0)
  const r = await pushRowsToDatabase(setup.proxyUrl, ens.databaseId, pending)
  if (!r.ok) return { ok: false, error: r.error }

  writeLastPushedAt(LAST_PUSHED_KEY, maxUpdated)
  return { ok: true, pushed: pending.length }
}

/** 从 Notion 拉取登记账号记录页下的固定 `收藏` 库并合并到本地（手动恢复用；根为数据库时定位登记账号行） */
export async function restoreFavs(storage: FavStorage): Promise<{ ok: boolean; count?: number; error?: string }> {
  const setup = await getSetup(storage)
  if (!setup) return { ok: false, error: '未配置 Notion 同步' }

  const account = getCurrentUserHandle()
  let hostPageId = setup.rootPageId
  const kind = await detectRootPageKind({ tokenOrUrl: setup.proxyUrl, notionVersion: NOTION_VERSION, rootPageId: setup.rootPageId })

  if (kind.kind === 'database') {
    if (!account) return { ok: false, error: '根对象是数据库，需要当前登录账号作为登记账号，但读取当前账号失败' }
    const row = await findAuthorRow({ tokenOrUrl: setup.proxyUrl, notionVersion: NOTION_VERSION, databaseId: setup.rootPageId, author: account })
    if (!row.ok) return { ok: false, error: row.error ?? '根数据库中未找到登记账号记录行' }
    hostPageId = row.rowPageId
  }

  const client = createNotionClient(setup.proxyUrl, NOTION_VERSION)
  let cursor: string | undefined
  let targetDbId: string | null = null
  try {
    while (true) {
      const r: any = await client.blocks.children.list({ block_id: hostPageId, page_size: 100, start_cursor: cursor })
      for (const b of r.results ?? []) {
        if (b.type === 'child_database') {
          const titleRaw = b.child_database?.title
          const title = Array.isArray(titleRaw) ? titleRaw.map((x: any) => x.plain_text ?? '').join('') : String(titleRaw ?? '')
          if (title === DB_TITLE) { targetDbId = b.id; break }
        }
      }
      if (targetDbId || !r.has_more) break
      cursor = r.next_cursor
    }
  } catch { /* 读取失败按无库处理 */ }

  if (!targetDbId) return { ok: true, count: 0 }
  const rows = await pullRowsFromDatabase(setup.proxyUrl, targetDbId)
  const count = await importFavs(rows)
  return { ok: true, count }
}