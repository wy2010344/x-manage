import { useState, useEffect, useCallback } from 'react';
import './Popup.css';
import type { BlockWord } from 'x-manage-lib-block';
import {
  getBlockWords,
  addBlockWord,
  removeBlockWord,
  toggleBlockWord,
  exportBlockWords,
  importBlockWords,
} from '../storage';

export default function () {
  const [words, setWords] = useState<BlockWord[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'words' | 'io'>('words');
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');

  const loadData = useCallback(async () => {
    setWords(await getBlockWords());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = useCallback(async () => {
    const word = inputValue.trim();
    if (!word) return;
    await addBlockWord(word);
    setInputValue('');
    loadData();
  }, [inputValue, loadData]);

  const handleRemove = useCallback(async (id: string) => {
    await removeBlockWord(id);
    loadData();
  }, [loadData]);

  const handleToggle = useCallback(async (id: string) => {
    await toggleBlockWord(id);
    loadData();
  }, [loadData]);

  const handleExport = useCallback(async () => {
    const json = await exportBlockWords();
    setExportText(json);
    try {
      await navigator.clipboard.writeText(json);
    } catch { /* ignore */ }
    setActiveTab('io');
  }, []);

  const handleImport = useCallback(async () => {
    if (!importText.trim()) return;
    await importBlockWords(importText.trim());
    setImportText('');
    loadData();
  }, [importText, loadData]);

  const FIELD_SHORT: Record<string, string> = {
    both: '正文+名',
    body: '正文',
    author: '显示名',
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>X Content Manage</h1>
        <span className="popup-badge">
          {words.filter(w => w.enabled).length} 个屏蔽词
        </span>
      </header>

      <div className="popup-tabs">
        {(['words', 'io'] as const).map(tab => (
          <button
            key={tab}
            className={`popup-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ words: '屏蔽词', io: '导入/导出' }[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'words' && (
        <div className="popup-section">
          <div className="popup-add-row">
            <input
              className="popup-input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="输入屏蔽词..."
            />
            <button className="popup-btn popup-btn-primary" onClick={handleAdd}>添加</button>
          </div>

          <div className="popup-list">
            {words.length === 0 ? (
              <div className="popup-empty">暂无屏蔽词</div>
            ) : (
              words.map(w => (
                <div key={w.id} className={`popup-item${!w.enabled ? ' disabled' : ''}`}>
                  <label className="popup-toggle">
                    <input type="checkbox" checked={w.enabled} onChange={() => handleToggle(w.id)} />
                    <span className="popup-toggle-slider" />
                  </label>
                  <span className="popup-word">{w.word}</span>
                  <span className="popup-field-badge">{FIELD_SHORT[w.matchField || 'both']}</span>
                  {w.caseSensitive && <span className="popup-field-badge">Aa</span>}
                  <button className="popup-btn popup-btn-danger popup-btn-sm" onClick={() => handleRemove(w.id)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'io' && (
        <div className="popup-section">
          <button className="popup-btn popup-btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={handleExport}>
            导出并复制到剪贴板
          </button>
          <textarea className="popup-textarea" value={exportText} readOnly placeholder="导出的 JSON 数据…" rows={3} />

          <div className="popup-divider" />

          <textarea
            className="popup-textarea"
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="在此粘贴 JSON 数据…"
            rows={3}
          />
          <button className="popup-btn popup-btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleImport} disabled={!importText.trim()}>
            导入
          </button>
        </div>
      )}
    </div>
  );
}