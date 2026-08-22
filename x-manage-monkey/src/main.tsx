import ReactDOM from 'react-dom/client'
import { STYLES, isSelfMutationBatch } from 'x-manage-share'
import {
  BlockFeature,
  processNewTweets,
  BLOCK_STYLES,
} from 'x-manage-lib-block'
import {
  TagFeature,
  ensureTagButtons,
  updateTweetTags,
  TAG_STYLES,
  getAllTags,
} from 'x-manage-lib-tag'
// import { XLinkFeature, XLINK_STYLES } from 'x-manage-lib-xlink'
import * as storage from './storage'

// 注入所有样式
GM_addStyle(STYLES + BLOCK_STYLES + TAG_STYLES)

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
      const [words, tags] = await Promise.all([
        storage.getBlockWords(),
        getAllTags(),
      ])
      processNewTweets(words)
      ensureTagButtons()
      updateTweetTags(tags)
      if (!pendingRun) break
    }
  } catch (err) {
    console.error('x-manage processAll error:', err)
  } finally {
    processing = false
  }
}

function init() {
  const container = document.createElement('div')
  container.id = 'x-manage-root'
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  root.render(
    <>
      <BlockFeature storage={storage} />
      <TagFeature storage={storage} />
      {/* <XLinkFeature storage={storage} /> */}
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
