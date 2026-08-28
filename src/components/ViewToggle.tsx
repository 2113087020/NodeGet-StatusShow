import { Globe, LayoutGrid, Table } from 'lucide-react'
import { type ReactNode } from 'react'
import type { View } from '../types'

// 核心修复：保持原始项目中定义的视图类型值为 'cards'
const ITEMS: { value: View; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'cards', label: '卡片视图', icon: LayoutGrid },
  { value: 'table', label: '表格视图', icon: Table },
  { value: 'map', label: '地图视图', icon: Globe },
]

export function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  // 核心修复：根据当前值 'cards' 正确寻找索引 (0)，避免找不到索引 ( idx < 0 ) 导致的界面问题
  const idx = Math.max(0, ITEMS.findIndex(i => i.value === value))

  return (
    <div
      className="relative inline-grid gap-1 p-1" // 调整：移除原始 bg-muted 壳子，在 Dock 栏中保持通透，增加 gap
      style={{ gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)` }}
    >
      {/* 调整：将滑动背景也改为玻璃质感，配合 Dock 栏风格 */}
      <div
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-white/70 dark:bg-white/20 shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 1rem) / ${ITEMS.length})`, // 调整：配合 gap 调整宽度
          transform: `translateX(${idx * 100}%) translateX(${idx * 4}px)`, // 调整：配合 gap 调整位移
        }}
      />
      {ITEMS.map(({ value: v, label, icon: Icon }) => (
        <Btn key={v} active={value === v} onClick={() => onChange(v)} title={label}>
          {/* 调整：增大图标和按钮，h-5 w-5 */}
          <Icon className="h-5 w-5" />
          <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
        </Btn>
      ))}
    </div>
  )
}

function Btn({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title} // 调整：移动端可以长按看提示
      className={`relative z-10 inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto px-1.5 sm:px-4 text-sm font-medium rounded-full transition-all duration-300 ${
        active 
          ? 'text-blue-600 dark:text-blue-400' // 调整：选中状态文字颜色
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40' // 调整：正常状态颜色
      }`}
    >
      {children}
    </button>
  )
}
