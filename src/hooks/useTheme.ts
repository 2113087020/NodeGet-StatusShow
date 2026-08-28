import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const KEY = 'nodeget.theme_override'
// 手动切换覆盖的有效时长：2 小时（单位：毫秒）
const OVERRIDE_TTL = 2 * 60 * 60 * 1000

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getValidOverride(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { theme, expireAt } = JSON.parse(raw)
    if (Date.now() < expireAt && (theme === 'light' || theme === 'dark')) {
      return theme
    }
    localStorage.removeItem(KEY)
  } catch {
    localStorage.removeItem(KEY)
  }
  return null
}

function initial(): Theme {
  const override = getValidOverride()
  return override || getSystemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial)

  // 监听手机系统深浅色切换
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const override = getValidOverride()
      // 如果没有手动覆盖或覆盖已过期，实时跟随系统
      if (!override) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  // 应用到 html 标签
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // 手动切换：记录并设置 2 小时有效期
  const toggle = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      const data = {
        theme: next,
        expireAt: Date.now() + OVERRIDE_TTL,
      }
      localStorage.setItem(KEY, JSON.stringify(data))
      return next
    })
  }

  return { theme, toggle }
}
