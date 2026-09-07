export interface FavTweet {
  id: string
  authorHandle: string
  authorName: string
  tweetId: string
  tweetText: string
  tweetUrl: string
  createdAt: number
  updatedAt: number
}

export interface FavNotionConfig {
  apiKey: string
  databaseId: string
}

/** Notion 独立配置，直接写入 favs 的 IndexedDB，无需外部 storage provider */
export interface FavStorage {
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
