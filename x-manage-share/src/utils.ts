export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function getTweetText(article: HTMLElement): string {
  const tweetText = article.querySelector<HTMLElement>('[data-testid="tweetText"]')
  if (tweetText?.textContent) return tweetText.textContent
  const spans = article.querySelectorAll('span')
  for (const span of spans) { const text = span.textContent?.trim(); if (text && text.length > 15) return text }
  return article.textContent || ''
}

export function getTweetAuthor(article: HTMLElement): string {
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

export function getTweetId(article: HTMLElement): string {
  const timeLink = article.querySelector<HTMLAnchorElement>('a[href*="/status/"]')
  if (timeLink) { const parts = timeLink.pathname.split('/'); const idx = parts.indexOf('status'); if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1] }
  return ''
}
