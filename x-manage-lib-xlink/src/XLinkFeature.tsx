import { useState, useEffect, useCallback } from 'react'
import { Fab, Toast } from 'x-manage-share'
import type { XLinkConfig, XLinkStorage } from './types'
import { updateConfig, initXLink } from './xlink'

interface Props {
  storage: XLinkStorage
}

/** 全局 iframe 弹窗——监听 x-manage-open-url 事件 */
function IframeModal() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { url: string }
      setUrl(detail.url)
    }
    window.addEventListener('x-manage-open-url', handler)
    return () => window.removeEventListener('x-manage-open-url', handler)
  }, [])

  if (!url) return null

  const openInNewWindow = () => {
    window.open(url, '_blank', 'noopener')
    setUrl(null)
  }

  return (
    <div className="x-manage-xlink-backdrop" onClick={() => setUrl(null)}>
      <div className="x-manage-xlink-frame" onClick={e => e.stopPropagation()}>
        <div className="x-manage-xlink-toolbar">
          <span className="x-manage-xlink-url" title={url}>{url}</span>
          <div className="x-manage-xlink-actions">
            <button className="x-manage-xlink-btn-open" onClick={openInNewWindow}>新窗口打开</button>
            <button className="x-manage-xlink-btn-close" onClick={() => setUrl(null)}>关闭</button>
          </div>
        </div>
        <iframe className="x-manage-xlink-iframe" src={url} />
      </div>
    </div>
  )
}

export function XLinkFeature({ storage }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [config, setConfig] = useState<XLinkConfig>({ enabled: true, mode: 'iframe' })
  const [fabPos, setFabPos] = useState({ top: 240, left: 16 })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    const destroyRef: { current?: () => void } = {}
    storage.getXLinkConfig().then(c => {
      setConfig(c)
      destroyRef.current = initXLink(c)
    }).catch(() => {})
    storage.getFabPosition().then(p => { if (p) setFabPos(p) }).catch(() => {})
    return () => { destroyRef.current?.() }
  }, [storage])

  const toggleEnabled = async () => {
    const next = { ...config, enabled: !config.enabled }
    setConfig(next)
    await storage.setXLinkConfig(next)
    updateConfig(next)
    showToast(next.enabled ? '链接拦截已开启' : '链接拦截已关闭')
  }

  const setMode = async (mode: 'iframe' | 'new-window') => {
    const next = { ...config, mode }
    setConfig(next)
    await storage.setXLinkConfig(next)
    updateConfig(next)
    showToast(mode === 'iframe' ? '已切换为 iframe 弹窗' : '已切换为新窗口')
  }

  return (
    <>
      <Fab defaultPos={fabPos} onPosChange={p => { setFabPos(p); storage.setFabPosition(p) }} onClick={() => setShowModal(true)} />
      <Toast message={toast} />
      <IframeModal />
      {showModal && (
        <div className="x-manage-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="x-manage-modal" onClick={e => e.stopPropagation()}>
            <div className="x-manage-modal-header">
              <h2>链接拦截</h2>
              <button className="x-manage-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="x-manage-modal-body">
              <div style={{ marginBottom: 16 }}>
                <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>状态</div>
                <button
                  className={`x-manage-btn ${config.enabled ? 'x-manage-btn-danger' : 'x-manage-btn-primary'}`}
                  onClick={toggleEnabled}
                >
                  {config.enabled ? '关闭拦截' : '开启拦截'}
                </button>
              </div>
              <div>
                <div className="x-manage-filter-label" style={{ marginBottom: 8 }}>打开方式</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`x-manage-btn ${config.mode === 'iframe' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`}
                    onClick={() => setMode('iframe')}
                  >
                    iframe 弹窗
                  </button>
                  <button
                    className={`x-manage-btn ${config.mode === 'new-window' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`}
                    onClick={() => setMode('new-window')}
                  >
                    新窗口
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 12, color: '#636e72', lineHeight: 1.6 }}>
                {config.mode === 'iframe'
                  ? '开启后，点击 X 上的内部链接会在 iframe 弹窗中打开，当前页面不会跳转。'
                  : '开启后，点击 X 上的内部链接会打开新窗口，当前页面不会跳转。'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
