import { type ReactNode, useEffect, useRef } from 'react'

interface Props {
  children: ReactNode
  className?: string
  radius?: number
}

const VS_SOURCE = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const FS_SOURCE = `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uCapsulePos;
  uniform vec2 uCapsuleSize;
  uniform float uRadius;

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 capUV = (uCapsulePos - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

    vec2 halfSize = (uCapsuleSize * 0.5) / min(uResolution.x, uResolution.y);
    float radius = uRadius / min(uResolution.x, uResolution.y);

    vec2 p = uv - capUV;
    float d = sdRoundedBox(p, halfSize, radius);

    vec4 finalColor = vec4(0.0);
    float bevelWidth = 0.085;

    if (d <= 0.0) {
      float distToEdge = -d;
      float factor = clamp(1.0 - (distToEdge / bevelWidth), 0.0, 1.0);
      float curve = pow(factor, 1.8);

      // 1. 边缘法线方向计算
      float eps = 0.0015;
      float dx = sdRoundedBox(p + vec2(eps, 0.0), halfSize, radius) - sdRoundedBox(p - vec2(eps, 0.0), halfSize, radius);
      float dy = sdRoundedBox(p + vec2(0.0, eps), halfSize, radius) - sdRoundedBox(p - vec2(0.0, eps), halfSize, radius);
      vec2 normal = normalize(vec2(dx, dy) + 0.0001);

      // 2. 纯净折射材质基底（适配透明背景）
      vec3 glassCol = vec3(1.0, 1.0, 1.0);

      // 3. 菲涅尔反光与倒角高光
      float fresnel = pow(factor, 3.0) * 0.45;
      float rimGlow = smoothstep(0.0, 0.03, distToEdge) * (1.0 - smoothstep(0.03, 0.08, distToEdge));
      glassCol += vec3(1.0) * (fresnel + rimGlow * 0.25);

      // 4. 内部微凹透镜渐变微阴影
      float innerShadow = curve * 0.08;
      glassCol -= vec3(innerShadow);

      // 5. 亚像素抗锯齿边缘与透镜透明度控制
      float alpha = smoothstep(0.0, -0.003, d);
      float opacity = mix(0.18, 0.45, factor);

      finalColor = vec4(glassCol, alpha * opacity);
    }

    gl_FragColor = finalColor;
  }
`

export function LiquidGlass({ children, className = '', radius = 24 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', {
        antialias: true,
        alpha: true,
        depth: false,
        powerPreference: 'high-performance',
      }) || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    if (!gl) return

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, VS_SOURCE))
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, FS_SOURCE))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const aPos = gl.getAttribLocation(prog, 'aPosition')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(prog, 'uResolution')
    const uCapsulePos = gl.getUniformLocation(prog, 'uCapsulePos')
    const uCapsuleSize = gl.getUniformLocation(prog, 'uCapsuleSize')
    const uRadius = gl.getUniformLocation(prog, 'uRadius')

    let animId: number

    const handleResize = () => {
      if (!canvas || !containerRef.current) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
      const rect = containerRef.current.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform2f(uCapsulePos, canvas.width * 0.5, canvas.height * 0.5)
      gl.uniform2f(uCapsuleSize, canvas.width, canvas.height)
      gl.uniform1f(uRadius, radius * dpr)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    const render = () => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [radius])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden backdrop-blur-md border border-white/70 dark:border-white/20 shadow-lg ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none -z-10"
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
