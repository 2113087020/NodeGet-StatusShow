import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  radius?: number
}

export function LiquidGlass({ children, className = '' }: Props) {
  return (
    <div
      className={`liquid-lens relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/80 dark:border-white/15 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ${className}`}
    >
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
