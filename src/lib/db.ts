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
  frontWing: number      // 1–11
  rearWing: number       // 1–11
  differential: number   // 50–100
  suspensionFront: number // 1–11
  suspensionRear: number  // 1–11
}

export interface Stint {
  compound: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet'
  laps: Lap[]
}

export interface Lap {
  lapNumber: number
  lapTime: string        // "1:23.456"
  sector1: string        // "28.123"
  sector2: string
  sector3: string
}

// --- Database ---

class MonopostoDB extends Dexie {
  sessions!: Table<Session>

  constructor() {
    super('MonopostoDB')
    this.version(1).stores({
      sessions: '++id, track, date'
    })
  }
}

export const db = new MonopostoDB()