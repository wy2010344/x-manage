import { useState, useEffect, useCallback } from 'react'
import { Fab, Toast } from 'x-manage-share'
import type { BlockWord, FilterRule, FilterField, BlockStorage } from './types'
import { BlockWordsPanel } from './BlockWordsPanel'
import { FilterPanel } from './FilterPanel'
import { IoPanel } from './IoPanel'

interface Props {
  /** 由消费者传入的 storage 适配器 */
  storage: BlockStorage
}

/**
 * 屏蔽词管理功能——独立完整的 UI 模块。
 * 包含自己的 FAB 按钮 + 模态框（屏蔽词列表 / 匹配规则 / 导入导出三个标签页）。
 */
export function BlockFeature({ storage }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('block')
  const [words, setWords] = useState<BlockWord[]>([])
  const [rule, setRule] = useState<FilterRule>({ field: 'all', caseSensitive: false })
  const [fabPos, setFabPos] = useState({ top: 100, left: 16 })
  const [toast, setToast] = useState<string | null>(null)
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    storage.getFabPosition().then(p => { if (p) setFabPos(p) })
    storage.getFilterRule().then(setRule)
    storage.getBlockWords().then(setWords)
  }, [storage])

  const handleAdd = async (word: string) => {
    const result = await storage.addBlockWord(word)
    setWords(result.words)
    if (!result.added) showToast('该词已存在')
  }
  const handleRemove = async (id: string) => setWords(await storage.removeBlockWord(id))
  const handleToggle = async (id: string) => setWords(await storage.toggleBlockWord(id))
  const handleFieldChange = async (field: FilterField) => {
    const r = { ...rule, field }; setRule(r); await storage.setFilterRule(r)
  }
  const handleCaseSensitive = async (cs: boolean) => {
    const r = { ...rule, caseSensitive: cs }; setRule(r); await storage.setFilterRule(r)
  }
  const handleExport = async () => {
    const text = await storage.exportBlockWords()
    setExportText(text)
    await navigator.clipboard.writeText(text)
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
      <Fab defaultPos={fabPos} onPosChange={p => { setFabPos(p); storage.setFabPosition(p) }} onClick={() => setShowModal(true)} />
      <Toast message={toast} />
      {showModal && (
        <div className="x-manage-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="x-manage-modal" onClick={e => e.stopPropagation()}>
            <div className="x-manage-modal-header">
              <h2>屏蔽词管理</h2>
              <button className="x-manage-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="x-manage-modal-body">
              <div className="x-manage-tabs">
                {['block', 'filter', 'io'].map(t => (
                  <button key={t} className={`x-manage-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                    {{ block: '屏蔽词', filter: '匹配规则', io: '导入/导出' }[t]}
                  </button>
                ))}
              </div>
              {tab === 'block' && <BlockWordsPanel words={words} onAdd={handleAdd} onRemove={handleRemove} onToggle={handleToggle} />}
              {tab === 'filter' && <FilterPanel rule={rule} activeCount={words.filter(w => w.enabled).length} onFieldChange={handleFieldChange} onCaseSensitiveChange={handleCaseSensitive} />}
              {tab === 'io' && <IoPanel exportText={exportText} importText={importText} onExport={handleExport} onImport={handleImport} onImportTextChange={setImportText} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
