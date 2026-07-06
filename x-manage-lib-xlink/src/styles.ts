export const XLINK_STYLES = `
.x-manage-xlink-backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483646 !important;
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(4px) !important;
  -webkit-backdrop-filter: blur(4px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  animation: x-manage-xlink-fadeIn 0.15s ease !important;
}

.x-manage-xlink-frame {
  position: relative !important;
  width: 90vw !important;
  height: 85vh !important;
  background: #fff !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  flex-direction: column !important;
  animation: x-manage-xlink-slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.x-manage-xlink-toolbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 10px 16px !important;
  background: #1a1a2e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  flex-shrink: 0 !important;
}

.x-manage-xlink-url {
  font-size: 12px !important;
  color: #a4b0be !important;
  font-family: "SF Mono", "Fira Code", monospace !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  flex: 1 !important;
  margin-right: 12px !important;
}

.x-manage-xlink-actions {
  display: flex !important;
  gap: 6px !important;
  flex-shrink: 0 !important;
}

.x-manage-xlink-actions button {
  padding: 6px 12px !important;
  border: none !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  transition: all 0.15s ease !important;
}

.x-manage-xlink-btn-open {
  background: rgba(108, 92, 231, 0.15) !important;
  color: #a855f7 !important;
}
.x-manage-xlink-btn-open:hover {
  background: rgba(108, 92, 231, 0.25) !important;
}

.x-manage-xlink-btn-close {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #a4b0be !important;
}
.x-manage-xlink-btn-close:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f1f2f6 !important;
}

.x-manage-xlink-iframe {
  flex: 1 !important;
  width: 100% !important;
  border: none !important;
  background: #fff !important;
}

@keyframes x-manage-xlink-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes x-manage-xlink-slideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`
