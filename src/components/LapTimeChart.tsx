import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { type Session, loadBenchmark, type BenchmarkRecord } from '../lib/db'
import TrackMap from './TrackMap'

interface Props {
  session: Session | null
}

function timeToSeconds(t: string): number {
  if (!t) return 0
  const parts = t.split(':')
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  return parseFloat(t)
}

function secondsToTime(s: number): string {
  if (!s) return ''
  const mins = Math.floor(s / 60)
  const secs = (s % 60).toFixed(3).padStart(6, '0')
  return `${mins}:${secs}`
}

function compoundBadge(c: string) {
  const map: Record<string, string> = {
    Soft:   'bg-red-600/20 text-red-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard:   'bg-gray-200/20 text-gray-200',
    Inter:  'bg-green-600/20 text-green-400',
    Wet:    'bg-blue-600/20 text-blue-400',
  }
  return map[c] ?? 'bg-gray-700/20 text-gray-400'
}

const STINT_COLORS = ['#ef4444', '#3b82f6', '#0b13f5', '#10b981', '#a855f7']

function sectorCellHighlight(sector: 1 | 2 | 3): string {
  const map = {
    1: 'bg-red-950/40 text-red-300 font-semibold',
    2: 'bg-blue-950/40 text-blue-300 font-semibold',
    3: 'bg-yellow-950/40 text-yellow-300 font-semibold',
  }
  return map[sector]
}

function sectorTextColor(sector: 1 | 2 | 3): string {
  const map = {
    1: 'text-red-400',
    2: 'text-blue-400',
    3: 'text-yellow-400',
  }
  return map[sector]
}

interface BenchmarkStats {
  best: number
  p25: number
  median: number
  p75: number
  worst: number
}

function calcBenchmarkStats(records: BenchmarkRecord[]): BenchmarkStats {
  const times = records
    .map(r => timeToSeconds(r.lapTime))
    .filter(t => t > 0)
    .sort((a, b) => a - b)

  const pct = (p: number) => times[Math.floor(times.length * p)] ?? 0

  return {
    best:   times[0],
    p25:    pct(0.25),
    median: pct(0.5),
    p75:    pct(0.75),
    worst:  times[times.length - 1],
  }
}

