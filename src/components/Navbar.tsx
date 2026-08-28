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
  const [stuck, setStuck] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onScroll = () => {
      const h = headerRef.current?.offsetHeight ?? 60
      setStuck(window.scrollY > 10)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 transition-all duration-300 ${
        stuck
          ? 'border-b border-white/60 dark:border-white/10 bg-white/55 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 py-3">
        <a
          href="./"
          className="flex items-center gap-2.5 min-w-0 shrink-0 hover:opacity-80 transition-opacity"
        >
          {logo ? (
            <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain drop-shadow-sm shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold text-xs shadow-sm backdrop-blur-md shrink-0">
              {siteName.slice(0, 1)}
            </div>
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate drop-shadow-sm">
            {siteName}
          </span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <Search value={query} onChange={onQuery} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-white/70 dark:border-white/10 shadow-sm"
            onClick={() => setSearchOpen(o => !o)}
            aria-label={searchOpen ? '关闭搜索' : '搜索'}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/45 dark:bg-white/5 backdrop-blur-md border border-white/70 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <SortMenu value={sort} onChange={onSort} />
            <ViewToggle value={view} onChange={onView} />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div
        aria-hidden={!searchOpen}
        className={`sm:hidden overflow-hidden transition-all duration-200 ease-out ${
          searchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-1 pb-3">
          <Search ref={inputRef} value={query} onChange={onQuery} className="w-full" />
        </div>
      </div>
    </header>
  )
}
