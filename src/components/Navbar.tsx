import { useEffect, useRef, useState, useId } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { ViewToggle } from './ViewToggle'
import { ThemeToggle } from './ThemeToggle'
import { SortMenu } from './SortMenu'
import { Button } from './ui/button'
import type { Sort, View } from '../types'

interface Props {
  siteName: string
  logo?: string
  query: string
  onQuery: (v: string) => void
  view: View
  onView: (v: View) => void
  sort: Sort
  onSort: (v: Sort) => void
  hidden?: boolean
}

// 核心：解决所有漂移、裁切与上下不对称的纯数学法线贴图生成器
function generateCapsuleNormalMap(width: number, height: number, radius: number) {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')
  if (!ctx) return ''

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  const halfW = width / 2
  const halfH = height / 2
  
  // 严格胶囊几何体平直区间
  const bX = Math.max(halfW - radius, 0)
  const bY = Math.max(halfH - radius, 0)
  
  // 锁定发丝透镜环宽度（固定为 8px~10px，杜绝上下力场重叠）
  const ringWidth = Math.min(10, height * 0.22)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 严格亚像素中心对齐 (0.5 像素栅格)
      const px = (x + 0.5) - halfW
      const py = (y + 0.5) - halfH

      // 1. 精确 SDF 胶囊圆角矩形距离
      const qx = Math.abs(px) - bX
      const qy = Math.abs(py) - bY
      const maxQx = Math.max(qx, 0)
      const maxQy = Math.max(qy, 0)
      const outsideDist = Math.sqrt(maxQx * maxQx + maxQy * maxQy)
      const insideDist = Math.min(Math.max(qx, qy), 0)
      const d = outsideDist + insideDist - radius

      let offsetX = 0
      let offsetY = 0

      // 仅在胶囊内部处理
      if (d <= 0.0) {
        const distToEdge = -d

        // 2. 严格几何外法线 (Normal)
        let nx = 0
        let ny = 0
        const len = Math.sqrt(maxQx * maxQx + maxQy * maxQy)
        if (len > 0.0001) {
          nx = (maxQx / len) * Math.sign(px)
          ny = (maxQy / len) * Math.sign(py)
        } else {
          nx = Math.abs(px) > Math.abs(py) ? Math.sign(px) : 0
          ny = Math.abs(py) >= Math.abs(px) ? Math.sign(py) : 0
        }

        // 3. 边缘发丝透镜折射：
        // 关键改动：将折射力向量改为向内聚光（Converging），上下边缘向内吸入，防止超出边界被 Clip
        if (distToEdge <= ringWidth) {
          const t = distToEdge / ringWidth
          // 采用平滑钟形脉冲曲线 (0 -> 1 -> 0)
          const pulse = Math.sin(t * Math.PI)
          
          offsetX = nx * pulse * 0.75
          offsetY = ny * pulse * 0.75
        }

        // 4. 全局平缓微凹透镜 (仅提供极轻微的中心向外推力，不破坏上下平衡)
        const rx = px / halfW
        const ry = py / halfH
        const rNorm = Math.min(Math.sqrt(rx * rx + ry * ry), 1.0)
        const concaveWeight = (1.0 - rNorm) * 0.08

        offsetX += rx * concaveWeight
        offsetY += ry * concaveWeight

        // 5. 最外缘发丝羽化（确保贴合边缘时 100% 归零）
        const edgeFade = Math.min(distToEdge / 1.5, 1.0)
        offsetX *= edgeFade
        offsetY *= edgeFade
      }

      // 严格量化 (采用精确舍入，彻底消除 128/255 偏移 Bug)
      const rVal = Math.min(Math.max(Math.round(128 + offsetX * 127), 0), 255)
      const gVal = Math.min(Math.max(Math.round(128 + offsetY * 127), 0), 255)

      const idx = (y * width + x) * 4
      data[idx] = rVal
      data[idx + 1] = gVal
      data[idx + 2] = 128
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return offscreen.toDataURL()
}

