import { escapeHtml, getTweetText, getTweetAuthor, getTweetAuthorHandle, getTweetId } from 'x-manage-share'
import type { BlockWord, FilterRule } from './types'

/** 屏蔽词模块内部使用的属性/类名（不与任何其他模块共享） */
const ATTR_BLOCKED = 'data-x-manage-blocked'
const ATTR_LEVEL = 'data-x-manage-level'
const ATTR_BLOCK_WORD = 'data-x-manage-word'
const CLASS_BANNER = 'x-manage-banner'
const CLASS_COLLAPSE = 'x-manage-collapse'
const CLASS_EXPAND_HINT = 'x-manage-expand-hint'
const CLASS_PROCESSED = 'x-manage-processed'

/** 判断一段文本是否匹配某个屏蔽词 */
function matchesFilter(text: string, word: BlockWord, rule: FilterRule): boolean {
  if (!word.enabled) return false
  const searchText = rule.caseSensitive ? text : text.toLowerCase()
  const searchWord = rule.caseSensitive ? word.word : word.word.toLowerCase()
  return searchText.includes(searchWord)
}

/** 获取推文容器（article 的第一个子元素） */
function getContentContainer(article: HTMLElement): HTMLElement | null {
  return article.firstElementChild as HTMLElement | null
}

/** 获取容器中非屏蔽词模块注入的"原始内容"子元素 */
function getContentChildren(container: HTMLElement): HTMLElement[] {
  const blockUI = [CLASS_BANNER, CLASS_COLLAPSE, CLASS_EXPAND_HINT]
  return Array.from(container.children).filter(
    (child) => !blockUI.some(cls => child.classList.contains(cls)),
  ) as HTMLElement[]
}

/** 设置推文的展开级别：0=隐藏、1=半透明、2=完全可见 */
function setLevel(article: HTMLElement, level: number): void {
  article.setAttribute(ATTR_LEVEL, String(level))
  const container = getContentContainer(article)
  if (!container) return
  const contentChildren = getContentChildren(container)
  const banner = article.querySelector<HTMLElement>(`.${CLASS_BANNER}`)
  const collapse = article.querySelector<HTMLElement>(`.${CLASS_COLLAPSE}`)
  const expandHint = article.querySelector<HTMLElement>(`.${CLASS_EXPAND_HINT}`)

  switch (level) {
    case 0:
      contentChildren.forEach((el) => { el.style.display = 'none'; el.style.pointerEvents = 'none' })
      container.style.display = ''
      article.style.padding = '0'
      article.style.minHeight = '0'
      if (banner) { banner.style.opacity = '1'; banner.style.pointerEvents = 'auto'; banner.style.display = 'flex' }
      if (collapse) collapse.remove()
      if (expandHint) expandHint.style.display = 'none'
      break
    case 1:
      contentChildren.forEach((el) => {
        el.style.opacity = '0.2'; el.style.display = ''; el.style.maxHeight = ''; el.style.overflow = ''
        el.style.marginTop = ''; el.style.marginBottom = ''; el.style.paddingTop = ''; el.style.paddingBottom = ''
        el.style.pointerEvents = 'auto'
      })
      container.style.display = ''
      article.style.padding = ''; article.style.minHeight = ''
      if (banner) banner.style.display = 'none'
      if (collapse) collapse.remove()
      if (expandHint) expandHint.style.display = 'block'
      break
    case 2:
      contentChildren.forEach((el) => {
        el.style.opacity = '1'; el.style.display = ''; el.style.maxHeight = ''; el.style.overflow = ''
        el.style.marginTop = ''; el.style.marginBottom = ''; el.style.paddingTop = ''; el.style.paddingBottom = ''
        el.style.pointerEvents = 'auto'
      })
      container.style.display = ''
      article.style.padding = ''; article.style.minHeight = ''
      if (banner) banner.style.display = 'none'
      if (expandHint) expandHint.style.display = 'none'
      if (!collapse) {
        const btn = document.createElement('div')
        btn.className = CLASS_COLLAPSE
        btn.textContent = '折叠 ↑'
        btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); setLevel(article, 0) })
        container.appendChild(btn)
      }
      break
  }
}

