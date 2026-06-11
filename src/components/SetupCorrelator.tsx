import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { type Session } from '../lib/db'

interface Props {
  sessions: Session[]
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

function getBestLap(session: Session): number {
  let best = Infinity
  session.stints.forEach(stint =>
    stint.laps.forEach(lap => {
      const s = timeToSeconds(lap.lapTime)
      if (s > 0 && s < best) best = s
    })
  )
  return best === Infinity ? 0 : best
}

const SETUP_KEYS: { key: keyof Session['carSetup']; label: string; min: number; max: number }[] = [
  { key: 'frontWing', label: 'Front Wing', min: 1, max: 11 },
  { key: 'rearWing', label: 'Rear Wing', min: 1, max: 11 },
  { key: 'differential', label: 'Differential', min: 50, max: 100 },
  { key: 'suspensionFront', label: 'Suspension Front', min: 1, max: 11 },
  { key: 'suspensionRear', label: 'Suspension Rear', min: 1, max: 11 },
]

export default function SetupCorrelator({ sessions }: Props) {
  if (sessions.length < 2) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center space-y-2">
        <p className="text-gray-400 text-sm">
          Log at least 2 sessions to see setup correlations.
        </p>
        <p className="text-gray-600 text-xs">
          Try different car settings across sessions on the same track to get meaningful insights.
        </p>
      </div>
    )
  }

  // Group sessions by track
  const byTrack = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    acc[s.track] = acc[s.track] ?? []
    acc[s.track].push(s)
    return acc
  }, {})

  // Only show tracks with 2+ sessions
  const tracks = Object.entries(byTrack).filter(([, s]) => s.length >= 2)

  if (tracks.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center space-y-2">
        <p className="text-gray-400 text-sm">
          Log at least 2 sessions on the same track to compare setups.
        </p>
        <p className="text-gray-600 text-xs">
          Currently you have sessions across different tracks — try revisiting the same track with a different setup.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {tracks.map(([track, trackSessions]) => {
        // Build best setup recommendation
        const ranked = trackSessions
          .map(s => ({ session: s, bestLap: getBestLap(s) }))
          .filter(r => r.bestLap > 0)
          .sort((a, b) => a.bestLap - b.bestLap)

        const bestSession = ranked[0]?.session

        return (
          <div key={track} className="space-y-6">

            {/* Track header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">{track}</h2>
              <span className="text-xs text-gray-400">
                {trackSessions.length} sessions
              </span>
            </div>

            {/* Best setup card */}
            {bestSession && (
              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Best setup on this track
                    </p>
                    <p className="text-2xl font-medium mt-1 text-red-400">
                      {secondsToTime(getBestLap(bestSession))}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {bestSession.date} · {bestSession.weather}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Recommended settings
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-right">
                      {SETUP_KEYS.map(({ key, label }) => (
                        <div key={key} className="flex justify-between gap-4">
                          <span className="text-gray-500 text-xs">{label}</span>
                          <span className="font-medium text-white">
                            {bestSession.carSetup[key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scatter charts per setup parameter */}
            <div className="grid grid-cols-1 gap-6">
              {SETUP_KEYS.map(({ key, label }) => {
                const data = trackSessions
                  .map(s => ({
                    setting: s.carSetup[key],
                    bestLap: getBestLap(s),
                    date: s.date,
                    weather: s.weather,
                  }))
                  .filter(d => d.bestLap > 0)

                if (data.length < 2) return null

                const avgLap = data.reduce((a, d) => a + d.bestLap, 0) / data.length

                return (
                  <div key={key} className="bg-gray-900 rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-300">{label}</h3>
                      <p className="text-xs text-gray-500">
                        Best value:{' '}
                        <span className="text-white font-medium">
                          {data.sort((a, b) => a.bestLap - b.bestLap)[0].setting}
                        </span>
                      </p>
                    </div>

                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="setting"
                          type="number"
                          name={label}
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          label={{ value: label, position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="bestLap"
                          type="number"
                          name="Best Lap"
                          tickFormatter={secondsToTime}
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          width={55}
                        />
                        <ReferenceLine
                          y={avgLap}
                          stroke="#374151"
                          strokeDasharray="4 4"
                          label={{ value: 'avg', fill: '#6b7280', fontSize: 10 }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number, name: string) => [
                            name === 'Best Lap' ? secondsToTime(value) : value,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#f9fafb' }}
                        />
                        <Scatter
                          data={data}
                          fill="#ef4444"
                          opacity={0.85}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>

            {/* All sessions ranked table */}
            <div className="bg-gray-900 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-300">All sessions ranked</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Best lap</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">FW</th>
                    <th className="text-left py-2">RW</th>
                    <th className="text-left py-2">Diff</th>
                    <th className="text-left py-2">SF</th>
                    <th className="text-left py-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map(({ session: s, bestLap }, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                        i === 0 ? 'text-red-400' : ''
                      }`}
                    >
                      <td className="py-2 font-medium">P{i + 1}</td>
                      <td className="py-2 font-medium">{secondsToTime(bestLap)}</td>
                      <td className="py-2 text-gray-400 text-xs">{s.date}</td>
                      <td className="py-2">{s.carSetup.frontWing}</td>
                      <td className="py-2">{s.carSetup.rearWing}</td>
                      <td className="py-2">{s.carSetup.differential}</td>
                      <td className="py-2">{s.carSetup.suspensionFront}</td>
                      <td className="py-2">{s.carSetup.suspensionRear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )
      })}
    </div>
  )
}