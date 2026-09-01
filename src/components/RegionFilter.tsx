import { useEffect, useRef, useState, useId } from 'react'
import { Flag } from './Flag'
import { cn } from '../utils/cn'

interface Props {
  regions: { code: string; count: number }[]
  total: number
  active: string | null
  onChange: (code: string | null) => void
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
 * 地区筛选条组件
 * ========================================================= */
export function RegionFilter({ regions, total, active, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

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

        const radius = height / 2
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

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      setShowIndicator(false)
    }, 800)
  }

  const triggerIndicator = () => {
    setShowIndicator(true)
    scheduleHide()
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)))
      setCanScroll(true)
      triggerIndicator()
    } else {
      setCanScroll(false)
    }
  }

  const handleClick = (code: string | null) => {
    onChange(code)
    triggerIndicator()
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScroll(el.scrollWidth > el.clientWidth)

    const onResize = () => {
      if (el) setCanScroll(el.scrollWidth > el.clientWidth)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [regions])

  if (regions.length === 0) return null

  return (
    <div
      ref={containerRef}
      onTouchStart={triggerIndicator}
      onTouchEnd={scheduleHide}
      className="relative w-full rounded-full border border-white/20 dark:border-white/10 bg-slate-900/[0.02] dark:bg-black/[0.18] shadow-sm select-none transition-all duration-300 overflow-hidden"
      style={{
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
            {/* 注入高斯模糊，获得通透磨砂底感 */}
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

      <div className="relative z-10 w-full overflow-hidden rounded-full">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full overflow-x-auto flex items-center px-1.5 py-1.5 divide-x divide-black/10 dark:divide-white/10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* 全部 选项 */}
          <div className="flex items-center px-1 shrink-0">
            <Segment selected={active === null} onClick={() => handleClick(null)}>
              <span className="font-semibold">全部</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors',
                  active === null
                    ? 'bg-black/15 dark:bg-white/20 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium',
                )}
              >
                {total}
              </span>
            </Segment>
          </div>

          {/* 各国家/地区选项 */}
          {regions.map(r => (
            <div key={r.code} className="flex items-center px-1 shrink-0">
              <Segment
                selected={active === r.code}
                onClick={() => handleClick(r.code)}
              >
                <Flag code={r.code} className="w-3.5 h-2.5 drop-shadow-sm shrink-0" />
                <span className="font-semibold tracking-wide text-xs">{r.code}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors',
                    active === r.code
                      ? 'bg-black/15 dark:bg-white/20 text-slate-900 dark:text-slate-100 font-semibold'
                      : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium',
                  )}
                >
                  {r.count}
                </span>
              </Segment>
            </div>
          ))}
        </div>

        {/* 底部滑动指示条 */}
        {canScroll && (
          <div
            ref={trackRef}
            className={cn(
              'absolute bottom-1 left-5 right-5 h-[3px] pointer-events-none transition-opacity duration-300',
              showIndicator ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div
              className="h-full w-[28%] bg-black/25 dark:bg-white/25 rounded-full"
              style={{
                transform: `translateX(${scrollProgress * 257}%)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Segment({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap active:scale-95 shrink-0',
        selected
          ? 'bg-black/10 dark:bg-white/15 text-slate-900 dark:text-slate-100 font-semibold shadow-inner'
          : 'text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 font-medium',
      )}
    >
      {children}
    </button>
  )
}
