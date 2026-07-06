/**
 * 通用 UI 样式——所有模块共享的基础组件（模态框、按钮、输入框、Toast、动画等）。
 * 各功能模块的专属样式请定义在各自的 styles.ts 中。
 */
export const STYLES = `
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
  background: rgba(0, 0, 0, 0.6) !important; backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  animation: x-manage-fadeIn 0.2s ease !important;
}
.x-manage-modal {
  background: #1a1a2e !important; border-radius: 16px !important;
  width: min(420px, calc(100vw - 32px)) !important;
  max-height: min(640px, calc(100vh - 64px)) !important; overflow-y: auto !important;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: #f1f2f6 !important;
  animation: x-manage-slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.x-manage-modal-header {
  display: flex !important; align-items: center !important; justify-content: space-between !important;
  padding: 20px 24px 16px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  position: sticky !important; top: 0 !important; background: #1a1a2e !important;
  z-index: 1 !important; border-radius: 16px 16px 0 0 !important;
}
.x-manage-modal-header h2 { margin: 0 !important; font-size: 18px !important; font-weight: 700 !important; letter-spacing: -0.3px !important; }
.x-manage-modal-close {
  width: 32px !important; height: 32px !important; border-radius: 50% !important; border: none !important;
  background: rgba(255, 255, 255, 0.06) !important; color: #a4b0be !important; font-size: 18px !important;
  cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;
  transition: all 0.2s ease !important;
}
.x-manage-modal-close:hover { background: rgba(255, 255, 255, 0.1) !important; color: #f1f2f6 !important; }
.x-manage-modal-body { padding: 16px 24px 24px !important; }

.x-manage-tabs {
  display: flex !important; gap: 4px !important; margin-bottom: 20px !important;
  background: rgba(255, 255, 255, 0.04) !important; border-radius: 10px !important; padding: 4px !important;
}
.x-manage-tab {
  flex: 1 !important; padding: 8px 12px !important; border: none !important; background: transparent !important;
  color: #a4b0be !important; font-size: 13px !important; font-weight: 500 !important;
  cursor: pointer !important; border-radius: 8px !important; transition: all 0.2s ease !important; font-family: inherit !important;
}
.x-manage-tab:hover { color: #f1f2f6 !important; background: rgba(255, 255, 255, 0.04) !important; }
.x-manage-tab.active { background: #2d2d4a !important; color: #f1f2f6 !important; }

.x-manage-input {
  flex: 1 !important; padding: 10px 14px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important; background: rgba(255, 255, 255, 0.05) !important;
  color: #f1f2f6 !important; font-size: 14px !important; font-family: inherit !important;
  outline: none !important; transition: border-color 0.2s ease !important; box-sizing: border-box !important;
}
.x-manage-input::placeholder { color: #636e72 !important; }
.x-manage-input:focus { border-color: #6c5ce7 !important; background: rgba(255, 255, 255, 0.08) !important; }

.x-manage-btn {
  padding: 10px 18px !important; border: none !important; border-radius: 10px !important;
  font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important;
  transition: all 0.2s ease !important; font-family: inherit !important; white-space: nowrap !important;
}
.x-manage-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a855f7) !important; color: #fff !important; }
.x-manage-btn-primary:hover { box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4) !important; transform: translateY(-1px) !important; }
.x-manage-btn-primary:active { transform: translateY(0) !important; }
.x-manage-btn-secondary { background: rgba(255, 255, 255, 0.06) !important; color: #a4b0be !important; }
.x-manage-btn-secondary:hover { background: rgba(255, 255, 255, 0.1) !important; color: #f1f2f6 !important; }
.x-manage-btn-danger { background: rgba(255, 71, 87, 0.15) !important; color: #ff6b81 !important; }
.x-manage-btn-danger:hover { background: rgba(255, 71, 87, 0.25) !important; }
.x-manage-btn-sm { padding: 6px 12px !important; font-size: 12px !important; border-radius: 8px !important; }

.x-manage-select { padding: 10px 14px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 10px !important; background: rgba(255, 255, 255, 0.05) !important; color: #f1f2f6 !important; font-size: 14px !important; font-family: inherit !important; outline: none !important; cursor: pointer !important; flex: 1 !important; transition: border-color 0.2s ease !important; }
.x-manage-select:focus { border-color: #6c5ce7 !important; }

.x-manage-checkbox-row { display: flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; font-size: 13px !important; color: #a4b0be !important; user-select: none !important; }
.x-manage-checkbox-row input[type="checkbox"] { accent-color: #6c5ce7 !important; width: 16px !important; height: 16px !important; cursor: pointer !important; }

.x-manage-empty { text-align: center !important; padding: 32px 16px !important; color: #636e72 !important; font-size: 14px !important; line-height: 1.6 !important; }
.x-manage-empty-icon { font-size: 36px !important; margin-bottom: 12px !important; opacity: 0.5 !important; }

.x-manage-toast {
  position: fixed !important; bottom: 96px !important; right: 24px !important;
  z-index: 2147483647 !important; padding: 10px 20px !important; border-radius: 10px !important;
  background: #2d2d4a !important; color: #f1f2f6 !important; font-size: 13px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  animation: x-manage-slideUp 0.2s ease !important; pointer-events: none !important;
}
.x-manage-toast-exit { animation: x-manage-fadeOut 0.3s ease forwards !important; }

@keyframes x-manage-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes x-manage-slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes x-manage-fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }

.x-manage-modal::-webkit-scrollbar, .x-manage-word-list::-webkit-scrollbar { width: 4px !important; }
.x-manage-modal::-webkit-scrollbar-track, .x-manage-word-list::-webkit-scrollbar-track { background: transparent !important; }
.x-manage-modal::-webkit-scrollbar-thumb, .x-manage-word-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1) !important; border-radius: 2px !important; }
.x-manage-modal::-webkit-scrollbar-thumb:hover, .x-manage-word-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2) !important; }
`
