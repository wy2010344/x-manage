interface Props {
  exportText: string
  importText: string
  onExport: () => void
  onImport: () => void
  onImportTextChange: (text: string) => void
}

export function IoPanel({ exportText, importText, onExport, onImport, onImportTextChange }: Props) {
  return (
    <div className="x-manage-io-section">
      <div className="x-manage-io-buttons">
        <button className="x-manage-btn x-manage-btn-primary" onClick={onExport}>导出并复制</button>
      </div>
      <textarea className="x-manage-textarea" value={exportText} readOnly placeholder="点击「导出并复制」生成 JSON 数据…" rows={4} onClick={e => (e.target as HTMLTextAreaElement).select()} />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
      <div style={{ fontSize: 13, color: '#a4b0be', marginBottom: 8, fontWeight: 600 }}>导入屏蔽词</div>
      <textarea className="x-manage-textarea" value={importText} onChange={e => onImportTextChange(e.target.value)} placeholder="在此粘贴 JSON 数据…" rows={4} />
      <div className="x-manage-io-buttons" style={{ marginTop: 8 }}>
        <button className="x-manage-btn x-manage-btn-primary" onClick={onImport} disabled={!importText.trim()}>导入</button>
      </div>
    </div>
  )
}
