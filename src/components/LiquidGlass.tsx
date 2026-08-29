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
  uniform float uTime;

  float drawDashedLine(vec2 uv, float yPos, float blockW, float gapW, float height) {
    float totalW = blockW + gapW;
    float xMod = mod(uv.x + 0.5 * totalW, totalW) - 0.5 * totalW;
    float inX = step(abs(xMod), blockW * 0.5);
    float inY = step(abs(uv.y - yPos), height * 0.5);
    return inX * inY;
  }

  vec3 getScene(vec2 uv) {
    vec2 p = uv * 1.4;
    vec3 topSky = vec3(0.35, 0.28, 0.45);
    vec3 botSky = vec3(0.48, 0.42, 0.58);
    vec3 bg = mix(topSky, botSky, uv.y + 0.5);

    float d1 = length(p - vec2(0.0, -0.35));
    bg += vec3(0.95, 0.45, 0.45) * (0.6 / (1.0 + d1 * 2.5));
    float d2 = length(p - vec2(0.4, -0.2));
    bg += vec3(0.35, 0.55, 0.95) * (0.5 / (1.0 + d2 * 2.8));

    float line1 = drawDashedLine(uv, 0.07, 0.065, 0.032, 0.026);
    bg = mix(bg, vec3(1.0), line1);

    float line2 = drawDashedLine(uv, -0.05, 0.045, 0.035, 0.015);
    bg = mix(bg, vec3(0.25, 0.95, 0.55), line2 * 0.9);

    float line3 = drawDashedLine(uv, -0.13, 0.045, 0.032, 0.012);
    bg = mix(bg, vec3(0.95), line3 * 0.85);

    float line4 = drawDashedLine(uv, -0.20, 0.042, 0.030, 0.010);
    bg = mix(bg, vec3(0.7, 0.8, 0.9), line4 * 0.6);

    return bg;
  }

  vec3 getSmoothFrostedScene(vec2 uv) {
    vec3 acc = vec3(0.0);
    float totalWeight = 0.0;
    float blurRadius = 0.0075;

    acc += getScene(uv) * 0.18;
    totalWeight += 0.18;

    for (int i = 0; i < 6; i++) {
      float angle = float(i) * 1.047197;
      vec2 offset = vec2(cos(angle), sin(angle)) * (blurRadius * 0.45);
      acc += getScene(uv + offset) * 0.08;
      totalWeight += 0.08;
    }

    for (int i = 0; i < 9; i++) {
      float angle = float(i) * 0.69813 + 0.35;
      vec2 offset = vec2(cos(angle), sin(angle)) * blurRadius;
      acc += getScene(uv + offset) * 0.038;
      totalWeight += 0.038;
    }

    return acc / totalWeight;
  }

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

      vec2 centerDir = p;
      vec2 concaveOffset = centerDir * 0.028 * (1.0 - factor * 0.8);

      float eps = 0.0015;
      float dx = sdRoundedBox(p + vec2(eps, 0.0), halfSize, radius) - sdRoundedBox(p - vec2(eps, 0.0), halfSize, radius);
      float dy = sdRoundedBox(p + vec2(0.0, eps), halfSize, radius) - sdRoundedBox(p - vec2(0.0, eps), halfSize, radius);
      vec2 normal = normalize(vec2(dx, dy) + 0.0001);

      vec2 edgePullOffset = -normal * (0.075 * curve);
      vec2 totalOffset = concaveOffset + edgePullOffset;

      float dispersion = 0.18 * curve;
      float rCol = getSmoothFrostedScene(uv + totalOffset * (1.0 + dispersion)).r;
      float gCol = getSmoothFrostedScene(uv + totalOffset).g;
      float bCol = getSmoothFrostedScene(uv + totalOffset * (1.0 - dispersion)).b;
      vec3 glassCol = vec3(rCol, gCol, bCol);

      glassCol = mix(glassCol, vec3(1.0), 0.13);
      float fresnel = pow(factor, 3.0) * 0.36;
      glassCol += vec3(1.0, 0.98, 0.96) * fresnel;

      float alpha = smoothstep(0.0, -0.003, d);
      finalColor = vec4(glassCol, alpha * 0.95);
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
    const uTime = gl.getUniformLocation(prog, 'uTime')

    let animId: number
    const start = performance.now()

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
      const now = (performance.now() - start) * 0.001
      gl.uniform1f(uTime, now)
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
      className={`relative overflow-hidden border border-white/60 dark:border-white/10 shadow-lg ${className}`}
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
