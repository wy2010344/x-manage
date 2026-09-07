import { openDB, type IDBPDatabase } from 'idb'
import type { FavTweet, FavNotionConfig } from './types'

const DB_NAME = 'x-manage-favs'
const STORE = 'favs'
const NOTION_STORE = 'fav-notion-config'

let dbPromise: Promise<IDBPDatabase> | null = null

// 全量收藏内存缓存：DOM 变更触发的高频读取不再每次走 IndexedDB，写操作后失效
let cache: FavTweet[] | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(NOTION_STORE)) {
          db.createObjectStore(NOTION_STORE, { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllFavs(): Promise<FavTweet[]> {
  if (cache) return cache
  const db = await getDb()
  cache = await db.getAll(STORE)
  return cache
}

function invalidate(): void {
  cache = null
}

export async function getFavsByAuthor(authorHandle: string): Promise<FavTweet[]> {
  const all = await getAllFavs()
  return all.filter(f => f.authorHandle.toLowerCase() === authorHandle.toLowerCase())
}

export async function getFavByTweetId(tweetId: string): Promise<FavTweet | undefined> {
  const all = await getAllFavs()
  return all.find(f => f.tweetId === tweetId)
}

export async function isTweetFavorited(tweetId: string): Promise<boolean> {
  return Boolean(await getFavByTweetId(tweetId))
}

export async function addFav(fav: FavTweet): Promise<void> {
  const db = await getDb()
  await db.put(STORE, fav)
  invalidate()
}

export async function removeFav(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
  invalidate()
}

export async function removeFavByTweetId(tweetId: string): Promise<void> {
  const existing = await getFavByTweetId(tweetId)
  if (existing) await removeFav(existing.id)
}

export async function deleteAllFavs(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE)
  invalidate()
}

export async function importFavs(favs: FavTweet[]): Promise<number> {
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  let count = 0
  for (const fav of favs) {
    const existing = await tx.store.get(fav.id)
    if (!existing || fav.updatedAt > existing.updatedAt) {
      await tx.store.put(fav)
      count++
    }
  }
  await tx.done
  invalidate()
  return count
}

/** Notion 独立配置读写 */
export async function getFavNotionConfig(): Promise<FavNotionConfig | null> {
  const db = await getDb()
  const row = await db.get<{ key: string; value: FavNotionConfig }>(NOTION_STORE, 'notion')
  return row?.value || null
}

export async function setFavNotionConfig(config: FavNotionConfig): Promise<void> {
  const db = await getDb()
  await db.put(NOTION_STORE, { key: 'notion', value: config })
}
