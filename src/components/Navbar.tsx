import { useEffect, useRef, useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { Search } from './Search'
import { ViewToggle } from './ViewToggle'
import { ThemeToggle } from './ThemeToggle'
import { SortMenu } from './SortMenu'
import { Button } from './ui/button'
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
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  return (
    <>
      {/* 顶部独立悬浮模块（左右分离，无全屏模糊背景） */}
      <header className="sticky top-0 z-30 w-full px-3.5 sm:px-6 pt-3 pb-1 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* 绿色左侧：网站名称与 Logo 独立悬浮玻璃条 */}
          <a
            href="./"
            className="pointer-events-auto h-11 px-3.5 sm:px-4 rounded-full flex items-center gap-2.5 liquid-lens hover:opacity-90 active:scale-95 transition-all duration-200"
          >
            {logo ? (
              <img src={logo} alt="" className="w-5 h-5 rounded object-contain drop-shadow-sm shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/40 flex items-center justify-center font-bold text-xs shrink-0">
                {siteName.slice(0, 1)}
              </div>
            )}
            <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 tracking-tight truncate">
              {siteName}
            </span>
          </a>

          {/* 绿色右侧：排序与夜间模式独立悬浮玻璃条 */}
          <div className="pointer-events-auto h-11 px-2 rounded-full flex items-center gap-1 liquid-lens">
            <SortMenu value={sort} onChange={onSort} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 红色部分：固定在页面最底部的独立悬浮液态玻璃 Dock 栏 */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto h-12 px-3 rounded-full flex items-center gap-2 liquid-lens shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* 搜索区域 */}
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <Search
                ref={inputRef}
                value={query}
                onChange={onQuery}
                className="w-48 sm:w-64"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/40"
                onClick={() => {
                  onQuery('')
                  setSearchOpen(false)
                }}
                aria-label="关闭搜索"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white/40 active:scale-95 transition-all"
              onClick={() => setSearchOpen(true)}
              aria-label="搜索"
            >
              <SearchIcon className="h-4.5 w-4.5" />
            </Button>
          )}

          {/* 分隔竖线 */}
          <div className="w-[1px] h-5 bg-slate-300/60 dark:bg-white/10 my-auto" />

          {/* 多视图切换 */}
          <div className="flex items-center">
            <ViewToggle value={view} onChange={onView} />
          </div>
        </div>
      </div>
    </>
  )
}
