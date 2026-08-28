import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const current = OPTIONS.find(o => o.value === value) ?? OPTIONS[0]

  const updatePosition = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }

  const handleToggle = () => {
    if (!open) updatePosition()
    setOpen(prev => !prev)
  }

  useEffect(() => {
    if (!open) return
    updatePosition()

    const onScrollOrResize = () => updatePosition()
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!btnRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`排序: ${current.label}`}
        className="w-full h-full rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
      >
        <ArrowUpDown className="h-4.5 w-4.5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              right: `${coords.right}px`,
            }}
            className={cn(
              "w-36 min-w-[9rem] z-[100] p-1.5 rounded-2xl liquid-lens shadow-2xl origin-top-right",
              "animate-in fade-in-0 zoom-in-95 duration-150"
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
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                        : "text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                  >
                    <span>{o.label}</span>
                    {active && <Check className="h-3.5 w-3.5 ml-2 shrink-0 stroke-[2.5]" />}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
