import { useState } from 'react'
import { db, type Session, type CarSetup, type Stint, type Lap, calcDownforce, downforceLabel } from '../lib/db'

const TRACKS = [
  'Bahrain', 'Saudi Arabia', 'Australia', 'Japan', 'China',
  'Miami', 'Emilia Romagna', 'Monaco', 'Canada', 'Spain',
  'Austria', 'Britain', 'Hungary', 'Belgium', 'Netherlands',
  'Monza', 'Azerbaijan', 'Singapore', 'USA', 'Mexico',
  'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi'
]

const COMPOUNDS = ['Soft', 'Medium', 'Hard', 'Inter', 'Wet'] as const
const ENGINE_MODES = ['Standard', 'Performance', 'Qualifying'] as const

const defaultSetup: CarSetup = {
  frontWing: 5,
  rearWing: 5,
  differential: 75,
  suspensionFront: 5,
  suspensionRear: 5,
  brakeBalance: 57,
  engineMode: 'Standard',
}

const emptyLap = (lapNumber: number): Lap => ({
  lapNumber,
  lapTime: '',
  sector1: '',
  sector2: '',
  sector3: '',
})

const emptyStint = (): Stint => ({
  compound: 'Medium',
  laps: [emptyLap(1)],
})

const ENGINE_MODE_COLORS: Record<string, string> = {
  Standard:    'bg-gray-700 text-gray-200',
  Performance: 'bg-yellow-600/30 text-yellow-400',
  Qualifying:  'bg-red-600/30 text-red-400',
}

