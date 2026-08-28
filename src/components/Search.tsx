import { forwardRef } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from './ui/input'
import { cn } from '../utils/cn'

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
  autoFocus?: boolean
}

export const Search = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, className, autoFocus }, ref) => (
    <div className={cn('relative w-44 md:w-56 group', className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors drop-shadow-sm" />
      <Input
        ref={ref}
        type="search"
        placeholder="搜索节点状态…"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus}
        className={cn(
          "pl-9 pr-3 py-1.5 rounded-full text-sm",
          "bg-white/45 dark:bg-slate-950/30 backdrop-blur-md border border-white/70 dark:border-white/10",
          "text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
          "shadow-[0_2px_10px_rgba(0,0,0,0.02)] shadow-inner-[0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none",
          "transition-all duration-200",
          "focus:bg-white/70 dark:focus:bg-slate-950/50 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/20 focus:shadow-[0_4px_16px_rgba(59,130,246,0.15)]",
          "hover:bg-white/65 dark:hover:bg-slate-950/40 hover:border-white/90 dark:hover:border-white/20"
        )}
      />
    </div>
  ),
)
Search.displayName = 'Search'
