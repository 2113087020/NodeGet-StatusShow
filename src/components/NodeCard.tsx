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
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block">
      <Card
        className={cn(
          'p-5 rounded-2xl transition flex flex-col gap-4',
          'bg-white/60 dark:bg-slate-900/50 backdrop-blur-md',
          'border border-white/80 dark:border-white/10',
          'shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]',
          'hover:bg-white/80 dark:hover:bg-slate-900/70 hover:border-blue-400/40',
          !node.online && 'opacity-60',
        )}
      >
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain" loading="lazy" />
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate" title={displayName(node)}>
            {displayName(node)}
          </span>
          <Flag code={node.meta?.region} className="shrink-0" />
        </div>

        {(os || virt) && (
          <div className="font-mono text-xs text-muted-foreground truncate -mt-1">
            {[os, virt].filter(Boolean).join(' · ')}
          </div>
        )}

        <div className="flex flex-col gap-3 py-1">
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

        <div className="pt-3 border-t border-dashed border-slate-200/80 dark:border-white/10 font-mono text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-3">
            <Stat icon={ArrowDown}>{bytes(u.netIn || 0)}/s</Stat>
            <Stat icon={ArrowUp}>{bytes(u.netOut || 0)}/s</Stat>
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={Clock}>{uptime(u.uptime)}</Stat>
            <span className="ml-auto">{relativeAge(u.ts)}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map(t => (
              <Badge 
                key={t} 
                variant="outline" 
                className="text-[10px] bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10"
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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{pct(value)}</span>
      </div>
      <Progress 
        value={value} 
        indicatorClassName={loadColor(value)} 
        className="h-1.5 bg-slate-200/50 dark:bg-slate-800/60 rounded-full" 
      />
      {sub && (
        <div
          className="font-mono text-[11px] text-muted-foreground mt-1.5 truncate"
          title={subTitle}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
