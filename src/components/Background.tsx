export function Background() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] bg-soft pointer-events-none overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 1600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-70 dark:opacity-55 transition-opacity duration-300"
      >
        {/* 顶部柔和暖光弧带 */}
        <path
          d="M0,-100 Q500,320 1000,-80 L1000,-100 Z"
          className="fill-amber-200/70 dark:fill-amber-950/30"
        />

        {/* Alegria 几何大太阳 */}
        <g>
          {/* 外层浅色大光晕 */}
          <circle
            cx="800"
            cy="270"
            r="165"
            className="fill-orange-200/80 dark:fill-orange-950/50"
          />
          {/* 太阳主圆 */}
          <circle
            cx="800"
            cy="270"
            r="105"
            className="fill-amber-400 dark:fill-amber-600"
          />
          {/* 太阳内环色块 */}
          <circle
            cx="800"
            cy="270"
            r="55"
            className="fill-rose-400 dark:fill-rose-600"
          />
        </g>

        {/* 远景粉橙色山脉 */}
        <path
          d="M 0,720 Q 300,400 600,640 T 1000,540 L 1000,1600 L 0,1600 Z"
          className="fill-rose-200 dark:fill-slate-800"
        />

        {/* 中景清爽青绿斜坡 */}
        <path
          d="M 0,860 C 250,710 450,960 750,810 C 860,760 940,790 1000,820 L 1000,1600 L 0,1600 Z"
          className="fill-teal-200 dark:fill-teal-900"
        />

        {/* 暖黄色中景过渡块 */}
        <path
          d="M 0,1050 Q 400,860 800,1100 L 1000,1030 L 1000,1600 L 0,1600 Z"
          className="fill-amber-200 dark:fill-amber-900/80"
        />

        {/* 鲜明蓝天青色河流 */}
        <path
          d="M 1000,950 C 650,1020 550,1200 200,1150 C 100,1130 0,1160 0,1160 L 0,1310 C 250,1290 450,1360 700,1210 C 880,1110 950,1070 1000,1060 Z"
          className="fill-sky-300 dark:fill-sky-800"
        />

        {/* 近景草绿大地 */}
        <path
          d="M 0,1260 C 350,1150 650,1420 1000,1290 L 1000,1600 L 0,1600 Z"
          className="fill-emerald-300 dark:fill-emerald-950"
        />

        {/* 近景珊瑚橙斜坡 */}
        <path
          d="M 0,1400 Q 450,1270 1000,1450 L 1000,1600 L 0,1600 Z"
          className="fill-orange-300 dark:fill-slate-900"
        />

        {/* 左侧几何植物 */}
        <g className="fill-teal-500 dark:fill-teal-400">
          <path d="M 120,1500 Q 110,1210 190,1070 Q 130,1210 140,1500 Z" />
          <circle cx="190" cy="1070" r="50" />
          <circle cx="140" cy="1135" r="38" className="fill-orange-400 dark:fill-orange-500" />
          <circle cx="235" cy="1125" r="32" className="fill-amber-300 dark:fill-amber-400" />
        </g>

        {/* 右侧几何植物叶片 */}
        <g className="fill-teal-600 dark:fill-teal-400">
          <path d="M 870,1600 Q 910,1370 810,1250 Q 950,1370 900,1600 Z" />
          <ellipse cx="780" cy="1250" rx="55" ry="30" transform="rotate(-30 780 1250)" />
          <ellipse cx="880" cy="1300" rx="48" ry="26" transform="rotate(25 880 1300)" className="fill-emerald-400 dark:fill-emerald-600" />
          <ellipse cx="770" cy="1350" rx="45" ry="24" transform="rotate(-20 770 1350)" />
        </g>
      </svg>
    </div>
  )
}
