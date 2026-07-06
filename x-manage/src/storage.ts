import browser from 'webextension-polyfill';
import type { BlockWord, FilterRule, FilterField } from 'x-manage-lib-block';

const STORAGE_KEYS = {
  BLOCK_WORDS: 'x_manage_block_words',
  FILTER_RULE: 'x_manage_filter_rule',
};

const DEFAULT_FILTER_RULE: FilterRule = {
  field: 'all',
  caseSensitive: false,
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export async function getBlockWords(): Promise<BlockWord[]> {
  const result = await browser.storage.local.get(STORAGE_KEYS.BLOCK_WORDS);
  return result[STORAGE_KEYS.BLOCK_WORDS] || [];
}

export async function setBlockWords(words: BlockWord[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.BLOCK_WORDS]: words });
}

export async function addBlockWord(word: string): Promise<{ words: BlockWord[]; added: boolean }> {
  const words = await getBlockWords();
  if (words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
    return { words, added: false };
  }
  const newWord: BlockWord = {
    id: generateId(),
    word,
    enabled: true,
    createdAt: Date.now(),
  };
  words.push(newWord);
  await setBlockWords(words);
  return { words, added: true };
}

export async function removeBlockWord(id: string): Promise<BlockWord[]> {
  const words = await getBlockWords();
  const filtered = words.filter(w => w.id !== id);
  await setBlockWords(filtered);
  return filtered;
}

export async function toggleBlockWord(id: string): Promise<BlockWord[]> {
  const words = await getBlockWords();
  const word = words.find(w => w.id === id);
  if (word) {
    word.enabled = !word.enabled;
    await setBlockWords(words);
  }
  return words;
}

export async function updateBlockWord(id: string, word: string): Promise<BlockWord[]> {
  const words = await getBlockWords();
  const target = words.find(w => w.id === id);
  if (target) {
    target.word = word;
    await setBlockWords(words);
  }
  return words;
}

export async function getFilterRule(): Promise<FilterRule> {
  const result = await browser.storage.local.get(STORAGE_KEYS.FILTER_RULE);
  return result[STORAGE_KEYS.FILTER_RULE] || DEFAULT_FILTER_RULE;
}

export async function setFilterRule(rule: FilterRule): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.FILTER_RULE]: rule });
}

export async function exportBlockWords(): Promise<string> {
  const words = await getBlockWords();
  const data = {
    version: 1,
    exportedAt: Date.now(),
    words: words.map(w => ({ word: w.word, enabled: w.enabled })),
  };
  return JSON.stringify(data, null, 2);
}

export async function importBlockWords(jsonStr: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.words || !Array.isArray(data.words)) {
      return { success: false, count: 0, error: '格式无效：缺少 words 数组' };
    }
    const currentWords = await getBlockWords();
    const currentWordSet = new Set(currentWords.map(w => w.word.toLowerCase()));
    let addedCount = 0;
    for (const item of data.words) {
      if (item.word && !currentWordSet.has(item.word.toLowerCase())) {
        currentWords.push({
          id: generateId(),
          word: item.word,
          enabled: item.enabled !== false,
          createdAt: Date.now(),
        });
        currentWordSet.add(item.word.toLowerCase());
        addedCount++;
      }
    }
    await setBlockWords(currentWords);
    return { success: true, count: addedCount };
  } catch {
    return { success: false, count: 0, error: 'JSON 解析失败' };
  }
}

const FAB_POS_KEY = 'x_manage_fab_position'
const XLINK_CONFIG_KEY = 'x_manage_xlink_config'

export async function getFabPosition(): Promise<{ top: number; left: number } | null> {
  const result = await browser.storage.local.get(FAB_POS_KEY);
  return result[FAB_POS_KEY] || null;
}

export async function setFabPosition(pos: { top: number; left: number }): Promise<void> {
  await browser.storage.local.set({ [FAB_POS_KEY]: pos });
}

export async function getXLinkConfig(): Promise<{ enabled: boolean; mode: 'iframe' | 'new-window' }> {
  const result = await browser.storage.local.get(XLINK_CONFIG_KEY);
  return result[XLINK_CONFIG_KEY] || { enabled: true, mode: 'iframe' };
}

export async function setXLinkConfig(config: { enabled: boolean; mode: 'iframe' | 'new-window' }): Promise<void> {
  await browser.storage.local.set({ [XLINK_CONFIG_KEY]: config });
}

const NOTION_CONFIG_KEY = 'x_manage_notion_config'

export async function getNotionConfig(): Promise<{ apiKey: string; databaseId: string } | null> {
  const result = await browser.storage.local.get(NOTION_CONFIG_KEY);
  return result[NOTION_CONFIG_KEY] || null;
}

export async function setNotionConfig(config: { apiKey: string; databaseId: string }): Promise<void> {
  await browser.storage.local.set({ [NOTION_CONFIG_KEY]: config });
}

export function onWordsChanged(callback: () => void): () => void {
  const handler = (changes: Record<string, browser.Storage.StorageChange>, area: string) => {
    if (area === 'local' && (STORAGE_KEYS.BLOCK_WORDS in changes || STORAGE_KEYS.FILTER_RULE in changes)) {
      callback();
    }
  };
  browser.storage.onChanged.addListener(handler);
  return () => browser.storage.onChanged.removeListener(handler);
}