// 零侵入液态透镜胶囊容器组件
function LiquidCapsuleItem({
  children,
  className = '',
  style = {},
  onClick,
  href,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  href?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const filterId = 'liquid-lens-' + rawId.replace(/[^a-zA-Z0-9-_]/g, '')
  const [mapUrl, setMapUrl] = useState<string>('')
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateMap = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w === 0 || h === 0) return

      setSize({ w, h })
      const radius = h / 2
      const url = generateCapsuleNormalMap(w, h, radius)
      setMapUrl(url)
    }

    updateMap()
    window.addEventListener('resize', updateMap)
    return () => window.removeEventListener('resize', updateMap)
  }, [])

  const commonProps = {
    ref: containerRef,
    className: `relative border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.1] transition-shadow duration-300 ${className}`,
    style: {
      backdropFilter: mapUrl ? `url(#${filterId}) blur(0.8px)` : 'blur(8px)',
      WebkitBackdropFilter: mapUrl ? `url(#${filterId}) blur(0.8px)` : 'blur(8px)',
      boxShadow: `
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 0 8px 0 rgba(255, 255, 255, 0.04),
        0 8px 24px -4px rgba(0, 0, 0, 0.06)
      `,
      ...style,
    },
    onClick,
  }

  const content = (
    <>
      {size.w > 0 && (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="fixed w-0 h-0 pointer-events-none opacity-0 -z-50"
        >
          <defs>
            <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
              {mapUrl && (
                <feImage
                  href={mapUrl}
                  x="0"
                  y="0"
                  width={size.w}
                  height={size.h}
                  preserveAspectRatio="none"
                  result="lensMap"
                />
              )}
              {/* scale 设为 20，兼顾透镜拉伸感与中心稳定性 */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="lensMap"
                scale={20}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </>
  )

  if (href) {
    return (
      <a href={href} {...(commonProps as any)}>
        {content}
      </a>
    )
  }

  return <div {...commonProps}>{content}</div>
}

export function Navbar({ siteName, logo, query, onQuery, view, onView, sort, onSort, hidden }: Props) {
  return (
    <>
      {/* 顶部悬浮操作区 */}
      <header className="fixed top-0 inset-x-0 z-30 w-full px-5 sm:px-7 pt-3.5 pb-2 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* 左侧：Logo 胶囊 + 自适应搜索胶囊 */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* 1. Logo 胶囊 */}
            <LiquidCapsuleItem
              href="./"
              className="pointer-events-auto h-12 px-4 sm:px-5 rounded-full flex items-center gap-3 shrink-0 hover:opacity-95 active:scale-95 transition-all duration-200"
            >
              {logo ? (
                <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain drop-shadow-sm shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/40 flex items-center justify-center font-bold text-sm shrink-0">
                  {siteName.slice(0, 1)}
                </div>
              )}
              <span className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight truncate">
                {siteName}
              </span>
            </LiquidCapsuleItem>

            {/* 2. 搜索框胶囊 */}
            <LiquidCapsuleItem className="pointer-events-auto flex-1 min-w-[72px] max-w-[220px] sm:max-w-xs h-12 px-3 rounded-full flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <input
                type="text"
                name="site-search"
                id="site-search"
                value={query}
                onChange={e => onQuery(e.target.value)}
                placeholder="搜索..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none outline-none min-w-0"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-full text-slate-500 hover:bg-white/40 active:scale-95"
                  onClick={() => onQuery('')}
                  aria-label="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </LiquidCapsuleItem>
          </div>

          {/* 3. 右上角：独立排序悬浮球 */}
          <div className="pointer-events-auto shrink-0">
            <LiquidCapsuleItem className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all duration-200">
              <SortMenu value={sort} onChange={onSort} />
            </LiquidCapsuleItem>
          </div>
        </div>
      </header>

      {/* 底部悬浮 Dock 栏 */}
      {!hidden && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center items-center gap-4 px-4 pointer-events-none animate-in fade-in duration-200">
          <div className="pointer-events-auto">
            <LiquidCapsuleItem className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all">
              <ThemeToggle />
            </LiquidCapsuleItem>
          </div>

          <div className="pointer-events-auto">
            <LiquidCapsuleItem className="h-14 px-2 rounded-full flex items-center">
              <ViewToggle value={view} onChange={onView} />
            </LiquidCapsuleItem>
          </div>
        </div>
      )}
    </>
  )
}
