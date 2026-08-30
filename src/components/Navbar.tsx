import { useState } from 'react'
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

/**
 * ============================================================
 * 液态玻璃胶囊
 * ============================================================
 *
 * 这一版故意不再使用：
 *   - SVG feDisplacementMap
 *   - feImage
 *   - backdrop-filter: url(...)
 *   - Canvas normal map
 *
 * 因为这些方案在 Android Chrome / WebView 上容易造成：
 *   1. 背景内容偏移
 *   2. 顶部文字被拉扯
 *   3. 上下滚动时出现不同步
 *   4. 胶囊边缘产生奇怪的采样
 *
 * 现在采用纯 CSS：
 *   - 极低透明度
 *   - 轻微 blur
 *   - saturate
 *   - inset 高光
 *   - 细边框
 *
 * 这样能保持“玻璃”的感觉，同时让后面的文字透出来。
 */
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
  const glassStyle: React.CSSProperties = {
    /*
     * 非常低的白色底。
     *
     * 这是这版“透字”的关键。
     * 不要再提高到 0.15 / 0.2，否则背景会变成一块白色塑料。
     */
    backgroundColor: 'rgba(255, 255, 255, 0.055)',

    /*
     * 只做非常轻的模糊。
     *
     * 你原来的 WebGL 方案最终实际上只有约 1px 的 blur，
     * 所以这里也保持在非常轻的范围。
     */
    backdropFilter: 'blur(1.5px) saturate(125%)',
    WebkitBackdropFilter: 'blur(1.5px) saturate(125%)',

    /*
     * 玻璃边缘。
     * 上边缘稍亮，模拟玻璃受光。
     */
    border: '1px solid rgba(255, 255, 255, 0.30)',

    /*
     * 玻璃内部高光 + 极轻阴影。
     *
     * 不使用厚重阴影，否则移动端看起来会像普通卡片。
     */
    boxShadow: `
      inset 0 1px 1px rgba(255, 255, 255, 0.42),
      inset 0 -1px 1px rgba(255, 255, 255, 0.08),
      inset 0 0 10px rgba(255, 255, 255, 0.025),
      0 6px 20px -8px rgba(0, 0, 0, 0.16)
    `,

    /*
     * 防止浏览器把 backdrop-filter 层和内容产生奇怪的合成。
     */
    isolation: 'isolate',

    /*
     * 保持圆角内部干净。
     */
    overflow: 'hidden',

    /*
     * 不允许浏览器因为滤镜产生额外布局。
     */
    transform: 'translateZ(0)',

    ...style,
  }

  const commonProps = {
    className: `
      relative
      ${className}
    `,
    style: glassStyle,
    onClick,
  }

  const content = (
    <>
      {/*
       * 非常轻的一层顶部玻璃反光。
       *
       * 它不会遮住后面的内容，只是让胶囊边缘
       * 更接近你截图里的真实玻璃效果。
       */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-white/35
          opacity-70
        "
      />

      {children}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        {...commonProps}
        className={`
          block
          ${commonProps.className}
        `}
      >
        {content}
      </a>
    )
  }

  return (
    <div {...commonProps}>
      {content}
    </div>
  )
}

/**
 * ============================================================
 * Navbar
 * ============================================================
 */
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
  /*
   * 这里不再有任何 map / canvas / SVG / displacement state。
   *
   * 这样 Navbar 本身完全不会参与页面内容的位移。
   */

  return (
    <>
      {/* ======================================================
          顶部三个玻璃胶囊
          ====================================================== */}

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
            gap-2.5
          "
        >
          {/* ==================================================
              左侧区域

              Logo + 搜索

              保持你原本的布局：
              Logo | 搜索
              ================================================== */}

          <div
            className="
              flex
              items-center
              gap-2.5
              flex-1
              min-w-0
            "
          >
            {/* ==================================================
                1. Logo 胶囊
                ================================================== */}

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
                active:scale-[0.97]
                transition-transform
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
                  whitespace-nowrap
                "
              >
                {siteName}
              </span>
            </LiquidCapsuleItem>

            {/* ==================================================
                2. 搜索胶囊

                关键：
                - 不再 max-w-xs 强行限制太死
                - mobile 保证不会把 Logo 挤变形
                - 搜索区域自己吃掉剩余空间
                ================================================== */}

            <LiquidCapsuleItem
              className="
                pointer-events-auto
                flex-1
                min-w-0
                w-0
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
                  text-slate-600/80
                  dark:text-slate-300/75
                  shrink-0
                "
              />

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
                className="
                  w-full
                  min-w-0
                  bg-transparent
                  text-sm
                  font-medium
                  text-slate-800
                  dark:text-slate-100
                  placeholder:text-slate-500/75
                  dark:placeholder:text-slate-300/60
                  border-none
                  outline-none
                  appearance-none
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
                    text-slate-600/80
                    dark:text-slate-300/80
                    hover:bg-white/20
                    active:scale-95
                  "
                  onClick={() => onQuery('')}
                  aria-label="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </LiquidCapsuleItem>
          </div>

          {/* ==================================================
              3. 右侧排序胶囊

              单独固定尺寸。
              不参与左侧搜索区域的伸缩。
              ================================================== */}

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
                active:scale-[0.97]
                transition-transform
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

      {/* ======================================================
          底部 Dock
          ====================================================== */}

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
          {/* ==================================================
              夜间模式
              ================================================== */}

          <div className="pointer-events-auto">
            <LiquidCapsuleItem
              className="
                w-14
                h-14
                rounded-full
                flex
                items-center
                justify-center
                active:scale-[0.97]
                transition-transform
                duration-200
              "
            >
              <ThemeToggle />
            </LiquidCapsuleItem>
          </div>

          {/* ==================================================
              View Dock
              ================================================== */}

          <div className="pointer-events-auto">
            <LiquidCapsuleItem
              className="
                h-14
                px-2
                rounded-full
                flex
                items-center
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
