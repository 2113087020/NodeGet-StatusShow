import { LayoutGrid, List, Globe } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../utils/cn'
import type { View } from '../types'

interface Props {
  value: View
  onChange: (v: View) => void
}

export function ViewToggle({ value, onChange }: Props) {
  const options: { id: View; icon: typeof LayoutGrid; label: string }[] = [
    { id: 'grid', icon: LayoutGrid, label: '卡片视图' },
    { id: 'table', icon: List, label: '表格视图' },
    { id: 'map', icon: Globe, label: '地图视图' },
  ]

  return (
    <div className="flex items-center gap-1">
      {options.map(item => {
        const Icon = item.icon
        const active = value === item.id
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onChange(item.id)}
            title={item.label}
            className={cn(
              'w-9 h-9 rounded-full transition-all duration-200',
              active
                ? 'bg-white/75 dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/30',
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </Button>
        )
      })}
    </div>
  )
}
