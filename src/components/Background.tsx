export function Background() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] bg-soft pointer-events-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 1600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-45 dark:opacity-30 transition-opacity duration-300"
      >
        {/* 顶部柔和暖光 */}
        <path
          d="M0,-100 Q500,300 1000,-80 L1000,-100 Z"
          className="fill-amber-100/60 dark:fill-amber-950/20"
        />

        {/* 极简柔和太阳与光晕 */}
        <g>
          <circle
            cx="800"
            cy="260"
            r="160"
            className="fill-orange-100 dark:fill-orange-950/40"
          />
          <circle
            cx="800"
            cy="260"
            r="95"
            className="fill-amber-200 dark:fill-amber-700/60"
          />
          <circle
            cx="800"
            cy="260"
            r="45"
            className="fill-rose-200 dark:fill-rose-800/60"
          />
        </g>

        {/* 远景柔和山脉 */}
        <path
          d="M 0,720 Q 300,420 600,650 T 1000,560 L 1000,1600 L 0,1600 Z"
          className="fill-rose-100/80 dark:fill-slate-800/80"
        />

        {/* 中景低饱和山坡 */}
        <path
          d="M 0,860 C 250,720 450,960 750,820 C 860,770 940,800 1000,830 L 1000,1600 L 0,1600 Z"
          className="fill-teal-100 dark:fill-teal-950/70"
        />

        {/* 暖色过渡层 */}
        <path
          d="M 0,1050 Q 400,880 800,1100 L 1000,1040 L 1000,1600 L 0,1600 Z"
          className="fill-amber-100/70 dark:fill-amber-950/50"
        />

        {/* 柔和浅蓝河流色带 */}
        <path
          d="M 1000,960 C 650,1020 550,1200 200,1160 C 100,1140 0,1170 0,1170 L 0,1310 C 250,1290 450,1350 700,1210 C 880,1110 950,1080 1000,1070 Z"
          className="fill-sky-100 dark:fill-sky-950/70"
        />

        {/* 近景大地基底 */}
        <path
          d="M 0,1260 C 350,1160 650,1420 1000,1300 L 1000,1600 L 0,1600 Z"
          className="fill-emerald-100/80 dark:fill-emerald-950/60"
        />
        <path
          d="M 0,1400 Q 450,1280 1000,1460 L 1000,1600 L 0,1600 Z"
          className="fill-orange-100/80 dark:fill-slate-900/90"
        />

        {/* 左侧极简植物剪影 */}
        <g className="fill-teal-200/90 dark:fill-teal-800/50">
          <path d="M 120,1500 Q 110,1220 190,1080 Q 130,1220 140,1500 Z" />
          <circle cx="190" cy="1080" r="48" />
          <circle cx="145" cy="1140" r="36" className="fill-orange-200/90 dark:fill-orange-900/50" />
        </g>

        {/* 右侧植物叶片 */}
        <g className="fill-teal-200/80 dark:fill-teal-800/40">
          <path d="M 870,1600 Q 910,1380 810,1260 Q 950,1380 900,1600 Z" />
          <ellipse cx="780" cy="1260" rx="50" ry="28" transform="rotate(-30 780 1260)" />
          <ellipse cx="880" cy="1310" rx="45" ry="25" transform="rotate(25 880 1310)" className="fill-emerald-200/80 dark:fill-emerald-900/40" />
        </g>
      </svg>
    </div>
  )
}
