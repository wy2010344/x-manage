import { useState, useEffect, useCallback, type SetStateAction } from 'react'
import { Toast } from 'x-manage-share'
import type { FavTweet } from './types'
import { getAllFavs, toggleFav } from './favStore'
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

  const handleFavToggle = useCallback(async (detail: FavToggleDetail) => {
    const favorited = await toggleFav(detail)
    const favs = await getAllFavs()
    setFavs(favs)
    updateFavButtonStates(favs)
    showToast(favorited ? '已收藏到本地' : '已取消收藏')
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
      const detail = (e as CustomEvent).detail as FavToggleDetail
      handleFavToggle(detail)
    }
    window.addEventListener('x-manage-fav-toggle', handler)
    return () => window.removeEventListener('x-manage-fav-toggle', handler)
  }, [handleFavToggle])

  return (
    <>
      <Toast message={toast} />
      <FavListPanel favs={favs} setFavs={setFavsSync} showToast={showToast} />
    </>
  )
}