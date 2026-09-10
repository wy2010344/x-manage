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

export interface NotionSetup {
  /** 代理 URL：Notion 客户端转发路径（token 由代理持有）；未填 API Key */
  proxyUrl: string
  /** 根页面 UUID（解析自用户填写的 Notion 页面链接） */
  rootPageId: string
}

export interface TagStorage {
  getNotionSetup: () => Promise<NotionSetup | null>
  setNotionSetup: (setup: NotionSetup) => Promise<void>
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
