import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
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

function getAvgLap(session: Session): number {
  const times: number[] = []
  session.stints.forEach(stint =>
    stint.laps.forEach(lap => {
      const s = timeToSeconds(lap.lapTime)
      if (s > 0) times.push(s)
    })
  )
  if (times.length === 0) return 0
  return times.reduce((a, b) => a + b, 0) / times.length
}

function getTotalLaps(session: Session): number {
  return session.stints.reduce((acc, s) => acc + s.laps.filter(l => timeToSeconds(l.lapTime) > 0).length, 0)
}

function getConsistency(session: Session): number {
  const times: number[] = []
  session.stints.forEach(stint =>
    stint.laps.forEach(lap => {
      const s = timeToSeconds(lap.lapTime)
      if (s > 0) times.push(s)
    })
  )
  if (times.length < 2) return 0
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length
  return parseFloat(Math.sqrt(variance).toFixed(3))
}

const TRACK_COLORS = [
  '#ef4444', '#f59e0b', '#3b82f6', '#10b981',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316'
]

export default function DriverComparison({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm">
        No sessions logged yet. Start logging races to track your progress.
      </div>
    )
  }

  // Sort sessions by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Progress over time — best lap per session
  const progressData = sorted
    .map((s, i) => ({
      session: i + 1,
      label: `${s.track} (${s.date})`,
      bestLap: getBestLap(s),
      avgLap: parseFloat(getAvgLap(s).toFixed(3)),
      track: s.track,
    }))
    .filter(d => d.bestLap > 0)

  // Personal bests per track
  const byTrack = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    acc[s.track] = acc[s.track] ?? []
    acc[s.track].push(s)
    return acc
  }, {})

  const pbData = Object.entries(byTrack).map(([track, trackSessions]) => {
    const best = Math.min(...trackSessions.map(getBestLap).filter(t => t > 0))
    const latest = trackSessions[trackSessions.length - 1]
    const latestBest = getBestLap(latest)
    const improvement = latestBest > 0 && best > 0
      ? parseFloat((latestBest - best).toFixed(3))
      : 0
    return { track, pb: best, improvement }
  }).filter(d => d.pb > 0)

  // Consistency per session (lower std dev = more consistent)
  const consistencyData = sorted.map((s, i) => ({
    session: i + 1,
    track: s.track,
    consistency: getConsistency(s),
    laps: getTotalLaps(s),
  })).filter(d => d.laps >= 2)

  // Overall stats
  const allBestLaps = sessions.map(getBestLap).filter(t => t > 0)
  const overallBest = Math.min(...allBestLaps)
  const totalLaps = sessions.reduce((acc, s) => acc + getTotalLaps(s), 0)
  const tracksRaced = new Set(sessions.map(s => s.track)).size
  const avgConsistency = consistencyData.length > 0
    ? (consistencyData.reduce((a, d) => a + d.consistency, 0) / consistencyData.length).toFixed(3)
    : '—'

  // Unique tracks for color mapping
  const allTracks = [...new Set(sessions.map(s => s.track))]

  return (
    <div className="space-y-6">

      {/* Overall stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Sessions', value: sessions.length },
          { label: 'Total Laps', value: totalLaps },
          { label: 'Tracks Raced', value: tracksRaced },
          { label: 'Overall Best', value: secondsToTime(overallBest) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-2xl font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress over time */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Progress Over Time</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Best lap per session — are you getting faster?
          </p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="session"
              label={{ value: 'Session', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              tickFormatter={secondsToTime}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={55}
            />
            <Tooltip
              formatter={(value: number, name: string) => [secondsToTime(value), name]}
              labelFormatter={(s) => {
                const d = progressData.find(p => p.session === s)
                return d ? d.label : `Session ${s}`
              }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f9fafb', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Line
              type="monotone"
              dataKey="bestLap"
              name="Best Lap"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ef4444' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="avgLap"
              name="Avg Lap"
              stroke="#6b7280"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Personal bests per track */}
      {pbData.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-medium">Personal Bests by Track</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Your fastest lap ever on each circuit
            </p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, pbData.length * 48)}>
            <BarChart
              data={pbData}
              layout="vertical"
              margin={{ top: 5, right: 60, bottom: 5, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={secondsToTime}
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="track"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={75}
              />
              <Tooltip
                formatter={(value: number) => [secondsToTime(value), 'Personal Best']}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Bar dataKey="pb" name="Personal Best" radius={[0, 6, 6, 0]}>
                {pbData.map((_, i) => (
                  <rect key={i} fill={TRACK_COLORS[i % TRACK_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Consistency tracker */}
      {consistencyData.length >= 2 && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium">Consistency</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Std deviation of lap times — lower is more consistent
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Avg consistency</p>
              <p className="text-lg font-medium">±{avgConsistency}s</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={consistencyData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="session"
                label={{ value: 'Session', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={v => `±${v}s`}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                width={50}
              />
              <Tooltip
                formatter={(v: number) => [`±${v}s`, 'Std Dev']}
                labelFormatter={s => {
                  const d = consistencyData.find(c => c.session === s)
                  return d ? `Session ${s} — ${d.track}` : `Session ${s}`
                }}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <ReferenceLine
                y={parseFloat(avgConsistency as string)}
                stroke="#374151"
                strokeDasharray="4 4"
                label={{ value: 'avg', fill: '#6b7280', fontSize: 10 }}
              />
              <Bar dataKey="consistency" name="Std Dev" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All sessions table */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-medium">All Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Track</th>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Best lap</th>
                <th className="text-left py-2">Avg lap</th>
                <th className="text-left py-2">Laps</th>
                <th className="text-left py-2">Consistency</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const best = getBestLap(s)
                const avg = getAvgLap(s)
                const laps = getTotalLaps(s)
                const consistency = getConsistency(s)
                const trackColor = TRACK_COLORS[allTracks.indexOf(s.track) % TRACK_COLORS.length]
                return (
                  <tr
                    key={i}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 font-medium flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: trackColor }}
                      />
                      {s.track}
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{s.date}</td>
                    <td className="py-2 font-medium text-red-400">
                      {best > 0 ? secondsToTime(best) : '—'}
                    </td>
                    <td className="py-2 text-gray-300">
                      {avg > 0 ? secondsToTime(avg) : '—'}
                    </td>
                    <td className="py-2 text-gray-400">{laps}</td>
                    <td className="py-2 text-gray-400">
                      {laps >= 2 ? `±${consistency}s` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}