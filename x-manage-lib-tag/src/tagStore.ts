import { openDB, type IDBPDatabase } from 'idb'
import type { TweetTag } from './types'

const DB_NAME = 'x-manage-tags'
const STORE = 'tags'

let dbPromise: Promise<IDBPDatabase> | null = null

// 全量标签内存缓存：DOM 变更触发的高频读取不再每次走 IndexedDB，写操作后失效
let cache: TweetTag[] | null = null

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

export async function getAllTags(): Promise<TweetTag[]> {
  if (cache) return cache
  const db = await getDb()
  cache = await db.getAll(STORE)
  return cache
}

function invalidate(): void {
  cache = null
}

export async function getTagsByAuthor(authorHandle: string): Promise<TweetTag[]> {
  const all = await getAllTags()
  return all.filter(t => t.authorHandle.toLowerCase() === authorHandle.toLowerCase())
}

export async function addTag(tag: TweetTag): Promise<void> {
  const db = await getDb()
  await db.add(STORE, tag)
  invalidate()
}

export async function updateTag(id: string, data: Partial<Omit<TweetTag, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDb()
  const existing = await db.get(STORE, id)
  if (!existing) return
  await db.put(STORE, { ...existing, ...data, updatedAt: Date.now() })
  invalidate()
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
  invalidate()
}

export async function deleteAllTags(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE)
  invalidate()
}

export async function importTags(tags: TweetTag[]): Promise<number> {
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  let count = 0
  for (const tag of tags) {
    const existing = await tx.store.get(tag.id)
    if (!existing || tag.updatedAt > existing.updatedAt) {
      await tx.store.put(tag)
      count++
    }
  }
  await tx.done
  invalidate()
  return count
}
