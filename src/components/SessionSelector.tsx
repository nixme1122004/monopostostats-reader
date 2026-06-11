import { type Session } from '../lib/db'

interface Props {
  sessions: Session[]
  selectedId: number | null
  onChange: (id: number) => void
}

export default function SessionSelector({ sessions, selectedId, onChange }: Props) {
  if (sessions.length === 0) return null

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3">
      <span className="text-xs text-gray-400 shrink-0">Viewing session</span>
      <select
        value={selectedId ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-white"
      >
        {sorted.map(s => (
          <option key={s.id} value={s.id}>
            {s.track} · {s.date} · {s.weather}
          </option>
        ))}
      </select>
    </div>
  )
}