import { cn } from '../utils/cn'
import { Flag } from './Flag'
import React from 'react'

interface Props {
  regions: { code: string; count: number }[]
  total: number
  active: string | null
  onChange: (code: string | null) => void
}

export function RegionFilter({ regions, total, active, onChange }: Props) {
  if (regions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip selected={active === null} onClick={() => onChange(null)}>
        <span>全部</span>
        <span className="text-[10px] font-mono opacity-75 px-1 py-0.2 rounded-full bg-black/5 dark:bg-white/10">{total}</span>
      </Chip>
      {regions.map(r => (
        <Chip key={r.code} selected={active === r.code} onClick={() => onChange(r.code)}>
          <Flag code={r.code} className="w-4 h-3 drop-shadow-sm" />
          <span className="font-medium">{r.code}</span>
          <span className="text-[10px] font-mono opacity-75 px-1 py-0.2 rounded-full bg-black/5 dark:bg-white/10">{r.count}</span>
        </Chip>
      ))}
    </div>
  )
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all duration-200 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95',
        selected
          ? 'bg-blue-500/85 dark:bg-blue-600/85 text-white border border-blue-400/60 shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
          : 'bg-white/45 dark:bg-slate-900/35 text-slate-700 dark:text-slate-200 border border-white/70 dark:border-white/10 hover:bg-white/75 dark:hover:bg-slate-900/60 hover:border-white/90',
      )}
    >
      {children}
    </button>
  )
}
