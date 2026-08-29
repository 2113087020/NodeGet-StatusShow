import { cn } from '../utils/cn'
import { Flag } from './Flag'
import React, { useEffect, useRef, useState } from 'react'

interface Props {
  regions: { code: string; count: number }[]
  total: number
  active: string | null
  onChange: (code: string | null) => void
}

export function RegionFilter({ regions, total, active, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScroll, setCanScroll] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll)
      setCanScroll(true)
    } else {
      setCanScroll(false)
    }
  }

  useEffect(() => {
    handleScroll()
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [regions])

  if (regions.length === 0) return null

  return (
    <div className="relative w-full rounded-full liquid-lens border border-white/60 dark:border-white/10 shadow-sm overflow-hidden select-none">
      {/* 横向滚动区域（强制隐藏原生系统滚动条） */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto flex items-center p-1 divide-x divide-black/5 dark:divide-white/10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 全部 选项 */}
        <div className="flex items-center px-0.5 shrink-0">
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
          <div key={r.code} className="flex items-center px-0.5 shrink-0">
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

      {/* 胶囊内部底端的极细进度指示条 */}
      {canScroll && (
        <div className="absolute bottom-0.5 left-6 right-6 h-[2px] bg-black/5 dark:bg-white/5 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full w-12 bg-blue-500/50 dark:bg-blue-400/50 rounded-full transition-transform duration-75 ease-out"
            style={{
              transform: `translateX(${scrollProgress * 200}%)`,
            }}
          />
        </div>
      )}
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
