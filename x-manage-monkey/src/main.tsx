import ReactDOM from 'react-dom/client'
import { useState, useCallback } from 'react'
import { STYLES, ControlCenter, isSelfMutationBatch, Toast, NotionHubPanel, type NotionSyncModule } from 'x-manage-share'
import {
  BlockSettingsPanel,
  processNewTweets,
  BLOCK_STYLES,
} from 'x-manage-lib-block'
import {
  TagFeature,
  TagSettingsPanel,
  ensureTagButtons,
  updateTweetTags,
  TAG_STYLES,
  getAllTags,
  pushTagsUnpushed,
  pushTagsFull,
  restoreTags,
  NOTION_TAG_VERSION,
} from 'x-manage-lib-tag'
import {
  FavSettingsPanel,
  ensureFavButtons,
  updateFavButtonStates,
  FAV_STYLES,
  getAllFavs,
  pushFavsUnpushed,
  pushFavsFull,
  restoreFavs,
  NOTION_FAV_VERSION,
} from 'x-manage-lib-fav'
import * as storage from './storage'

// 注入所有样式
GM_addStyle(STYLES + BLOCK_STYLES + TAG_STYLES + FAV_STYLES)

// 全局 Notion 公共 tab：各模块注入各自的 push/restore 与游标 key
const NOTION_MODULES: NotionSyncModule[] = [
  {
    id: 'tag',
    label: '标签',
    version: NOTION_TAG_VERSION,
    lastPushedKey: 'x-manage-tags-lastPushedAt',
    push: s => pushTagsUnpushed(s as Parameters<typeof pushTagsUnpushed>[0]),
    pushAll: s => pushTagsFull(s as Parameters<typeof pushTagsFull>[0]),
    restore: s => restoreTags(s as Parameters<typeof restoreTags>[0]),
  },
  {
    id: 'fav',
    label: '收藏',
    version: NOTION_FAV_VERSION,
    lastPushedKey: 'x-manage-favs-lastPushedAt',
    push: s => pushFavsUnpushed(s as Parameters<typeof pushFavsUnpushed>[0]),
    pushAll: s => pushFavsFull(s as Parameters<typeof pushFavsFull>[0]),
    restore: s => restoreFavs(s as Parameters<typeof restoreFavs>[0]),
  },
]

const notionModules: NotionSyncModule[] = NOTION_MODULES

function NotionTab() {
  const [msg, setMsg] = useState<string | null>(null)
  const showToast = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2200)
  }, [])
  return (
    <div>
      <Toast message={msg} />
      <NotionHubPanel storage={{ getNotionSetup: storage.getNotionSetup, setNotionSetup: storage.setNotionSetup }} modules={notionModules} showToast={showToast} />
    </div>
  )
}

// 处理当前页面上所有推文（防重入：storage/IndexedDB 读写期间不重复执行；
// 期间若有新的 DOM 变更，置 pendingRun 标记，本轮结束后立即补跑一次）
let processing = false
let pendingRun = false
async function processAll() {
  if (processing) { pendingRun = true; return }
  processing = true
  try {
    while (true) {
      pendingRun = false
      const [words, tags, favs] = await Promise.all([
        storage.getBlockWords(),
        getAllTags(),
        getAllFavs(),
      ])
      processNewTweets(words)
      ensureTagButtons()
      updateTweetTags(tags)
      ensureFavButtons()
      updateFavButtonStates(favs)
      if (!pendingRun) break
    }
  } catch (err) {
    console.error('x-manage processAll error:', err)
  } finally {
    processing = false
  }
}

// 定期自动推送到 Notion（标签/收藏各自增量，未配置时静默跳过；多标签页以模块内锁防重入）
const NOTION_PUSH_INTERVAL = 30 * 60 * 1000
let notionPushing = false
async function autoPushNotion() {
  if (notionPushing) return
  notionPushing = true
  try {
    await Promise.allSettled([pushTagsUnpushed(storage), pushFavsUnpushed(storage)])
  } finally {
    notionPushing = false
  }
}

function init() {
  const container = document.createElement('div')
  container.id = 'x-manage-root'
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  root.render(
    <>
      <ControlCenter
        storage={storage}
        sections={[
          { key: 'block', label: '屏蔽词', render: <BlockSettingsPanel storage={storage} /> },
          { key: 'fav', label: '收藏', render: <FavSettingsPanel /> },
          { key: 'tag', label: '标签', render: <TagSettingsPanel /> },
          { key: 'notion', label: 'Notion', render: <NotionTab /> },
        ]}
      />
      <TagFeature />
      {/* XLink 暂未纳入控制中心，待后续作为顶级 tab 集成 */}
    </>,
  )

  let timeout: ReturnType<typeof setTimeout>
  new MutationObserver((mutations) => {
    // 插件自身 UI（banner/标签行/按钮等）产生的变更不触发重扫，避免空转与抖动
    if (isSelfMutationBatch(mutations)) return
    clearTimeout(timeout)
    timeout = setTimeout(processAll, 500)
  }).observe(document.body, { childList: true, subtree: true })

  processAll()
  autoPushNotion()
  setInterval(autoPushNotion, NOTION_PUSH_INTERVAL)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
