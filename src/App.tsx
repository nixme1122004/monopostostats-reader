import { useEffect, useState } from 'react'
import { db, type Session } from './lib/db'
import Landing from './components/Landing'
import SessionForm from './components/SessionForm'
import LapTimeChart from './components/LapTimeChart'
import TyreChart from './components/TyreChart'
import SetupCorrelator from './components/SetupCorrelator'
import DriverComparison from './components/DriverComparison'
import SessionSelector from './components/SessionSelector'

type View = 'log' | 'chart' | 'tyres' | 'setup' | 'driver'

const SESSION_VIEWS: View[] = ['chart', 'tyres']

const VIEW_INFO: Record<View, { title: string; description: string }> = {
  log: {
    title: 'Log Session',
    description: 'Record your lap times, tyre stints, and car setup after each race.'
  },
  chart: {
    title: 'Lap Times',
    description: 'Visualise lap time progression across stints. Best, worst, and average laps highlighted. Compare against Bahrain benchmark data.'
  },
  tyres: {
    title: 'Tyre Wear',
    description: 'Track degradation per stint — how many seconds slower each lap becomes as tyres age.'
  },
  setup: {
    title: 'Setup Analyser',
    description: 'Discover which car settings produced your fastest laps on each circuit. Requires 2+ sessions on the same track.'
  },
  driver: {
    title: 'Driver Progress',
    description: 'Your improvement over time — personal bests, consistency rating, and session history across all tracks.'
  },
}

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [view, setView] = useState<View>('log')
  const [entering, setEntering] = useState(false)

  const refresh = async () => {
    const all = await db.sessions.toArray()
    setSessions(all)
    if (all.length > 0 && selectedId === null) {
      setSelectedId(all[all.length - 1].id ?? null)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleEnter = () => {
    setEntering(true)
    setTimeout(() => {
      setShowLanding(false)
      setEntering(false)
    }, 400)
  }

  const selectedSession = sessions.find(s => s.id === selectedId) ?? null

  const NAV: { key: View; label: string }[] = [
    { key: 'log',    label: 'Log Session' },
    { key: 'chart',  label: 'Lap Times'   },
    { key: 'tyres',  label: 'Tyre Wear'   },
    { key: 'setup',  label: 'Setup'       },
    { key: 'driver', label: 'Driver'      },
  ]

  if (showLanding) {
    return (
      <div
        style={{
          opacity: entering ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <Landing onEnter={handleEnter} />
      </div>
    )
  }

  const info = VIEW_INFO[view]

  return (
    <div
      className="min-h-screen bg-gray-950 text-white"
      style={{ animation: 'fadeIn 0.4s ease forwards' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-2 group"
          >
            <span className="text-xl font-bold tracking-tight">
              Mono<span className="text-red-500">posto</span>
            </span>
            <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors hidden sm:block">
              ← back to home
            </span>
          </button>
          <span className="text-xs text-gray-500">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Nav */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 flex-wrap">
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                view === key
                  ? 'bg-red-600 text-white scale-105'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Section info card */}
        <div className="border-l-2 border-red-700 pl-4 py-1">
          <p className="text-sm font-medium text-white">{info.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{info.description}</p>
        </div>

        {/* Session selector */}
        {SESSION_VIEWS.includes(view) && sessions.length > 0 && (
          <SessionSelector
            sessions={sessions}
            selectedId={selectedId}
            onChange={setSelectedId}
          />
        )}

        {/* Views */}
        {view === 'log'    && <SessionForm onSaved={() => { refresh(); setView('chart') }} />}
        {view === 'chart'  && <LapTimeChart session={selectedSession} />}
        {view === 'tyres'  && <TyreChart session={selectedSession} />}
        {view === 'setup'  && <SetupCorrelator sessions={sessions} />}
        {view === 'driver' && <DriverComparison sessions={sessions} />}

      </div>
    </div>
  )
}

export default App