/** 屏蔽一条推文：注入 banner / expand-hint / collapse */
function blockTweet(article: HTMLElement, matchedWord: string): void {
  article.setAttribute(ATTR_BLOCKED, 'true')
  article.setAttribute(ATTR_BLOCK_WORD, matchedWord)
  article.classList.add(CLASS_PROCESSED)
  article.style.position = 'relative'

  const banner = document.createElement('div')
  banner.className = CLASS_BANNER
  banner.innerHTML = `<span class="x-manage-banner-icon">⊘</span><span class="x-manage-banner-text">因屏蔽词 "<strong>${escapeHtml(matchedWord)}</strong>" 而隐藏</span><span class="x-manage-banner-hint">点击展开</span>`
  banner.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault()
    const currentLevel = parseInt(article.getAttribute(ATTR_LEVEL) || '0', 10)
    if (currentLevel < 2) setLevel(article, currentLevel + 1)
  })

  const rootContent = article.firstElementChild as HTMLElement | undefined
  if (rootContent) rootContent.insertBefore(banner, rootContent.firstChild)
  else article.insertBefore(banner, article.firstChild)

  const expandHint = document.createElement('div')
  expandHint.className = CLASS_EXPAND_HINT
  expandHint.innerHTML = `因屏蔽词 "<strong>${escapeHtml(matchedWord)}</strong>" 隐藏 · <span class="x-manage-expand-action">展开 →</span>`
  expandHint.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); setLevel(article, 2) })
  if (rootContent) rootContent.appendChild(expandHint)
  else article.appendChild(expandHint)

  setLevel(article, 0)
}

/** 取消屏蔽一条推文：移除所有注入元素 + 重置样式 */
function unblockTweet(article: HTMLElement): void {
  article.removeAttribute(ATTR_BLOCKED)
  article.removeAttribute(ATTR_LEVEL)
  article.removeAttribute(ATTR_BLOCK_WORD)
  article.classList.remove(CLASS_PROCESSED)
  const b = article.querySelector(`.${CLASS_BANNER}`); if (b) b.remove()
  const c = article.querySelector(`.${CLASS_COLLAPSE}`); if (c) c.remove()
  const e = article.querySelector(`.${CLASS_EXPAND_HINT}`); if (e) e.remove()
  const container = getContentContainer(article)
  if (container) {
    getContentChildren(container).forEach((el) => {
      el.style.opacity = ''; el.style.maxHeight = ''; el.style.overflow = ''
      el.style.marginTop = ''; el.style.marginBottom = ''; el.style.paddingTop = ''; el.style.paddingBottom = ''
      el.style.pointerEvents = ''; el.style.display = ''
    })
  }
  article.style.padding = ''; article.style.minHeight = ''
}

/** 检查一条推文是否匹配任何屏蔽词 */
function checkTweetAgainstBlockWords(article: HTMLElement, words: BlockWord[], rule: FilterRule): string | null {
  if (article.getAttribute(ATTR_BLOCKED) === 'true') {
    const existingWord = article.getAttribute(ATTR_BLOCK_WORD)
    const stillBlocked = words.some(w => w.word.toLowerCase() === existingWord?.toLowerCase() && w.enabled)
    if (!stillBlocked) return null
    return existingWord
  }
  let textToCheck = ''
  switch (rule.field) {
    case 'content': textToCheck = getTweetText(article); break
    case 'author': textToCheck = getTweetAuthor(article); break
    default: textToCheck = `${getTweetText(article)} ${getTweetAuthor(article)}`
  }
  for (const word of words) if (matchesFilter(textToCheck, word, rule)) return word.word
  return null
}

/** 处理当前页面上所有推文：屏蔽匹配的 / 取消屏蔽不再匹配的 */
export function processNewTweets(words: BlockWord[], rule: FilterRule): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    if (article.getAttribute(ATTR_BLOCKED) === 'true') {
      if (!checkTweetAgainstBlockWords(article, words, rule)) unblockTweet(article)
    } else {
      const matchedWord = checkTweetAgainstBlockWords(article, words, rule)
      if (matchedWord) blockTweet(article, matchedWord)
    }
  })
}
