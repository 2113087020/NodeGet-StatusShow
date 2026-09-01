import { useEffect, useRef, useState, useId } from 'react'
import { ArrowDown, ArrowUp, Clock, type LucideIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge, uptime } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cn, loadColor } from '../utils/cn'
import type { Node } from '../types'
import type { ReactNode } from 'react'

/* =========================================================
 * Liquid Glass Normal Map 生成器
 * ========================================================= */
const normalMapCache = new Map<string, string>()

function generateCapsuleNormalMap(width: number, height: number, radius: number) {
  if (typeof document === 'undefined') return ''

  const maxTextureSize = 256
  const ratio = Math.min(1, maxTextureSize / Math.max(width, height))
  const canvasWidth = Math.max(32, Math.round(width * ratio))
  const canvasHeight = Math.max(32, Math.round(height * ratio))
  const canvasRadius = Math.min(radius * ratio, canvasWidth / 2, canvasHeight / 2)

  const cacheKey = `${canvasWidth}:${canvasHeight}:${Math.round(canvasRadius)}`
  const cached = normalMapCache.get(cacheKey)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(canvasWidth, canvasHeight)
  const data = imageData.data

  const halfW = canvasWidth / 2
  const halfH = canvasHeight / 2
  const bX = Math.max(halfW - canvasRadius, 0)
  const bY = Math.max(halfH - canvasRadius, 0)
  const bevelWidth = canvasRadius * 0.75

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const px = x - halfW
      const py = y - halfH

      const qx = Math.abs(px) - bX
      const qy = Math.abs(py) - bY
      const maxQx = Math.max(qx, 0)
      const maxQy = Math.max(qy, 0)
      const outsideDist = Math.sqrt(maxQx * maxQx + maxQy * maxQy)
      const insideDist = Math.min(Math.max(qx, qy), 0)
      const d = outsideDist + insideDist - canvasRadius

      let offsetX = 0
      let offsetY = 0

      if (d <= 0) {
        const distToEdge = -d
        const factor = Math.min(Math.max(1 - distToEdge / Math.max(bevelWidth, 0.001), 0), 1)
        const curve = Math.pow(factor, 1.8)

        const concaveX = (px / halfW) * 0.22 * (1 - factor * 0.8)
        const concaveY = (py / halfH) * 0.22 * (1 - factor * 0.8)

        const len = Math.sqrt(maxQx * maxQx + maxQy * maxQy)
        let nx = 0
        let ny = 0

        if (len > 0.001) {
          nx = (maxQx / len) * Math.sign(px)
          ny = (maxQy / len) * Math.sign(py)
        } else {
          nx = Math.abs(px) > Math.abs(py) ? Math.sign(px) : 0
          ny = Math.abs(py) >= Math.abs(px) ? Math.sign(py) : 0
        }

        const yPullScale = py > 0 ? 0.65 : 0.85
        const pullX = -nx * (0.85 * curve)
        const pullY = -ny * (yPullScale * curve)
        const edgeFade = Math.min(Math.max(distToEdge / 2, 0), 1)

        offsetX = (concaveX + pullX) * edgeFade
        offsetY = (concaveY + pullY) * edgeFade
      }

      const rVal = Math.min(Math.max(Math.round(128 + offsetX * 127), 0), 255)
      const gVal = Math.min(Math.max(Math.round(128 + offsetY * 127), 0), 255)

      const index = (y * canvasWidth + x) * 4
      data[index] = rVal
      data[index + 1] = gVal
      data[index + 2] = 128
      data[index + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const url = canvas.toDataURL('image/png')
  normalMapCache.set(cacheKey, url)
  return url
}

/* =========================================================
 * 液态透镜卡片外壳
 * ========================================================= */
function LiquidCardItem({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const filterId = `liquid-lens-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`
  const [mapUrl, setMapUrl] = useState('')

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let frameId = 0
    let lastWidth = 0
    let lastHeight = 0

    const updateMap = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect()
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)

        if (width <= 0 || height <= 0) return
        if (width === lastWidth && height === lastHeight) return

        lastWidth = width
        lastHeight = height

        const radius = 24
        const url = generateCapsuleNormalMap(width, height, radius)
        setMapUrl(url)
      })
    }

    updateMap()
    const resizeObserver = new ResizeObserver(updateMap)
    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [])

  const filterElement = (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="fixed pointer-events-none"
      style={{
        position: 'fixed',
        width: 0,
        height: 0,
        overflow: 'hidden',
        opacity: 0,
      }}
    >
      <defs>
        <filter
          id={filterId}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          {mapUrl && <feImage href={mapUrl} preserveAspectRatio="none" result="lensMap" />}
          {mapUrl && (
            <feDisplacementMap
              in="SourceGraphic"
              in2="lensMap"
              scale={26}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          )}
        </filter>
      </defs>
    </svg>
  )

  return (
    <div
      ref={containerRef}
      className={`relative border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.10] transition-shadow duration-300 ${className}`}
      style={{
        backdropFilter: mapUrl ? `url(#${filterId}) blur(1px)` : 'blur(8px)',
        WebkitBackdropFilter: mapUrl ? `url(#${filterId}) blur(1px)` : 'blur(8px)',
        boxShadow: `
          inset 0 1px 1px 0 rgba(255, 255, 255, 0.4),
          inset 0 0 8px 0 rgba(255, 255, 255, 0.04),
          0 8px 24px -4px rgba(0, 0, 0, 0.06)
        `,
        isolation: 'isolate',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        ...style,
      }}
    >
      {filterElement}
      <div className="relative z-10 w-full h-full flex flex-col gap-4">{children}</div>
    </div>
  )
}

/* =========================================================
 * 节点卡片组件
 * ========================================================= */
export function NodeCard({ node }: { node: Node }) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const logo = distroLogo(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)

  // 流量用量与配额解析
  const meta = (node.meta || {}) as Record<string, any>
  const limitGb = Number(meta.traffic_limit ?? meta.metadata_traffic_limit)
  const usedBytes = Number(meta.traffic_used ?? meta.metadata_traffic_used ?? (u.totalRx || 0) + (u.totalTx || 0))
  const resetDay = Number(meta.traffic_reset_day ?? meta.metadata_traffic_reset_day) || 1

  const hasLimit = Number.isFinite(limitGb) && limitGb > 0
  const limitBytes = hasLimit ? limitGb * 1024 * 1024 * 1024 : 0
  const trafficPct = hasLimit ? Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100)) : undefined

  let trafficSub: string | null = null
  if (hasLimit) {
    trafficSub = `${bytes(usedBytes)} / ${limitGb} GiB · 每月 ${resetDay} 号重置`
  } else {
    trafficSub = `${bytes(usedBytes)} / ∞ (无上限)`
  }

  return (
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block">
      <LiquidCardItem
        className={cn(
          'p-5 sm:p-6 rounded-3xl transition-all duration-200',
          'hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:scale-[1.01] active:scale-[0.99]',
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
          <Metric
            label="流量"
            value={trafficPct}
            overrideValueText={hasLimit ? undefined : '∞'}
            sub={trafficSub}
          />
        </div>

        <div className="pt-3 border-t border-white/20 dark:border-white/10 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-2">
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
      </LiquidCardItem>
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
  overrideValueText,
  sub,
  subTitle,
}: {
  label: string
  value: number | undefined
  overrideValueText?: string
  sub?: string | null
  subTitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">
          {overrideValueText ?? pct(value)}
        </span>
      </div>
      <Progress 
        value={value ?? 0} 
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
