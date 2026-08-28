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
          'p-5 sm:p-6 rounded-3xl transition-all duration-200 flex flex-col gap-4',
          'liquid-lens',
          'hover:bg-white/60 dark:hover:bg-slate-800/60 hover:scale-[1.01] active:scale-[0.99]',
          !node.online && 'opacity-60',
        )}
      >
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain drop-shadow-sm" loading="lazy" />
          )}
          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0 truncate tracking-tight" title={displayName(node)}>
            {displayName(node)}
          </span>
          <Flag code={node.meta?.region} className="shrink-0" />
        </div>

        {(os || virt) && (
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate -mt-1">
            {[os, virt].filter(Boolean).join(' · ')}
          </div>
        )}

        <div className="flex flex-col gap-3.5 py-1">
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

        <div className="pt-3 border-t border-white/60 dark:border-white/10 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-2">
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
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/40 dark:bg-white/10 border-white/70 dark:border-white/20 text-slate-700 dark:text-slate-300"
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
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{pct(value)}</span>
      </div>
      <Progress 
        value={value} 
        indicatorClassName={loadColor(value)} 
        className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden" 
      />
      {sub && (
        <div
          className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate"
          title={subTitle}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
