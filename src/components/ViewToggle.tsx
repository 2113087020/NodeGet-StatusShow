import { Globe, LayoutGrid, Table } from 'lucide-react'
import { type ReactNode } from 'react'
import type { View } from '../types'

const ITEMS: { value: View; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'cards', label: '卡片', icon: LayoutGrid },
  { value: 'table', label: '表格', icon: Table },
  { value: 'map', label: '地图', icon: Globe },
]

export function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const idx = Math.max(0, ITEMS.findIndex(i => i.value === value))

  return (
    <div
      className="relative grid items-center p-1.5"
      style={{ gridTemplateColumns: `repeat(${ITEMS.length}, minmax(0, 1fr))` }}
    >
      {/* 选中的暗色毛玻璃滑块 */}
      <div
        aria-hidden
        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-black/10 dark:bg-white/15 shadow-inner transition-transform duration-300 ease-out pointer-events-none"
        style={{
          width: `calc((100% - 0.75rem) / ${ITEMS.length})`,
          transform: `translateX(${idx * 100}%)`,
        }}
      />
      {ITEMS.map(({ value: v, label, icon: Icon }) => (
        <Btn key={v} active={value === v} onClick={() => onChange(v)} title={label}>
          <Icon className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold">{label}</span>
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
      title={title}
      className={`relative z-10 inline-flex items-center justify-center gap-1.5 h-10 min-w-[50px] px-3.5 rounded-full transition-all duration-200 active:scale-95 ${
        active
          ? 'text-slate-900 dark:text-slate-100 font-semibold'
          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  )
}
