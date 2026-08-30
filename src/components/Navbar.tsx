import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
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
 * Liquid Glass Utils
 * ========================================================= */

function clamp(
  value: number,
  min = 0,
  max = 1,
) {
  return Math.min(Math.max(value, min), max)
}

function smoothstep(
  edge0: number,
  edge1: number,
  value: number,
) {
  const range = Math.max(
    edge1 - edge0,
    0.0001,
  )

  const t = clamp(
    (value - edge0) / range,
  )

  return t * t * (3 - 2 * t)
}


/* =========================================================
 * Normal Map Cache
 *
 * 避免同尺寸胶囊重复生成 Canvas。
 * ========================================================= */

const liquidMapCache =
  new Map<string, string>()


/* =========================================================
 * Generate Liquid Normal Map
 * ========================================================= */

function generateLiquidNormalMap(
  width: number,
  height: number,
  radius: number,
) {
  if (
    typeof document === 'undefined'
  ) {
    return ''
  }

  /*
   * 不需要按照真实 CSS 尺寸生成。
   *
   * 限制 Normal Map 尺寸，
   * 可以显著降低 CPU 开销。
   */
  const MAX_SIZE = 192

  const scale = Math.min(
    1,
    MAX_SIZE /
      Math.max(width, height),
  )

  const w = Math.max(
    32,
    Math.round(width * scale),
  )

  const h = Math.max(
    32,
    Math.round(height * scale),
  )

  const scaledRadius = Math.min(
    radius * scale,
    w / 2,
    h / 2,
  )

  /*
   * Cache key
   */
  const cacheKey =
    `${w}x${h}x${Math.round(
      scaledRadius,
    )}`

  const cached =
    liquidMapCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const canvas =
    document.createElement('canvas')

  canvas.width = w
  canvas.height = h

  const ctx =
    canvas.getContext('2d')

  if (!ctx) {
    return ''
  }

  const image =
    ctx.createImageData(w, h)

  const data = image.data

  const halfW = w / 2
  const halfH = h / 2

  const r = scaledRadius

  /*
   * 胶囊 / 圆角矩形内部的
   * 液态折射区域。
   */
  const bX = Math.max(
    halfW - r,
    0,
  )

  const bY = Math.max(
    halfH - r,
    0,
  )

  /*
   * 边缘折射宽度。
   *
   * 越大越像厚玻璃。
   */
  const bevelWidth =
    Math.max(r * 0.95, 7)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x - halfW
      const py = y - halfH

      /*
       * Rounded Rectangle SDF
       */
      const qx =
        Math.abs(px) - bX

      const qy =
        Math.abs(py) - bY

      const outsideX =
        Math.max(qx, 0)

      const outsideY =
        Math.max(qy, 0)

      const outsideDistance =
        Math.sqrt(
          outsideX * outsideX +
          outsideY * outsideY,
        )

      const insideDistance =
        Math.min(
          Math.max(qx, qy),
          0,
        )

      const distance =
        outsideDistance +
        insideDistance -
        r

      let offsetX = 0
      let offsetY = 0

      if (distance <= 0) {
        const depth = -distance

        /*
         * 0 = 边缘
         * 1 = 内部
         */
        const edgeFactor =
          smoothstep(
            0,
            bevelWidth,
            depth,
          )

        /*
         * 边缘折射强度。
         */
        const curve =
          Math.pow(
            1 - edgeFactor,
            1.55,
          )

        /*
         * 几何法线。
         */
        const len =
          Math.sqrt(
            outsideX * outsideX +
            outsideY * outsideY,
          )

        let nx = 0
        let ny = 0

        if (len > 0.001) {
          nx =
            (outsideX / len) *
            Math.sign(px)

          ny =
            (outsideY / len) *
            Math.sign(py)
        } else {
          /*
           * 中间区域不要产生奇怪的
           * 十字形折射。
           */
          if (
            Math.abs(px) >
            Math.abs(py)
          ) {
            nx = Math.sign(px)
          } else {
            ny = Math.sign(py)
          }
        }

        /*
         * 液态玻璃边缘拉扯。
         *
         * 横向稍强，
         * 纵向稍弱。
         */
        const pullX =
          -nx *
          1.05 *
          curve

        const pullY =
          -ny *
          0.86 *
          curve

        /*
         * 中央微凹。
         */
        const concaveStrength =
          0.13

        const concaveX =
          (px / halfW) *
          concaveStrength *
          (1 - curve * 0.85)

        const concaveY =
          (py / halfH) *
          concaveStrength *
          (1 - curve * 0.85)

        /*
         * 防止边缘出现突兀的
         * displacement。
         */
        const fade =
          smoothstep(
            0,
            Math.max(
              2,
              r * 0.1,
            ),
            depth,
          )

        offsetX =
          (pullX + concaveX) *
          fade

        offsetY =
          (pullY + concaveY) *
          fade
      }

      /*
       * Normal Map
       *
       * 128 = 无位移
       */
      const red = Math.round(
        clamp(
          128 +
            offsetX * 127,
          0,
          255,
        ),
      )

      const green = Math.round(
        clamp(
          128 +
            offsetY * 127,
          0,
          255,
        ),
      )

      const index =
        (y * w + x) * 4

      data[index] = red
      data[index + 1] = green
      data[index + 2] = 128
      data[index + 3] = 255
    }
  }

  ctx.putImageData(
    image,
    0,
    0,
  )

  const url =
    canvas.toDataURL('image/png')

  liquidMapCache.set(
    cacheKey,
    url,
  )

  return url
}


