import { escapeHtml, getTweetText, getTweetAuthor, getTweetAuthorHandle, getTweetId } from 'x-manage-share'
import type { BlockWord } from './types'

const ATTR_BLOCKED = 'data-x-manage-blocked'
const ATTR_LEVEL = 'data-x-manage-level'
const ATTR_BLOCK_WORD = 'data-x-manage-word'
const ATTR_BLOCK_FIELD = 'data-x-manage-field'
const CLASS_BANNER = 'x-manage-banner'
const CLASS_COLLAPSE = 'x-manage-collapse'
const CLASS_EXPAND_HINT = 'x-manage-expand-hint'
const CLASS_PROCESSED = 'x-manage-processed'

const FIELD_LABEL: Record<string, string> = {
  body: '匹配正文',
  author: '匹配显示名',
}

function matchesFilter(text: string, word: BlockWord): boolean {
  if (!word.enabled) return false
  const searchText = word.caseSensitive ? text : text.toLowerCase()
  const searchWord = word.caseSensitive ? word.word : word.word.toLowerCase()
  return searchText.includes(searchWord)
}

function getContentContainer(article: HTMLElement): HTMLElement | null {
  return article.firstElementChild as HTMLElement | null
}

function getContentChildren(container: HTMLElement): HTMLElement[] {
  const blockUI = [CLASS_BANNER, CLASS_COLLAPSE, CLASS_EXPAND_HINT]
  return Array.from(container.children).filter(
    (child) => !blockUI.some(cls => child.classList.contains(cls)),
  ) as HTMLElement[]
}

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

function blockTweet(article: HTMLElement, matchedWord: string, matchedField: string): void {
  article.setAttribute(ATTR_BLOCKED, 'true')
  article.setAttribute(ATTR_BLOCK_WORD, matchedWord)
  article.setAttribute(ATTR_BLOCK_FIELD, matchedField)
  article.classList.add(CLASS_PROCESSED)
  article.style.position = 'relative'

  const fieldInfo = FIELD_LABEL[matchedField] || ''

  const banner = document.createElement('div')
  banner.className = CLASS_BANNER
  banner.innerHTML = `<span class="x-manage-banner-icon">⊘</span><span class="x-manage-banner-text">因屏蔽词 "<strong>${escapeHtml(matchedWord)}</strong>"${fieldInfo ? `（${fieldInfo}）` : ''}而隐藏</span><span class="x-manage-banner-hint">点击展开</span>`
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
  expandHint.innerHTML = `因屏蔽词 "<strong>${escapeHtml(matchedWord)}</strong>"${fieldInfo ? `（${fieldInfo}）` : ''}隐藏 · <span class="x-manage-expand-action">展开 →</span>`
  expandHint.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); setLevel(article, 2) })
  if (rootContent) rootContent.appendChild(expandHint)
  else article.appendChild(expandHint)

  setLevel(article, 0)
}

function unblockTweet(article: HTMLElement): void {
  article.removeAttribute(ATTR_BLOCKED)
  article.removeAttribute(ATTR_LEVEL)
  article.removeAttribute(ATTR_BLOCK_WORD)
  article.removeAttribute(ATTR_BLOCK_FIELD)
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

type MatchResult = { word: string; field: string } | null

function checkTweetAgainstBlockWords(article: HTMLElement, words: BlockWord[]): MatchResult {
  if (article.getAttribute(ATTR_BLOCKED) === 'true') {
    const existingWord = article.getAttribute(ATTR_BLOCK_WORD)
    const existingField = article.getAttribute(ATTR_BLOCK_FIELD)
    const stillBlocked = words.some(w => w.word.toLowerCase() === existingWord?.toLowerCase() && w.enabled)
    if (!stillBlocked) return null
    return existingWord && existingField ? { word: existingWord, field: existingField } : null
  }
  for (const word of words) {
    if (!word.enabled) continue
    const field = word.matchField
    if (field === 'body' || field === 'both') {
      if (matchesFilter(getTweetText(article), word)) return { word: word.word, field: 'body' }
    }
    if (field === 'author' || field === 'both') {
      if (matchesFilter(getTweetAuthor(article), word)) return { word: word.word, field: 'author' }
    }
  }
  return null
}

export function processNewTweets(words: BlockWord[]): void {
  const articles = document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')
  articles.forEach((article) => {
    if (article.getAttribute(ATTR_BLOCKED) === 'true') {
      if (!checkTweetAgainstBlockWords(article, words)) unblockTweet(article)
    } else {
      const match = checkTweetAgainstBlockWords(article, words)
      if (match) blockTweet(article, match.word, match.field)
    }
  })
}