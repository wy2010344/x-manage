import { openDB, type IDBPDatabase } from 'idb'
import type { FavTweet } from './types'

const DB_NAME = 'x-manage-favs'
const STORE = 'favs'

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

export interface FavToggleInput {
  authorHandle: string
  authorName: string
  tweetId: string
  tweetUrl: string
  tweetText: string
}

// 串行队列：连点时后续操作基于最新库状态决策，避免"先读后写"竞态产生重复/漏删
let toggleQueue: Promise<unknown> = Promise.resolve()

/** 翻转某推文的收藏状态，返回操作后是否处于已收藏。 */
export function toggleFav(input: FavToggleInput): Promise<boolean> {
  const task = toggleQueue.then(async (): Promise<boolean> => {
    const existing = await getFavByTweetId(input.tweetId)
    if (existing) {
      await removeFav(existing.id)
      return false
    }
    const now = Date.now()
    await addFav({
      id: `${input.authorHandle}_${input.tweetId}_${now}`,
      authorHandle: input.authorHandle,
      authorName: input.authorName || input.authorHandle.replace('/', ''),
      tweetId: input.tweetId,
      tweetText: input.tweetText,
      tweetUrl: input.tweetUrl,
      createdAt: now,
      updatedAt: now,
    })
    return true
  })
  toggleQueue = task.catch(() => {})
  return task
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
