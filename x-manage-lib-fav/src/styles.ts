/**
 * 收藏模块专属样式——推文内的星标按钮。
 * 弹窗与按钮基础类复用 tag 模块的 x-manage-tag-dialog-* 与共享 x-manage-btn-*。
 */
export const FAV_STYLES = `
.x-manage-fav-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 20px !important; height: 20px !important; padding: 0 !important; border: none !important; background: transparent !important; cursor: pointer !important; color: var(--xm-text-muted) !important; transition: all 0.15s ease !important; }
.x-manage-fav-btn:hover { color: var(--xm-text-secondary) !important; }
.x-manage-fav-btn svg { width: 14px !important; height: 14px !important; display: block !important; }
.x-manage-fav-btn[data-filled="true"] { color: #fbbf24 !important; }
.x-manage-fav-btn[data-filled="true"]:hover { color: #f59e0b !important; }
`