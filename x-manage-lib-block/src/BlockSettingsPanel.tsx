import { useState, useEffect, useCallback } from 'react'
import { Toast } from 'x-manage-share'
import type { BlockWord, BlockStorage } from './types'
import { BlockWordsPanel } from './BlockWordsPanel'
import { IoPanel } from './IoPanel'

interface Props {
  storage: BlockStorage
}

/**
 * 屏蔽词设置面板——控制中心「屏蔽词」tab 的内容。
 * 子 tab：屏蔽词列表 / 导入导出。
 */
export function BlockSettingsPanel({ storage }: Props) {
  const [tab, setTab] = useState('block')
  const [words, setWords] = useState<BlockWord[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    storage.getBlockWords().then(setWords).catch(() => {})
  }, [storage])

  const handleAdd = async (word: string) => {
    const result = await storage.addBlockWord(word)
    setWords(result.words)
    if (!result.added) showToast('该词已存在')
  }
  const handleRemove = async (id: string) => setWords(await storage.removeBlockWord(id))
  const handleToggle = async (id: string) => setWords(await storage.toggleBlockWord(id))
  const handleMatchFieldChange = async (id: string, field: 'both' | 'body' | 'author') => {
    const ws = words.map(w => w.id === id ? { ...w, matchField: field } : w)
    setWords(ws)
    await storage.setBlockWords(ws)
  }
  const handleCaseSensitive = async (id: string, cs: boolean) => {
    const ws = words.map(w => w.id === id ? { ...w, caseSensitive: cs } : w)
    setWords(ws)
    await storage.setBlockWords(ws)
  }
  const handleExport = async () => {
    const text = await storage.exportBlockWords()
    setExportText(text)
    try { await navigator.clipboard.writeText(text) } catch { /* 非安全上下文或权限不足时静默失败 */ }
    showToast('已复制到剪贴板')
  }
  const handleImport = async () => {
    const result = await storage.importBlockWords(importText)
    setWords(await storage.getBlockWords())
    showToast(result.success ? `已导入 ${result.count} 个词` : result.error || '导入失败')
    if (result.success) setImportText('')
  }

  return (
    <>
      <Toast message={toast} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'block' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('block')}>屏蔽词</button>
        <button className={`x-manage-btn x-manage-btn-sm ${tab === 'io' ? 'x-manage-btn-primary' : 'x-manage-btn-secondary'}`} onClick={() => setTab('io')}>导入/导出</button>
      </div>
      {tab === 'block' && (
        <BlockWordsPanel
          words={words}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onToggle={handleToggle}
          onMatchFieldChange={handleMatchFieldChange}
          onCaseSensitiveChange={handleCaseSensitive}
        />
      )}
      {tab === 'io' && <IoPanel exportText={exportText} importText={importText} onExport={handleExport} onImport={handleImport} onImportTextChange={setImportText} />}
    </>
  )
}