import { useState, useEffect, useCallback } from 'react'
import { Toast } from 'x-manage-share'
import { getAllTags } from './tagStore'
import type { TweetTag } from './types'
import { TagPanel } from './TagPanel'

/**
 * 标签设置面板——控制中心「标签」tab 的内容。
 * Notion 同步已移至控制中心顶层的公共「Notion」tab。
 * 注意：per-tweet 的「此推文」弹窗仍由 TagFeature 负责，不受影响。
 */
export function TagSettingsPanel() {
  const [toast, setToast] = useState<string | null>(null)
  const [tags, setTags] = useState<TweetTag[]>([])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    getAllTags().then(setTags).catch(() => {})
  }, [])

  return (
    <>
      <Toast message={toast} />
      <TagPanel tags={tags} setTags={setTags} showToast={showToast} />
    </>
  )
}