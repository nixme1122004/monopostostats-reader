import { useEffect, useState } from 'react'
import { db, type Session } from './lib/db'
import SessionForm from './components/SessionForm'
import LapTimeChart from './components/LapTimeChart'
import TyreChart from './components/TyreChart'
import SetupCorrelator from './components/SetupCorrelator'
import DriverComparison from './components/DriverComparison'
import SessionSelector from './components/SessionSelector'

type View = 'log' | 'chart' | 'tyres' | 'setup' | 'driver'

const SESSION_VIEWS: View[] = ['chart', 'tyres']

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [view, setView] = useState<View>('log')

  const refresh = async () => {
    const all = await db.sessions.toArray()
    setSessions(all)
    if (all.length > 0 && selectedId === null) {
      setSelectedId(all[all.length - 1].id ?? null)
    }
  }

  useEffect(() => { refresh() }, [])

  const selectedSession = sessions.find(s => s.id === selectedId) ?? null

  const NAV: { key: View; label: string }[] = [
    { key: 'log', label: 'Log Session' },
    { key: 'chart', label: 'Lap Times' },
    { key: 'tyres', label: 'Tyre Wear' },
    { key: 'setup', label: 'Setup' },
    { key: 'driver', label: 'Driver' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Monoposto</h1>
            <p className="text-gray-400 mt-1">
              Telemetry Analyser · {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
            </p>
          </div>
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1 flex-wrap">
            {NAV.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Session selector — only on per-session views */}
        {SESSION_VIEWS.includes(view) && sessions.length > 0 && (
          <SessionSelector
            sessions={sessions}
            selectedId={selectedId}
            onChange={setSelectedId}
          />
        )}

        {/* Views */}
        {view === 'log' && (
          <SessionForm onSaved={() => {
            refresh()
            setView('chart')
          }} />
        )}
        {view === 'chart' && <LapTimeChart session={selectedSession} />}
        {view === 'tyres' && <TyreChart session={selectedSession} />}
        {view === 'setup' && <SetupCorrelator sessions={sessions} />}
        {view === 'driver' && <DriverComparison sessions={sessions} />}

      </div>
    </div>
  )
}

export default App