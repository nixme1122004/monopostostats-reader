import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
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

function compoundBadge(c: string) {
  const map: Record<string, string> = {
    Soft: 'bg-red-600/20 text-red-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard: 'bg-gray-200/20 text-gray-200',
    Inter: 'bg-green-600/20 text-green-400',
    Wet: 'bg-blue-600/20 text-blue-400',
  }
  return map[c] ?? 'bg-gray-700/20 text-gray-400'
}

const STINT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7']

export default function LapTimeChart({ session }: Props) {
  if (!session) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm">
        No session selected.
      </div>
    )
  }

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

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Lap Times</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {session.track} · {session.date} · {session.weather}
          </p>
        </div>
        <div className="flex gap-2">
          {session.stints.map((s, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-full font-medium ${compoundBadge(s.compound)}`}>
              {s.compound}
            </span>
          ))}
        </div>
      </div>

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
          />
          <Tooltip
            formatter={(value: number) => secondsToTime(value)}
            labelFormatter={(lap) => `Lap ${lap}`}
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#f9fafb' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left py-2">Lap</th>
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">S1</th>
              <th className="text-left py-2">S2</th>
              <th className="text-left py-2">S3</th>
              <th className="text-left py-2">Compound</th>
            </tr>
          </thead>
          <tbody>
            {session.stints.flatMap((stint, si) =>
              stint.laps.map((lap, li) => (
                <tr key={`${si}-${li}`} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 text-gray-400">{lap.lapNumber}</td>
                  <td className="py-2 font-medium">{lap.lapTime || '—'}</td>
                  <td className="py-2 text-gray-400">{lap.sector1 || '—'}</td>
                  <td className="py-2 text-gray-400">{lap.sector2 || '—'}</td>
                  <td className="py-2 text-gray-400">{lap.sector3 || '—'}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${compoundBadge(stint.compound)}`}>
                      {stint.compound}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}