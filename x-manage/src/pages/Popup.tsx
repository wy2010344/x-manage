import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import './Popup.css';
import type { BlockWord } from 'x-manage-lib-block';
import type { FavTweet } from 'x-manage-lib-fav';
import {
  getBlockWords,
  addBlockWord,
  removeBlockWord,
  toggleBlockWord,
  exportBlockWords,
  importBlockWords,
} from '../storage';

/** 向当前活动 tab 的 content script 发消息（收藏数据存在页面 origin 的 IndexedDB，popup 无法直连） */
async function askFavs(msg: { type: 'get-favs' } | { type: 'remove-fav'; id: string }): Promise<FavTweet[]> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) throw new Error('no active tab');
  const res: unknown = await browser.tabs.sendMessage(tab.id, { source: 'x-manage-popup', ...msg });
  if (!Array.isArray(res)) throw new Error('content script not reachable');
  return res as FavTweet[];
}

export default function () {
  const [words, setWords] = useState<BlockWord[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'words' | 'io' | 'fav'>('words');
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [favs, setFavs] = useState<FavTweet[]>([]);
  const [favError, setFavError] = useState('');
  const [favLoading, setFavLoading] = useState(false);

  const loadData = useCallback(async () => {
    setWords(await getBlockWords());
  }, []);

  const loadFavs = useCallback(async () => {
    setFavLoading(true); setFavError('');
    try {
      setFavs(await askFavs({ type: 'get-favs' }));
    } catch {
      setFavError('无法读取收藏：请在 x.com 页面打开本弹窗，或刷新 X 页面后重试');
    } finally {
      setFavLoading(false);
    }
  }, []);

  const handleFavDelete = useCallback(async (id: string) => {
    try {
      setFavs(await askFavs({ type: 'remove-fav', id }));
    } catch {
      loadFavs();
    }
  }, [loadFavs]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (activeTab === 'fav') loadFavs();
  }, [activeTab, loadFavs]);

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
        {(['words', 'io', 'fav'] as const).map(tab => (
          <button
            key={tab}
            className={`popup-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ words: '屏蔽词', io: '导入/导出', fav: '收藏' }[tab]}
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

      {activeTab === 'fav' && (
        <div className="popup-section">
          {favLoading ? (
            <div className="popup-empty">加载中…</div>
          ) : favError ? (
            <div className="popup-empty" style={{ color: '#c0392b' }}>{favError}</div>
          ) : favs.length === 0 ? (
            <div className="popup-empty">暂无收藏</div>
          ) : (
            <div className="popup-list">
              {favs.map(f => (
                <div key={f.id} className="popup-item" style={{ height: 'auto', padding: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: '#f6b93b' }}>★ {f.authorName || f.authorHandle}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', wordBreak: 'break-word' }}>
                      {f.tweetText.length > 100 ? `${f.tweetText.slice(0, 100)}…` : f.tweetText}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {f.tweetUrl && (
                      <a href={f.tweetUrl} target="_blank" rel="noopener noreferrer" className="popup-btn popup-btn-sm">跳转</a>
                    )}
                    <button className="popup-btn popup-btn-danger popup-btn-sm" onClick={() => handleFavDelete(f.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}