import { getTweetAuthorHandle, getTweetId, getTweetAuthor } from 'x-manage-share'
import type { TweetTag } from './types'

const CLASS_TAG_ROW = 'x-manage-tag-row'
const CLASS_TAGS = 'x-manage-tweet-tags'
const CLASS_TAG_BTN = 'x-manage-tag-btn'

/** 标签行锚点元素：标签行将插入到该元素之后（推文正文区） */
const TAG_ROW_ANCHOR_SELECTOR = ':scope > div > div > div:nth-child(2) > div:nth-child(2) > div > div'

/** 将 article > 前缀规范化为 :scope >，以适配 article.querySelector 相对查询 */
function normalizeSelector(selector: string): string {
  return selector.replace(/^\s*article\s*>\s*/, ':scope > ')
}

let tagBtnSelector = ':scope > div > div > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div'

export function setTagButtonSelector(selector: string): void {
  tagBtnSelector = normalizeSelector(selector)
}

function findTagButtonContainer(article: HTMLElement): HTMLElement | null {
  return article.querySelector(tagBtnSelector)
}

/** 查找标签行锚点元素，未命中时回退到推文根容器 */
function findTagRowAnchor(article: HTMLElement): HTMLElement {
  return article.querySelector<HTMLElement>(TAG_ROW_ANCHOR_SELECTOR) || (article.firstElementChild as HTMLElement)
}

/** 确保标签行存在且紧跟在锚点元素之后，并解除其他模块可能设置的隐藏 */
function ensureTagRow(anchor: HTMLElement): HTMLElement {
  let row = anchor.nextElementSibling && anchor.nextElementSibling.classList.contains(CLASS_TAG_ROW)
    ? anchor.nextElementSibling as HTMLElement
    : null
  if (!row) {
    row = document.createElement('div')
    row.className = CLASS_TAG_ROW
    anchor.after(row)
  }
  row.style.display = ''
  return row
}

export function ensureTagButtons(): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const handle = getTweetAuthorHandle(article)
    if (!handle) return
    const container = findTagButtonContainer(article)
    if (!container) return
    let btn = article.querySelector<HTMLButtonElement>(`.${CLASS_TAG_BTN}`)
    if (!btn) {
      btn = document.createElement('button')
      btn.className = CLASS_TAG_BTN
      btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h6l8 8-6 6-8-8V3z"/><circle cx="6.5" cy="6.5" r="1.2" fill="currentColor"/></svg>'
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault()
        const tweetId = getTweetId(article)
        const authorName = getTweetAuthor(article) || handle.replace('/', '')
        const tweetUrl = tweetId ? `https://x.com${handle}/status/${tweetId}` : ''
        window.dispatchEvent(new CustomEvent('x-manage-add-tag', {
          detail: { authorHandle: handle, authorName, tweetId, tweetUrl },
        }))
      })
      container.appendChild(btn)
    } else if (btn.parentElement !== container || btn !== container.lastElementChild) {
      // X 的 React 重排可能把按钮挤到非末尾位置，统一移回容器末尾
      container.appendChild(btn)
    }
  })
}

export function updateTweetTags(tags: TweetTag[]): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const handle = getTweetAuthorHandle(article)
    if (!handle) return
    const anchor = findTagRowAnchor(article)
    if (!anchor) return
    const authorTags = tags.filter(t => t.authorHandle.toLowerCase() === handle.toLowerCase())
    const existingContainer = anchor.parentElement?.querySelector<HTMLElement>(`:scope > .${CLASS_TAG_ROW} > .${CLASS_TAGS}`)
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
    const row = ensureTagRow(anchor)
    row.appendChild(tagsEl)
  })
}
