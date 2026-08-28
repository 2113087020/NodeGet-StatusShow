export function Background() {
  return (
    <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="0.8" result="blurred" />
          <feColorMatrix type="saturate" values="1.6" />
        </filter>
      </defs>
    </svg>
  )
}
