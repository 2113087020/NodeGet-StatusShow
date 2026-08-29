import { useEffect, useRef } from 'react'

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
  uniform int uEnableCapsule;

  // 真正的全屏动态液态波浪渐变场
  vec3 getScene(vec2 uv) {
    vec2 p = uv * 1.4;
    vec3 topSky = vec3(0.55, 0.65, 0.95);
    vec3 botSky = vec3(0.92, 0.72, 0.88);
    vec3 bg = mix(topSky, botSky, uv.y + 0.5);

    float wave = sin(uTime * 1.5 + uv.x * 2.0) * 0.08;
    float wave2 = cos(uTime * 1.2 + uv.y * 2.5) * 0.08;

    float d1 = length(p - vec2(0.0 + wave2, -0.35 + wave));
    bg += vec3(0.98, 0.55, 0.65) * (0.55 / (1.0 + d1 * 2.5));
    
    float d2 = length(p - vec2(0.4 - wave, -0.2 + wave2));
    bg += vec3(0.45, 0.75, 1.0) * (0.50 / (1.0 + d2 * 2.8));

    return bg;
  }

  // 16 采样点黄金旋转泊松模糊采样
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
    vec3 sceneColor = getScene(uv);

    if (uEnableCapsule == 1) {
      vec2 capUV = (uCapsulePos - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
      vec2 halfSize = (uCapsuleSize * 0.5) / min(uResolution.x, uResolution.y);
      float radius = uRadius / min(uResolution.x, uResolution.y);

      vec2 p = uv - capUV;
      float d = sdRoundedBox(p, halfSize, radius);

      float bevelWidth = 0.085;

      if (d <= 0.0) {
        float distToEdge = -d;
        float factor = clamp(1.0 - (distToEdge / bevelWidth), 0.0, 1.0);
        float curve = pow(factor, 1.8);

        // 1. 胶囊内部均匀凹透镜下凹
        vec2 centerDir = p;
        vec2 concaveOffset = centerDir * 0.028 * (1.0 - factor * 0.8);

        // 2. 边缘法线方向计算
        float eps = 0.0015;
        float dx = sdRoundedBox(p + vec2(eps, 0.0), halfSize, radius) - sdRoundedBox(p - vec2(eps, 0.0), halfSize, radius);
        float dy = sdRoundedBox(p + vec2(0.0, eps), halfSize, radius) - sdRoundedBox(p - vec2(0.0, eps), halfSize, radius);
        vec2 normal = normalize(vec2(dx, dy) + 0.0001);

        // 3. 边缘向外吸扯折射
        vec2 edgePullOffset = -normal * (0.075 * curve);
        vec2 totalOffset = concaveOffset + edgePullOffset;

        // 4. 三原色色散分离 + 模糊采样
        float dispersion = 0.18 * curve;
        float rCol = getSmoothFrostedScene(uv + totalOffset * (1.0 + dispersion)).r;
        float gCol = getSmoothFrostedScene(uv + totalOffset).g;
        float bCol = getSmoothFrostedScene(uv + totalOffset * (1.0 - dispersion)).b;
        vec3 glassCol = vec3(rCol, gCol, bCol);

        // 5. 磨砂提亮与倒角菲涅尔高光反光
        glassCol = mix(glassCol, vec3(1.0), 0.10);
        float fresnel = pow(factor, 3.0) * 0.48;
        glassCol += vec3(1.0, 0.98, 0.96) * fresnel;

        float alpha = smoothstep(0.0, -0.003, d);
        sceneColor = mix(sceneColor, glassCol, alpha);
      }
    }

    gl_FragColor = vec4(sceneColor, 1.0);
  }
`

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', {
        antialias: true,
        alpha: false,
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
    const uEnableCapsule = gl.getUniformLocation(prog, 'uEnableCapsule')

    let animId: number
    const start = performance.now()

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
      const w = window.innerWidth * dpr
      const h = window.innerHeight * dpr
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uResolution, w, h)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
      const now = (performance.now() - start) * 0.001

      // 实时同步概览卡片 DOM 元素在视口中的绝对物理位置
      const el = document.getElementById('liquid-overview-capsule')
      if (el) {
        const rect = el.getBoundingClientRect()
        const posX = (rect.left + rect.width * 0.5) * dpr
        const posY = (window.innerHeight - (rect.top + rect.height * 0.5)) * dpr
        const capW = rect.width * dpr
        const capH = rect.height * dpr
        const capR = capH * 0.5

        gl.uniform1i(uEnableCapsule, 1)
        gl.uniform2f(uCapsulePos, posX, posY)
        gl.uniform2f(uCapsuleSize, capW, capH)
        gl.uniform1f(uRadius, capR)
      } else {
        gl.uniform1i(uEnableCapsule, 0)
      }

      gl.uniform1f(uTime, now)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-50 w-full h-full pointer-events-none"
    />
  )
}
