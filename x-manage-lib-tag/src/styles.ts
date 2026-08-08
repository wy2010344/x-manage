/**
 * 标签模块专属样式——推文内的标签行、标签按钮、标签对话框。
 * 颜色使用 x-manage-share 定义的 CSS 变量（--xm-*），自动适配亮/暗主题。
 */
export const TAG_STYLES = `
.x-manage-tag-row { display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 4px !important; }
.x-manage-tweet-tags { display: inline-flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 4px !important; }
.x-manage-tag-chip { display: inline-flex !important; align-items: center !important; font-size: 11px !important; font-weight: 600 !important; color: var(--xm-chip-text) !important; background: var(--xm-chip-bg) !important; border: 1px solid var(--xm-chip-border) !important; border-radius: 3px !important; padding: 1px 6px !important; text-decoration: none !important; line-height: 1.4 !important; transition: all 0.15s ease !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
.x-manage-tag-chip:hover { color: var(--xm-text) !important; background: var(--xm-chip-bg-hover) !important; border-color: var(--xm-chip-border-hover) !important; }
.x-manage-tag-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 20px !important; height: 20px !important; padding: 0 !important; border: none !important; background: transparent !important; cursor: pointer !important; color: var(--xm-text-muted) !important; transition: all 0.15s ease !important; }
.x-manage-tag-btn:hover { color: var(--xm-text-secondary) !important; }
.x-manage-tag-btn svg { width: 14px !important; height: 14px !important; display: block !important; }
.x-manage-tag-dialog-backdrop { position: fixed !important; inset: 0 !important; z-index: 2147483646 !important; background: var(--xm-overlay) !important; display: flex !important; align-items: center !important; justify-content: center !important; animation: x-manage-fadeIn 0.15s ease !important; }
.x-manage-tag-dialog { background: var(--xm-bg) !important; border-radius: 12px !important; width: min(360px, calc(100vw - 32px)) !important; max-height: min(640px, calc(100vh - 64px)) !important; display: flex !important; flex-direction: column !important; box-shadow: 0 16px 64px var(--xm-shadow) !important; border: 1px solid var(--xm-border) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; color: var(--xm-text) !important; color-scheme: var(--xm-scheme) !important; animation: x-manage-slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
.x-manage-tag-dialog-header { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 14px 16px 10px !important; font-size: 15px !important; font-weight: 700 !important; flex-shrink: 0 !important; }
.x-manage-tag-dialog-close { width: 28px !important; height: 28px !important; border-radius: 50% !important; border: none !important; background: var(--xm-surface) !important; color: var(--xm-text-secondary) !important; font-size: 15px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.15s ease !important; }
.x-manage-tag-dialog-close:hover { background: var(--xm-surface-hover) !important; color: var(--xm-text) !important; }
.x-manage-tag-dialog-body { padding: 0 16px 16px !important; flex: 1 !important; min-height: 0 !important; overflow-y: auto !important; }
.x-manage-tag-dialog-body::-webkit-scrollbar { width: 4px !important; }
.x-manage-tag-dialog-body::-webkit-scrollbar-track { background: transparent !important; }
.x-manage-tag-dialog-body::-webkit-scrollbar-thumb { background: var(--xm-scrollbar) !important; border-radius: 2px !important; }
.x-manage-tag-dialog-body::-webkit-scrollbar-thumb:hover { background: var(--xm-scrollbar-hover) !important; }
.x-manage-tag-dialog-field { margin-bottom: 10px !important; }
.x-manage-tag-dialog-field label { display: block !important; font-size: 11px !important; color: var(--xm-text-secondary) !important; font-weight: 600 !important; margin-bottom: 4px !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; }
.x-manage-tag-dialog-add-row { display: flex !important; gap: 6px !important; }
.x-manage-tag-dialog-add-row .x-manage-input { flex: 1 !important; }
.x-manage-tag-dialog-list { max-height: 260px !important; overflow-y: auto !important; margin-top: 8px !important; }
.x-manage-tag-dialog-item { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 6px 4px !important; border-bottom: 1px solid var(--xm-divider) !important; gap: 8px !important; }
.x-manage-tag-dialog-item:last-child { border-bottom: none !important; }
.x-manage-tag-dialog-item-label { font-size: 13px !important; color: var(--xm-text) !important; font-weight: 500 !important; flex-shrink: 0 !important; }
.x-manage-tag-dialog-item-actions { display: flex !important; gap: 4px !important; flex-shrink: 0 !important; }
.x-manage-tag-dialog-item-edit { display: flex !important; gap: 4px !important; width: 100% !important; }
.x-manage-tag-dialog-item-edit .x-manage-input { flex: 1 !important; min-width: 0 !important; }
`
