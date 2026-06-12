import { useEffect, useState } from 'react'

interface Props {
  onEnter: () => void
}

const FEATURES = [
  {
    icon: '⏱',
    title: 'Lap Times',
    description: 'Chart every lap across all stints. Spot consistency, track improvements, identify where time is lost.'
  },
  {
    icon: '🔴',
    title: 'Tyre Wear',
    description: 'Visualise degradation curves per stint. Know exactly how much time your tyres are costing you per lap.'
  },
  {
    icon: '⚙️',
    title: 'Setup Analyser',
    description: 'Correlate wing angles, brake balance, and engine mode against your best lap times on each circuit.'
  },
  {
    icon: '👤',
    title: 'Driver Progress',
    description: 'Track personal bests, consistency ratings, and improvement trends across every session you log.'
  },
]

export default function Landing({ onEnter }: Props) {
  const [visible, setVisible] = useState(false)
  const [featuresVisible, setFeaturesVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100)
    const t2 = setTimeout(() => setFeaturesVisible(true), 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center relative overflow-hidden">

        {/* Background grid lines — subtle racing aesthetic */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ef4444 1px, transparent 1px),
              linear-gradient(to bottom, #ef4444 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Red accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 bg-red-600"
          style={{
            transform: visible ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'left',
          }}
        />

        {/* Tag line */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            transitionDelay: '0.1s',
          }}
        >
          <span className="text-xs tracking-[0.3em] text-red-500 uppercase font-medium">
            Telemetry Analyser
          </span>
        </div>

        {/* Main title */}
        <h1
          className="mt-4 text-7xl font-bold tracking-tight"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            transitionDelay: '0.2s',
            letterSpacing: '-0.03em',
          }}
        >
          Mono<span className="text-red-500">posto</span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            transitionDelay: '0.35s',
          }}
        >
          Log your race sessions. Analyse lap times, tyre behaviour, and car setup.
          Compare against benchmark data. Get faster.
        </p>

        {/* CTA button */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            transitionDelay: '0.5s',
          }}
        >
          <button
            onClick={onEnter}
            className="mt-10 group relative px-10 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Enter Dashboard</span>
            <div className="absolute inset-0 rounded-xl bg-red-400 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>

        {/* Scroll hint */}
        <div
          className="mt-16 flex flex-col items-center gap-2"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease',
            transitionDelay: '0.9s',
          }}
        >
          <span className="text-xs text-gray-600 tracking-widest uppercase">Scroll to explore</span>
          <div
            className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Features section */}
      <div className="px-6 pb-24 max-w-4xl mx-auto w-full">

        <div
          className="text-center mb-12"
          style={{
            opacity: featuresVisible ? 1 : 0,
            transform: featuresVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">Everything you need to improve</h2>
          <p className="text-gray-500 mt-2 text-sm">Four analytical views, one unified dashboard.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-900 transition-colors duration-300 cursor-pointer group"
              style={{
                opacity: featuresVisible ? 1 : 0,
                transform: featuresVisible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease`,
                transitionDelay: `${0.1 + i * 0.08}s`,
              }}
              onClick={onEnter}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-12 text-center"
          style={{
            opacity: featuresVisible ? 1 : 0,
            transition: 'opacity 0.6s ease',
            transitionDelay: '0.5s',
          }}
        >
          <button
            onClick={onEnter}
            className="text-sm text-red-500 hover:text-red-400 transition-colors underline underline-offset-4"
          >
            Start logging your sessions →
          </button>
          <p className="text-xs text-gray-700 mt-3">
            No account needed · All data stored locally in your browser
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-900 to-transparent" />
    </div>
  )
}