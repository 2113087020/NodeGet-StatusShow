import { useEffect, useId, useRef, useState } from 'react'
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
 * 保持你最初版本的玻璃参数：
 *
 * bevelWidth = radius * 0.75
 * curve      = pow(factor, 1.8)
 * concave    = 0.22
 * pullX     = 0.85
 * pullY     = 0.65 / 0.85
 *
 * 不增加额外模糊。
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
   * 手机上没必要生成非常大的 Normal Map。
   * 256 是内部纹理尺寸，不影响最终胶囊尺寸。
   */
  const maxTextureSize = 256

  const ratio = Math.min(
    1,
    maxTextureSize / Math.max(width, height),
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
    `${canvasWidth}:${canvasHeight}:${Math.round(canvasRadius)}`

  const cached = normalMapCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const canvas = document.createElement('canvas')

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return ''
  }

  const imageData = ctx.createImageData(
    canvasWidth,
    canvasHeight,
  )

  const data = imageData.data

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
   * 原始参数：75%
   */
  const bevelWidth =
    canvasRadius * 0.75

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const px = x - halfW
      const py = y - halfH

      /*
       * Rounded Rectangle SDF
       */
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
         * 原始 1.8 次方
         */
        const curve =
          Math.pow(
            factor,
            1.8,
          )

        /*
         * 原始全局微凹
         */
        const concaveX =
          (px / halfW) *
          0.22 *
          (1 - factor * 0.8)

        const concaveY =
          (py / halfH) *
          0.22 *
          (1 - factor * 0.8)

        /*
         * 几何法线
         */
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

        /*
         * 原始上下拉扯参数
         */
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

        /*
         * 原始 edge fade
         */
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

      /*
       * Normal Map：
       *
       * 128 = 无位移
       */
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

      const index =
        (y * canvasWidth + x) * 4

      data[index] = rVal
      data[index + 1] = gVal
      data[index + 2] = 128
      data[index + 3] = 255
    }
  }

  ctx.putImageData(
    imageData,
    0,
    0,
  )

  const url =
    canvas.toDataURL('image/png')

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
    `liquid-lens-${rawId.replace(
      /[^a-zA-Z0-9-_]/g,
      '',
    )}`

  const [mapUrl, setMapUrl] =
    useState('')

  /*
   * 记录当前尺寸。
   *
   * 重要：
   * 只有真正发生尺寸变化时才重新生成。
   */
  useEffect(() => {
    const element =
      containerRef.current

    if (!element) {
      return
    }

    let frameId = 0
    let lastWidth = 0
    let lastHeight = 0

    const updateMap = () => {
      cancelAnimationFrame(frameId)

      frameId =
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

          /*
           * 尺寸没有改变时不要重新生成。
           */
          if (
            width === lastWidth &&
            height === lastHeight
          ) {
            return
          }

          lastWidth = width
          lastHeight = height

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

    const resizeObserver =
      new ResizeObserver(
        updateMap,
      )

    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [])


  /*
   * =======================================================
   * SVG Filter
   *
   * 它完全脱离布局。
   * 不参与 flex。
   * 不产生任何尺寸。
   * =======================================================
   */

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


  /*
   * =======================================================
   * 玻璃本体
   *
   * 这里严格保留你最开始的参数。
   * =======================================================
   */

  const glassStyle: React.CSSProperties = {
    /*
     * 你原来的透明度。
     */
    backgroundColor:
      undefined,

    /*
     * 最终状态：
     *
     * url displacement
     * +
     * blur(1px)
     *
     * 而不是上一版的重 blur。
     */
    backdropFilter: mapUrl
      ? `url(#${filterId}) blur(1px)`
      : 'blur(8px)',

    WebkitBackdropFilter: mapUrl
      ? `url(#${filterId}) blur(1px)`
      : 'blur(8px)',

    /*
     * 原始阴影。
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
     * 创建独立合成层。
     */
    isolation: 'isolate',

    /*
     * 防止 Android Chrome 某些情况下
     * backdrop-filter 在滚动时出现半像素偏移。
     */
    transform:
      'translate3d(0, 0, 0)',

    WebkitTransform:
      'translate3d(0, 0, 0)',

    ...style,
  }


  const commonClass = `
    relative

    border
    border-white/20
    dark:border-white/10

    bg-white/[0.03]
    dark:bg-black/[0.10]

    transition-shadow
    duration-300

    ${className}
  `


  /*
   * 内容层：
   *
   * 不使用 absolute。
   * 不使用 width/height 100%。
   *
   * 这样不会再干扰胶囊尺寸。
   */

  const content = (
    <>
      {filterElement}

      <span
        className="
          relative
          z-10
          flex
          items-center
        "
      >
        {children}
      </span>
    </>
  )


  if (href) {
    return (
      <a
        ref={
          containerRef as
            React.Ref<HTMLAnchorElement>
        }
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
      ref={
        containerRef as
          React.Ref<HTMLDivElement>
      }
      className={commonClass}
      style={glassStyle}
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
       * 使用独立的固定定位层。
       *
       * 高度约 68px。
       * =================================================== */}

      <header
        className="
          fixed
          top-0
          left-0
          right-0

          z-[100]

          w-full

          px-5
          sm:px-7

          pt-3.5
          pb-2

          pointer-events-none

          box-border
        "
        style={{
          /*
           * 防止 fixed header 因父元素 transform
           * 在部分移动浏览器中产生偏移。
           */
          transform:
            'translate3d(0, 0, 0)',
          WebkitTransform:
            'translate3d(0, 0, 0)',
        }}
      >
        <div
          className="
            w-full
            max-w-7xl
            mx-auto

            flex
            items-center

            min-w-0

            gap-3
          "
        >

          {/* =================================================
           * 左侧区域
           *
           * Logo + Search
           * ================================================= */}

          <div
            className="
              flex
              items-center

              min-w-0
              flex-1

              gap-2.5

              overflow-visible
            "
          >

            {/* ===============================================
             * LOGO CAPSULE
             *
             * 固定，不参与压缩。
             * =============================================== */}

            <LiquidCapsuleItem
              href="./"
              className="
                pointer-events-auto

                h-12

                shrink-0

                rounded-full

                px-4
                sm:px-5

                flex
                items-center

                gap-3

                overflow-hidden

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

                    shrink-0

                    rounded-lg

                    object-contain

                    drop-shadow-sm
                  "
                />
              ) : (
                <div
                  className="
                    w-7
                    h-7

                    shrink-0

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
                  "
                >
                  {siteName.slice(0, 1)}
                </div>
              )}

              <span
                className="
                  min-w-0

                  truncate

                  font-bold
                  text-base

                  text-slate-800
                  dark:text-slate-100

                  tracking-tight
                "
              >
                {siteName}
              </span>
            </LiquidCapsuleItem>


            {/* ===============================================
             * SEARCH CAPSULE
             *
             * 搜索框只吃剩余空间。
             * =============================================== */}

            <LiquidCapsuleItem
              className="
                pointer-events-auto

                h-12

                flex-1
                min-w-0

                max-w-[220px]
                sm:max-w-xs

                rounded-full

                px-3

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

                  shrink-0

                  text-slate-500
                  dark:text-slate-400
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
                  min-w-0
                  w-full

                  bg-transparent

                  border-none
                  outline-none

                  text-sm
                  font-medium

                  text-slate-800
                  dark:text-slate-100

                  placeholder:text-slate-400
                  dark:placeholder:text-slate-500
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
           * 完全独立。
           *
           * 不让它参与左边 flex。
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

                p-0

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
       * TOP SPACE
       *
       * 这是这次修复“卡片内容穿进顶部胶囊”的关键。
       *
       * Navbar 是 fixed，
       * fixed 本身不会占据正常文档流。
       *
       * 如果不补空间，第一张卡片就会直接顶到
       * Navbar 后面。
       *
       * 这里给页面正常流补出顶部高度。
       * =================================================== */}

      <div
        aria-hidden="true"
        className="
          h-[68px]
          w-full
          shrink-0
        "
      />


      {/* ===================================================
       * BOTTOM DOCK
       *
       * 整体固定在底部。
       * =================================================== */}

      {!hidden && (
        <div
          className="
            fixed

            left-0
            right-0
            bottom-6

            z-[100]

            w-full

            flex
            justify-center
            items-center

            pointer-events-none

            px-4

            animate-in
            fade-in
            duration-200
          "
          style={{
            transform:
              'translate3d(0, 0, 0)',
            WebkitTransform:
              'translate3d(0, 0, 0)',
          }}
        >

          {/* ===============================================
           * Dock Wrapper
           *
           * 两个胶囊保持独立。
           *
           * Moon：56
           * View：自动
           * gap：16
           * =============================================== */}

          <div
            className="
              flex
              items-center

              justify-center

              gap-4

              shrink-0
            "
          >

            {/* =============================================
             * THEME
             * ============================================= */}

            <div
              className="
                pointer-events-auto

                w-14
                h-14

                shrink-0
              "
            >
              <LiquidCapsuleItem
                className="
                  w-14
                  h-14

                  p-0

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


            {/* =============================================
             * VIEW TOGGLE
             *
             * 这里不强行设置 width。
             * 让 ViewToggle 自己决定内容宽度。
             * ============================================= */}

            <div
              className="
                pointer-events-auto

                h-14

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

                  overflow-hidden

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
        </div>
      )}
    </>
  )
}
