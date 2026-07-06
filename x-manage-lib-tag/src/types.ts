export interface TweetTag {
  id: string
  authorHandle: string
  authorName: string
  tweetId: string
  tweetUrl: string
  tag: string
  createdAt: number
  updatedAt: number
}

export interface NotionConfig {
  apiKey: string
  databaseId: string
}

export interface TagStorage {
  getNotionConfig: () => Promise<NotionConfig | null>
  setNotionConfig: (config: NotionConfig) => Promise<void>
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
