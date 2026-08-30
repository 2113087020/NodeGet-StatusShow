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
 * Liquid Glass Normal Map
 *
 * 这里基本恢复你最开始的参数。
 * 不使用重 blur。
 * ========================================================= */

const normalMapCache = new Map<string, string>()

function generateCapsuleNormalMap(
  width: number,
  height: number,
  radius: number,
) {
  if (typeof document === 'undefined') {
    return ''
  }

  /*
   * 避免手机上生成过大的 PNG。
   * Normal Map 缩小后通过 feImage 拉伸即可。
   */
  const maxSize = 256

  const ratio = Math.min(
    1,
    maxSize / Math.max(width, height),
  )

  const canvasWidth = Math.max(
    32,
    Math.round(width * ratio),
  )

  const canvasHeight = Math.max(
    32,
    Math.round(height * ratio),
  )

  const canvasRadius = Math.min(
    radius * ratio,
    canvasWidth / 2,
    canvasHeight / 2,
  )

  const cacheKey =
    `${canvasWidth}x${canvasHeight}x${Math.round(canvasRadius)}`

  const cached = normalMapCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const offscreen = document.createElement('canvas')

  offscreen.width = canvasWidth
  offscreen.height = canvasHeight

  const ctx = offscreen.getContext('2d')

  if (!ctx) {
    return ''
  }

  const imgData = ctx.createImageData(
    canvasWidth,
    canvasHeight,
  )

  const data = imgData.data

  const halfW = canvasWidth / 2
  const halfH = canvasHeight / 2

  const bX = Math.max(
    halfW - canvasRadius,
    0,
  )

  const bY = Math.max(
    halfH - canvasRadius,
    0,
  )

  /*
   * 恢复原代码：
   * 半径的 75% 作为吸附区域。
   */
  const bevelWidth =
    canvasRadius * 0.75


  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {

      const px = x - halfW
      const py = y - halfH

      /* -----------------------------------------------
       * Rounded Rectangle SDF
       * ----------------------------------------------- */

      const qx =
        Math.abs(px) - bX

      const qy =
        Math.abs(py) - bY

      const maxQx =
        Math.max(qx, 0)

      const maxQy =
        Math.max(qy, 0)

      const outsideDist =
        Math.sqrt(
          maxQx * maxQx +
          maxQy * maxQy,
        )

      const insideDist =
        Math.min(
          Math.max(qx, qy),
          0,
        )

      const d =
        outsideDist +
        insideDist -
        canvasRadius


      let offsetX = 0
      let offsetY = 0


      if (d <= 0) {

        const distToEdge = -d

        const factor = Math.min(
          Math.max(
            1 -
              distToEdge /
                Math.max(
                  bevelWidth,
                  0.001,
                ),
            0,
          ),
          1,
        )

        /*
         * 恢复你原来的 1.8。
         */
        const curve =
          Math.pow(
            factor,
            1.8,
          )


        /* ---------------------------------------------
         * 全局微凹
         *
         * 恢复原来的 0.22。
         * --------------------------------------------- */

        const concaveX =
          (px / halfW) *
          0.22 *
          (1 - factor * 0.8)

        const concaveY =
          (py / halfH) *
          0.22 *
          (1 - factor * 0.8)


        /* ---------------------------------------------
         * 几何法线
         * --------------------------------------------- */

        const len =
          Math.sqrt(
            maxQx * maxQx +
            maxQy * maxQy,
          )

        let nx = 0
        let ny = 0

        if (len > 0.001) {

          nx =
            (maxQx / len) *
            Math.sign(px)

          ny =
            (maxQy / len) *
            Math.sign(py)

        } else {

          nx =
            Math.abs(px) >
            Math.abs(py)
              ? Math.sign(px)
              : 0

          ny =
            Math.abs(py) >=
            Math.abs(px)
              ? Math.sign(py)
              : 0
        }


        /* ---------------------------------------------
         * 恢复原来的拉扯力度
         * --------------------------------------------- */

        const yPullScale =
          py > 0
            ? 0.65
            : 0.85

        const pullX =
          -nx *
          (0.85 * curve)

        const pullY =
          -ny *
          (yPullScale * curve)


        /* ---------------------------------------------
         * Edge Fade
         * --------------------------------------------- */

        const edgeFade =
          Math.min(
            Math.max(
              distToEdge / 2,
              0,
            ),
            1,
          )


        offsetX =
          (concaveX + pullX) *
          edgeFade

        offsetY =
          (concaveY + pullY) *
          edgeFade
      }


      /* -----------------------------------------------
       * Normal Map Encoding
       *
       * 128 = 无位移
       * ----------------------------------------------- */

      const rVal =
        Math.min(
          Math.max(
            Math.round(
              128 +
                offsetX * 127,
            ),
            0,
          ),
          255,
        )

      const gVal =
        Math.min(
          Math.max(
            Math.round(
              128 +
                offsetY * 127,
            ),
            0,
          ),
          255,
        )


      const idx =
        (y * canvasWidth + x) * 4

      data[idx] =
        rVal

      data[idx + 1] =
        gVal

      data[idx + 2] =
        128

      data[idx + 3] =
        255
    }
  }


  ctx.putImageData(
    imgData,
    0,
    0,
  )

  const url =
    offscreen.toDataURL(
      'image/png',
    )

  normalMapCache.set(
    cacheKey,
    url,
  )

  return url
}


