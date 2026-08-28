import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge } from '../utils/format'
import { deriveUsage, displayName, distroLogo, virtLabel } from '../utils/derive'
import { cn, loadColor } from '../utils/cn'
import type { Node } from '../types'

interface Props {
  nodes: Node[]
  onOpen?: (uuid: string) => void
}

export function NodeTable({ nodes, onOpen }: Props) {
  return (
    <Card className={cn(
      'rounded-2xl overflow-hidden',
      'bg-white/55 dark:bg-slate-900/35 backdrop-blur-xl backdrop-saturate-150',
      'border border-white/70 dark:border-white/10',
      'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]',
    )}>
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-white/10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead className="text-slate-700 dark:text-slate-300">名称</TableHead>
            <TableHead className="w-12 text-center text-slate-700 dark:text-slate-300">地区</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">架构</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">CPU</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">内存</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">磁盘</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">下行</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">上行</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300">更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map(n => {
            const u = deriveUsage(n)
            const logo = distroLogo(n)
            const virt = virtLabel(n)
            return (
              <TableRow
                key={n.uuid}
                onClick={() => onOpen?.(n.uuid)}
                className={cn(
                  'cursor-pointer transition-colors group',
                  'hover:bg-white/50 dark:hover:bg-white/5',
                  !n.online && 'opacity-60 grayscale-[0.3]',
                )}
              >
                <TableCell>
                  <StatusDot online={n.online} />
                </TableCell>
                <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    {logo && (
                      <img
                        src={logo}
                        alt=""
                        className="w-4 h-4 shrink-0 object-contain drop-shadow-sm"
                        loading="lazy"
                      />
                    )}
                    <span className="truncate tracking-tight">{displayName(n)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {n.meta?.region ? (
                    <Flag code={n.meta.region} className="drop-shadow-sm" />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {virt ? (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] uppercase tracking-wide">
                      {virt}
                    </Badge>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <CellBar value={u.cpu} />
                </TableCell>
                <TableCell>
                  <CellBar
                    value={u.mem}
                    hint={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : null}
                  />
                </TableCell>
                <TableCell>
                  <CellBar
                    value={u.disk}
                    hint={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : null}
                  />
                </TableCell>
                <TableCell className="font-mono text-slate-700 dark:text-slate-200">{bytes(u.netIn || 0)}/s</TableCell>
                <TableCell className="font-mono text-slate-700 dark:text-slate-200">{bytes(u.netOut || 0)}/s</TableCell>
                <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 opacity-90">
                  {relativeAge(u.ts)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

function CellBar({ value, hint }: { value: number | undefined; hint?: string | null }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={hint || ''}>
      <Progress 
        value={value} 
        indicatorClassName={loadColor(value)} 
        className="flex-1 h-1.5 bg-slate-200/50 dark:bg-slate-800/60 rounded-full backdrop-blur-sm" 
      />
      <span className="font-mono text-xs w-12 text-right text-slate-700 dark:text-slate-300 font-medium">{pct(value)}</span>
    </div>
  )
}
