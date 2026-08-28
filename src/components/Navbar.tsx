import { Search as SearchIcon, X } from 'lucide-react'
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
  return (
    <>
      {/* 顶部独立悬浮操作区 */}
      <header className="sticky top-0 z-30 w-full px-3 sm:px-6 pt-3.5 pb-1 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
          {/* 左侧区域：Logo 胶囊 + 紧跟其后的搜索框（红圈位置） */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-auto">
            <a
              href="./"
              className="h-12 px-3.5 sm:px-4 rounded-full flex items-center gap-2.5 liquid-lens shrink-0 hover:opacity-95 active:scale-95 transition-all duration-200"
            >
              {logo ? (
                <img src={logo} alt="" className="w-6 h-6 rounded object-contain drop-shadow-sm shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/40 flex items-center justify-center font-bold text-xs shrink-0">
                  {siteName.slice(0, 1)}
                </div>
              )}
              <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 tracking-tight truncate">
                {siteName}
              </span>
            </a>

            {/* 红圈位置：紧挨着标题的玻璃搜索条 */}
            <div className="flex-1 min-w-[120px] max-w-xs sm:max-w-sm h-12 px-3 sm:px-3.5 rounded-full flex items-center gap-2 liquid-lens">
              <SearchIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <input
                type="search"
                name="site-search"
                id="site-search"
                value={query}
                onChange={e => onQuery(e.target.value)}
                placeholder="搜索..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none outline-none"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-full text-slate-500 hover:bg-white/40"
                  onClick={() => onQuery('')}
                  aria-label="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* 右上角：综合排序/筛选按钮 */}
          <div className="pointer-events-auto shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center liquid-lens active:scale-95 transition-all duration-200">
              <SortMenu value={sort} onChange={onSort} />
            </div>
          </div>
        </div>
      </header>

      {/* 底部悬浮 Dock 栏：左边夜间模式球 + 右边视图切换胶囊 */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center items-center gap-4 px-4 pointer-events-none">
        {/* 左侧独立夜间模式玻璃球 */}
        <div className="pointer-events-auto">
          <div className="w-14 h-14 rounded-full flex items-center justify-center liquid-lens shadow-[0_10px_28px_rgba(0,0,0,0.1)] active:scale-95 transition-all">
            <ThemeToggle />
          </div>
        </div>

        {/* 右侧独立视图切换胶囊 */}
        <div className="pointer-events-auto h-14 px-2 rounded-full flex items-center liquid-lens shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
          <ViewToggle value={view} onChange={onView} />
        </div>
      </div>
    </>
  )
}
