import { useEffect, useState } from 'react'
import { taskQuery } from '../api/methods'
import type { BackendPool } from '../api/pool'
import type { TaskQueryResult } from '../types'

const REFRESH_MS = 10_000
const QUERY_TIMEOUT_MS = 20_000

function clean(rows: TaskQueryResult[] | undefined): TaskQueryResult[] {
  const map = new Map<string, TaskQueryResult>()
  for (const r of rows ?? []) {
    if (!r.cron_source || r.cron_source === '未知') continue
    const key = `${r.timestamp}-${r.cron_source}`
    map.set(key, r)
  }
  return [...map.values()].sort((a, b) => a.timestamp - b.timestamp)
}

export function useNodeLatency(
  pool: BackendPool | null,
  source: string | null,
  uuid: string | null,
  hours = 1,
) {
  const [pingData, setPingData] = useState<TaskQueryResult[]>([])
  const [tcpData, setTcpData] = useState<TaskQueryResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPingData([])
    setTcpData([])

    if (!pool || !source || !uuid) return
    const entry = pool.entries.find(e => e.name === source)
    if (!entry) return

    let cancelled = false

    const fetchOnce = async () => {
      const now = Date.now()
      const totalMs = hours * 3600 * 1000

      // 根据选择的时间段，控制采样点在 100 ~ 150 个左右
      // 1h: 全量; 6h: 约2分钟一次; 12h: 约4分钟一次; 24h: 约6分钟一次
      let stepMs = 0
      if (hours === 6) stepMs = 2 * 60 * 1000
      else if (hours === 12) stepMs = 4 * 60 * 1000
      else if (hours >= 24) stepMs = 6 * 60 * 1000

      setLoading(true)

      try {
        if (stepMs === 0) {
          // 1小时内保持秒级全量
          const [ping, tcp] = await Promise.allSettled([
            taskQuery(
              entry.client,
              [
                { uuid },
                { timestamp_from_to: [now - totalMs, now] },
                { type: 'ping' },
                { limit: 3000 },
              ],
              QUERY_TIMEOUT_MS,
            ),
            taskQuery(
              entry.client,
              [
                { uuid },
                { timestamp_from_to: [now - totalMs, now] },
                { type: 'tcp_ping' },
                { limit: 3000 },
              ],
              QUERY_TIMEOUT_MS,
            ),
          ])

          if (cancelled) return
          if (ping.status === 'fulfilled') setPingData(clean(ping.value))
          if (tcp.status === 'fulfilled') setTcpData(clean(tcp.value))
        } else {
          // 长周期采用小窗口点阵抽样，数据量降至原来的 5%~10%
          const sampleWindows: [number, number][] = []
          for (let t = now - totalMs; t <= now; t += stepMs) {
            // 每个时间段只抓取 30 秒内的点
            sampleWindows.push([t, t + 30_000])
          }

          // 分批并发拉取，每个采样点只取少量数据
          const pingPromises = sampleWindows.map(w =>
            taskQuery(
              entry.client,
              [
                { uuid },
                { timestamp_from_to: w },
                { type: 'ping' },
                { limit: 10 },
              ],
              QUERY_TIMEOUT_MS,
            ).catch(() => [] as TaskQueryResult[]),
          )

          const tcpPromises = sampleWindows.map(w =>
            taskQuery(
              entry.client,
              [
                { uuid },
                { timestamp_from_to: w },
                { type: 'tcp_ping' },
                { limit: 10 },
              ],
              QUERY_TIMEOUT_MS,
            ).catch(() => [] as TaskQueryResult[]),
          )

          const [pingResults, tcpResults] = await Promise.all([
            Promise.all(pingPromises),
            Promise.all(tcpPromises),
          ])

          if (cancelled) return
          setPingData(clean(pingResults.flat()))
          setTcpData(clean(tcpResults.flat()))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOnce()
    const timer = setInterval(fetchOnce, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pool, source, uuid, hours])

  return { pingData, tcpData, loading }
}
