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
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      setShowIndicator(false)
    }, 800)
  }

  const triggerIndicator = () => {
    setShowIndicator(true)
    scheduleHide()
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)))
      setCanScroll(true)
      triggerIndicator()
    } else {
      setCanScroll(false)
    }
  }

  const handleClick = (code: string | null) => {
    onChange(code)
    triggerIndicator()
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScroll(el.scrollWidth > el.clientWidth)

    const onResize = () => {
      if (el) setCanScroll(el.scrollWidth > el.clientWidth)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [regions])

  if (regions.length === 0) return null

  return (
    <div
      onTouchStart={triggerIndicator}
      onTouchEnd={scheduleHide}
      className="relative w-full rounded-full liquid-lens border border-white/60 dark:border-white/10 shadow-sm overflow-hidden select-none"
    >
      {/* 调整为舒适饱满的高度 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto flex items-center px-1.5 py-1.5 divide-x divide-black/5 dark:divide-white/10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 全部 选项 */}
        <div className="flex items-center px-1 shrink-0">
          <Segment selected={active === null} onClick={() => handleClick(null)}>
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
          <div key={r.code} className="flex items-center px-1 shrink-0">
            <Segment
              selected={active === r.code}
              onClick={() => handleClick(r.code)}
            >
              <Flag code={r.code} className="w-3.5 h-2.5 drop-shadow-sm shrink-0" />
              <span className="font-semibold tracking-wide text-xs">{r.code}</span>
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

      {/* 加长版指示条：宽度占可见区域约 28% */}
      {canScroll && (
        <div
          ref={trackRef}
          className={cn(
            'absolute bottom-1 left-5 right-5 h-[3px] pointer-events-none transition-opacity duration-300',
            showIndicator ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="h-full w-[28%] bg-blue-500/80 dark:bg-blue-400/80 rounded-full"
            style={{
              transform: `translateX(${scrollProgress * 257}%)`,
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
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap active:scale-95 shrink-0',
        selected
          ? 'bg-blue-500 text-white shadow-sm font-medium'
          : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
      )}
    >
      {children}
    </button>
  )
}
