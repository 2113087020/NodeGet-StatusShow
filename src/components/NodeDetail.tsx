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
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  color: '#333'
}

const DARK_TOOLTIP_STYLE = {
  background: 'rgba(15, 23, 42, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  color: '#eee'
}

interface Props {
  node: Node | null
  onClose: () => void
  showSource?: boolean
  pool: BackendPool | null
}

export function NodeDetail({ node, onClose, showSource, pool }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [isDark, setIsDark] = useState(false)

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

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setStuck(false)
    const onScroll = () => {
      const h = headerRef.current?.offsetHeight ?? 60
      setStuck(el.scrollTop > 10)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [node])

  const { pingData, tcpData, loading: latencyLoading } = useNodeLatency(
    pool,
    node?.source ?? null,
    node?.uuid ?? null,
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
    <div
      ref={scrollRef}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-200",
        "bg-white/45 dark:bg-black/60 backdrop-blur-2xl backdrop-saturate-150"
      )}
    >
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-10 transition-all duration-300",
          stuck
            ? 'border-b border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            aria-label="返回" 
            className="shrink-0 rounded-full bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </Button>
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain drop-shadow-sm" loading="lazy" />
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate min-w-0 tracking-tight">{displayName(node)}</span>
          <Flag code={node.meta?.region} className="shrink-0 drop-shadow-sm" />
          <span className="hidden md:inline truncate text-xs font-mono text-slate-500 dark:text-slate-400 opacity-80">
            {node.uuid}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5 shrink-0">
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
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/30 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-inner"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <Section title="资源状态">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-2 py-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                data={history}
                dataKey="mem"
                label="内存 %"
                stroke="#10b981"
                domain={[0, 100]}
                format={pct}
                isDark={isDark}
              />
              <Spark
                data={history}
                dataKey="netIn"
                label="下行带宽"
                stroke="#8b5cf6"
                format={v => `${bytes(v)}/s`}
                isDark={isDark}
              />
              <Spark
                data={history}
                dataKey="netOut"
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
          loading={latencyLoading}
          isDark={isDark}
        />
        <LatencyBlock title="ICMP Ping 延迟" rows={pingData} type="ping" loading={latencyLoading} isDark={isDark} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Section title="系统信息">
            <div className="space-y-1.5 pt-1">
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
            <div className="space-y-1.5 pt-1">
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
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className={cn(
      "p-5.5 rounded-2xl",
      "bg-white/55 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150",
      "border border-white/70 dark:border-white/10",
      "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]",
    )}>
      <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-4 px-0.5">{title}</div>
      {children}
    </Card>
  )
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  if (v == null || v === '') return null
  return (
    <div className="flex justify-between items-center gap-3 text-sm py-1 px-1 rounded hover:bg-white/40 dark:hover:bg-white/5">
      <span className="text-slate-600 dark:text-slate-400">{k}</span>
      <span className="font-mono text-right text-slate-800 dark:text-slate-100 font-medium truncate">{v}</span>
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
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r={r}
            fill="none" strokeWidth={9}
            className="stroke-slate-200/60 dark:stroke-slate-800/80 backdrop-blur-sm"
          />
          {hasValue && (
            <circle
              cx="50" cy="50" r={r}
              fill="none" strokeWidth={9}
              className={cn(strokeColor(value), "drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]")}
              strokeDasharray={c}
              strokeDashoffset={c - (c * v) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
          {pct(value)}
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{label}</div>
      {sub && (
        <div className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate max-w-full opacity-90" title={sub}>
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
  const tooltipStyle = isDark ? DARK_TOOLTIP_STYLE : TOOLTIP_STYLE;

  return (
    <div className={cn(
      "rounded-2xl p-4 transition-all",
      "bg-white/40 dark:bg-slate-900/35 border border-white/70 dark:border-white/5",
      "shadow-inner-[0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none",
      "shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
    )}>
      <div className="flex justify-between items-baseline mb-2 px-0.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{format(last)}</span>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={isDark ? 0.25 : 0.4} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={domain ?? ['auto', 'auto']} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={t => new Date(t).toLocaleTimeString()}
              formatter={(v: number) => [format(v), label]}
              cursor={{ stroke: stroke, strokeWidth: 1, strokeDasharray: '3 3' }}
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
}

const ms = (v: number) => `${v.toFixed(1)} ms`

function LatencyBlock({ title, rows, type, loading, isDark }: LatencyBlockProps) {
  const { data, series } = useMemo(() => buildLatencyChart(rows, type), [rows, type])
  const stats = useMemo(() => computeLatencyStats(rows, type), [rows, type])
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const empty = data.length === 0
  const tooltipStyle = isDark ? DARK_TOOLTIP_STYLE : TOOLTIP_STYLE;

  const visibleSeries = series.filter(s => !hidden.has(s.name))

  const toggle = (name: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <Section title={`${title} · 近 1 小时趋势`}>
      <div className="relative h-60 bg-white/20 dark:bg-slate-950/20 rounded-xl border border-white/60 dark:border-white/5 p-2 shadow-inner mb-4">
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
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
                tickFormatter={t => new Date(t).toLocaleTimeString()}
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
                labelFormatter={t => new Date(Number(t)).toLocaleTimeString()}
                formatter={(v: number) => ms(Number(v))}
                cursor={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
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
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        {!empty && loading && (
          <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="数据同步中" />
        )}
      </div>

      {stats.length > 0 && (
        <div className="mt-3 border-t border-slate-200/60 dark:border-white/10 pt-3.5 space-y-1">
          <div className="flex items-center px-2.5 pb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
        'flex items-center px-2.5 py-1.5 rounded-xl text-xs cursor-pointer select-none transition-all duration-200 active:scale-[0.98]',
        'hover:bg-white/40 dark:hover:bg-white/5',
        hidden ? 'opacity-35grayscale' : 'opacity-100',
      )}
    >
      <span className="flex items-center gap-2.5 flex-1 min-w-0 text-slate-700 dark:text-slate-200">
        <span
          className="inline-block w-3.5 h-1 rounded-full shrink-0 shadow-sm"
          style={{ background: color, border: hidden ? '1px solid rgba(255,255,255,0.2)' : 'none' }}
        />
        <span className="truncate font-medium">{name}</span>
      </span>
      <span className="w-20 text-right tabular-nums font-mono text-slate-800 dark:text-slate-100 font-semibold">
        {avg != null ? ms(avg) : '—'}
      </span>
      <span className="w-16 text-right tabular-nums font-mono text-slate-500 dark:text-slate-400">
        {jitter != null ? ms(jitter) : '—'}
      </span>
      <span
        className={cn(
          'w-14 text-right tabular-nums font-mono',
          lossRate >= 5 ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400',
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
        "bg-white/45 dark:bg-white/5 backdrop-blur-sm border-white/70 dark:border-white/10",
        "text-slate-700 dark:text-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] uppercase tracking-wide",
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
        ? 'bg-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
        : days <= 30
          ? 'bg-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]'
          : 'bg-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]'

  return (
    <Section title="账单与费用">
      <div className="space-y-1.5 pt-1">
        <KV k="续费月费" v={meta.price > 0 ? `${unit}${meta.price} / ${meta.priceCycle} 天` : null} />
        <KV k="到期时间" v={meta.expireTime || null} />
        <KV k="剩余天数" v={<span className={cn(daysClass, "font-bold")}>{daysLabel}</span>} />
        <KV k="剩余价值 (估)" v={meta.price > 0 ? `${unit}${value.toFixed(2)}` : null} />

        {meta.expireTime && days != null && (
          <div className="mt-4 px-1.5">
            <div className="h-2 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-inner">
              <div
                className={cn('h-full rounded-full transition-all duration-1000 ease-out', barColor)}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-center text-slate-400 dark:text-slate-500 mt-1.5 opacity-80">
              周期已使用 {progress.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
