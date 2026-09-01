export function Background() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] bg-soft pointer-events-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {/* 太阳 */}
        <circle
          cx="800"
          cy="220"
          r="80"
          className="fill-amber-400 dark:fill-amber-300 opacity-90"
        />

        {/* 装饰光环 */}
        <circle
          cx="800"
          cy="220"
          r="115"
          fill="none"
          strokeWidth="4"
          strokeDasharray="12 8"
          className="stroke-amber-400/40 dark:stroke-amber-300/30"
        />

        {/* 远景山丘 */}
        <path
          d="M0,620 Q250,500 500,600 T1000,540 L1000,1000 L0,1000 Z"
          className="fill-orange-200 dark:fill-slate-800 opacity-70"
        />

        {/* 中景山坡 */}
        <path
          d="M0,700 Q300,580 600,720 T1000,660 L1000,1000 L0,1000 Z"
          className="fill-emerald-300 dark:fill-teal-900 opacity-60"
        />

        {/* 流水曲线 */}
        <path
          d="M0,820 Q350,750 650,860 T1000,780 L1000,860 Q650,940 350,830 T0,900 Z"
          className="fill-sky-300 dark:fill-cyan-700 opacity-60"
        />

        {/* 近景起伏大地 */}
        <path
          d="M0,870 Q300,780 600,890 T1000,830 L1000,1000 L0,1000 Z"
          className="fill-rose-300 dark:fill-slate-700 opacity-80"
        />

        {/* Alegria 几何植被 */}
        <g className="fill-teal-600 dark:fill-teal-400 opacity-80">
          <circle cx="150" cy="790" r="30" />
          <circle cx="125" cy="825" r="22" />
          <circle cx="180" cy="830" r="18" />
          <rect x="147" y="800" width="6" height="85" rx="3" />
        </g>
      </svg>
    </div>
  )
}
