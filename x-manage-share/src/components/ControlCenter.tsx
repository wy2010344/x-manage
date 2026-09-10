import { useState, useEffect } from 'react'
import { Fab } from './Fab'
import { XMANAGE_VERSION } from '../version'

/** 控制中心的一个顶级功能 tab */
export interface HubSection {
  key: string
  label: string
  render: React.ReactNode
}

/** 控制中心所需的存储能力（FAB 位置全局共享一份） */
export interface HubStorage {
  getFabPosition: () => Promise<{ top: number; left: number } | null>
  setFabPosition: (pos: { top: number; left: number }) => Promise<void>
}

interface Props {
  storage: HubStorage
  sections: HubSection[]
  initialPos?: { top: number; left: number }
}

/**
 * 全局控制中心——唯一的浮动按钮。
 * 点击弹出由各业务包注入的顶级 tab（每个 tab 内部自带各自的子 tab/配置）。
 * 注意：所有 tab 面板保持挂载（隐藏而非卸载），切换后各自的输入/状态不丢失。
 */
export function ControlCenter({ storage, sections, initialPos = { top: 100, left: 16 } }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [active, setActive] = useState(() => sections[0]?.key ?? '')
  const [fabPos, setFabPos] = useState(initialPos)

  useEffect(() => {
    storage.getFabPosition().then(p => { if (p) setFabPos(p) }).catch(() => {})
  }, [storage])

  const activeKey = sections.some(s => s.key === active) ? active : sections[0]?.key

  return (
    <>
      <Fab
        defaultPos={fabPos}
        onPosChange={p => { setFabPos(p); storage.setFabPosition(p) }}
        onClick={() => setShowModal(true)}
      />
      {showModal && (
        <div className="x-manage-hub-backdrop" onClick={() => setShowModal(false)}>
          <div className="x-manage-hub-dialog" onClick={e => e.stopPropagation()}>
            <div className="x-manage-hub-topbar">
              <span className="x-manage-hub-version">v{XMANAGE_VERSION}</span>
              {sections.map(s => (
                <button
                  key={s.key}
                  className={`x-manage-hub-tab${s.key === activeKey ? ' active' : ''}`}
                  onClick={() => setActive(s.key)}
                >
                  {s.label}
                </button>
              ))}
              <button className="x-manage-hub-close" onClick={() => setShowModal(false)} aria-label="关闭">✕</button>
            </div>
            <div className="x-manage-hub-body">
              {sections.map(s => (
                <div key={s.key} className="x-manage-hub-pane" style={{ display: s.key === activeKey ? undefined : 'none' }}>
                  {s.render}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}