import { useState, useEffect, useCallback } from 'react'
import { Toast } from 'x-manage-share'
import { getAllTags } from './tagStore'
import type { TweetTag, TagStorage } from './types'
import { TagPanel } from './TagPanel'
import { NotionPanel } from './NotionPanel'

interface Props {
  storage: TagStorage
}

/**
 * 标签设置面板——控制中心「标签」tab 的内容。
 * 子 tab：全部标签 / Notion同步。
 * 注意：per-tweet 的「此推文」弹窗仍由 TagFeature 负责，不受影响。
 */
export function TagSettingsPanel({ storage }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'notion'>('all')
  const [tags, setTags] = useState<TweetTag[]>([])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    getAllTags().then(setTags).catch(() => {})
  }, [storage])

  return (
    <>
      <Toast message={toast} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'all' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('all')}>全部标签</button>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'notion' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('notion')}>Notion同步</button>
      </div>
      {tab === 'all' ? (
        <TagPanel tags={tags} setTags={setTags} showToast={showToast} />
      ) : (
        <NotionPanel tags={tags} setTags={setTags} showToast={showToast} storage={storage} />
      )}
    </>
  )
}