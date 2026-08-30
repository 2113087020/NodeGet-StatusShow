export function Background() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] overflow-hidden pointer-events-none select-none"
      style={{
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
      }}
    >
      {/* 1. 干净舒适的低饱和底色 */}
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0b0f17] transition-colors duration-500" />

      {/* 2. 微质感点阵/网格：玻璃划过网格时能产生极明显的几何拉扯折射感 */}
      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            radial-gradient(rgba(100, 116, 139, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* 3. 顶部微光弧：专为 Navbar 提供的晶莹冷光边缘 */}
      <div
        className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] h-[240px] rounded-full blur-[50px] opacity-60 dark:opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, #38bdf8 0%, #818cf8 40%, transparent 75%)',
        }}
      />

      {/* 4. 中部对角微光带：提供滚动时的动态折射明暗交界 */}
      <div
        className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] rounded-full blur-[70px] opacity-40 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle at center, #6366f1 0%, #a855f7 50%, transparent 75%)',
        }}
      />

      {/* 5. 底部 Dock 悬浮托底光：保证下方操作栏通透立体 */}
      <div
        className="absolute -bottom-[80px] left-1/2 -translate-x-1/2 w-[80vw] max-w-[600px] h-[200px] rounded-full blur-[45px] opacity-50 dark:opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, #3b82f6 0%, #06b6d4 50%, transparent 75%)',
        }}
      />
    </div>
  )
}
