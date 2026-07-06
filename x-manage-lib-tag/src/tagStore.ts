import { openDB, type IDBPDatabase } from 'idb'
import type { TweetTag } from './types'

const DB_NAME = 'x-manage-tags'
const STORE = 'tags'

let dbPromise: Promise<IDBPDatabase> | null = null

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
  const db = await getDb()
  return db.getAll(STORE)
}

export async function getTagsByAuthor(authorHandle: string): Promise<TweetTag[]> {
  const all = await getAllTags()
  return all.filter(t => t.authorHandle.toLowerCase() === authorHandle.toLowerCase())
}

export async function addTag(tag: TweetTag): Promise<void> {
  const db = await getDb()
  await db.add(STORE, tag)
}

export async function updateTag(id: string, data: Partial<Omit<TweetTag, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDb()
  const existing = await db.get(STORE, id)
  if (!existing) return
  await db.put(STORE, { ...existing, ...data, updatedAt: Date.now() })
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function deleteAllTags(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE)
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
  return count
}
