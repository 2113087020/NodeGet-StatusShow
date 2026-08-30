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
      {/* 基础底色 */}
      <div className="absolute inset-0 bg-[#eef2f9] dark:bg-[#080b11] transition-colors duration-500" />

      {/* 结构 1：顶部强反差光弧（紫粉到青蓝），穿过 Navbar 和 顶部卡片产生剧烈折射 */}
      <div
        className="absolute -top-[10%] left-[-10%] w-[120vw] h-[55vh] rounded-[100%] blur-[45px] sm:blur-[60px] opacity-80 dark:opacity-40 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 40%, #3b82f6 75%, #06b6d4 100%)',
        }}
      />

      {/* 结构 2：中左侧高光球（高饱和青绿），使列表滚动时左侧边缘产生强反光 */}
      <div
        className="absolute top-[35%] -left-[15%] w-[65vw] h-[65vw] max-w-[500px] max-h-[500px] rounded-full blur-[40px] sm:blur-[55px] opacity-75 dark:opacity-35 transition-all duration-500"
        style={{
          background: 'radial-gradient(circle at center, #10b981 0%, #3b82f6 65%, transparent 85%)',
        }}
      />

      {/* 结构 3：中右侧明暗分割光带（橙粉暖色），制造冷暖交界线 */}
      <div
        className="absolute top-[45%] -right-[15%] w-[60vw] h-[60vw] max-w-[480px] max-h-[480px] rounded-full blur-[40px] sm:blur-[50px] opacity-70 dark:opacity-30 transition-all duration-500"
        style={{
          background: 'radial-gradient(circle at center, #f97316 0%, #ec4899 60%, transparent 80%)',
        }}
      />

      {/* 结构 4：底部 Dock 强光托底（蔚蓝到极光紫） */}
      <div
        className="absolute -bottom-[15%] left-[5%] w-[90vw] h-[45vh] rounded-[100%] blur-[45px] sm:blur-[60px] opacity-80 dark:opacity-35 transition-all duration-500"
        style={{
          background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #ec4899 100%)',
        }}
      />

      {/* 微对比度强化遮罩 */}
      <div className="absolute inset-0 bg-transparent dark:bg-black/20" />
    </div>
  )
}