export default function SessionForm({ onSaved }: { onSaved: () => void }) {
  const [track, setTrack] = useState(TRACKS[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weather, setWeather] = useState<Session['weather']>('Dry')
  const [setup, setSetup] = useState<CarSetup>(defaultSetup)
  const [stints, setStints] = useState<Stint[]>([emptyStint()])
  const [saving, setSaving] = useState(false)

  const updateSetup = (key: keyof CarSetup, value: number | string) =>
    setSetup(prev => ({ ...prev, [key]: value }))

  const addStint = () => setStints(prev => [...prev, emptyStint()])

  const updateCompound = (si: number, compound: Stint['compound']) =>
    setStints(prev => prev.map((s, i) => i === si ? { ...s, compound } : s))

  const addLap = (si: number) =>
    setStints(prev => prev.map((s, i) => {
      if (i !== si) return s
      const nextLap = s.laps.length + 1
      return { ...s, laps: [...s.laps, emptyLap(nextLap)] }
    }))

  const updateLap = (si: number, li: number, field: keyof Lap, value: string) =>
    setStints(prev => prev.map((s, i) => {
      if (i !== si) return s
      return {
        ...s,
        laps: s.laps.map((l, j) => j === li ? { ...l, [field]: value } : l)
      }
    }))

  const removeLap = (si: number, li: number) =>
    setStints(prev => prev.map((s, i) => {
      if (i !== si) return s
      return { ...s, laps: s.laps.filter((_, j) => j !== li) }
    }))

  const handleSave = async () => {
    setSaving(true)
    await db.sessions.add({ track, date, weather, carSetup: setup, stints })
    setSaving(false)
    onSaved()
  }

  const downforce = calcDownforce(setup)
  const dfLabel = downforceLabel(downforce)
  const dfColor =
    downforce <= 3 ? 'text-blue-400' :
    downforce <= 6 ? 'text-green-400' :
    downforce <= 9 ? 'text-yellow-400' :
    'text-red-400'

  return (
    <div className="space-y-8">

      {/* Session Info */}
      <section className="bg-gray-900 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-medium">Session Info</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Track</label>
            <select
              value={track}
              onChange={e => setTrack(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
            >
              {TRACKS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Weather</label>
            <select
              value={weather}
              onChange={e => setWeather(e.target.value as Session['weather'])}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
            >
              {['Dry', 'Wet', 'Mixed'].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Car Setup */}
      <section className="bg-gray-900 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Car Setup</h2>
          {/* Downforce display */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-400">Downforce</span>
            <span className={`text-sm font-medium ${dfColor}`}>
              {downforce} — {dfLabel}
            </span>
          </div>
        </div>

        {/* Wing sliders */}
        <div className="grid grid-cols-2 gap-6">
          {([
            ['frontWing',       'Front Wing',       1,  11],
            ['rearWing',        'Rear Wing',         1,  11],
            ['differential',    'Differential',      50, 100],
            ['suspensionFront', 'Suspension Front',  1,  11],
            ['suspensionRear',  'Suspension Rear',   1,  11],
            ['brakeBalance',    'Brake Balance (%)', 50, 70],
          ] as [keyof CarSetup, string, number, number][]).map(([key, label, min, max]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium">
                  {setup[key as keyof CarSetup]}
                  {key === 'brakeBalance' ? '%' : ''}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={setup[key as keyof CarSetup] as number}
                onChange={e => updateSetup(key, Number(e.target.value))}
                className="w-full accent-red-500"
              />
              {/* Brake balance visual indicator */}
              {key === 'brakeBalance' && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Front {setup.brakeBalance}%</span>
                  <span>Rear {100 - setup.brakeBalance}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Engine Mode */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Engine Mode</label>
          <div className="flex gap-2">
            {ENGINE_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => updateSetup('engineMode', mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  setup.engineMode === mode
                    ? ENGINE_MODE_COLORS[mode]
                    : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            {setup.engineMode === 'Standard'    && 'Balanced power and reliability — suitable for full race distance.'}
            {setup.engineMode === 'Performance' && 'Increased power output — moderate engine wear over a race distance.'}
            {setup.engineMode === 'Qualifying'  && 'Maximum power — high wear, short stints only.'}
          </p>
        </div>
      </section>

      {/* Stints */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Stints</h2>
          <button
            onClick={addStint}
            className="text-sm text-red-400 hover:text-red-300"
          >
            + Add stint
          </button>
        </div>

        {stints.map((stint, si) => (
          <div key={si} className="bg-gray-900 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Stint {si + 1}</span>
              <div className="flex gap-2">
                {COMPOUNDS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateCompound(si, c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      stint.compound === c
                        ? compoundColor(c)
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 px-1">
                <span>Lap</span>
                <span>Lap Time</span>
                <span>S1</span>
                <span>S2</span>
                <span>S3</span>
              </div>
              {stint.laps.map((lap, li) => (
                <div key={li} className="grid grid-cols-5 gap-2 items-center">
                  <span className="text-sm text-gray-400 px-1">{lap.lapNumber}</span>
                  {(['lapTime', 'sector1', 'sector2', 'sector3'] as (keyof Lap)[]).map(field => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field === 'lapTime' ? '1:23.456' : '28.123'}
                      value={lap[field] as string}
                      onChange={e => updateLap(si, li, field, e.target.value)}
                      className="bg-gray-800 rounded-lg px-2 py-1.5 text-sm w-full"
                    />
                  ))}
                  <button
                    onClick={() => removeLap(si, li)}
                    className="text-gray-600 hover:text-red-400 text-xs col-span-1 text-right"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addLap(si)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              + Add lap
            </button>
          </div>
        ))}
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl py-3 font-medium transition-colors"
      >
        {saving ? 'Saving...' : 'Save Session'}
      </button>
    </div>
  )
}

function compoundColor(c: string) {
  const map: Record<string, string> = {
    Soft:   'bg-red-600 text-white',
    Medium: 'bg-yellow-500 text-black',
    Hard:   'bg-white text-black',
    Inter:  'bg-green-600 text-white',
    Wet:    'bg-blue-600 text-white',
  }
  return map[c] ?? 'bg-gray-700 text-white'
}