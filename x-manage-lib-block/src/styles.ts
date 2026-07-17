/**
 * 屏蔽词模块专属样式——banner、折叠、展开提示、词列表、开关等。
 */
export const BLOCK_STYLES = `
.x-manage-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  margin: 0;
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.12), rgba(255, 71, 87, 0.04));
  border-left: 3px solid #ff4757;
  font-size: 13px;
  color: #ff6b81;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.4;
  box-sizing: border-box;
}
.x-manage-banner:hover {
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.18), rgba(255, 71, 87, 0.08));
}
.x-manage-banner-icon { font-size: 16px; flex-shrink: 0; opacity: 0.3; }
.x-manage-banner-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.x-manage-banner-text strong { font-weight: 600; color: #ff4757; }
.x-manage-banner-hint { flex-shrink: 0; font-size: 11px; color: rgba(255, 107, 129, 0.6); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(255, 71, 87, 0.2); }
.x-manage-collapse { cursor: pointer; padding: 6px 16px; text-align: center; font-size: 12px; color: #a4b0be; background: rgba(255, 255, 255, 0.02); border-top: 1px solid rgba(255, 255, 255, 0.06); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; user-select: none; transition: background 0.2s ease; }
.x-manage-collapse:hover { background: rgba(255, 255, 255, 0.05); }
.x-manage-expand-hint { padding: 6px 12px; font-size: 12px; color: rgba(255, 107, 129, 0.7); background: rgba(255, 71, 87, 0.04); border-top: 1px solid rgba(255, 71, 87, 0.08); cursor: pointer; user-select: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; transition: background 0.2s ease; line-height: 1.4; }
.x-manage-expand-hint:hover { background: rgba(255, 71, 87, 0.08); }
.x-manage-expand-hint strong { font-weight: 600; color: #ff6b81; }
.x-manage-expand-action { color: #6c5ce7; font-weight: 600; }

.x-manage-add-row { display: flex !important; gap: 8px !important; margin-bottom: 16px !important; }
.x-manage-word-list { display: flex !important; flex-direction: column !important; gap: 6px !important; max-height: 340px !important; overflow-y: auto !important; }
.x-manage-word-item {
  display: flex !important; align-items: center !important; gap: 10px !important; padding: 10px 14px !important;
  background: rgba(255, 255, 255, 0.03) !important; border-radius: 10px !important;
  transition: background 0.2s ease !important; border: 1px solid transparent !important;
}
.x-manage-word-item:hover { background: rgba(255, 255, 255, 0.06) !important; border-color: rgba(255, 255, 255, 0.06) !important; }
.x-manage-word-item.disabled { opacity: 0.45 !important; }
.x-manage-word-text { flex: 1 !important; min-width: 0 !important; font-size: 14px !important; font-weight: 500 !important; overflow-wrap: break-word !important; white-space: pre-wrap !important; }
.x-manage-word-actions { display: flex !important; gap: 4px !important; align-items: center !important; flex-shrink: 0 !important; }

.x-manage-field-dropdown { position: relative !important; flex-shrink: 0 !important; }
.x-manage-field-trigger { display: flex !important; align-items: center !important; gap: 2px !important; font-size: 11px !important; color: #a4b0be !important; background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 4px !important; padding: 2px 6px !important; cursor: pointer !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; white-space: nowrap !important; transition: all 0.15s ease !important; line-height: 1.3 !important; }
.x-manage-field-trigger:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.15) !important; color: #c8d6e5 !important; }
.x-manage-field-arrow { font-size: 8px !important; opacity: 0.5 !important; }
.x-manage-field-menu { min-width: 100px !important; background: #1e1e32 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 6px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; overflow: hidden !important; }
.x-manage-field-option { padding: 6px 10px !important; font-size: 12px !important; color: #a4b0be !important; cursor: pointer !important; transition: all 0.12s ease !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
.x-manage-field-option:hover { background: rgba(108, 92, 231, 0.12) !important; color: #c8d6e5 !important; }
.x-manage-field-option.active { color: #c8d6e5 !important; background: rgba(108, 92, 231, 0.15) !important; font-weight: 600 !important; }

.x-manage-case-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 24px !important; height: 20px !important; font-size: 10px !important; font-weight: 700 !important; color: rgba(164, 176, 190, 0.3) !important; background: transparent !important; border: none !important; border-radius: 3px !important; padding: 0 !important; cursor: pointer !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; transition: all 0.15s ease !important; line-height: 1 !important; flex-shrink: 0 !important; }
.x-manage-case-btn:hover { color: rgba(164, 176, 190, 0.6) !important; background: rgba(255,255,255,0.04) !important; }
.x-manage-case-btn.active { color: #6c5ce7 !important; }

.x-manage-toggle { position: relative !important; width: 40px !important; height: 22px !important; flex-shrink: 0 !important; }
.x-manage-toggle input { opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; }
.x-manage-toggle-slider { position: absolute !important; cursor: pointer !important; inset: 0 !important; background: rgba(255, 255, 255, 0.15) !important; border-radius: 11px !important; transition: all 0.3s ease !important; }
.x-manage-toggle-slider::before { content: '' !important; position: absolute !important; height: 18px !important; width: 18px !important; left: 2px !important; bottom: 2px !important; background: #fff !important; border-radius: 50% !important; transition: all 0.3s ease !important; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important; }
.x-manage-toggle input:checked + .x-manage-toggle-slider { background: linear-gradient(135deg, #6c5ce7, #a855f7) !important; }
.x-manage-toggle input:checked + .x-manage-toggle-slider::before { transform: translateX(18px) !important; }

.x-manage-filter-label { font-size: 13px !important; font-weight: 600 !important; color: #a4b0be !important; margin-bottom: 6px !important; display: block !important; }
.x-manage-filter-section { display: flex !important; flex-direction: column !important; gap: 16px !important; }
.x-manage-io-section { display: flex !important; flex-direction: column !important; gap: 12px !important; }
.x-manage-io-buttons { display: flex !important; gap: 8px !important; }
.x-manage-io-buttons .x-manage-btn { flex: 1 !important; }
.x-manage-textarea {
  width: 100% !important; padding: 12px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important; background: rgba(255, 255, 255, 0.04) !important;
  color: #a4b0be !important; font-size: 12px !important; font-family: "SF Mono", "Fira Code", monospace !important;
  resize: vertical !important; min-height: 80px !important; max-height: 200px !important;
  outline: none !important; box-sizing: border-box !important; transition: border-color 0.2s ease !important;
}
.x-manage-textarea:focus { border-color: #6c5ce7 !important; }
.x-manage-textarea::placeholder { color: #636e72 !important; }

.x-manage-word-list::-webkit-scrollbar { width: 4px !important; }
.x-manage-word-list::-webkit-scrollbar-track { background: transparent !important; }
.x-manage-word-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1) !important; border-radius: 2px !important; }
.x-manage-word-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2) !important; }
`
