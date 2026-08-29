import { useEffect, useState } from 'react'
import { taskQuery } from '../api/methods'
import type { BackendPool } from '../api/pool'
import type { TaskQueryResult } from '../types'

const REFRESH_MS = 10_000
const QUERY_TIMEOUT_MS = 25_000

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

      // 按最多 6 小时一段生成时间切片，彻底避开后端单次条数限制
      const stepMs = 6 * 3600 * 1000
      const windows: [number, number][] = []

      if (hours <= 6) {
        windows.push([now - totalMs, now])
      } else {
        let currentEnd = now
        while (currentEnd > now - totalMs) {
          const currentStart = Math.max(now - totalMs, currentEnd - stepMs)
          windows.push([currentStart, currentEnd])
          currentEnd = currentStart
        }
      }

      setLoading(true)

      try {
        const pingPromises = windows.map(w =>
          taskQuery(
            entry.client,
            [
              { uuid },
              { timestamp_from_to: [w[0], w[1]] },
              { type: 'ping' },
              { limit: 5000 },
            ],
            QUERY_TIMEOUT_MS,
          ).catch(() => [] as TaskQueryResult[]),
        )

        const tcpPromises = windows.map(w =>
          taskQuery(
            entry.client,
            [
              { uuid },
              { timestamp_from_to: [w[0], w[1]] },
              { type: 'tcp_ping' },
              { limit: 5000 },
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
