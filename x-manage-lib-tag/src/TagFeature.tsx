import { useState, useEffect, useCallback } from 'react'
import { Fab, Toast } from 'x-manage-share'
import { getAllTags } from './tagStore'
import type { TweetTag, TagStorage } from './types'
import { TagPanel } from './TagPanel'

interface Props {
  /** 由消费者传入的 storage 适配器（用于读取/保存 Notion 配置） */
  storage: TagStorage
}

/**
 * 标签管理功能——独立完整的 UI 模块。
 * 包含自己的 FAB 按钮 + 模态框（标签列表 + Notion 同步）。
 */
export function TagFeature({ storage }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [tags, setTags] = useState<TweetTag[]>([])
  const [fabPos, setFabPos] = useState({ top: 170, left: 16 })
  const [toast, setToast] = useState<string | null>(null)
  const [notionKey, setNotionKey] = useState('')
  const [notionDbId, setNotionDbId] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    storage.getFabPosition?.().then(p => { if (p) setFabPos(p) })
    getAllTags().then(setTags)
    storage.getNotionConfig?.().then(c => {
      if (c) { setNotionKey(c.apiKey); setNotionDbId(c.databaseId) }
    })
  }, [storage])

  return (
    <>
      <Fab defaultPos={fabPos} onPosChange={p => { setFabPos(p); storage.setFabPosition?.(p) }} onClick={() => setShowModal(true)} />
      <Toast message={toast} />
      {showModal && (
        <div className="x-manage-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="x-manage-modal" onClick={e => e.stopPropagation()}>
            <div className="x-manage-modal-header">
              <h2>标签管理</h2>
              <button className="x-manage-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="x-manage-modal-body">
              <TagPanel tags={tags} setTags={setTags} showToast={showToast} storage={storage} notionKey={notionKey} notionDbId={notionDbId} setNotionKey={setNotionKey} setNotionDbId={setNotionDbId} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
