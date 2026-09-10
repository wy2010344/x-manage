import { useState, useEffect, useCallback, type SetStateAction } from 'react'
import { Toast } from 'x-manage-share'
import type { FavTweet } from './types'
import { getAllFavs } from './favStore'
import { updateFavButtonStates } from './fav'
import { FavListPanel } from './FavListPanel'

interface FavToggleDetail {
  authorHandle: string
  authorName: string
  tweetId: string
  tweetUrl: string
  tweetText: string
}

/**
 * 收藏设置面板——控制中心「收藏」tab 的内容。
 * Notion 同步已移至控制中心顶层的公共「Notion」tab。
 * 星标按钮自身直接写 IndexedDB（见 fav.ts），本面板只负责展示与刷新。
 */
export function FavSettingsPanel() {
  const [toast, setToast] = useState<string | null>(null)
  const [favs, setFavs] = useState<FavTweet[]>([])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    getAllFavs().then(setFavs).catch(() => {})
  }, [])

  // 页面星标点击写入成功后，通知本面板刷新列表
  const handleFavChanged = useCallback(async (detail: { favorited: boolean }) => {
    const favs = await getAllFavs()
    setFavs(favs)
    showToast(detail.favorited ? '已收藏到本地' : '已取消收藏')
  }, [showToast])

  // 收藏列表面板增删后，同步刷新页面上的所有星标按钮
  const setFavsSync = useCallback((next: SetStateAction<FavTweet[]>) => {
    setFavs(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      updateFavButtonStates(resolved)
      return resolved
    })
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { favorited: boolean }
      handleFavChanged(detail)
    }
    window.addEventListener('x-manage-fav-changed', handler)
    return () => window.removeEventListener('x-manage-fav-changed', handler)
  }, [handleFavChanged])

  return (
    <>
      <Toast message={toast} />
      <FavListPanel favs={favs} setFavs={setFavsSync} showToast={showToast} />
    </>
  )
}