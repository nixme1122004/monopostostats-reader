import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { type Session } from '../lib/db'

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

const COMPOUND_COLORS: Record<string, string> = {
  Soft: '#ef4444',
  Medium: '#f59e0b',
  Hard: '#e5e7eb',
  Inter: '#10b981',
  Wet: '#3b82f6',
}

export default function TyreChart({ session }: Props) {
  if (!session) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm">
        No session selected.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {session.stints.map((stint, si) => {
        const laps = stint.laps.filter(l => timeToSeconds(l.lapTime) > 0)
        if (laps.length === 0) return null

        const baseLapTime = timeToSeconds(laps[0].lapTime)
        const data = laps.map((lap, li) => {
          const seconds = timeToSeconds(lap.lapTime)
          const delta = seconds - baseLapTime
          return {
            lap: li + 1,
            lapTime: seconds,
            delta: parseFloat(delta.toFixed(3)),
          }
        })

        const color = COMPOUND_COLORS[stint.compound] ?? '#6b7280'
        const totalDeg = data[data.length - 1].delta
        const avgDegPerLap = laps.length > 1
          ? (totalDeg / (laps.length - 1)).toFixed(3)
          : '0.000'

        return (
          <div key={si} className="bg-gray-900 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Stint {si + 1} — {stint.compound}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {session.track} · {laps.length} lap{laps.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-gray-400">
                  Total deg
                  <span className="ml-2 font-medium" style={{ color: totalDeg > 0 ? '#ef4444' : '#10b981' }}>
                    {totalDeg > 0 ? '+' : ''}{totalDeg.toFixed(3)}s
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  Avg per lap
                  <span className="ml-2 font-medium text-white">+{avgDegPerLap}s</span>
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id={`grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="lap"
                  label={{ value: 'Lap in stint', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={v => `+${v.toFixed(1)}s`}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'delta' ? `+${value.toFixed(3)}s vs lap 1` : secondsToTime(value),
                    name === 'delta' ? 'Degradation' : 'Lap time'
                  ]}
                  labelFormatter={lap => `Lap ${lap} of stint`}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Area
                  type="monotone"
                  dataKey="delta"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${si})`}
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2">Lap in stint</th>
                    <th className="text-left py-2">Lap time</th>
                    <th className="text-left py-2">Deg vs lap 1</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-2 text-gray-400">{row.lap}</td>
                      <td className="py-2 font-medium">{secondsToTime(row.lapTime)}</td>
                      <td className="py-2 font-medium" style={{ color: row.delta > 0 ? '#ef4444' : '#10b981' }}>
                        {row.delta > 0 ? '+' : ''}{row.delta.toFixed(3)}s
                      </td>
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