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
      {/* 1. 基础环境底色：浅色模式采用高级冷白灰，深色模式采用深邃暗夜黑 */}
      <div className="absolute inset-0 bg-[#f6f8fc] dark:bg-[#07090e] transition-colors duration-700" />

      {/* 2. 顶部主光斑（冰蓝 -> 珊瑚粉），给顶部 Navbar 带来晶莹冷暖折射 */}
      <div
        className="absolute -top-[25%] -left-[15%] w-[85vw] h-[85vw] max-w-[900px] max-h-[900px] rounded-full blur-[90px] sm:blur-[130px] opacity-75 dark:opacity-25 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #60a5fa 0%, #ec4899 50%, transparent 80%)',
        }}
      />

      {/* 3. 中右上光斑（极光青 -> 鸢尾紫），增强卡片与表格右侧的高光层次 */}
      <div
        className="absolute top-[20%] -right-[20%] w-[75vw] h-[75vw] max-w-[800px] max-h-[800px] rounded-full blur-[100px] sm:blur-[140px] opacity-65 dark:opacity-20 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle at center, #06b6d4 0%, #8b5cf6 60%, transparent 80%)',
        }}
      />

      {/* 4. 底部托底光斑（薄荷翠绿 -> 蔚蓝），为底部悬浮 Dock 提供饱满的通透感 */}
      <div
        className="absolute -bottom-[20%] left-[10%] w-[85vw] h-[70vw] max-w-[950px] max-h-[750px] rounded-full blur-[110px] sm:blur-[150px] opacity-65 dark:opacity-20 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle at center, #10b981 0%, #3b82f6 55%, transparent 80%)',
        }}
      />

      {/* 5. 微质感层：增强透镜对背景像素采样的折射层次 */}
      <div className="absolute inset-0 bg-white/[0.015] dark:bg-black/[0.2] backdrop-contrast-[1.02]" />
    </div>
  )
}
