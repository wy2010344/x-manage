import { useState, useEffect, useCallback } from 'react';
import './Popup.css';
import type { BlockWord, FilterRule, FilterField } from 'x-manage-lib-block';
import {
  getBlockWords,
  getFilterRule,
  addBlockWord,
  removeBlockWord,
  toggleBlockWord,
  setFilterRule,
  exportBlockWords,
  importBlockWords,
} from '../storage';

export default function () {
  const [words, setWords] = useState<BlockWord[]>([]);
  const [filterRule, setFilterRuleState] = useState<FilterRule>({ field: 'all', caseSensitive: false });
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'words' | 'filter' | 'io'>('words');
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');

  const loadData = useCallback(async () => {
    const [loadedWords, loadedRule] = await Promise.all([
      getBlockWords(),
      getFilterRule(),
    ]);
    setWords(loadedWords);
    setFilterRuleState(loadedRule);
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

  const handleFilterChange = useCallback(async (field: FilterField) => {
    const newRule = { ...filterRule, field };
    setFilterRuleState(newRule);
    await setFilterRule(newRule);
  }, [filterRule]);

  const handleCaseSensitiveChange = useCallback(async (caseSensitive: boolean) => {
    const newRule = { ...filterRule, caseSensitive };
    setFilterRuleState(newRule);
    await setFilterRule(newRule);
  }, [filterRule]);

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

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>X Content Manage</h1>
        <span className="popup-badge">
          {words.filter(w => w.enabled).length} 个屏蔽词
        </span>
      </header>

      <div className="popup-tabs">
        {(['words', 'filter', 'io'] as const).map(tab => (
          <button
            key={tab}
            className={`popup-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ words: '屏蔽词', filter: '规则', io: '导入/导出' }[tab]}
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
                  <button className="popup-btn popup-btn-danger popup-btn-sm" onClick={() => handleRemove(w.id)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'filter' && (
        <div className="popup-section">
          <label className="popup-label">匹配字段</label>
          <select
            className="popup-select"
            value={filterRule.field}
            onChange={e => handleFilterChange(e.target.value as FilterField)}
          >
            <option value="all">所有内容</option>
            <option value="content">推文正文</option>
            <option value="author">作者名称</option>
          </select>

          <label className="popup-checkbox" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={filterRule.caseSensitive} onChange={e => handleCaseSensitiveChange(e.target.checked)} />
            区分大小写
          </label>
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
