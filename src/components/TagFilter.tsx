import { cn } from '../utils/cn'

interface Props {
  tags: string[]
  active: string | null
  onChange: (tag: string | null) => void
}

export function TagFilter({ tags, active, onChange }: Props) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip selected={active === null} onClick={() => onChange(null)}>
        全部
      </Chip>
      {tags.map(t => (
        <Chip key={t} selected={active === t} onClick={() => onChange(t)}>
          {t}
        </Chip>
      ))}
    </div>
  )
}

function Chip({
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
        'px-3 py-1.2 text-xs rounded-full border transition-all duration-200 active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        selected
          ? 'bg-blue-500/85 dark:bg-blue-600/85 text-white border-blue-400/60 shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
          : 'bg-white/45 dark:bg-slate-900/35 text-slate-700 dark:text-slate-200 border-white/70 dark:border-white/10 hover:bg-white/75 dark:hover:bg-slate-900/60 hover:border-white/90',
      )}
    >
      {children}
    </button>
  )
}
