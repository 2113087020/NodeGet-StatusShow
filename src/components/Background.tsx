export function Background() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] bg-soft pointer-events-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 1600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {/* 天空顶层大弧光带 */}
        <path
          d="M-100,-100 Q500,400 1100,-50 L1100,-100 Z"
          className="fill-amber-100/60 dark:fill-slate-800/40"
        />

        {/* Alegria 巨大几何太阳与放射色带 */}
        <g opacity="0.85">
          {/* 放射光芒块 1 */}
          <polygon
            points="750,300 0,600 0,750"
            className="fill-orange-200/50 dark:fill-orange-950/30"
          />
          {/* 放射光芒块 2 */}
          <polygon
            points="750,300 1000,50 1000,250"
            className="fill-amber-200/40 dark:fill-amber-900/20"
          />
          {/* 太阳外环装饰弧 */}
          <path
            d="M 500 300 A 250 250 0 0 1 1000 300"
            fill="none"
            strokeWidth="30"
            className="stroke-amber-300 dark:stroke-amber-500/30"
          />
          <path
            d="M 570 300 A 180 180 0 0 1 930 300"
            fill="none"
            strokeWidth="16"
            strokeDasharray="24 16"
            className="stroke-orange-300 dark:stroke-orange-400/40"
          />
          {/* 核心大太阳 */}
          <circle
            cx="750"
            cy="300"
            r="120"
            className="fill-amber-400 dark:fill-amber-500"
          />
          <circle
            cx="750"
            cy="300"
            r="60"
            className="fill-rose-400 dark:fill-rose-500"
          />
        </g>

        {/* 远景高山（高耸色块，覆盖竖屏中上部） */}
        <path
          d="M 0,800 Q 250,350 500,680 T 1000,550 L 1000,1600 L 0,1600 Z"
          className="fill-rose-200 dark:fill-slate-800"
        />
        <path
          d="M 500,680 Q 750,420 1000,550 L 1000,1600 L 500,1600 Z"
          className="fill-rose-300 dark:fill-slate-700/80"
        />

        {/* 中景山坡与大地 */}
        <path
          d="M 0,920 C 300,750 450,1050 780,880 C 880,830 950,860 1000,890 L 1000,1600 L 0,1600 Z"
          className="fill-teal-300 dark:fill-teal-900/90"
        />

        {/* 明亮黄色过渡斜坡 */}
        <path
          d="M 0,1100 Q 400,900 800,1150 L 1000,1080 L 1000,1600 L 0,1600 Z"
          className="fill-amber-300/80 dark:fill-amber-900/60"
        />

        {/* 宽阔的 S 形河流色带 */}
        <path
          d="M 1000,980 C 650,1050 550,1250 200,1200 C 100,1180 0,1220 0,1220 L 0,1380 C 250,1360 450,1420 700,1260 C 880,1150 950,1120 1000,1110 Z"
          className="fill-sky-300 dark:fill-sky-800"
        />

        {/* 近景前坡 */}
        <path
          d="M 0,1320 C 350,1200 650,1500 1000,1360 L 1000,1600 L 0,1600 Z"
          className="fill-emerald-400 dark:fill-emerald-950"
        />
        <path
          d="M 0,1460 Q 450,1300 1000,1520 L 1000,1600 L 0,1600 Z"
          className="fill-coral-400 fill-orange-400 dark:fill-slate-900"
        />

        {/* Alegria 风格几何卷曲大植物（左侧） */}
        <g className="fill-teal-600 dark:fill-teal-400">
          <path d="M 100,1500 Q 90,1200 180,1050 Q 110,1200 120,1500 Z" />
          <circle cx="180" cy="1050" r="55" />
          <circle cx="130" cy="1120" r="42" className="fill-orange-400 dark:fill-orange-500" />
          <circle cx="230" cy="1110" r="38" className="fill-amber-300 dark:fill-amber-400" />
        </g>

        {/* Alegria 风格大型叶片（右侧前景） */}
        <g className="fill-teal-700 dark:fill-teal-500">
          <path d="M 880,1600 Q 920,1350 820,1220 Q 960,1350 910,1600 Z" />
          <ellipse cx="790" cy="1220" rx="60" ry="35" transform="rotate(-30 790 1220)" />
          <ellipse cx="890" cy="1280" rx="55" ry="30" transform="rotate(25 890 1280)" className="fill-emerald-500 dark:fill-emerald-600" />
          <ellipse cx="770" cy="1330" rx="50" ry="28" transform="rotate(-20 770 1330)" />
        </g>

        {/* Alegria 经典点阵装饰 */}
        <g className="fill-orange-400/70 dark:fill-orange-400/40">
          <circle cx="150" cy="650" r="8" />
          <circle cx="190" cy="650" r="8" />
          <circle cx="230" cy="650" r="8" />
          <circle cx="150" cy="690" r="8" />
          <circle cx="190" cy="690" r="8" />
          <circle cx="230" cy="690" r="8" />
        </g>
      </svg>
    </div>
  )
}
