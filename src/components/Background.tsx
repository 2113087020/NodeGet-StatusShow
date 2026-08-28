export function Background() {
  return (
    <>
      {/* 物理全屏绝对固定背景：永远贴满手机屏幕，不随滚动移位 */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 -z-50 w-full h-full min-h-[100dvh] bg-soft pointer-events-none"
      />

      {/* 玻璃拟态 SVG 滤镜定义 */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-refract">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </>
  )
}
