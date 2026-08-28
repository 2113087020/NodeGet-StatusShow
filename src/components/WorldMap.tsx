import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { ChevronRight } from 'lucide-react'
import { Card } from './ui/card'
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

// 优化后的基准坐标
const REGION_COORDS: Record<string, [number, number]> = {
  US: [-98.5795, 38.8283],
  HK: [114.1694, 21.0],
  JP: [141.5, 38.0],
  TW: [122.8, 24.0],
  SG: [103.8198, 1.3521],
  CN: [104.1954, 35.8617],
  DE: [10.4515, 51.1657],
  NL: [5.2913, 52.1326],
  GB: [-3.436, 55.3781],
  FR: [2.2137, 46.2276],
  CA: [-106.3468, 56.1304],
  AU: [133.7751, -25.2744],
  KR: [128.5, 36.5],
}

// 针对密集区域的标签独立朝向与偏移，杜绝文字重叠
const LABEL_LAYOUT: Record<string, { position: any; offset?: [number, number] }> = {
  US: { position: 'top', offset: [0, -2] },
  DE: { position: 'top', offset: [0, -2] },
  NL: { position: 'left', offset: [-4, 0] },
  CN: { position: 'left', offset: [-6, -4] },
  JP: { position: 'right', offset: [4, 0] },
  HK: { position: 'bottom', offset: [-10, 4] },
  TW: { position: 'right', offset: [6, 4] },
  SG: { position: 'bottom', offset: [-12, 6] },
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
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureMap().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { byCountry, totalOnline, totalNodes, topRegionA2 } = useMemo(() => {
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

    let maxCount = -1
    let topA2 = 'US'
    for (const [a2, e] of map.entries()) {
      if (e.nodes.length > maxCount) {
        maxCount = e.nodes.length
        topA2 = a2
      }
    }

    return { byCountry: map, totalOnline, totalNodes, topRegionA2: topA2 }
  }, [nodes])

  useEffect(() => {
    if (!selectedA2 && topRegionA2) {
      setSelectedA2(topRegionA2)
    }
  }, [topRegionA2, selectedA2])

  const activeEntry = selectedA2 ? byCountry.get(selectedA2) ?? null : null

  const liveRef = useRef({ byCountry, onOpen, setSelectedA2 })
  useEffect(() => {
    liveRef.current = { byCountry, onOpen, setSelectedA2 }
  })

  const option = useMemo(() => {
    const activeA2List = Array.from(byCountry.keys())

    // 拓扑连线
    const linesData: any[] = []
    for (let i = 0; i < activeA2List.length; i++) {
      for (let j = i + 1; j < activeA2List.length; j++) {
        const c1 = REGION_COORDS[activeA2List[i]]
        const c2 = REGION_COORDS[activeA2List[j]]
        if (c1 && c2) {
          linesData.push({ coords: [c1, c2] })
        }
      }
    }

    // 独立错位散点信标
    const scatterData = activeA2List
      .map(a2 => {
        const coord = REGION_COORDS[a2]
        const e = byCountry.get(a2)
        if (!coord || !e) return null
        const isSelected = a2 === selectedA2
        const layout = LABEL_LAYOUT[a2] || { position: 'top', offset: [0, -2] }

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
            show: true,
            formatter: `${a2} · ${e.online + e.offline}`,
            position: layout.position,
            offset: layout.offset,
            distance: 5,
            backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isSelected ? '#93c5fd' : 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderRadius: 6,
            padding: [2, 5],
            color: isSelected ? '#ffffff' : '#1e293b',
            fontSize: 8.5,
            fontWeight: 'bold',
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
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 1,
          effect: {
            show: true,
            period: 6,
            trailLength: 0.2,
            symbol: 'circle',
            symbolSize: 3,
            color: '#93c5fd',
          },
          lineStyle: {
            color: '#60a5fa',
            width: 1,
            opacity: 0.35,
            curveness: 0.2,
            type: 'dashed',
          },
          data: linesData,
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 2,
          rippleEffect: {
            brushType: 'stroke',
            scale: 3.2,
            period: 4,
          },
          symbolSize: 9,
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
    <Card className="p-4 sm:p-6 rounded-3xl liquid-lens space-y-4">
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

      {/* 放大后的高比例地图视口 */}
      <div
        className="relative w-full rounded-2xl border border-white/60 dark:border-white/10 bg-white/20 dark:bg-slate-900/30 backdrop-blur-md overflow-hidden"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
      >
        <div ref={wrapRef} className="absolute inset-0" />
        <div className="absolute bottom-2 left-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium pointer-events-none">
          ● 点击任意区域信标联动聚焦详情
        </div>
        <div className="absolute bottom-2 right-3 font-mono text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase pointer-events-none">
          World Topology
        </div>
      </div>

      {/* 下方联动区域抽屉 */}
      {activeEntry && (
        <div className="rounded-2xl p-3.5 sm:p-4 bg-white/50 dark:bg-white/5 border border-white/70 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Flag code={activeEntry.a2} className="shrink-0 drop-shadow-sm" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {activeEntry.cname}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({activeEntry.online} 在线{activeEntry.offline > 0 ? ` · ${activeEntry.offline} 离线` : ''})
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              {activeEntry.a2}
            </div>
          </div>

          {/* 节点明细列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto overscroll-contain pr-0.5">
            {activeEntry.nodes.map(n => {
              const u = deriveUsage(n)
              const logo = distroLogo(n)
              return (
                <div
                  key={n.uuid}
                  onClick={() => onOpen?.(n.uuid)}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-white/95 dark:hover:bg-white/10 border border-white/80 dark:border-white/10 shadow-sm cursor-pointer transition-all duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusDot online={n.online} />
                    {logo && (
                      <img src={logo} alt="" className="w-4 h-4 shrink-0 object-contain drop-shadow-sm" loading="lazy" />
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
      )}
    </Card>
  )
}
