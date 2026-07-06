import { getTweetAuthorHandle, getTweetId, getTweetAuthor } from 'x-manage-share'
import type { TweetTag } from './types'

const CLASS_TAG_ROW = 'x-manage-tag-row'
const CLASS_TAGS = 'x-manage-tweet-tags'
const CLASS_TAG_BTN = 'x-manage-tag-btn'

/** 确保推文容器中有标签行（始终位于末尾），并解除其他模块可能设置的隐藏 */
function ensureTagRow(container: HTMLElement): HTMLElement {
  let row = container.querySelector<HTMLElement>(`.${CLASS_TAG_ROW}`)
  if (!row) { row = document.createElement('div'); row.className = CLASS_TAG_ROW; container.appendChild(row) }
  row.style.display = ''
  container.appendChild(row)
  return row
}

export function ensureTagButtons(): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const handle = getTweetAuthorHandle(article)
    if (!handle) return
    const container = article.firstElementChild as HTMLElement | null
    if (!container) return
    if (container.querySelector(`.${CLASS_TAG_BTN}`)) return
    const row = ensureTagRow(container)
    const btn = document.createElement('button')
    btn.className = CLASS_TAG_BTN
    btn.textContent = '+标签'
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault()
      const tweetId = getTweetId(article)
      const authorName = getTweetAuthor(article) || handle.replace('/', '')
      const tweetUrl = tweetId ? `https://x.com${handle}/status/${tweetId}` : ''
      window.dispatchEvent(new CustomEvent('x-manage-add-tag', {
        detail: { authorHandle: handle, authorName, tweetId, tweetUrl },
      }))
    })
    row.appendChild(btn)
  })
}

export function updateTweetTags(tags: TweetTag[]): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const handle = getTweetAuthorHandle(article)
    if (!handle) return
    const container = article.firstElementChild as HTMLElement | null
    if (!container) return
    const authorTags = tags.filter(t => t.authorHandle.toLowerCase() === handle.toLowerCase())
    const existingContainer = container.querySelector<HTMLElement>(`.${CLASS_TAGS}`)
    const existingChips = existingContainer ? Array.from(existingContainer.querySelectorAll('.x-manage-tag-chip')) : []
    if (authorTags.length > 0 && existingChips.length === authorTags.length) {
      const tagKey = authorTags.map(t => `${t.tag}|${t.tweetUrl}`).join(',')
      const chipKey = existingChips.map(c => `${c.textContent}|${c.getAttribute('href')}`).join(',')
      if (tagKey === chipKey) return
    }
    if (existingContainer) existingContainer.remove()
    if (authorTags.length === 0) return
    const tagsEl = document.createElement('div')
    tagsEl.className = CLASS_TAGS
    for (const t of authorTags) {
      const chip = document.createElement('a')
      chip.className = 'x-manage-tag-chip'
      chip.href = t.tweetUrl; chip.target = '_blank'; chip.rel = 'noopener noreferrer'
      chip.title = '查看原始推文'; chip.textContent = t.tag
      tagsEl.appendChild(chip)
    }
    const row = ensureTagRow(container)
    row.insertBefore(tagsEl, row.lastElementChild)
  })
}
