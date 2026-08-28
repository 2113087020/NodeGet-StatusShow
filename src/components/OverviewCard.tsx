import { useMemo } from 'react'
import { Activity, ArrowDown, ArrowUp, HardDriveDownload, HardDriveUpload, Server } from 'lucide-react'
import { Card } from './ui/card'
import { bytes } from '../utils/format'
import { deriveUsage } from '../utils/derive'
import type { Node } from '../types'

interface Props {
  nodes: Node[]
}

export function OverviewCard({ nodes }: Props) {
  const stats = useMemo(() => {
    let online = 0
    let total = 0
    let totalNetIn = 0
    let totalNetOut = 0
    let totalRecv = 0
    let totalTrans = 0

    for (const n of nodes) {
      if (n.meta?.hidden) continue
      total++
      if (n.online) online++

      const u = deriveUsage(n)
      totalNetIn += u.netIn || 0
      totalNetOut += u.netOut || 0
      totalRecv += n.dynamic?.total_received || 0
      totalTrans += n.dynamic?.total_transmitted || 0
    }

    const offline = total - online
    return {
      online,
      offline,
      total,
      totalNetIn,
      totalNetOut,
      totalRecv,
      totalTrans,
    }
  }, [nodes])

  if (stats.total === 0) return null

  return (
    <Card className="px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl liquid-lens select-none">
      <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/10">
        
        {/* 1. 节点状态 */}
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-3 px-1 sm:px-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>节点状态</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 min-w-0">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.online}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                / {stats.total}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  stats.offline === 0
                    ? 'bg-emerald-500 animate-pulse'
                    : stats.online === 0
                      ? 'bg-red-500'
                      : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span
                className={
                  stats.offline === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : stats.online === 0
                      ? 'text-red-500'
                      : 'text-amber-600 dark:text-amber-400'
                }
              >
                {stats.offline === 0
                  ? '全部在线'
                  : stats.online === 0
                    ? '全部离线'
                    : `${stats.offline} 离线`}
              </span>
            </div>
          </div>
        </div>

        {/* 2. 实时速率 */}
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-3 px-2 sm:px-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            <Activity className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>实时速率</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 font-mono text-[11px] sm:text-xs min-w-0">
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate">
              <ArrowUp className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{bytes(stats.totalNetOut)}/s</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate">
              <ArrowDown className="w-3 h-3 text-blue-500 shrink-0" />
              <span>{bytes(stats.totalNetIn)}/s</span>
            </div>
          </div>
        </div>

        {/* 3. 累计总流量 */}
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-3 px-1 sm:px-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            <HardDriveUpload className="w-3.5 h-3.5 text-emerald-500 shrink-0 hidden sm:inline" />
            <span>累计用量</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 font-mono text-[11px] sm:text-xs min-w-0">
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">出</span>
              <span>{bytes(stats.totalTrans)}</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 tabular-nums truncate">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">入</span>
              <span>{bytes(stats.totalRecv)}</span>
            </div>
          </div>
        </div>

      </div>
    </Card>
  )
}
