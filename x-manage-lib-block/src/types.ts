export interface BlockWord {
  id: string;
  word: string;
  enabled: boolean;
  matchField: 'both' | 'body' | 'author';
  caseSensitive: boolean;
  createdAt: number;
}

export interface FilterRule {
  // 保留空接口以保持向后兼容
}

export interface BlockStorage {
  getBlockWords(): Promise<BlockWord[]>
  setBlockWords(words: BlockWord[]): Promise<void>
  addBlockWord(word: string): Promise<{ words: BlockWord[]; added: boolean }>
  removeBlockWord(id: string): Promise<BlockWord[]>
  toggleBlockWord(id: string): Promise<BlockWord[]>
  getFilterRule(): Promise<FilterRule>
  setFilterRule(rule: FilterRule): Promise<void>
  exportBlockWords(): Promise<string>
  importBlockWords(json: string): Promise<{ success: boolean; count: number; error?: string }>
  onWordsChanged?: (callback: () => void) => () => void
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}