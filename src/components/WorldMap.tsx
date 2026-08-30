import { useEffect, useMemo, useRef, useState, useId } from 'react'
import * as echarts from 'echarts'
import { ChevronRight, Globe } from 'lucide-react'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, pct } from '../utils/format'
import { deriveUsage, displayName, distroLogo } from '../utils/derive'
import type { Node } from '../types'

const MAP_W = 800
const MAP_H = 500
const GEO_URL = `${import.meta.env.BASE_URL}world.geo.json`

const cnameMap = new Map<string, string>()
const knownA2 = new Set<string>()
let mapPromise: Promise<void> | null = null

const REGION_COORDS: Record<string, [number, number]> = {
  US: [-98.5795, 38.8283],
  HK: [114.1694, 22.3193],
  JP: [139.6917, 35.6895],
  TW: [121.5654, 25.033],
  SG: [103.8198, 1.3521],
  CN: [104.1954, 35.8617],
  DE: [10.4515, 51.1657],
  NL: [5.2913, 52.1326],
  GB: [-3.436, 55.3781],
  FR: [2.2137, 46.2276],
  CA: [-106.3468, 56.1304],
  AU: [133.7751, -25.2744],
  KR: [127.7669, 35.9078],
}

interface CountryEntry {
  a2: string
  cname: string
  online: number
  offline: number
  nodes: Node[]
}

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
 * 地图加载服务
 * ========================================================= */
function ensureMap() {
  if (!mapPromise) {
    mapPromise = fetch(GEO_URL)
      .then(r => r.json())
      .then(geo => {
        for (const f of geo.features ?? []) {
          const a2 = f.properties?.name
          if (!a2) continue
          knownA2.add(a2)
          if (f.properties?.cname) cnameMap.set(a2, f.properties.cname)
        }
        echarts.registerMap('world', geo)
      })
      .catch(err => {
        mapPromise = null
        throw err
      })
  }
  return mapPromise
}

