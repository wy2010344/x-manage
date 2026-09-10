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

export interface FavNotionSetup {
  /** 代理 URL：notionFetch 转发路径；未填 API Key（token 由代理持有） */
  proxyUrl: string
  /** 根页面 UUID（解析自用户填写的 Notion 页面链接） */
  rootPageId: string
}

/** 全局 Notion 配置由 tag/fav 共用一份（存于平台 storage），收藏包也消费它 */
export interface FavStorage {
  getNotionSetup: () => Promise<FavNotionSetup | null>
  setNotionSetup: (setup: FavNotionSetup) => Promise<void>
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
