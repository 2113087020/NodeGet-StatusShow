export function Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-soft overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* 顶部左侧柔和蓝紫光球 */}
      <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-blue-400/25 to-indigo-500/15 blur-3xl dark:from-blue-600/15 dark:to-indigo-600/10" />
      
      {/* 顶部右侧粉紫光斑 */}
      <div className="absolute top-[5%] -right-[12%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-bl from-pink-400/20 to-purple-400/15 blur-3xl dark:from-pink-600/10 dark:to-purple-600/10" />

      {/* 中部青绿水波光斑 */}
      <div className="absolute top-[45%] left-[20%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-tr from-teal-300/15 to-sky-400/15 blur-3xl dark:from-teal-600/10 dark:to-sky-600/10" />

      {/* 底部天蓝大光晕 */}
      <div className="absolute -bottom-[10%] right-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-tl from-cyan-400/20 to-blue-500/15 blur-3xl dark:from-cyan-600/10 dark:to-blue-600/10" />
    </div>
  )
}
