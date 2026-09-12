/**
 * 通用 UI 样式——所有模块共享的基础组件（模态框、按钮、输入框、Toast、动画等）。
 * 各功能模块的专属样式请定义在各自的 styles.ts 中。
 *
 * 主题适配：通过 CSS 变量适配推特的亮色/暗色模式。
 * - 默认（无 data-theme，或为 dark/dim）→ 暗色变量
 * - html[data-theme="light"] → 亮色变量
 */
export const STYLES = `
:root {
  --xm-scheme: dark;
  --xm-bg: #1a1a2e;
  --xm-bg-elevated: #2d2d4a;
  --xm-surface: rgba(255,255,255,0.05);
  --xm-surface-strong: rgba(255,255,255,0.08);
  --xm-surface-hover: rgba(255,255,255,0.1);
  --xm-border: rgba(255,255,255,0.08);
  --xm-border-strong: rgba(255,255,255,0.15);
  --xm-text: #f1f2f6;
  --xm-text-secondary: #a4b0be;
  --xm-text-muted: #636e72;
  --xm-chip-text: #c8d6e5;
  --xm-chip-bg: rgba(108,92,231,0.12);
  --xm-chip-bg-hover: rgba(108,92,231,0.25);
  --xm-chip-border: rgba(108,92,231,0.15);
  --xm-chip-border-hover: rgba(108,92,231,0.3);
  --xm-danger-text: #ff6b81;
  --xm-overlay: rgba(0,0,0,0.6);
  --xm-divider: rgba(255,255,255,0.06);
  --xm-scrollbar: rgba(255,255,255,0.1);
  --xm-scrollbar-hover: rgba(255,255,255,0.2);
  --xm-word-item-hover: rgba(255,255,255,0.06);
  --xm-shadow: rgba(0,0,0,0.5);
  --xm-toggle-off: rgba(255,255,255,0.15);
  --xm-case-off: rgba(164,176,190,0.3);
  --xm-case-hover: rgba(164,176,190,0.6);
}
:root[data-theme="light"] {
  --xm-scheme: light;
  --xm-bg: #ffffff;
  --xm-bg-elevated: #eef0f4;
  --xm-surface: rgba(15,23,42,0.05);
  --xm-surface-strong: rgba(15,23,42,0.08);
  --xm-surface-hover: rgba(15,23,42,0.1);
  --xm-border: rgba(15,23,42,0.1);
  --xm-border-strong: rgba(15,23,42,0.18);
  --xm-text: #1a1a2e;
  --xm-text-secondary: #57606f;
  --xm-text-muted: #8a9099;
  --xm-chip-text: #5a4bcf;
  --xm-chip-bg: rgba(108,92,231,0.08);
  --xm-chip-bg-hover: rgba(108,92,231,0.15);
  --xm-chip-border: rgba(108,92,231,0.25);
  --xm-chip-border-hover: rgba(108,92,231,0.35);
  --xm-danger-text: #ff4757;
  --xm-overlay: rgba(0,0,0,0.35);
  --xm-divider: rgba(15,23,42,0.08);
  --xm-scrollbar: rgba(15,23,42,0.15);
  --xm-scrollbar-hover: rgba(15,23,42,0.25);
  --xm-word-item-hover: rgba(15,23,42,0.05);
  --xm-shadow: rgba(0,0,0,0.2);
  --xm-toggle-off: rgba(15,23,42,0.2);
  --xm-case-off: rgba(15,23,42,0.28);
  --xm-case-hover: rgba(15,23,42,0.5);
}

#x-manage-fab {
  all: initial;
  position: fixed !important;
  z-index: 2147483647 !important;
  width: 56px !important;
  height: 56px !important;
  border-radius: 50% !important;
  border: none !important;
  background: linear-gradient(135deg, #6c5ce7, #a855f7) !important;
  color: #fff !important;
  font-size: 24px !important;
  cursor: grab !important;
  box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  outline: none !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  overflow: hidden !important;
  touch-action: none !important;
}
#x-manage-fab.dragging {
  cursor: grabbing !important;
  box-shadow: 0 8px 32px rgba(108, 92, 231, 0.6), 0 4px 16px rgba(0, 0, 0, 0.3) !important;
  transition: none !important;
}
#x-manage-fab:active { transform: scale(0.92) !important; }

.x-manage-modal-backdrop {
  position: fixed !important; inset: 0 !important; z-index: 2147483646 !important;
  background: var(--xm-overlay) !important; backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  animation: x-manage-fadeIn 0.2s ease !important;
}
.x-manage-modal {
  background: var(--xm-bg) !important; border-radius: 16px !important;
  width: min(420px, calc(100vw - 32px)) !important;
  max-height: min(640px, calc(100vh - 64px)) !important; overflow-y: auto !important;
  box-shadow: 0 24px 80px var(--xm-shadow) !important;
  border: 1px solid var(--xm-border) !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: var(--xm-text) !important;
  color-scheme: var(--xm-scheme) !important;
  animation: x-manage-slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.x-manage-modal-header {
  display: flex !important; align-items: center !important; justify-content: space-between !important;
  padding: 20px 24px 16px !important; border-bottom: 1px solid var(--xm-divider) !important;
  position: sticky !important; top: 0 !important; background: var(--xm-bg) !important;
  z-index: 1 !important; border-radius: 16px 16px 0 0 !important;
}
.x-manage-modal-header h2 { margin: 0 !important; font-size: 18px !important; font-weight: 700 !important; letter-spacing: -0.3px !important; }
.x-manage-modal-close {
  width: 32px !important; height: 32px !important; border-radius: 50% !important; border: none !important;
  background: var(--xm-surface) !important; color: var(--xm-text-secondary) !important; font-size: 18px !important;
  cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;
  transition: all 0.2s ease !important;
}
.x-manage-modal-close:hover { background: var(--xm-surface-hover) !important; color: var(--xm-text) !important; }
.x-manage-modal-body { padding: 16px 24px 24px !important; }

.x-manage-tabs {
  display: flex !important; gap: 4px !important; margin-bottom: 20px !important;
  background: var(--xm-surface) !important; border-radius: 10px !important; padding: 4px !important;
}
.x-manage-tab {
  flex: 1 !important; padding: 8px 12px !important; border: none !important; background: transparent !important;
  color: var(--xm-text-secondary) !important; font-size: 13px !important; font-weight: 500 !important;
  cursor: pointer !important; border-radius: 8px !important; transition: all 0.2s ease !important; font-family: inherit !important;
}
.x-manage-tab:hover { color: var(--xm-text) !important; background: var(--xm-surface) !important; }
.x-manage-tab.active { background: var(--xm-bg-elevated) !important; color: var(--xm-text) !important; }

.x-manage-input {
  flex: 1 !important; padding: 10px 14px !important; border: 1px solid var(--xm-border-strong) !important;
  border-radius: 10px !important; background: var(--xm-surface) !important;
  color: var(--xm-text) !important; font-size: 14px !important; font-family: inherit !important;
  outline: none !important; transition: border-color 0.2s ease !important; box-sizing: border-box !important;
}
.x-manage-input::placeholder { color: var(--xm-text-muted) !important; }
.x-manage-input:focus { border-color: #6c5ce7 !important; background: var(--xm-surface-strong) !important; }

.x-manage-btn {
  padding: 10px 18px !important; border: none !important; border-radius: 10px !important;
  font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important;
  transition: all 0.2s ease !important; font-family: inherit !important; white-space: nowrap !important;
}
.x-manage-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a855f7) !important; color: #fff !important; }
.x-manage-btn-primary:hover { box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4) !important; transform: translateY(-1px) !important; }
.x-manage-btn-primary:active { transform: translateY(0) !important; }
.x-manage-btn-secondary { background: var(--xm-surface) !important; color: var(--xm-text-secondary) !important; }
.x-manage-btn-secondary:hover { background: var(--xm-surface-hover) !important; color: var(--xm-text) !important; }
.x-manage-btn-danger { background: rgba(255, 71, 87, 0.15) !important; color: var(--xm-danger-text) !important; }
.x-manage-btn-danger:hover { background: rgba(255, 71, 87, 0.25) !important; }
.x-manage-btn-sm { padding: 6px 12px !important; font-size: 12px !important; border-radius: 8px !important; }
.x-manage-btn[disabled] { opacity: 0.65 !important; cursor: not-allowed !important; }
.x-manage-btn:disabled:hover { transform: none !important; box-shadow: none !important; }
.x-manage-spinner { display: inline-block !important; width: 12px !important; height: 12px !important; border: 2px solid rgba(255,255,255,0.35) !important; border-top-color: #fff !important; border-radius: 50% !important; animation: x-manage-spin 0.7s linear infinite !important; vertical-align: -2px !important; margin-right: 6px !important; }
.x-manage-btn-secondary .x-manage-spinner { border-color: var(--xm-text-muted) !important; border-top-color: var(--xm-text) !important; }
@keyframes x-manage-spin { to { transform: rotate(360deg); } }

.x-manage-select { padding: 10px 14px !important; border: 1px solid var(--xm-border-strong) !important; border-radius: 10px !important; background: var(--xm-surface) !important; color: var(--xm-text) !important; font-size: 14px !important; font-family: inherit !important; outline: none !important; cursor: pointer !important; flex: 1 !important; transition: border-color 0.2s ease !important; color-scheme: var(--xm-scheme) !important; }
.x-manage-select:focus { border-color: #6c5ce7 !important; }

.x-manage-checkbox-row { display: flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; font-size: 13px !important; color: var(--xm-text-secondary) !important; user-select: none !important; }
.x-manage-checkbox-row input[type="checkbox"] { accent-color: #6c5ce7 !important; width: 16px !important; height: 16px !important; cursor: pointer !important; }

.x-manage-empty { text-align: center !important; padding: 32px 16px !important; color: var(--xm-text-muted) !important; font-size: 14px !important; line-height: 1.6 !important; }
.x-manage-empty-icon { font-size: 36px !important; margin-bottom: 12px !important; opacity: 0.5 !important; }

.x-manage-toast {
  position: fixed !important; bottom: 96px !important; right: 24px !important;
  z-index: 2147483647 !important; padding: 10px 20px !important; border-radius: 10px !important;
  background: var(--xm-bg-elevated) !important; color: var(--xm-text) !important; font-size: 13px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  box-shadow: 0 8px 32px var(--xm-shadow) !important;
  border: 1px solid var(--xm-border) !important;
  animation: x-manage-slideUp 0.2s ease !important; pointer-events: none !important;
}
.x-manage-toast-exit { animation: x-manage-fadeOut 0.3s ease forwards !important; }

@keyframes x-manage-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes x-manage-slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes x-manage-fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }

.x-manage-modal::-webkit-scrollbar, .x-manage-word-list::-webkit-scrollbar { width: 4px !important; }
.x-manage-modal::-webkit-scrollbar-track, .x-manage-word-list::-webkit-scrollbar-track { background: transparent !important; }
.x-manage-modal::-webkit-scrollbar-thumb, .x-manage-word-list::-webkit-scrollbar-thumb { background: var(--xm-scrollbar) !important; border-radius: 2px !important; }
.x-manage-modal::-webkit-scrollbar-thumb:hover, .x-manage-word-list::-webkit-scrollbar-thumb:hover { background: var(--xm-scrollbar-hover) !important; }

.x-manage-hub-backdrop {
  position: fixed !important; inset: 0 !important; z-index: 2147483646 !important;
  background: var(--xm-overlay) !important; backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  animation: x-manage-fadeIn 0.2s ease !important;
}
.x-manage-hub-dialog {
  background: var(--xm-bg) !important; border-radius: 16px !important;
  width: min(600px, calc(100vw - 32px)) !important;
  max-height: min(680px, calc(100vh - 64px)) !important;
  display: flex !important; flex-direction: column !important; overflow: hidden !important;
  box-shadow: 0 24px 80px var(--xm-shadow) !important;
  border: 1px solid var(--xm-border) !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: var(--xm-text) !important;
  color-scheme: var(--xm-scheme) !important;
  animation: x-manage-slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.x-manage-hub-topbar {
  display: flex !important; align-items: center !important; gap: 8px !important;
  padding: 12px 16px !important; border-bottom: 1px solid var(--xm-divider) !important;
  flex-shrink: 0 !important; background: var(--xm-bg) !important;
}
.x-manage-hub-tab {
  padding: 7px 16px !important; border: none !important; border-radius: 8px !important;
  background: var(--xm-surface) !important; color: var(--xm-text-secondary) !important;
  font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important;
  font-family: inherit !important; transition: all 0.2s ease !important; white-space: nowrap !important;
}
.x-manage-hub-tab:hover { background: var(--xm-surface-hover) !important; color: var(--xm-text) !important; }
.x-manage-hub-tab.active { background: linear-gradient(135deg, #6c5ce7, #a855f7) !important; color: #fff !important; }
.x-manage-hub-close {
  margin-left: auto !important; width: 32px !important; height: 32px !important; border-radius: 50% !important;
  border: none !important; background: var(--xm-surface) !important;
  color: var(--xm-text-secondary) !important; font-size: 18px !important;
  cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;
  transition: all 0.2s ease !important;
}
.x-manage-hub-close:hover { background: var(--xm-surface-hover) !important; color: var(--xm-text) !important; }
.x-manage-hub-body { flex: 1 !important; min-height: 0 !important; overflow-y: auto !important; padding: 16px !important; }
.x-manage-hub-pane { min-height: 100% !important; }
.x-manage-hub-body::-webkit-scrollbar { width: 4px !important; }
.x-manage-hub-body::-webkit-scrollbar-track { background: transparent !important; }
.x-manage-hub-body::-webkit-scrollbar-thumb { background: var(--xm-scrollbar) !important; border-radius: 2px !important; }
.x-manage-hub-body::-webkit-scrollbar-thumb:hover { background: var(--xm-scrollbar-hover) !important; }
`