export default function LapTimeChart({ session }: Props) {
  const [benchmarkStats, setBenchmarkStats] = useState<BenchmarkStats | null>(null)
  const [showBenchmark, setShowBenchmark] = useState(false)
  const [benchmarkAvailable, setBenchmarkAvailable] = useState(false)
  const [hoveredSector, setHoveredSector] = useState<1 | 2 | 3 | null>(null)
  const [activeSector,  setActiveSector]  = useState<1 | 2 | 3 | null>(null)

  useEffect(() => {
    if (!session) return
    setActiveSector(null)
    setHoveredSector(null)
    loadBenchmark(session.track).then(data => {
      if (data) {
        setBenchmarkStats(calcBenchmarkStats(data.records))
        setBenchmarkAvailable(true)
      } else {
        setBenchmarkAvailable(false)
        setShowBenchmark(false)
      }
    })
  }, [session?.track])

  if (!session) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm">
        No session selected.
      </div>
    )
  }

  // Build per-stint datasets
  const stintDatasets = session.stints.map((stint, si) => {
    const lapOffset = session.stints
      .slice(0, si)
      .reduce((acc, s) => acc + s.laps.length, 0)
    return {
      compound: stint.compound,
      color: STINT_COLORS[si % STINT_COLORS.length],
      data: stint.laps
        .filter(l => timeToSeconds(l.lapTime) > 0)
        .map((lap, li) => ({
          lap: lapOffset + li + 1,
          time: timeToSeconds(lap.lapTime),
        }))
    }
  })

  const allLaps = Array.from(
    new Set(stintDatasets.flatMap(s => s.data.map(d => d.lap)))
  ).sort((a, b) => a - b)

  const chartData = allLaps.map(lap => {
    const row: Record<string, number | string> = { lap }
    stintDatasets.forEach((stint, si) => {
      const match = stint.data.find(d => d.lap === lap)
      if (match) row[`Stint ${si + 1} (${stint.compound})`] = match.time
    })
    return row
  })

  const stintKeys = stintDatasets.map((s, si) => `Stint ${si + 1} (${s.compound})`)

  // Collect all valid lap times for stats
  const allTimes = stintDatasets
    .flatMap(s => s.data.map(d => d.time))
    .filter(t => t > 0)
    .sort((a, b) => a - b)

  const bestLap  = allTimes[0] ?? 0
  const worstLap = allTimes[allTimes.length - 1] ?? 0
  const avgLap   = allTimes.length > 0
    ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
    : 0

  const yMin = bestLap  > 0 ? bestLap  - 2 : undefined
  const yMax = worstLap > 0 ? worstLap + 2 : undefined

  return (
    <div className="space-y-4">

      {/* Session header + chart */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-medium">Lap Times</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {session.track} · {session.date} · {session.weather}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {session.stints.map((s, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded-full font-medium ${compoundBadge(s.compound)}`}>
                {s.compound}
              </span>
            ))}
            {benchmarkAvailable && (
              <button
                onClick={() => setShowBenchmark(v => !v)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
                  showBenchmark
                    ? 'bg-purple-600/20 text-purple-400 border-purple-700'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {showBenchmark ? '✓ Benchmark' : 'Show Benchmark'}
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        {allTimes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Best Lap',    value: secondsToTime(bestLap),  color: 'text-green-400',  border: 'border-green-900'  },
              { label: 'Average Lap', value: secondsToTime(avgLap),   color: 'text-yellow-400', border: 'border-yellow-900' },
              { label: 'Worst Lap',   value: secondsToTime(worstLap), color: 'text-red-400',    border: 'border-red-900'    },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={`bg-gray-800 rounded-lg p-3 border ${border}`}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-lg font-medium mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Benchmark stats */}
        {showBenchmark && benchmarkStats && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-purple-900/40">
            <p className="text-xs text-purple-400 font-medium uppercase tracking-wider">
              Bahrain Benchmark — 5,000 reference laps
            </p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: 'Pro best',   value: benchmarkStats.best,   color: 'text-green-400'  },
                { label: 'Top 25%',    value: benchmarkStats.p25,    color: 'text-teal-400'   },
                { label: 'Median',     value: benchmarkStats.median, color: 'text-purple-400' },
                { label: 'Bottom 25%', value: benchmarkStats.p75,    color: 'text-orange-400' },
                { label: 'Slowest',    value: benchmarkStats.worst,  color: 'text-red-400'    },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-xs font-medium mt-0.5 ${color}`}>{secondsToTime(value)}</p>
                </div>
              ))}
            </div>
            {bestLap > 0 && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Your best lap{' '}
                  <span className="text-white font-medium">{secondsToTime(bestLap)}</span>
                  {' '}is{' '}
                  <span className={
                    bestLap <= benchmarkStats.p25    ? 'text-green-400 font-medium'  :
                    bestLap <= benchmarkStats.median ? 'text-teal-400 font-medium'   :
                    bestLap <= benchmarkStats.p75    ? 'text-yellow-400 font-medium' :
                    'text-red-400 font-medium'
                  }>
                    {bestLap <= benchmarkStats.p25    ? 'in the top 25% — pro territory 🟢'  :
                     bestLap <= benchmarkStats.median ? 'above average — solid pace 🔵'       :
                     bestLap <= benchmarkStats.p75    ? 'below median — room to improve 🟡'   :
                     'in the bottom 25% — keep pushing 🔴'}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="lap"
              label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              tickFormatter={secondsToTime}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={55}
              domain={[yMin ?? 'auto', yMax ?? 'auto']}
            />
            <Tooltip
              formatter={(value: number) => secondsToTime(value)}
              labelFormatter={lap => `Lap ${lap}`}
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />

            {bestLap > 0 && (
              <ReferenceLine y={bestLap} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value: 'Best', fill: '#4ade80', fontSize: 10, position: 'insideTopRight' }} />
            )}
            {avgLap > 0 && (
              <ReferenceLine y={avgLap} stroke="#facc15" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: 'Avg', fill: '#facc15', fontSize: 10, position: 'insideTopRight' }} />
            )}
            {worstLap > 0 && (
              <ReferenceLine y={worstLap} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: 'Worst', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }} />
            )}
            {showBenchmark && benchmarkStats && (
              <>
                <ReferenceLine y={benchmarkStats.best} stroke="#a855f7" strokeDasharray="2 4" strokeWidth={1}
                  label={{ value: 'Pro best', fill: '#a855f7', fontSize: 9, position: 'insideBottomRight' }} />
                <ReferenceLine y={benchmarkStats.median} stroke="#7c3aed" strokeDasharray="2 4" strokeWidth={1}
                  label={{ value: 'Median', fill: '#7c3aed', fontSize: 9, position: 'insideBottomRight' }} />
              </>
            )}

            {stintKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={STINT_COLORS[i % STINT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Track map + lap table */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-6 flex-wrap">

          {/* Track map */}
          {session.track === 'Bahrain' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {session.track} Circuit
              </p>
              <TrackMap
                size="large"
                highlightedSector={hoveredSector}
                activeSector={activeSector}
                onSectorClick={setActiveSector}
              />
              {activeSector && (
                <p className="text-xs text-center text-gray-500">
                  Filtering by Sector {activeSector}
                </p>
              )}
            </div>
          )}

          {/* Lap table */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Lap by lap
              {activeSector && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  — best in S{activeSector} highlighted
                </span>
              )}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2">Lap</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2 text-red-400">S1</th>
                    <th className="text-left py-2 text-blue-400">S2</th>
                    <th className="text-left py-2 text-yellow-400">S3</th>
                    <th className="text-left py-2">Cmp</th>
                    <th className="text-left py-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {session.stints.flatMap((stint, si) =>
                    stint.laps.map((lap, li) => {
                      const t  = timeToSeconds(lap.lapTime)
                      const s1 = parseFloat(lap.sector1)
                      const s2 = parseFloat(lap.sector2)
                      const s3 = parseFloat(lap.sector3)

                      const isBest  = t > 0 && t === bestLap
                      const isWorst = t > 0 && t === worstLap

                      const bestSectorInLap: 1 | 2 | 3 | null =
                        s1 > 0 && s2 > 0 && s3 > 0
                          ? s1 <= s2 && s1 <= s3 ? 1
                          : s2 <= s1 && s2 <= s3 ? 2
                          : 3
                          : null

                      return (
                        <tr
                          key={`${si}-${li}`}
                          className={`border-b border-gray-800/50 transition-colors cursor-default ${
                            isBest                          ? 'bg-green-900/10'               :
                            isWorst                         ? 'bg-red-900/10'                 :
                            'hover:bg-gray-800/30'
                          }`}
                          onMouseEnter={() => setHoveredSector(bestSectorInLap)}
                          onMouseLeave={() => setHoveredSector(null)}
                        >
                          <td className="py-2 text-gray-400">{lap.lapNumber}</td>
                          <td className={`py-2 font-medium ${
                            isBest  ? 'text-green-400' :
                            isWorst ? 'text-red-400'   : ''
                          }`}>
                            {lap.lapTime || '—'}
                          </td>
                          <td className={`py-2 text-xs ${
                            activeSector === 1
                              ? sectorCellHighlight(1)
                              : bestSectorInLap === 1 && !activeSector
                                ? `${sectorTextColor(1)} font-medium`
                                : 'text-gray-500'
                          }`}>
                            {lap.sector1 || '—'}
                          </td>
                          <td className={`py-2 text-xs ${
                            activeSector === 2
                              ? sectorCellHighlight(2)
                              : bestSectorInLap === 2 && !activeSector
                                ? `${sectorTextColor(2)} font-medium`
                                : 'text-gray-500'
                          }`}>
                            {lap.sector2 || '—'}
                          </td>
                          <td className={`py-2 text-xs ${
                            activeSector === 3
                              ? sectorCellHighlight(3)
                              : bestSectorInLap === 3 && !activeSector
                                ? `${sectorTextColor(3)} font-medium`
                                : 'text-gray-500'
                          }`}>
                            {lap.sector3 || '—'}
                          </td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${compoundBadge(stint.compound)}`}>
                              {stint.compound}
                            </span>
                          </td>
                          <td className="py-2 text-xs">
                            {isBest  && <span className="text-green-400">▲ Best</span>}
                            {isWorst && <span className="text-red-400">▼ Worst</span>}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
