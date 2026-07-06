import ReactDOM from 'react-dom/client'
import { STYLES } from 'x-manage-share'
import { BlockFeature, processNewTweets, BLOCK_STYLES } from 'x-manage-lib-block'
import { TagFeature, ensureTagButtons, updateTweetTags, TAG_STYLES, getAllTags } from 'x-manage-lib-tag'
import { XLinkFeature, XLINK_STYLES } from 'x-manage-lib-xlink'
import * as storage from './storage'

// 注入所有样式
const styleEl = document.createElement('style')
styleEl.textContent = STYLES + BLOCK_STYLES + TAG_STYLES + XLINK_STYLES
document.head.appendChild(styleEl)

// 处理当前页面上所有推文
async function processAll() {
  const [words, rule, tags] = await Promise.all([
    storage.getBlockWords(),
    storage.getFilterRule(),
    getAllTags(),
  ])
  processNewTweets(words, rule)
  ensureTagButtons()
  updateTweetTags(tags)
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
      <XLinkFeature storage={storage} />
    </>
  )

  let timeout: ReturnType<typeof setTimeout>
  new MutationObserver(() => {
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