export function WorldMap({ nodes, onOpen }: Props) {
  const [ready, setReady] = useState(false)
  const [selectedA2, setSelectedA2] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  const rawId = useId()
  const filterId = `liquid-lens-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`
  const [mapUrl, setMapUrl] = useState('')

  // 尺寸监听与 Normal Map 更新
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

  useEffect(() => {
    let cancelled = false
    ensureMap().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { byCountry, totalOnline, totalNodes } = useMemo(() => {
    const map = new Map<string, CountryEntry>()
    let totalOnline = 0
    let totalNodes = 0

    for (const n of nodes) {
      const a2 = n.meta?.region?.trim().toUpperCase()
      if (!a2 || !/^[A-Z]{2}$/.test(a2)) continue
      totalNodes++
      if (n.online) totalOnline++

      const cname = cnameMap.get(a2) || a2
      const e = map.get(a2) || { a2, cname, online: 0, offline: 0, nodes: [] }
      if (n.online) e.online++
      else e.offline++
      e.nodes.push(n)
      map.set(a2, e)
    }

    return { byCountry: map, totalOnline, totalNodes }
  }, [nodes])

  const activeEntry = useMemo(() => {
    if (selectedA2 && byCountry.has(selectedA2)) {
      return byCountry.get(selectedA2)!
    }
    return {
      a2: 'ALL',
      cname: '全部区域',
      online: totalOnline,
      offline: totalNodes - totalOnline,
      nodes: nodes.filter(n => {
        const a2 = n.meta?.region?.trim().toUpperCase()
        return a2 && /^[A-Z]{2}$/.test(a2)
      }),
    }
  }, [selectedA2, byCountry, totalOnline, totalNodes, nodes])

  const liveRef = useRef({ byCountry, onOpen, setSelectedA2 })
  useEffect(() => {
    liveRef.current = { byCountry, onOpen, setSelectedA2 }
  })

  const option = useMemo(() => {
    const activeA2List = Array.from(byCountry.keys())

    const scatterData = activeA2List
      .map(a2 => {
        const coord = REGION_COORDS[a2]
        const e = byCountry.get(a2)
        if (!coord || !e) return null
        const isSelected = a2 === selectedA2

        return {
          name: a2,
          value: [...coord, e.online + e.offline],
          itemStyle: {
            color: isSelected ? '#2563eb' : '#3b82f6',
            borderColor: '#ffffff',
            borderWidth: isSelected ? 2.5 : 1.5,
            shadowBlur: isSelected ? 16 : 8,
            shadowColor: isSelected ? 'rgba(37,99,235,0.6)' : 'rgba(59,130,246,0.35)',
          },
          label: {
            show: false,
          },
        }
      })
      .filter(Boolean)

    return {
      backgroundColor: 'transparent',
      geo: {
        map: 'world',
        roam: false,
        zoom: 1.35,
        layoutCenter: ['48%', '50%'],
        layoutSize: '105%',
        silent: false,
        itemStyle: {
          areaColor: 'rgba(59, 130, 246, 0.12)',
          borderColor: 'rgba(96, 165, 250, 0.4)',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(59, 130, 246, 0.28)',
            borderColor: '#60a5fa',
          },
          label: { show: false },
        },
        regions: activeA2List.map(a2 => ({
          name: a2,
          itemStyle: {
            areaColor: a2 === selectedA2 ? 'rgba(37, 99, 235, 0.35)' : 'rgba(59, 130, 246, 0.22)',
            borderColor: a2 === selectedA2 ? '#2563eb' : '#60a5fa',
            borderWidth: a2 === selectedA2 ? 1.5 : 1,
          },
        })),
      },
      series: [
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 2,
          rippleEffect: {
            brushType: 'stroke',
            scale: 3.2,
            period: 4,
          },
          symbolSize: 10,
          data: scatterData,
        },
      ],
    }
  }, [byCountry, selectedA2])

  useEffect(() => {
    if (!ready || !wrapRef.current) return
    if (!chartRef.current) {
      chartRef.current = echarts.init(wrapRef.current)

      chartRef.current.on('click', (p: any) => {
        const cur = liveRef.current
        const a2 = p.name || p.data?.name
        if (a2 && cur.byCountry.has(a2)) {
          cur.setSelectedA2(a2)
        }
      })

      chartRef.current.getZr().on('click', (event: any) => {
        if (!event.target) {
          liveRef.current.setSelectedA2(null)
        }
      })
    }
    chartRef.current.setOption(option, true)
  }, [ready, option])

  useEffect(() => {
    if (!ready || !chartRef.current) return
    const ro = new ResizeObserver(() => chartRef.current?.resize())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [ready])

  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative p-4 sm:p-6 rounded-3xl border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.10] shadow-sm select-none transition-shadow duration-300"
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

      <div className="relative z-10 w-full flex flex-col gap-4">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300">
            全球节点地理分布
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalOnline} / {totalNodes} 节点在线</span>
          </div>
        </div>

        {/* 地图视口 */}
        <div
          className="relative w-full rounded-2xl border border-white/20 dark:border-white/10 bg-black/[0.02] dark:bg-slate-950/20 overflow-hidden"
          style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
        >
          <div ref={wrapRef} className="absolute inset-0" />
        </div>

        {/* 下方联动区域抽屉 */}
        <div className="rounded-2xl p-3.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.03] border border-white/20 dark:border-white/10 space-y-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              {activeEntry.a2 === 'ALL' ? (
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <Flag code={activeEntry.a2} className="shrink-0 drop-shadow-sm" />
              )}
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {activeEntry.cname}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({activeEntry.online} 在线{activeEntry.offline > 0 ? ` · ${activeEntry.offline} 离线` : ''})
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {activeEntry.a2}
            </div>
          </div>

          {/* 节点明细列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto overscroll-contain pr-0.5">
            {activeEntry.nodes.map(n => {
              const u = deriveUsage(n)
              const logo = distroLogo(n)
              const nodeRegion = n.meta?.region?.trim().toUpperCase()
              return (
                <div
                  key={n.uuid}
                  onClick={() => onOpen?.(n.uuid)}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 shadow-xs cursor-pointer transition-all duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusDot online={n.online} />
                    {nodeRegion && <Flag code={nodeRegion} className="w-3.5 shrink-0 drop-shadow-xs" />}
                    {logo && (
                      <img
                        src={logo}
                        alt=""
                        className="w-4 h-4 shrink-0 object-contain drop-shadow-sm"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {displayName(n)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        CPU {pct(u.cpu)} · 内存 {pct(u.mem)} · 磁盘 {pct(u.disk)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-right">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        ↑ {bytes(u.netOut || 0)}/s
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        ↓ {bytes(u.netIn || 0)}/s
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
