export function Background() {
  return (
    <>
      {/* 隐藏的液态玻璃折射与色散滤镜定义 */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%">
            {/* 生成水波/透镜微流动纹理 */}
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
            {/* 斯涅尔定律折射置换：scale 控制边缘扭曲程度 */}
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            {/* 柔化微光与通透度提升 */}
            <feGaussianBlur in="displaced" stdDeviation="0.8" result="blurred" />
            <feColorMatrix type="saturate" values="1.6" />
          </filter>
        </defs>
      </svg>

      {/* 流体光斑背景 */}
      <div className="fixed inset-0 -z-10 bg-soft pointer-events-none select-none" aria-hidden />
    </>
  )
}
