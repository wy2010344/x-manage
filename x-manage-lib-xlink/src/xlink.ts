import type { XLinkConfig } from './types'

const DEFAULT_CONFIG: XLinkConfig = { enabled: true, mode: 'iframe' }

let currentConfig: XLinkConfig = DEFAULT_CONFIG
let destroyHandlers: (() => void) | null = null

export function getConfig(): XLinkConfig {
  return currentConfig
}

export function updateConfig(config: XLinkConfig): void {
  currentConfig = config
  if (config.enabled) {
    if (!destroyHandlers) destroyHandlers = install()
  } else {
    if (destroyHandlers) { destroyHandlers(); destroyHandlers = null }
  }
}

function shouldIntercept(href: string): boolean {
  try {
    const url = new URL(href, location.origin)
    if (url.origin !== location.origin) return false
    const curPath = location.pathname + location.search
    if (url.pathname + url.search === curPath) return false
    return true
  } catch {
    return false
  }
}

function fireOpen(url: string): void {
  window.dispatchEvent(new CustomEvent('x-manage-open-url', { detail: { url } }))
}

function install(): () => void {
  const onCaptureClick = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
    if (!link) return
    const href = link.getAttribute('href')
    if (!href || !shouldIntercept(href)) return

    e.preventDefault()
    e.stopPropagation()
    fireOpen(new URL(href, location.origin).href)
  }

  const origPushState = history.pushState.bind(history)
  const origReplaceState = history.replaceState.bind(history)

  history.pushState = function (data, _unused, url) {
    const urlStr = url ? String(url) : ''
    if (urlStr && shouldIntercept(urlStr)) {
      const fullUrl = new URL(urlStr, location.origin).href
      fireOpen(fullUrl)
      return
    }
    return origPushState(data, _unused, url)
  }

  history.replaceState = function (data, _unused, url) {
    const urlStr = url ? String(url) : ''
    if (urlStr && shouldIntercept(urlStr)) {
      const fullUrl = new URL(urlStr, location.origin).href
      fireOpen(fullUrl)
      return
    }
    return origReplaceState(data, _unused, url)
  }

  document.addEventListener('click', onCaptureClick, { capture: true })

  return () => {
    document.removeEventListener('click', onCaptureClick, { capture: true })
    history.pushState = origPushState
    history.replaceState = origReplaceState
  }
}

export function initXLink(config: XLinkConfig): () => void {
  currentConfig = config
  if (destroyHandlers) { destroyHandlers(); destroyHandlers = null }
  if (config.enabled) {
    destroyHandlers = install()
  }
  return () => {
    if (destroyHandlers) { destroyHandlers(); destroyHandlers = null }
  }
}
