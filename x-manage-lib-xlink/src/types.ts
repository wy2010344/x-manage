export type XLinkMode = 'iframe' | 'new-window'

export interface XLinkConfig {
  enabled: boolean
  mode: XLinkMode
}

export interface XLinkStorage {
  getXLinkConfig: () => Promise<XLinkConfig>
  setXLinkConfig: (config: XLinkConfig) => Promise<void>
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}
