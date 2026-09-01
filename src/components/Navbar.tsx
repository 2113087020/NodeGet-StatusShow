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
 * 液态透镜胶囊组件（带无白雾通透模糊）
 * ========================================================= */
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
  const containerRef = useRef<HTMLDivElement | HTMLAnchorElement>(null)
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

        const radius = Math.min(width, height) / 2
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
          {/* 注入高斯模糊底图，保证磨砂通透感 */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blurredBg" />
          {mapUrl && <feImage href={mapUrl} preserveAspectRatio="none" result="lensMap" />}
          {mapUrl && (
            <feDisplacementMap
              in="blurredBg"
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

  const glassStyle: React.CSSProperties = {
    backdropFilter: mapUrl ? `url(#${filterId})` : 'blur(10px)',
    WebkitBackdropFilter: mapUrl ? `url(#${filterId})` : 'blur(10px)',
    boxShadow: `
      inset 0 1px 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 0 8px 0 rgba(255, 255, 255, 0.04),
      0 8px 24px -4px rgba(0, 0, 0, 0.06)
    `,
    isolation: 'isolate',
    transform: 'translate3d(0, 0, 0)',
    WebkitTransform: 'translate3d(0, 0, 0)',
    ...style,
  }

  const commonClass = `relative border border-white/20 dark:border-white/10 bg-slate-900/[0.02] dark:bg-black/[0.18] transition-all duration-300 overflow-hidden ${className}`

  const content = (
    <>
      {filterElement}
      <span className="relative z-10 flex items-center h-full w-full">{children}</span>
    </>
  )

  if (href) {
    return (
      <a
        ref={containerRef as React.Ref<HTMLAnchorElement>}
        href={href}
        className={commonClass}
        style={glassStyle}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <div
      ref={containerRef as React.Ref<HTMLDivElement>}
      className={commonClass}
      style={glassStyle}
      onClick={onClick}
    >
      {content}
    </div>
  )
}

/* =========================================================
 * 导航栏组件
 * ========================================================= */
export function Navbar({
  siteName,
  logo,
  query,
  onQuery,
  view,
  onView,
  sort,
  onSort,
  hidden,
}: Props) {
  return (
    <>
      {/* 顶部固定栏 */}
      <header
        className="fixed top-0 inset-x-0 z-30 w-full px-5 sm:px-7 pt-3.5 pb-2 pointer-events-none"
        style={{
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* 左侧：Logo 胶囊 + 搜索胶囊 */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <LiquidCapsuleItem
              href="./"
              className="pointer-events-auto h-12 px-4 sm:px-5 rounded-full flex items-center gap-3 shrink-0 overflow-hidden hover:opacity-95 active:scale-95 transition-all duration-200"
            >
              {logo ? (
                <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain drop-shadow-sm shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/40 flex items-center justify-center font-bold text-sm shrink-0">
                  {siteName.slice(0, 1)}
                </div>
              )}
              <span className="font-semibold text-base text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {siteName}
              </span>
            </LiquidCapsuleItem>

            <LiquidCapsuleItem className="pointer-events-auto flex-1 min-w-[72px] max-w-[220px] sm:max-w-xs h-12 px-3 rounded-full flex items-center gap-2 overflow-hidden">
              <SearchIcon className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
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
                spellCheck={false}
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border-none outline-none min-w-0"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-full text-slate-600 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
                  onClick={() => onQuery('')}
                  aria-label="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </LiquidCapsuleItem>
          </div>

          {/* 右侧：排序按钮 */}
          <div className="pointer-events-auto shrink-0 w-12 h-12">
            <LiquidCapsuleItem className="w-12 h-12 p-0 rounded-full flex items-center justify-center active:scale-95 transition-all duration-200">
              <SortMenu value={sort} onChange={onSort} />
            </LiquidCapsuleItem>
          </div>
        </div>
      </header>

      {/* 底部悬浮 Dock 栏 */}
      {!hidden && (
        <div
          className="fixed bottom-6 inset-x-0 z-30 flex justify-center items-center gap-4 px-4 pointer-events-none animate-in fade-in duration-200"
          style={{
            transform: 'translate3d(0, 0, 0)',
            WebkitTransform: 'translate3d(0, 0, 0)',
          }}
        >
          <div className="pointer-events-auto w-14 h-14 shrink-0">
            <LiquidCapsuleItem className="w-14 h-14 p-0 rounded-full flex items-center justify-center active:scale-95 transition-all">
              <ThemeToggle />
            </LiquidCapsuleItem>
          </div>

          <div className="pointer-events-auto h-14 shrink-0">
            <LiquidCapsuleItem className="h-14 px-2 rounded-full flex items-center overflow-hidden active:scale-95 transition-all">
              <ViewToggle value={view} onChange={onView} />
            </LiquidCapsuleItem>
          </div>
        </div>
      )}
    </>
  )
}
