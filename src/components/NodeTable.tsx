import { useEffect, useRef, useState, useId } from 'react'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct, relativeAge } from '../utils/format'
import { deriveUsage, displayName, distroLogo, virtLabel } from '../utils/derive'
import { cn } from '../utils/cn'
import type { Node } from '../types'

interface Props {
  nodes: Node[]
  onOpen?: (uuid: string) => void
}

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
 * 节点表格组件
 * ========================================================= */
export function NodeTable({ nodes, onOpen }: Props) {
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

        // 对应 rounded-3xl 的 24px 圆角
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

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.10] shadow-sm select-none transition-shadow duration-300"
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
      }}
    >
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

      <div className="relative z-10 w-full overflow-hidden rounded-3xl">
        <Table>
          <TableHeader className="bg-white/[0.04] dark:bg-white/[0.02] border-b border-white/20 dark:border-white/10">
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
                    'cursor-pointer transition-colors group border-b border-white/10 dark:border-white/5',
                    'hover:bg-black/5 dark:hover:bg-white/5',
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
      </div>
    </div>
  )
}

function CellBar({ value, hint }: { value: number | undefined; hint?: string | null }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={hint || ''}>
      <Progress 
        value={value} 
        indicatorClassName="bg-black/20 dark:bg-white/20" 
        className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden" 
      />
      <span className="font-mono text-xs w-12 text-right text-slate-900 dark:text-slate-100 font-semibold">{pct(value)}</span>
    </div>
  )
}
