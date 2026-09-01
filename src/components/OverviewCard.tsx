import { useMemo, useEffect, useRef, useState, useId } from 'react'
import { Activity, ArrowDown, ArrowUp, HardDrive, Server } from 'lucide-react'
import { bytes } from '../utils/format'
import { deriveUsage } from '../utils/derive'
import type { Node } from '../types'

interface Props {
  nodes: Node[]
}

/* =========================================================
 * Liquid Glass Normal Map 生成器（收窄边缘反射环带）
 * ========================================================= */
const normalMapCache = new Map<string, string>()

function generateCapsuleNormalMap(width: number, height: number, radius: number) {
  if (typeof document === 'undefined') return ''

  // 内部纹理限宽，优化移动端开销
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

  // 缩小倒角厚度，反射线向外扩，显著缩窄边缘反射盲区
  const bevelWidth = Math.max(canvasRadius * 0.38, 4)

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const px = x - halfW
      const py = y - halfH

      // 1. SDF 计算
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

        // 几何法线向量（由中心指向边缘）
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

        if (distToEdge < bevelWidth) {
          // ==========================================
          // 环形反射区：从外边缘到反射分界线
          // ==========================================
          const factor = distToEdge / bevelWidth
          const reflectionCurve = Math.pow(1 - factor, 1.4)
          const reflectionStrength = 1.45 * reflectionCurve

          // 向中心内部深度抓取像素，形成反射镜像
          offsetX = -nx * reflectionStrength
          offsetY = -ny * reflectionStrength
        } else {
          // ==========================================
          // 凹透镜核心区：反射线以内的中心区域
          // ==========================================
          const concaveX = (px / halfW) * 0.22
          const concaveY = (py / halfH) * 0.22

          offsetX = concaveX
          offsetY = concaveY
        }
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

        // 圆角 24px (对应 rounded-3xl)
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
              scale={32}
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
      className={`relative border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.10] transition-shadow duration-300 overflow-hidden ${className}`}
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
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
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
    <LiquidCardItem className="px-4 py-3.5 sm:px-6 sm:py-4 rounded-3xl select-none">
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

        {/* 3. 累计用量 */}
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-3 px-1 sm:px-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            <HardDrive className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>累计用量</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 font-mono text-[11px] sm:text-xs min-w-0">
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-sans">出</span>
              <span>{bytes(stats.totalTrans)}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-sans">入</span>
              <span>{bytes(stats.totalRecv)}</span>
            </div>
          </div>
        </div>

      </div>
    </LiquidCardItem>
  )
}
