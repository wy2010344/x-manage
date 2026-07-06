export const TAG_STYLES = `
.x-manage-tag-row { display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 4px !important; padding: 4px 12px 6px !important; }
.x-manage-tweet-tags { display: inline-flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 4px !important; }
.x-manage-tag-chip { display: inline-flex !important; align-items: center !important; font-size: 11px !important; font-weight: 600 !important; color: #c8d6e5 !important; background: rgba(108, 92, 231, 0.12) !important; border: 1px solid rgba(108, 92, 231, 0.15) !important; border-radius: 3px !important; padding: 1px 6px !important; text-decoration: none !important; line-height: 1.4 !important; transition: all 0.15s ease !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
.x-manage-tag-chip:hover { color: #f1f2f6 !important; background: rgba(108, 92, 231, 0.25) !important; border-color: rgba(108, 92, 231, 0.3) !important; }
.x-manage-tag-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; font-size: 12px !important; font-weight: 600 !important; color: #57606f !important; background: rgba(255, 255, 255, 0.04) !important; border: 1px dashed rgba(255, 255, 255, 0.06) !important; border-radius: 3px !important; padding: 1px 8px !important; line-height: 1.4 !important; cursor: pointer !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; user-select: none !important; transition: all 0.15s ease !important; min-width: 44px !important; min-height: 24px !important; }
.x-manage-tag-btn:hover { color: #c8d6e5 !important; background: rgba(108, 92, 231, 0.15) !important; border-color: rgba(108, 92, 231, 0.2) !important; border-style: solid !important; }
@media (hover: none) and (pointer: coarse) { .x-manage-tag-btn { min-height: 30px !important; font-size: 13px !important; } }
.x-manage-tag-dialog-backdrop { position: fixed !important; inset: 0 !important; z-index: 2147483646 !important; background: rgba(0, 0, 0, 0.4) !important; display: flex !important; align-items: center !important; justify-content: center !important; animation: x-manage-fadeIn 0.15s ease !important; }
.x-manage-tag-dialog { background: #1a1a2e !important; border-radius: 12px !important; width: min(360px, calc(100vw - 32px)) !important; box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4) !important; border: 1px solid rgba(255, 255, 255, 0.06) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; color: #f1f2f6 !important; animation: x-manage-slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
.x-manage-tag-dialog-header { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 14px 16px 10px !important; font-size: 15px !important; font-weight: 700 !important; }
.x-manage-tag-dialog-close { width: 28px !important; height: 28px !important; border-radius: 50% !important; border: none !important; background: rgba(255, 255, 255, 0.06) !important; color: #a4b0be !important; font-size: 15px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.15s ease !important; }
.x-manage-tag-dialog-close:hover { background: rgba(255, 255, 255, 0.1) !important; color: #f1f2f6 !important; }
.x-manage-tag-dialog-body { padding: 0 16px 16px !important; }
.x-manage-tag-dialog-field { margin-bottom: 10px !important; }
.x-manage-tag-dialog-field label { display: block !important; font-size: 11px !important; color: #a4b0be !important; font-weight: 600 !important; margin-bottom: 4px !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; }
.x-manage-tag-dialog-add-row { display: flex !important; gap: 6px !important; }
.x-manage-tag-dialog-add-row .x-manage-input { flex: 1 !important; }
.x-manage-tag-dialog-list { max-height: 260px !important; overflow-y: auto !important; margin-top: 8px !important; }
.x-manage-tag-dialog-item { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 6px 4px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important; gap: 8px !important; }
.x-manage-tag-dialog-item:last-child { border-bottom: none !important; }
.x-manage-tag-dialog-item-label { font-size: 13px !important; color: #f1f2f6 !important; font-weight: 500 !important; flex-shrink: 0 !important; }
.x-manage-tag-dialog-item-actions { display: flex !important; gap: 4px !important; flex-shrink: 0 !important; }
.x-manage-tag-dialog-item-edit { display: flex !important; gap: 4px !important; width: 100% !important; }
.x-manage-tag-dialog-item-edit .x-manage-input { flex: 1 !important; min-width: 0 !important; }
`
