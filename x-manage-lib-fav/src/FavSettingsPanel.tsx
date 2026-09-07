import { useState, useEffect, useCallback } from 'react'
import { Toast } from 'x-manage-share'
import type { FavTweet, FavStorage } from './types'
import { getAllFavs, removeFavByTweetId, addFav } from './favStore'
import { FavListPanel } from './FavListPanel'
import { FavNotionPanel } from './FavNotionPanel'

interface Props {
  storage: FavStorage
}

interface FavToggleDetail {
  authorHandle: string
  authorName: string
  tweetId: string
  tweetUrl: string
  tweetText: string
}

/**
 * 收藏设置面板——控制中心「收藏」tab 的内容。
 * 子 tab：收藏列表 / Notion同步。
 */
export function FavSettingsPanel({ storage }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<'favs' | 'notion'>('favs')
  const [favs, setFavs] = useState<FavTweet[]>([])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    getAllFavs().then(setFavs).catch(() => {})
  }, [storage])

  const handleFavToggle = useCallback(async (detail: FavToggleDetail) => {
    const existing = await getAllFavs()
    const found = existing.find(f => f.tweetId === detail.tweetId)
    if (found) {
      await removeFavByTweetId(detail.tweetId)
      setFavs(await getAllFavs())
      showToast('已取消收藏')
    } else {
      const now = Date.now()
      await addFav({
        id: `${detail.authorHandle}_${detail.tweetId}_${now}`,
        authorHandle: detail.authorHandle,
        authorName: detail.authorName || detail.authorHandle.replace('/', ''),
        tweetId: detail.tweetId,
        tweetText: detail.tweetText,
        tweetUrl: detail.tweetUrl,
        createdAt: now,
        updatedAt: now,
      })
      setFavs(await getAllFavs())
      showToast('已收藏到本地')
    }
  }, [showToast])

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'favs' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('favs')}>收藏列表</button>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'notion' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('notion')}>Notion同步</button>
      </div>
      {tab === 'favs' ? (
        <FavListPanel favs={favs} setFavs={setFavs} showToast={showToast} />
      ) : (
        <FavNotionPanel favs={favs} setFavs={setFavs} showToast={showToast} />
      )}
    </>
  )
}