/* =========================================================
 * SVG Liquid Filter
 * ========================================================= */

function LiquidGlassFilter({
  id,
  mapUrl,
}: {
  id: string
  mapUrl: string
}) {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="fixed pointer-events-none opacity-0"
      style={{
        position: 'fixed',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        <filter
          id={id}
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          {mapUrl && (
            <feImage
              href={mapUrl}
              preserveAspectRatio="none"
              result="liquidMap"
            />
          )}

          {mapUrl && (
            <feDisplacementMap
              in="SourceGraphic"
              in2="liquidMap"
              scale={21}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          )}
        </filter>
      </defs>
    </svg>
  )
}


/* =========================================================
 * Liquid Capsule
 * ========================================================= */

function LiquidCapsuleItem({
  children,
  className = '',
  style,
  onClick,
  href,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  href?: string
}) {
  const containerRef =
    useRef<
      HTMLDivElement | HTMLAnchorElement
    >(null)

  const rawId = useId()

  const filterId = useMemo(
    () =>
      `liquid-glass-${rawId.replace(
        /[^a-zA-Z0-9-_]/g,
        '',
      )}`,
    [rawId],
  )

  const [mapUrl, setMapUrl] =
    useState('')

  /*
   * 监听胶囊实际尺寸。
   *
   * 比 window.resize 更可靠。
   */
  useEffect(() => {
    const element =
      containerRef.current

    if (!element) {
      return
    }

    let raf = 0

    const updateMap = () => {
      cancelAnimationFrame(raf)

      raf =
        requestAnimationFrame(() => {
          const rect =
            element.getBoundingClientRect()

          const width =
            Math.round(rect.width)

          const height =
            Math.round(rect.height)

          if (
            width <= 0 ||
            height <= 0
          ) {
            return
          }

          const radius =
            Math.min(
              width,
              height,
            ) / 2

          const url =
            generateLiquidNormalMap(
              width,
              height,
              radius,
            )

          setMapUrl(url)
        })
    }

    updateMap()

    const observer =
      new ResizeObserver(updateMap)

    observer.observe(element)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  const capsuleClassName = `
    relative
    overflow-hidden
    isolation-isolate

    border
    border-white/[0.22]
    dark:border-white/[0.11]

    bg-white/[0.075]
    dark:bg-white/[0.035]

    shadow-[0_10px_35px_rgba(0,0,0,0.055)]

    transition-all
    duration-300
    ease-[cubic-bezier(.22,1,.36,1)]

    hover:bg-white/[0.105]
    dark:hover:bg-white/[0.05]

    hover:border-white/[0.30]
    dark:hover:border-white/[0.16]

    active:scale-[0.965]

    ${className}
  `

  const capsuleStyle: React.CSSProperties = {
    /*
     * Liquid Glass 核心。
     */
    backdropFilter: mapUrl
      ? `
        url(#${filterId})
        blur(13px)
        saturate(155%)
        brightness(108%)
      `
      : `
        blur(13px)
        saturate(155%)
        brightness(108%)
      `,

    WebkitBackdropFilter:
      mapUrl
        ? `
          url(#${filterId})
          blur(13px)
          saturate(155%)
          brightness(108%)
        `
        : `
          blur(13px)
          saturate(155%)
          brightness(108%)
        `,

    /*
     * 玻璃阴影。
     */
    boxShadow: `
      inset 0 1px 1px
        rgba(255,255,255,0.48),

      inset 0 -1px 1px
        rgba(255,255,255,0.08),

      inset 0 0 18px
        rgba(255,255,255,0.045),

      0 2px 5px
        rgba(0,0,0,0.025),

      0 12px 32px
        rgba(0,0,0,0.055)
    `,

    /*
     * GPU layer。
     */
    transform:
      'translateZ(0)',

    ...style,
  }

  const content = (
    <>
      {/* =================================================
       * SVG Liquid Distortion
       * ================================================= */}

      <LiquidGlassFilter
        id={filterId}
        mapUrl={mapUrl}
      />

      {/* =================================================
       * Top Glass Reflection
       * ================================================= */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-[1px]
          top-[1px]
          h-[55%]
          rounded-[inherit]

          bg-gradient-to-b
          from-white/[0.18]
          via-white/[0.055]
          to-transparent

          opacity-80
        "
      />

      {/* =================================================
       * Thin Top Highlight
       * ================================================= */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[8%]
          right-[8%]
          top-0
          h-[2px]

          rounded-full

          bg-white/[0.42]

          blur-[1px]
        "
      />

      {/* =================================================
       * Ambient Reflection
       * ================================================= */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[inherit]

          bg-[radial-gradient(
            ellipse_at_50%_-20%,
            rgba(255,255,255,0.14),
            transparent_62%
          )]

          opacity-80
        "
      />

      {/* =================================================
       * Inner Glass Edge
       * ================================================= */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[inherit]

          ring-1
          ring-inset
          ring-white/[0.08]
        "
      />

      {/* =================================================
       * Content
       * ================================================= */}

      <span
        className="
          relative
          z-10
          block
          h-full
          w-full
        "
      >
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        ref={
          containerRef as React.Ref<HTMLAnchorElement>
        }
        className={capsuleClassName}
        style={capsuleStyle}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <div
      ref={
        containerRef as React.Ref<HTMLDivElement>
      }
      className={capsuleClassName}
      style={capsuleStyle}
      onClick={onClick}
    >
      {content}
    </div>
  )
}


/* =========================================================
 * Navbar
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
      {/* ===================================================
       * Top Floating Navbar
       * =================================================== */}

      <header
        className="
          fixed
          top-0
          inset-x-0
          z-30
          w-full

          px-5
          sm:px-7

          pt-3.5
          pb-2

          pointer-events-none
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto

            flex
            items-center
            justify-between

            gap-3
          "
        >
          {/* =================================================
           * Left
           * ================================================= */}

          <div
            className="
              flex
              items-center
              gap-2.5

              flex-1
              min-w-0
            "
          >
            {/* =============================================
             * Logo Capsule
             * ============================================= */}

            <LiquidCapsuleItem
              href="./"
              className="
                pointer-events-auto

                h-12
                px-4
                sm:px-5

                rounded-full

                flex
                items-center
                gap-3

                shrink-0

                hover:opacity-95

                active:scale-[0.965]
              "
            >
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  className="
                    w-7
                    h-7

                    rounded-lg

                    object-contain

                    drop-shadow-sm

                    shrink-0
                  "
                />
              ) : (
                <div
                  className="
                    w-7
                    h-7

                    rounded-xl

                    bg-blue-500/20

                    text-blue-600
                    dark:text-blue-400

                    border
                    border-blue-400/40

                    flex
                    items-center
                    justify-center

                    font-bold
                    text-sm

                    shrink-0
                  "
                >
                  {siteName.slice(0, 1)}
                </div>
              )}

              <span
                className="
                  font-bold
                  text-base

                  text-slate-800
                  dark:text-slate-100

                  tracking-tight

                  truncate
                "
              >
                {siteName}
              </span>
            </LiquidCapsuleItem>


            {/* =============================================
             * Search Capsule
             * ============================================= */}

            <LiquidCapsuleItem
              className="
                pointer-events-auto

                flex-1
                min-w-[72px]

                max-w-[220px]
                sm:max-w-xs

                h-12
                px-3

                rounded-full

                flex
                items-center
                gap-2
              "
            >
              <SearchIcon
                className="
                  h-4
                  w-4

                  text-slate-500
                  dark:text-slate-400

                  shrink-0
                "
              />

              <input
                type="text"
                name="site-search"
                id="site-search"

                value={query}

                onChange={e =>
                  onQuery(e.target.value)
                }

                placeholder="搜索..."

                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"

                spellCheck={false}

                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"

                className="
                  w-full
                  min-w-0

                  bg-transparent

                  text-sm
                  font-medium

                  text-slate-800
                  dark:text-slate-100

                  placeholder:text-slate-400
                  dark:placeholder:text-slate-500

                  border-none
                  outline-none
                "
              />

              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="
                    h-6
                    w-6

                    shrink-0

                    rounded-full

                    text-slate-500

                    hover:bg-white/40

                    active:scale-95
                  "
                  onClick={() =>
                    onQuery('')
                  }
                  aria-label="清空"
                >
                  <X
                    className="
                      h-3.5
                      w-3.5
                    "
                  />
                </Button>
              )}
            </LiquidCapsuleItem>
          </div>


          {/* =================================================
           * Sort
           * ================================================= */}

          <div
            className="
              pointer-events-auto
              shrink-0
            "
          >
            <LiquidCapsuleItem
              className="
                w-12
                h-12

                rounded-full

                flex
                items-center
                justify-center

                active:scale-[0.965]
              "
            >
              <SortMenu
                value={sort}
                onChange={onSort}
              />
            </LiquidCapsuleItem>
          </div>
        </div>
      </header>


      {/* ===================================================
       * Bottom Floating Dock
       * =================================================== */}

      {!hidden && (
        <div
          className="
            fixed
            bottom-6
            inset-x-0

            z-30

            flex
            justify-center
            items-center

            gap-4

            px-4

            pointer-events-none

            animate-in
            fade-in
            duration-200
          "
        >
          {/* =============================================
           * Theme
           * ============================================= */}

          <div
            className="
              pointer-events-auto
            "
          >
            <LiquidCapsuleItem
              className="
                w-14
                h-14

                rounded-full

                flex
                items-center
                justify-center

                active:scale-[0.965]
              "
            >
              <ThemeToggle />
            </LiquidCapsuleItem>
          </div>


          {/* =============================================
           * View Toggle
           * ============================================= */}

          <div
            className="
              pointer-events-auto
            "
          >
            <LiquidCapsuleItem
              className="
                h-14
                px-2

                rounded-full

                flex
                items-center

                active:scale-[0.965]
              "
            >
              <ViewToggle
                value={view}
                onChange={onView}
              />
            </LiquidCapsuleItem>
          </div>
        </div>
      )}
    </>
  )
          }
