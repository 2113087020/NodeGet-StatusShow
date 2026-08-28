import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { cn } from '../utils/cn'
import type { Sort } from '../types'

const OPTIONS: { value: Sort; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'name', label: '名称' },
  { value: 'region', label: '地区' },
  { value: 'cpu', label: 'CPU 占用' },
  { value: 'mem', label: '内存占用' },
  { value: 'disk', label: '磁盘占用' },
  { value: 'netIn', label: '下行速度' },
  { value: 'netOut', label: '上行速度' },
  { value: 'uptime', label: '在线时长' },
]

export function SortMenu({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = OPTIONS.find(o => o.value === value) ?? OPTIONS[0]

  useEffect(() => {
    if (open) setShow(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center justify-center w-full h-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`排序: ${current.label}`}
        className="w-full h-full rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
      >
        <ArrowUpDown className="h-4.5 w-4.5" />
      </button>

      {show && (
        <div
          data-state={open ? 'open' : 'closed'}
          onAnimationEnd={() => {
            if (!open) setShow(false)
          }}
          className={cn(
            "pointer-events-auto absolute right-0 top-full mt-2 w-36 min-w-[9rem] max-w-[calc(100vw-2rem)] origin-top-right z-50 p-1.5 rounded-2xl liquid-lens shadow-[0_12px_32px_rgba(0,0,0,0.12)] fill-mode-forwards",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="space-y-0.5">
            {OPTIONS.map(o => {
              const active = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer",
                    active
                      ? "bg-white/60 dark:bg-white/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                      : "text-slate-800 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10"
                  )}
                >
                  <span>{o.label}</span>
                  {active && <Check className="h-3.5 w-3.5 ml-2 shrink-0 stroke-[2.5]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
