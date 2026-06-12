import Dexie, { type Table } from 'dexie'

// --- Types ---

export interface Session {
  id?: number
  track: string
  date: string
  weather: 'Dry' | 'Wet' | 'Mixed'
  carSetup: CarSetup
  stints: Stint[]
}

export interface CarSetup {
  frontWing: number        // 1–11
  rearWing: number         // 1–11
  differential: number     // 50–100
  suspensionFront: number  // 1–11
  suspensionRear: number   // 1–11
  brakeBalance: number     // 50–70 (front bias %)
  engineMode: 'Standard' | 'Performance' | 'Qualifying'
}

export interface Stint {
  compound: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet'
  laps: Lap[]
}

export interface Lap {
  lapNumber: number
  lapTime: string
  sector1: string
  sector2: string
  sector3: string
}

// --- Derived helpers ---

// Downforce level derived from front + rear wing (1–11 scale)
export function calcDownforce(setup: CarSetup): number {
  return parseFloat(((setup.frontWing + setup.rearWing) / 2).toFixed(1))
}

// Downforce label for display
export function downforceLabel(level: number): string {
  if (level <= 3)  return 'Low'
  if (level <= 6)  return 'Medium'
  if (level <= 9)  return 'High'
  return 'Maximum'
}

// --- Database ---

class MonopostoDB extends Dexie {
  sessions!: Table<Session>

  constructor() {
    super('MonopostoDB')
    this.version(1).stores({
      sessions: '++id, track, date'
    })
    // Version 2 — adds brakeBalance + engineMode to carSetup
    this.version(2).stores({
      sessions: '++id, track, date'
    }).upgrade(tx => {
      return tx.table('sessions').toCollection().modify(session => {
        if (session.carSetup.brakeBalance === undefined) {
          session.carSetup.brakeBalance = 57
        }
        if (session.carSetup.engineMode === undefined) {
          session.carSetup.engineMode = 'Standard'
        }
      })
    })
  }
}

export const db = new MonopostoDB()

// --- Benchmark data types ---

export interface BenchmarkRecord {
  track: string
  tier: 'beginner' | 'intermediate' | 'pro'
  compound: string
  weather: string
  lapTime: string
  sector1: string
  sector2: string
  sector3: string
}

export interface BenchmarkData {
  track: string
  count: number
  records: BenchmarkRecord[]
}

// Lazy-load benchmark data for a track
const benchmarkCache: Record<string, BenchmarkData> = {}

export async function loadBenchmark(track: string): Promise<BenchmarkData | null> {
  if (benchmarkCache[track]) return benchmarkCache[track]

  const filename = track.toLowerCase().replace(/\s+/g, '_') + '_benchmark.json'
  try {
    const res = await fetch(`/data/${filename}`)
    if (!res.ok) return null
    const data: BenchmarkData = await res.json()
    benchmarkCache[track] = data
    return data
  } catch {
    return null
  }
}