import { useEffect, useRef, useState, useId } from 'react'
import { parseGitRepo } from '../utils/git'
import { FolderSync } from 'lucide-react'
import { cn } from '../utils/cn'

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
 * 液态透镜胶囊链接项
 * ========================================================= */
interface LiquidCapsuleLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  title?: string
  style?: React.CSSProperties
}

function LiquidCapsuleLink({
  href,
  children,
  className = '',
  title,
  style = {},
}: LiquidCapsuleLinkProps) {
  const containerRef = useRef<HTMLAnchorElement>(null)
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

  const glassStyle: React.CSSProperties = {
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
  }

  return (
    <a
      ref={containerRef}
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={cn(
        'relative inline-flex items-center rounded-full border border-white/20 dark:border-white/10 bg-white/[0.03] dark:bg-black/[0.10] text-slate-700 dark:text-slate-300 transition-all duration-200 active:scale-95 overflow-hidden',
        className,
      )}
      style={glassStyle}
    >
      {filterElement}
      <span className="relative z-10 flex items-center justify-center w-full h-full">
        {children}
      </span>
    </a>
  )
}

/* =========================================================
 * Footer 组件
 * ========================================================= */
export function Footer({
  text,
  repo,
  dist_page,
}: {
  text?: string
  repo?: string
  dist_page?: string
}) {
  const [latest, setLatest] = useState<string | null>(null)

  const git = parseGitRepo(repo)
  const PKG_URL = `https://raw.githubusercontent.com/${git.user}/${git.repo}/main/package.json`

  useEffect(() => {
    fetch(PKG_URL)
      .then(r => (r.ok ? r.json() : null))
      .then(j => j?.version && setLatest(String(j.version)))
      .catch(() => {})
  }, [])

  const outdated = latest != null && latest !== __APP_VERSION__
  const laststDist = dist_page
    ? `${dist_page}/NodeGet-StatusShow.zip?version=v${latest}`
    : `${repo}/releases`

  return (
    <footer className="relative z-10 w-full max-w-7xl mx-auto pt-2 pb-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        <LiquidCapsuleLink
          href="https://nezha.wiki/"
          className="px-4 py-2 font-medium hover:text-blue-600 dark:hover:text-blue-400"
        >
          {text || 'Powered by Nezha'}
        </LiquidCapsuleLink>

        {outdated && (
          <LiquidCapsuleLink
            href={laststDist}
            className="px-3.5 py-1.5 text-red-600 dark:text-red-400 bg-red-100/30 dark:bg-red-950/30 border-red-200/40 dark:border-red-800/40 hover:bg-red-200/40 dark:hover:bg-red-900/50"
            title="检测到新版本，请及时升级以获得最佳体验和安全性"
          >
            <FolderSync className="inline-block w-3.5 mr-1.5 opacity-80" />
            升级到 v{latest}
          </LiquidCapsuleLink>
        )}
      </div>
    </footer>
  )
}
