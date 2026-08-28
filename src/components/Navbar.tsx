import { useEffect, useRef, useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { Search } from './Search'
import { ViewToggle } from './ViewToggle'
import { ThemeToggle } from './ThemeToggle'
import { SortMenu } from './SortMenu'
import { Button } from './ui/button'
import { cn } from '../utils/cn'
import type { Sort, View } from '../types'

interface Props {
  siteName: string
  logo?: string
  query: string
  onQuery: (v: string) => void
  view: View
  onView: (v: View) => void
  sort: Sort
  onSort: (v: Sort) => void
}

export function Navbar({ siteName, logo, query, onQuery, view, onView, sort, onSort }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  return (
    <>
      {/* 顶部独立悬浮导航 */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 pt-3.5 pb-1 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* 左上角大号 Logo 与标题胶囊 */}
          <a
            href="./"
            className="pointer-events-auto h-12 px-4 sm:px-5 rounded-full flex items-center gap-3 liquid-lens hover:opacity-95 active:scale-95 transition-all duration-200"
          >
            {logo ? (
              <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain drop-shadow-sm shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/40 flex items-center justify-center font-bold text-sm shrink-0">
                {siteName.slice(0, 1)}
              </div>
            )}
            <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight truncate drop-shadow-sm">
              {siteName}
            </span>
          </a>

          {/* 右上角两个独立悬浮球 */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center liquid-lens active:scale-95 transition-all duration-200">
              <SortMenu value={sort} onChange={onSort} />
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center liquid-lens active:scale-95 transition-all duration-200">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 底部悬浮 Dock 栏 */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center items-center px-4 pointer-events-none">
        <div className="flex items-center gap-4 max-w-full">
          {/* 搜索展开模式：全宽显示，不挤压其他按钮 */}
          {searchOpen ? (
            <div className="pointer-events-auto h-14 w-[85vw] max-w-md px-4 rounded-full flex items-center gap-2 liquid-lens shadow-[0_12px_32px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
              <SearchIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => onQuery(e.target.value)}
                placeholder="搜索节点状态..."
                className="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none outline-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/40 active:scale-95"
                onClick={() => {
                  onQuery('')
                  setSearchOpen(false)
                }}
                aria-label="关闭搜索"
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>
          ) : (
            <>
              {/* 未展开：独立搜索球 */}
              <div className="pointer-events-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-14 h-14 rounded-full liquid-lens text-slate-700 dark:text-slate-200 hover:bg-white/70 active:scale-95 transition-all shadow-[0_10px_28px_rgba(0,0,0,0.1)]"
                  onClick={() => setSearchOpen(true)}
                  aria-label="搜索"
                >
                  <SearchIcon className="h-6 w-6" />
                </Button>
              </div>

              {/* 独立视图切换大胶囊 */}
              <div className="pointer-events-auto h-14 px-2 rounded-full flex items-center liquid-lens shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
                <ViewToggle value={view} onChange={onView} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
