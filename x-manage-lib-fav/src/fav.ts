import { getTweetAuthorHandle, getTweetId, getTweetAuthor, getTweetText } from 'x-manage-share'
import type { FavTweet } from './types'

const CLASS_FAV_BTN = 'x-manage-fav-btn'

/** 收藏按钮放置在「标签按钮」之前（左侧），共用相同的按钮容器 */
let favBtnSelector = ':scope > div > div > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div'

function normalizeSelector(selector: string): string {
  return selector.replace(/^\s*article\s*>\s*/, ':scope > ')
}

export function setFavButtonSelector(selector: string): void {
  favBtnSelector = normalizeSelector(selector)
}

function findFavButtonContainer(article: HTMLElement): HTMLElement | null {
  return article.querySelector(favBtnSelector)
}

/** 收藏状态 → 按钮的 SVG 图标内联（实心星=已收藏，空心星=未收藏） */
function starSvg(filled: boolean): string {
  return filled
    ? '<svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M10 2.5l2.3 4.7 5.2.76-3.75 3.66.88 5.14L10 14.5l-4.63 2.44.88-5.14L2.5 7.96l5.2-.76L10 2.5z"/></svg>'
    : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M10 2.5l2.3 4.7 5.2.76-3.75 3.66.88 5.14L10 14.5l-4.63 2.44.88-5.14L2.5 7.96l5.2-.76L10 2.5z"/></svg>'
}

function buildFavButton(): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = CLASS_FAV_BTN
  btn.title = '收藏到本地'
  btn.dataset.filled = 'false'
  btn.innerHTML = starSvg(false)
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault()
    const article = btn.closest<HTMLElement>('article[data-testid="tweet"]')
    if (!article) return
    const handle = getTweetAuthorHandle(article)
    const tweetId = getTweetId(article)
    if (!tweetId) return
    // 乐观翻转视觉，立即给出点击反馈（不必等 IndexedDB 写入后的全量刷新）
    const filled = btn.dataset.filled === 'true'
    btn.dataset.filled = String(!filled)
    btn.innerHTML = starSvg(!filled)
    btn.title = filled ? '收藏到本地' : '取消收藏'
    const tweetUrl = handle ? `https://x.com${handle}/status/${tweetId}` : ''
    window.dispatchEvent(new CustomEvent('x-manage-fav-toggle', {
      detail: {
        authorHandle: handle || '',
        authorName: getTweetAuthor(article) || '',
        tweetId,
        tweetUrl,
        tweetText: getTweetText(article),
      },
    }))
  })
  return btn
}

/** 确保收藏按钮存在，并保持在 tag 按钮正前方（无 tag 按钮时置于容器首位） */
function placeFavButton(article: HTMLElement, container: HTMLElement): void {
  let btn = article.querySelector<HTMLButtonElement>(`.${CLASS_FAV_BTN}`)
  if (!btn) {
    btn = buildFavButton()
  }
  const tagBtn = article.querySelector<HTMLElement>('.x-manage-tag-btn')
  const tagInContainer = tagBtn && tagBtn.parentElement === container
  const correct = tagInContainer ? btn.nextElementSibling === tagBtn : btn === container.firstElementChild
  if (!correct) {
    if (tagInContainer && tagBtn) container.insertBefore(btn, tagBtn)
    else container.insertBefore(btn, container.firstChild)
  }
}

export function ensureFavButtons(): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const container = findFavButtonContainer(article)
    if (!container) return
    placeFavButton(article, container)
  })
}

/** 依据当前已收藏集合，统一刷新所有星标按钮的实心/空心状态 */
export function updateFavButtonStates(favs: FavTweet[]): void {
  const byTweetId = new Map<string, FavTweet>()
  for (const f of favs) byTweetId.set(f.tweetId, f)
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    const btn = article.querySelector<HTMLButtonElement>(`.${CLASS_FAV_BTN}`)
    if (!btn) return
    const tweetId = getTweetId(article)
    const filled = tweetId ? byTweetId.has(tweetId) : false
    btn.innerHTML = starSvg(filled)
    btn.setAttribute('data-filled', String(filled))
  })
}

export { CLASS_FAV_BTN }