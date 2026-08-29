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
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="inline-flex items-stretch rounded-full p-1 liquid-lens border border-white/60 dark:border-white/10 shadow-sm divide-x divide-black/5 dark:divide-white/10 select-none">
        
        {/* 全部 选项 */}
        <div className="flex items-center px-0.5">
          <Segment selected={active === null} onClick={() => onChange(null)}>
            <span className="font-medium">全部</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors',
                active === null
                  ? 'bg-white/20 text-white'
                  : 'bg-black/5 dark:bg-white/10 opacity-75'
              )}
            >
              {total}
            </span>
          </Segment>
        </div>

        {/* 各国家/地区选项 */}
        {regions.map(r => (
          <div key={r.code} className="flex items-center px-0.5">
            <Segment
              selected={active === r.code}
              onClick={() => onChange(r.code)}
            >
              <Flag code={r.code} className="w-4 h-3 drop-shadow-sm shrink-0" />
              <span className="font-semibold tracking-wide">{r.code}</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors',
                  active === r.code
                    ? 'bg-white/20 text-white'
                    : 'bg-black/5 dark:bg-white/10 opacity-75'
                )}
              >
                {r.count}
              </span>
            </Segment>
          </div>
        ))}
      </div>
    </div>
  )
}

function Segment({
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
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all duration-200 whitespace-nowrap active:scale-95 shrink-0',
        selected
          ? 'bg-blue-500 text-white shadow-md font-medium'
          : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
      )}
    >
      {children}
    </button>
  )
}
