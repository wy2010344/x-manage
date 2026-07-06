import type { FilterRule, FilterField } from './types'

interface Props {
  rule: FilterRule
  activeCount: number
  onFieldChange: (field: FilterField) => void
  onCaseSensitiveChange: (cs: boolean) => void
}

export function FilterPanel({ rule, activeCount, onFieldChange, onCaseSensitiveChange }: Props) {
  const fieldLabel = rule.field === 'all' ? '推文正文 + 作者名称' : rule.field === 'content' ? '仅推文正文' : '仅作者名称'
  const csLabel = rule.caseSensitive ? '，区分大小写' : '，不区分大小写'

  return (
    <div className="x-manage-filter-section">
      <div>
        <label className="x-manage-filter-label">匹配字段</label>
        <div className="x-manage-filter-row">
          <select className="x-manage-select" value={rule.field} onChange={e => onFieldChange(e.target.value as FilterField)}>
            <option value="all">所有内容</option>
            <option value="content">推文正文</option>
            <option value="author">作者名称</option>
          </select>
        </div>
      </div>
      <div>
        <label className="x-manage-filter-label">匹配选项</label>
        <label className="x-manage-checkbox-row">
          <input type="checkbox" checked={rule.caseSensitive} onChange={e => onCaseSensitiveChange(e.target.checked)} />
          区分大小写
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 12, color: '#636e72', lineHeight: 1.6 }}>
          当前已启用 {activeCount} 个屏蔽词<br />
          匹配模式：{fieldLabel}{csLabel}
        </div>
      </div>
    </div>
  )
}
