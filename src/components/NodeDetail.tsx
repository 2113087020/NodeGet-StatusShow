import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge, uptime } from '../utils/format'
import { deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cycleProgress, hasCost, remainingDays, remainingValue } from '../utils/cost'
import { cn, strokeColor } from '../utils/cn'
import {
  buildLatencyChart,
  computeLatencyStats,
  type LatencyStats,
} from '../utils/latency'
import { useNodeLatency } from '../hooks/useNodeLatency'
import type { BackendPool } from '../api/pool'
import type { HistorySample, LatencyType, Node, NodeMeta, TaskQueryResult } from '../types'

const TOOLTIP_STYLE = {
  background: 'rgba(255, 255, 255, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.9)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  color: '#1e293b'
}

const DARK_TOOLTIP_STYLE = {
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  color: '#f8fafc'
}

interface Props {
  node: Node | null
  onClose: () => void
  showSource?: boolean
  pool: BackendPool | null
}

const TIME_RANGES = [
  { label: '1小时', hours: 1 },
  { label: '6小时', hours: 6 },
  { label: '12小时', hours: 12 },
  { label: '24小时', hours: 24 },
]

export function NodeDetail({ node, onClose, showSource, pool }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(false)
  const [tcpHours, setTcpHours] = useState(1)
  const [pingHours, setPingHours] = useState(1)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [node, onClose])

  const { tcpData, loading: tcpLoading } = useNodeLatency(
    pool,
    node?.source ?? null,
    node?.uuid ?? null,
    tcpHours,
  )

  const { pingData, loading: pingLoading } = useNodeLatency(
    pool,
    node?.source ?? null,
    node?.uuid ?? null,
    pingHours,
  )

  if (!node) return null

  const u = deriveUsage(node)
  const d = node.dynamic
  const s = node.static?.system
  const cpu = node.static?.cpu
  const tags = node.meta?.tags ?? []
  const virt = virtLabel(node)
  const logo = distroLogo(node)
  const swap =
    d?.total_swap && d.used_swap != null ? (d.used_swap / d.total_swap) * 100 : undefined
  const loadAvg =
    d?.load_one != null && d?.load_five != null && d?.load_fifteen != null
      ? `${d.load_one.toFixed(2)} / ${d.load_five.toFixed(2)} / ${d.load_fifteen.toFixed(2)}`
      : null
  const history = node.history || []

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-hidden flex flex-col bg-soft select-none animate-in fade-in duration-150">
      {/* 顶部悬浮导航 */}
      <div className="fixed top-0 inset-x-0 z-30 w-full px-5 sm:px-7 pt-3.5 pb-2 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            aria-label="返回" 
            className="pointer-events-auto w-12 h-12 rounded-full shrink-0 liquid-lens active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-slate-800 dark:text-slate-100" />
          </Button>

          <div className="pointer-events-auto flex-1 min-w-0 h-12 px-4 sm:px-5 rounded-full flex items-center gap-2.5 sm:gap-3.5 liquid-lens">
            <StatusDot online={node.online} />
            {logo && (
              <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain drop-shadow-sm" loading="lazy" />
            )}
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate min-w-0 tracking-tight">
              {displayName(node)}
            </span>
            <Flag code={node.meta?.region} className="shrink-0" />
            <span className="hidden md:inline truncate text-xs font-mono text-slate-500 dark:text-slate-400">
              {node.uuid}
            </span>
            <div className="ml-auto flex items-center gap-1.5 shrink-0 overflow-hidden">
              {node.meta?.region && <GlassBadge>{node.meta.region}</GlassBadge>}
              {showSource && (
                <GlassBadge className="hidden sm:inline-flex">
                  {node.source}
                </GlassBadge>
              )}
              {virt && <GlassBadge>{virt}</GlassBadge>}
              {tags.map(t => (
                <Badge 
                  key={t} 
                  variant="outline"
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/40 dark:bg-white/10 border-white/70 dark:border-white/20 shrink-0"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 独立滚动内容区域 */}
      <div 
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto overscroll-contain"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 space-y-6">
          <Section title="资源状态">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 py-2">
              <Ring label="CPU" value={u.cpu} sub={loadAvg ?? undefined} />
              <Ring
                label="内存"
                value={u.mem}
                sub={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : undefined}
              />
              <Ring
                label="磁盘"
                value={u.disk}
                sub={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : undefined}
              />
              {swap != null && (
                <Ring
                  label="Swap"
                  value={swap}
                  sub={`${bytes(d?.used_swap)} / ${bytes(d?.total_swap)}`}
                />
              )}
            </div>
          </Section>

          {history.length > 1 && (
            <Section title={`近 ${history.length * 2} 秒趋势`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Spark
                  data={history}
                  dataKey="cpu"
                  label="CPU %"
                  stroke="#3b82f6"
                  domain={[0, 100]}
                  format={pct}
                  isDark={isDark}
                />
                <Spark
                  dataKey="mem"
                  data={history}
                  label="内存 %"
                  stroke="#10b981"
                  domain={[0, 100]}
                  format={pct}
                  isDark={isDark}
                />
                <Spark
                  dataKey="netIn"
                  data={history}
                  label="下行带宽"
                  stroke="#8b5cf6"
                  format={v => `${bytes(v)}/s`}
                  isDark={isDark}
                />
                <Spark
                  dataKey="netOut"
                  data={history}
                  label="上行带宽"
                  stroke="#f59e0b"
                  format={v => `${bytes(v)}/s`}
                  isDark={isDark}
                />
              </div>
            </Section>
          )}

          <LatencyBlock
            title="TCP 延迟"
            rows={tcpData}
            type="tcp_ping"
            loading={tcpLoading}
            isDark={isDark}
            hours={tcpHours}
            onHoursChange={setTcpHours}
          />
          <LatencyBlock
            title="ICMP Ping 延迟"
            rows={pingData}
            type="ping"
            loading={pingLoading}
            isDark={isDark}
            hours={pingHours}
            onHoursChange={setPingHours}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="系统信息">
              <div className="space-y-2 pt-1">
                <KV k="主机名" v={s?.system_host_name} />
                <KV k="操作系统" v={osLabel(node)} />
                <KV k="内核版本" v={s?.system_kernel || s?.system_kernel_version} />
                <KV k="CPU 架构" v={s?.arch || s?.cpu_arch} />
                <KV k="虚拟化技术" v={virt} />
                <KV k="CPU 型号" v={cpu?.brand || cpu?.per_core?.[0]?.brand} />
                <KV
                  k="CPU 核心"
                  v={
                    cpu?.physical_cores != null
                      ? `${cpu.physical_cores} 物理 / ${cpu.logical_cores} 逻辑`
                      : cpu?.per_core?.length
                        ? `${cpu.per_core.length} 核`
                        : null
                  }
                />
              </div>
            </Section>

            <Section title="网络与负载">
              <div className="space-y-2 pt-1">
                <KV k="累计接收流量" v={d?.total_received != null ? bytes(d.total_received) : null} />
                <KV k="累计发送流量" v={d?.total_transmitted != null ? bytes(d.total_transmitted) : null} />
                <KV k="实时磁盘读" v={d?.read_speed != null ? `${bytes(d.read_speed)}/s` : null} />
                <KV k="实时磁盘写" v={d?.write_speed != null ? `${bytes(d.write_speed)}/s` : null} />
                <KV k="进程数" v={d?.process_count} />
                <KV
                  k="TCP / UDP 连接"
                  v={
                    d?.tcp_connections != null || d?.udp_connections != null
                      ? `${d?.tcp_connections ?? '—'} / ${d?.udp_connections ?? '—'}`
                      : null
                  }
                />
                <KV k="运行时长" v={uptime(d?.uptime)} />
                <KV k="最近更新" v={relativeAge(d?.timestamp)} />
              </div>
            </Section>

            {hasCost(node.meta) && <CostSection meta={node.meta} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="p-6 rounded-3xl liquid-lens">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  if (v == null || v === '') return null
  return (
    <div className="flex justify-between items-center gap-3 text-sm py-1.5 px-2.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
      <span className="text-slate-600 dark:text-slate-400 font-medium">{k}</span>
      <span className="font-mono text-right text-slate-900 dark:text-slate-100 font-semibold truncate">{v}</span>
    </div>
  )
}

function Ring({ label, value, sub }: { label: string; value?: number; sub?: string }) {
  const r = 40
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value ?? 0))
  const hasValue = Number.isFinite(value)

  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r={r}
            fill="none" strokeWidth={8}
            className="stroke-black/5 dark:stroke-white/10"
          />
          {hasValue && (
            <circle
              cx="50" cy="50" r={r}
              fill="none" strokeWidth={8}
              className={strokeColor(value)}
              strokeDasharray={c}
              strokeDashoffset={c - (c * v) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 400ms ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
          {pct(value)}
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{label}</div>
      {sub && (
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-full" title={sub}>
          {sub}
        </div>
      )}
    </div>
  )
}

interface SparkProps {
  data: HistorySample[]
  dataKey: keyof HistorySample
  label: string
  stroke: string
  domain?: [number, number]
  format: (v: number) => string
  isDark?: boolean
}

function Spark({ data, dataKey, label, stroke, domain, format, isDark }: SparkProps) {
  const last = Number(data.at(-1)?.[dataKey] ?? 0)
  const id = `g-${dataKey}`
  const tooltipStyle = isDark ? DARK_TOOLTIP_STYLE : TOOLTIP_STYLE

  return (
    <div className="rounded-2xl p-4 transition-all bg-white/40 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-inner">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{format(last)}</span>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={domain ?? ['auto', 'auto']} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={t => new Date(t).toLocaleTimeString()}
              formatter={(v: number) => [format(v), label]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={1.8}
              fill={`url(#${id})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface LatencyBlockProps {
  title: string
  rows: TaskQueryResult[]
  type: LatencyType
  loading: boolean
  isDark?: boolean
  hours: number
  onHoursChange: (h: number) => void
}

const ms = (v: number) => `${v.toFixed(1)} ms`

function LatencyBlock({
  title,
  rows,
  type,
  loading,
  isDark,
  hours,
  onHoursChange,
}: LatencyBlockProps) {
  const { data, series } = useMemo(() => buildLatencyChart(rows, type), [rows, type])
  const stats = useMemo(() => computeLatencyStats(rows, type), [rows, type])
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const empty = data.length === 0
  const tooltipStyle = isDark ? DARK_TOOLTIP_STYLE : TOOLTIP_STYLE

  const visibleSeries = series.filter(s => !hidden.has(s.name))

  const toggle = (name: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const rangeSelector = (
    <div className="inline-flex items-center rounded-full p-0.5 liquid-lens border border-white/60 dark:border-white/10 divide-x divide-black/5 dark:divide-white/10 select-none">
      {TIME_RANGES.map(r => (
        <button
          key={r.hours}
          type="button"
          onClick={() => onHoursChange(r.hours)}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-200 whitespace-nowrap active:scale-95',
            hours === r.hours
              ? 'bg-blue-500 text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  return (
    <Section title={title} action={rangeSelector}>
      <div className="relative h-60 bg-white/35 dark:bg-slate-950/30 rounded-2xl border border-white/80 dark:border-white/10 p-2 mb-4">
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
            {loading ? '正在从探针节点加载中…' : `暂无 ${type} 延迟数据`}
          </div>
        )}
        {!empty && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickCount={6}
                tickFormatter={t => {
                  const d = new Date(t)
                  if (hours <= 1) {
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  }
                  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                }}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              />
              <YAxis
                tickFormatter={v => `${v}ms`}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                width={48}
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={t => new Date(Number(t)).toLocaleString()}
                formatter={(v: number) => ms(Number(v))}
              />
              {visibleSeries.map(s => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color}
                  strokeWidth={1.8}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        {!empty && loading && (
          <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="数据同步中" />
        )}
      </div>

      {stats.length > 0 && (
        <div className="mt-3 border-t border-white/70 dark:border-white/10 pt-3.5 space-y-1">
          <div className="flex items-center px-2.5 pb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex-1">检测来源节点</span>
            <span className="w-20 text-right">平均延迟</span>
            <span className="w-16 text-right">抖动</span>
            <span className="w-14 text-right">丢包</span>
          </div>
          <div className="space-y-0.5">
            {stats.map(s => (
              <LatencyStatsRow
                key={s.name}
                stat={s}
                hidden={hidden.has(s.name)}
                onToggle={() => toggle(s.name)}
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

function LatencyStatsRow({
  stat,
  hidden,
  onToggle,
}: {
  stat: LatencyStats
  hidden: boolean
  onToggle: () => void
}) {
  const { name, color, avg, jitter, lossRate } = stat

  return (
    <div
      onClick={onToggle}
      className={cn(
        'flex items-center px-2.5 py-1.5 rounded-xl text-xs cursor-pointer select-none transition-colors',
        'hover:bg-white/50 dark:hover:bg-white/5',
        hidden ? 'opacity-35' : 'opacity-100',
      )}
    >
      <span className="flex items-center gap-2.5 flex-1 min-w-0 text-slate-700 dark:text-slate-200">
        <span
          className="inline-block w-3.5 h-1 rounded-full shrink-0"
          style={{ background: color }}
        />
        <span className="truncate font-semibold">{name}</span>
      </span>
      <span className="w-20 text-right tabular-nums font-mono text-slate-900 dark:text-slate-100 font-bold">
        {avg != null ? ms(avg) : '—'}
      </span>
      <span className="w-16 text-right tabular-nums font-mono text-slate-600 dark:text-slate-400 font-medium">
        {jitter != null ? ms(jitter) : '—'}
      </span>
      <span
        className={cn(
          'w-14 text-right tabular-nums font-mono',
          lossRate >= 5 ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium',
        )}
      >
        {lossRate.toFixed(1)}%
      </span>
    </div>
  )
}

function GlassBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-[10px] px-2.5 py-0.5 rounded-full",
        "bg-white/50 dark:bg-white/10 border-white/80 dark:border-white/20",
        "text-slate-800 dark:text-slate-200 uppercase tracking-wide font-medium",
        className
      )}
    >
      {children}
    </Badge>
  )
}

function CostSection({ meta }: { meta: NodeMeta }) {
  const days = remainingDays(meta.expireTime)
  const value = remainingValue(meta)
  const progress = cycleProgress(meta)
  const unit = meta.priceUnit || '$'

  let daysLabel: string
  let daysClass = ''
  if (days == null) daysLabel = '未设置'
  else if (days < 0) {
    daysLabel = `已过期 ${Math.abs(days)} 天`
    daysClass = 'text-red-500'
  } else if (days <= 7) {
    daysLabel = `${days} 天`
    daysClass = 'text-red-500'
  } else if (days <= 30) {
    daysLabel = `${days} 天`
    daysClass = 'text-orange-500'
  } else {
    daysLabel = `${days} 天`
  }

  const barColor =
    days == null || days < 0
      ? 'bg-slate-400 dark:bg-slate-600'
      : days <= 7
        ? 'bg-red-500'
        : days <= 30
          ? 'bg-orange-500'
          : 'bg-emerald-500'

  return (
    <Section title="账单与费用">
      <div className="space-y-2 pt-1">
        <KV k="续费金额" v={meta.price > 0 ? `${unit}${meta.price} / ${meta.priceCycle} 天` : null} />
        <KV k="到期时间" v={meta.expireTime || null} />
        <KV k="剩余天数" v={<span className={cn(daysClass, "font-bold")}>{daysLabel}</span>} />
        <KV k="剩余价值 (估)" v={meta.price > 0 ? `${unit}${value.toFixed(2)}` : null} />

        {meta.expireTime && days != null && (
          <div className="mt-4 px-1">
            <div className="h-2 w-full rounded-full bg-black/5 dark:bg-slate-800/80 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', barColor)}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-center text-slate-500 dark:text-slate-400 mt-2">
              周期剩余 {progress.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
