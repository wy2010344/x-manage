import ReactDOM from 'react-dom/client'
import { STYLES, ControlCenter, isSelfMutationBatch } from 'x-manage-share'
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
} from 'x-manage-lib-tag'
import {
  FavSettingsPanel,
  ensureFavButtons,
  updateFavButtonStates,
  FAV_STYLES,
  getAllFavs,
  pushFavsUnpushed,
} from 'x-manage-lib-fav'
import * as storage from './storage'

// 注入所有样式
GM_addStyle(STYLES + BLOCK_STYLES + TAG_STYLES + FAV_STYLES)

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
          { key: 'fav', label: '收藏', render: <FavSettingsPanel storage={storage} /> },
          { key: 'tag', label: '标签', render: <TagSettingsPanel storage={storage} /> },
        ]}
      />
      <TagFeature storage={storage} />
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
