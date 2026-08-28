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
      'rounded-3xl overflow-hidden liquid-lens'
    )}>
      <Table>
        <TableHeader className="bg-white/20 dark:bg-white/5 border-b border-white/60 dark:border-white/10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 shrink-0" />
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">名称</TableHead>
            <TableHead className="w-16 min-w-[4rem] text-center text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">地区</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">架构</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">CPU</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">内存</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">磁盘</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">下行</TableHead>
            <TableHead className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">上行</TableHead>
            <TableHead className="w-20 min-w-[4.5rem] text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold">更新</TableHead>
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
                  'hover:bg-white/40 dark:hover:bg-white/5',
                  !n.online && 'opacity-60 grayscale-[0.3]',
                )}
              >
                <TableCell className="shrink-0">
                  <StatusDot online={n.online} />
                </TableCell>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
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
                <TableCell className="text-center whitespace-nowrap min-w-[4rem]">
                  {n.meta?.region ? (
                    <Flag code={n.meta.region} className="drop-shadow-sm inline-block" />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {virt ? (
                    <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/40 dark:bg-white/10 border-white/70 dark:border-white/20 text-slate-700 dark:text-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] uppercase tracking-wide">
                      {virt}
                    </Badge>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <CellBar value={u.cpu} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <CellBar
                    value={u.mem}
                    hint={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : null}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <CellBar
                    value={u.disk}
                    hint={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : null}
                  />
                </TableCell>
                <TableCell className="font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">{bytes(u.netIn || 0)}/s</TableCell>
                <TableCell className="font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">{bytes(u.netOut || 0)}/s</TableCell>
                <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[4.5rem]">
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
        className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden" 
      />
      <span className="font-mono text-xs w-12 text-right text-slate-900 dark:text-slate-100 font-semibold">{pct(value)}</span>
    </div>
  )
}
