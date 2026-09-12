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
  /** 代理 URL：Notion 客户端转发路径（token 由代理持有） */
  proxyUrl: string
  /** 根页面 UUID（解析自用户填写的 Notion 页面链接） */
  rootPageId: string
  /** 用户填写的根对象原始链接（面板回显用，可选） */
  rootPageUrl?: string
  /** 手动指定登记账号 handle（如 /yangw448531；留空则自动读取当前登录账号） */
  accountHandle?: string
}

/** 全局 Notion 配置由 tag/fav 共用一份（存于平台 storage），收藏包也消费它 */
export interface FavStorage {
  getNotionSetup: () => Promise<FavNotionSetup | null>
  setNotionSetup: (setup: FavNotionSetup) => Promise<void>
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