/* =========================================================
 * Liquid Capsule
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

  const containerRef =
    useRef<
      HTMLDivElement |
      HTMLAnchorElement
    >(null)

  const rawId = useId()

  const filterId =
    'liquid-lens-' +
    rawId.replace(
      /[^a-zA-Z0-9-_]/g,
      '',
    )

  const [mapUrl, setMapUrl] =
    useState('')


  /* =======================================================
   * Generate / Resize Normal Map
   * ======================================================= */

  useEffect(() => {

    const el =
      containerRef.current

    if (!el) {
      return
    }

    let frame = 0

    const updateMap = () => {

      cancelAnimationFrame(frame)

      frame =
        requestAnimationFrame(() => {

          const rect =
            el.getBoundingClientRect()

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
            generateCapsuleNormalMap(
              width,
              height,
              radius,
            )

          setMapUrl(url)
        })
    }


    updateMap()


    /*
     * ResizeObserver 比 window resize
     * 更适合这里。
     *
     * 例如：
     * 手机横竖屏
     * 搜索框尺寸变化
     * 字体加载
     * Tailwind breakpoint
     */

    const observer =
      new ResizeObserver(
        updateMap,
      )

    observer.observe(el)


    return () => {

      cancelAnimationFrame(frame)

      observer.disconnect()
    }

  }, [])


  /* =======================================================
   * SVG Filter
   *
   * 关键：
   * filter 不能影响 flex layout。
   * ======================================================= */

  const filter = (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="
        fixed
        pointer-events-none
        opacity-0
      "
      style={{
        position: 'fixed',
        width: 0,
        height: 0,
        overflow: 'hidden',
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
        >

          {mapUrl && (
            <feImage
              href={mapUrl}
              preserveAspectRatio="none"
              result="lensMap"
            />
          )}

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


  /* =======================================================
   * IMPORTANT
   *
   * 这里恢复你原来的玻璃参数。
   *
   * 不使用 blur(7px)
   * 不使用额外白色背景
   * ======================================================= */

  const commonClass = `
    relative

    shrink-0

    border
    border-white/20
    dark:border-white/10

    bg-white/[0.03]
    dark:bg-black/[0.10]

    transition-shadow
    duration-300

    ${className}
  `


  const commonStyle: React.CSSProperties = {

    /*
     * =====================================================
     * 这里是最重要的地方
     *
     * 原代码：
     *
     * backdropFilter:
     *   url(#filter) blur(1px)
     *
     * 现在恢复。
     *
     * 不再使用 blur(7px)。
     * =====================================================
     */

    backdropFilter:
      mapUrl
        ? `url(#${filterId}) blur(1px)`
        : 'blur(8px)',

    WebkitBackdropFilter:
      mapUrl
        ? `url(#${filterId}) blur(1px)`
        : 'blur(8px)',


    /*
     * 恢复原来的阴影。
     */

    boxShadow: `
      inset 0 1px 1px 0
        rgba(255, 255, 255, 0.4),

      inset 0 0 8px 0
        rgba(255, 255, 255, 0.04),

      0 8px 24px -4px
        rgba(0, 0, 0, 0.06)
    `,


    /*
     * 防止 SVG / transform 导致某些移动浏览器
     * 重新计算布局。
     */

    isolation: 'isolate',

    transform:
      'translateZ(0)',


    ...style,
  }


  /* =======================================================
   * Content
   *
   * 绝对不要给这里加：
   *
   * w-full
   * h-full
   *
   * 否则会影响父级 flex。
   * ======================================================= */

  const content = (
    <>
      {filter}

      <span
        className="
          relative
          z-10
        "
      >
        {children}
      </span>
    </>
  )


  /* =======================================================
   * Link
   * ======================================================= */

  if (href) {

    return (
      <a
        href={href}
        ref={
          containerRef as
          React.Ref<HTMLAnchorElement>
        }
        className={commonClass}
        style={commonStyle}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }


  /* =======================================================
   * Div
   * ======================================================= */

  return (
    <div
      ref={
        containerRef as
        React.Ref<HTMLDivElement>
      }
      className={commonClass}
      style={commonStyle}
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
       * TOP NAVBAR
       *
       * 这里不让 header 自己参与宽度计算。
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

            w-full
            min-w-0
          "
        >

          {/* =================================================
           * LEFT AREA
           *
           * Logo + Search
           * ================================================= */}

          <div
            className="
              flex
              items-center

              gap-2.5

              flex-1
              min-w-0

              overflow-visible
            "
          >

            {/* ===============================================
             * LOGO
             *
             * shrink-0 非常重要。
             * =============================================== */}

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

                max-w-[55vw]

                hover:opacity-95

                active:scale-95

                transition-all
                duration-200
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

                  min-w-0
                "
              >
                {siteName}
              </span>

            </LiquidCapsuleItem>


            {/* ===============================================
             * SEARCH
             *
             * 只允许搜索框吃掉剩余空间。
             * =============================================== */}

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

                overflow-hidden
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
                  onQuery(
                    e.target.value,
                  )
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
           * SORT
           *
           * 永远固定 48x48。
           * 不参与左边搜索框的 flex。
           * ================================================= */}

          <div
            className="
              pointer-events-auto

              shrink-0

              w-12
              h-12
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

                active:scale-95

                transition-all
                duration-200
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
       * BOTTOM DOCK
       *
       * 保持你原来的布局。
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

          {/* ===============================================
           * Theme
           * =============================================== */}

          <div
            className="
              pointer-events-auto
              shrink-0
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

                active:scale-95

                transition-all
              "
            >

              <ThemeToggle />

            </LiquidCapsuleItem>

          </div>


          {/* ===============================================
           * View
           * =============================================== */}

          <div
            className="
              pointer-events-auto
              shrink-0
            "
          >

            <LiquidCapsuleItem
              className="
                h-14

                px-2

                rounded-full

                flex
                items-center

                active:scale-95

                transition-all
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
