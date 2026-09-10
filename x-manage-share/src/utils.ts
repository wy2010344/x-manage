export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function getTweetText(article: HTMLElement): string {
  const tweetText = article.querySelector<HTMLElement>('[data-testid="tweetText"]')
  if (tweetText?.textContent) return tweetText.textContent
  // 回退时剔除本插件注入的 UI 节点，避免横幅/标签文案被误当作正文参与匹配
  const clone = article.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[class*="x-manage-"]').forEach(el => el.remove())
  const spans = clone.querySelectorAll('span')
  for (const span of spans) { const text = span.textContent?.trim(); if (text && text.length > 15) return text }
  return clone.textContent || ''
}


export function getTweetAuthor(article: HTMLElement): string {
  const userName = article.querySelector<HTMLElement>('[data-testid="User-Name"]')
  if (userName) {
    const spans = userName.querySelectorAll('span')
    for (const span of spans) {
      const t = span.textContent?.trim()
      if (t && !t.startsWith('@')) return t
    }
  }
  const links = article.querySelectorAll<HTMLAnchorElement>('a[role="link"]')
  for (const link of links) { const href = link.getAttribute('href') || ''; if (/^\/[^/]+$/.test(href) && !href.includes('status')) return link.textContent?.trim() || '' }
  return ''
}

export function getTweetAuthorHandle(article: HTMLElement): string {
  const links = article.querySelectorAll<HTMLAnchorElement>('a[role="link"]')
  for (const link of links) { const href = link.getAttribute('href') || ''; if (/^\/[^/]+$/.test(href) && !href.includes('status')) return href }
  const timeLink = article.querySelector<HTMLAnchorElement>('a[href*="/status/"]')
  if (timeLink) { const parts = timeLink.pathname.split('/'); if (parts.length >= 2) return `/${parts[1]}` }
  return ''
}

/**
 * 读取当前登录的 X 账号 handle（首页数据库登记账号）。
 * 依次尝试：侧边栏个人资料入口、导航栏内个人资料链接、账号切换按钮内的 @用户名。
 * 返回带前导斜杠的 handle（如 `/elonmusk`），读取失败返回 null。
 * 仅在 x.com 页面上下文可用（content script / user script）。
 */
export function getCurrentUserHandle(): string | null {
  try {
    const profileLink = document.querySelector<HTMLAnchorElement>('a[data-testid="AppTabBar_Profile_Link"]')
    if (profileLink) {
      const href = profileLink.getAttribute('href') || ''
      if (/^\/[^/?#]+$/.test(href)) return href
    }
    const knownPaths = new Set(['/home', '/explore', '/notifications', '/messages', '/compose', '/settings', '/search'])
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a[href^="/"][role="link"], header a[href^="/"][role="link"]')
    for (const a of navLinks) {
      const href = a.getAttribute('href') || ''
      if (/^\/[^/?#]+$/.test(href) && !knownPaths.has(href)) {
        const top = href.split('/')[1]
        if (/^[A-Za-z0-9_]{1,50}$/.test(top)) return `/${top}`
      }
    }
    const switcherBtn = document.querySelector<HTMLElement>('[data-testid="SideNav_AccountSwitcher_Button"]')
    const atSpan = switcherBtn ? [...switcherBtn.querySelectorAll('span')].map(s => s.textContent || '').find(t => /^@[A-Za-z0-9_]{1,50}$/.test(t)) : ''
    if (atSpan) return `/${atSpan.slice(1)}`
  } catch { /* 不在浏览器页面环境时静默失败 */ }
  return null
}

export function getTweetId(article: HTMLElement): string {
  const timeLink = article.querySelector<HTMLAnchorElement>('a[href*="/status/"]')
  if (timeLink) { const parts = timeLink.pathname.split('/'); const idx = parts.indexOf('status'); if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1] }
  return ''
}

const OWN_ROOT_ID = 'x-manage-root'

function isOwnNode(node: Node | null): boolean {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false
  const el = node as Element
  if (el.id === OWN_ROOT_ID) return true
  const root = document.getElementById(OWN_ROOT_ID)
  if (root && (el === root || root.contains(el))) return true
  return Array.from(el.classList || []).some(c => c.startsWith('x-manage-'))
}

/**
 * 判断一批 mutation 是否完全由本插件自身 UI 产生。
 * 是则调用方可安全跳过本轮处理，避免「自身写入 → 观察器再扫描」的空转与抖动。
 */
export function isSelfMutationBatch(mutations: MutationRecord[]): boolean {
  return mutations.every(m => {
    if (isOwnNode(m.target)) return true
    return [...m.addedNodes, ...m.removedNodes].every(n => isOwnNode(n))
  })
}
