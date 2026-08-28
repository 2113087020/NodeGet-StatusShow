import { ArrowDown, ArrowUp, Clock, type LucideIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge, uptime } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cn, loadColor } from '../utils/cn'
import type { Node } from '../types'
import type { ReactNode } from 'react'

export function NodeCard({ node }: { node: Node }) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const logo = distroLogo(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)

  return (
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block group">
      <Card
        className={cn(
          'p-4.5 rounded-2xl transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden',
          'bg-white/55 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150',
          'border border-white/70 dark:border-white/10',
          'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]',
          'hover:bg-white/75 dark:hover:bg-slate-900/60 hover:shadow-[0_12px_36px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 hover:border-blue-400/50',
          !node.online && 'opacity-60 grayscale-[0.3]',
        )}
      >
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain drop-shadow-sm" loading="lazy" />
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate tracking-tight" title={displayName(node)}>
            {displayName(node)}
          </span>
          <Flag code={node.meta?.region} className="shrink-0 drop-shadow-sm" />
        </div>

        {(os || virt) && (
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
            {[os, virt].filter(Boolean).join(' · ')}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <Metric label="CPU" value={u.cpu} sub={cpu || null} subTitle={cpu || undefined} />
          <Metric
            label="内存"
            value={u.mem}
            sub={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : null}
          />
          <Metric
            label="磁盘"
            value={u.disk}
            sub={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : null}
          />
        </div>

        <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10 border-dashed font-mono text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-3">
            <Stat icon={ArrowDown}>{bytes(u.netIn || 0)}/s</Stat>
            <Stat icon={ArrowUp}>{bytes(u.netOut || 0)}/s</Stat>
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={Clock}>{uptime(u.uptime)}</Stat>
            <span className="ml-auto text-[11px] opacity-80">{relativeAge(u.ts)}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {tags.map(t => (
              <Badge 
                key={t} 
                variant="outline" 
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </a>
  )
}

function Stat({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 opacity-70" />
      {children}
    </span>
  )
}

function Metric({
  label,
  value,
  sub,
  subTitle,
}: {
  label: string
  value: number | undefined
  sub?: string | null
  subTitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{pct(value)}</span>
      </div>
      <Progress 
        value={value} 
        indicatorClassName={loadColor(value)} 
        className="h-1.5 bg-slate-200/50 dark:bg-slate-800/60 rounded-full backdrop-blur-sm" 
      />
      {sub && (
        <div
          className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate"
          title={subTitle}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
