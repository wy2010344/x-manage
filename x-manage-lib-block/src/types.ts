export interface BlockWord {
  id: string;
  word: string;
  enabled: boolean;
  createdAt: number;
}

export type FilterField = 'all' | 'content' | 'author';

export interface FilterRule {
  field: FilterField;
  caseSensitive: boolean;
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
