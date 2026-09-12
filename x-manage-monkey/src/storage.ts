import type { BlockWord, FilterRule } from 'x-manage-lib-block'

const STORAGE_KEYS = {
  BLOCK_WORDS: 'x_manage_block_words',
  FILTER_RULE: 'x_manage_filter_rule',
}

const DEFAULT_FILTER_RULE: FilterRule = { caseSensitive: false }

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export async function getBlockWords(): Promise<BlockWord[]> {
  try { return JSON.parse(GM_getValue(STORAGE_KEYS.BLOCK_WORDS, '[]')) }
  catch { return [] }
}

export async function setBlockWords(words: BlockWord[]): Promise<void> {
  try { GM_setValue(STORAGE_KEYS.BLOCK_WORDS, JSON.stringify(words)) } catch (err) { console.error('x-manage setBlockWords error:', err) }
}

export async function addBlockWord(word: string): Promise<{ words: BlockWord[]; added: boolean }> {
  const words = await getBlockWords()
  if (words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
    return { words, added: false }
  }
  const newWord: BlockWord = { id: generateId(), word, enabled: true, matchField: 'both', caseSensitive: false, createdAt: Date.now() }
  words.push(newWord)
  await setBlockWords(words)
  return { words, added: true }
}

export async function removeBlockWord(id: string): Promise<BlockWord[]> {
  const words = (await getBlockWords()).filter(w => w.id !== id)
  await setBlockWords(words)
  return words
}

export async function toggleBlockWord(id: string): Promise<BlockWord[]> {
  const words = await getBlockWords()
  const word = words.find(w => w.id === id)
  if (word) { word.enabled = !word.enabled; await setBlockWords(words) }
  return words
}

export async function getFilterRule(): Promise<FilterRule> {
  try { return JSON.parse(GM_getValue(STORAGE_KEYS.FILTER_RULE, JSON.stringify(DEFAULT_FILTER_RULE))) }
  catch { return DEFAULT_FILTER_RULE }
}

export async function setFilterRule(rule: FilterRule): Promise<void> {
  try { GM_setValue(STORAGE_KEYS.FILTER_RULE, JSON.stringify(rule)) } catch (err) { console.error('x-manage setFilterRule error:', err) }
}

export async function exportBlockWords(): Promise<string> {
  const words = await getBlockWords()
  return JSON.stringify({ version: 1, exportedAt: Date.now(), words: words.map(w => ({ word: w.word, enabled: w.enabled })) }, null, 2)
}

const FAB_POS_KEY = 'x_manage_fab_position'
const NOTION_SETUP_KEY = 'x_manage_notion_setup'
const XLINK_CONFIG_KEY = 'x_manage_xlink_config'

export async function getFabPosition(): Promise<{ top: number; left: number } | null> {
  try { return JSON.parse(GM_getValue(FAB_POS_KEY, 'null')) }
  catch { return null }
}

export async function setFabPosition(pos: { top: number; left: number }): Promise<void> {
  try { GM_setValue(FAB_POS_KEY, JSON.stringify(pos)) } catch (err) { console.error('x-manage setFabPosition error:', err) }
}

export async function getNotionSetup(): Promise<{ proxyUrl: string; rootPageId: string; rootPageUrl?: string; accountHandle?: string } | null> {
  try { return JSON.parse(GM_getValue(NOTION_SETUP_KEY, 'null')) }
  catch { return null }
}

export async function setNotionSetup(setup: { proxyUrl: string; rootPageId: string; rootPageUrl?: string; accountHandle?: string }): Promise<void> {
  try { GM_setValue(NOTION_SETUP_KEY, JSON.stringify(setup)) } catch (err) { console.error('x-manage setNotionSetup error:', err) }
}

export async function getXLinkConfig(): Promise<{ enabled: boolean; mode: 'iframe' | 'new-window' }> {
  try { return JSON.parse(GM_getValue(XLINK_CONFIG_KEY, JSON.stringify({ enabled: true, mode: 'iframe' }))) }
  catch { return { enabled: true, mode: 'iframe' as const } }
}

export async function setXLinkConfig(config: { enabled: boolean; mode: 'iframe' | 'new-window' }): Promise<void> {
  try { GM_setValue(XLINK_CONFIG_KEY, JSON.stringify(config)) } catch (err) { console.error('x-manage setXLinkConfig error:', err) }
}

export async function importBlockWords(jsonStr: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonStr)
    if (!Array.isArray(data.words)) return { success: false, count: 0, error: '格式无效：缺少 words 数组' }
    const current = await getBlockWords()
    const existing = new Set(current.map(w => w.word.toLowerCase()))
    let added = 0
    for (const item of data.words) {
      if (item.word && !existing.has(item.word.toLowerCase())) {
        current.push({ id: generateId(), word: item.word, enabled: item.enabled !== false, matchField: item.matchField || 'both', caseSensitive: item.caseSensitive ?? false, createdAt: Date.now() })
        existing.add(item.word.toLowerCase())
        added++
      }
    }
    await setBlockWords(current)
    return { success: true, count: added }
  } catch { return { success: false, count: 0, error: 'JSON 解析失败' } }
}
