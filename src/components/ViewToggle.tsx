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
      {/* 选中的内嵌椭圆滑块，留出贴合间距 */}
      <div
        aria-hidden
        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-white/80 dark:bg-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/10 transition-transform duration-300 ease-out pointer-events-none"
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
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  )
}
