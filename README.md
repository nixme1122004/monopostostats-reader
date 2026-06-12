# 🏎️ Monoposto Telemetry Analyser

> A personal telemetry dashboard for [Monoposto](https://play.google.com/store/apps/details?id=com.gabama.monopostolite) — the mobile single-seater racing game.

**🔗 Live App → [https://nixme1122004.github.io/monopststats-reader/](https://nixme1122004.github.io/monopostostats-reader/)**

---

## What is this?

Monoposto Telemetry Analyser lets you log, track, and analyse your race sessions from the Monoposto mobile game. After each session, enter your lap times, tyre compounds, and car setup — and the dashboard builds up a personal performance database with charts and insights.

No backend. No account. Everything is stored locally in your browser.

---

## Features

### 📋 Log Session
Log everything from a race session:
- Track, date, and weather conditions
- Car setup (front/rear wing, differential, suspension)
- Multiple stints with tyre compound per stint
- Lap times and sector splits for every lap

### 📈 Lap Times
- Line chart showing lap time progression across all stints
- Each stint displayed in a different colour
- Full lap-by-lap table with sector times and compound

### 🔴 Tyre Wear
- Degradation curve per stint showing time lost vs lap 1
- Total and average degradation stats per stint
- Colour-coded by tyre compound (Soft/Medium/Hard/Inter/Wet)

### ⚙️ Setup Correlator
- Scatter charts showing which car settings gave the best lap times
- Best setup recommendation per track based on your history
- All sessions ranked by best lap time per track
- Requires 2+ sessions on the same track to activate

### 👤 Driver Progress
- Progress chart across all sessions (best lap + average lap)
- Personal bests per track as a horizontal bar chart
- Consistency tracker (lap time standard deviation)
- Full sessions table with all stats

---

## How to use

1. Open the **live app** link above
2. Click **Log Session** and fill in your race data after each Monoposto session
3. Switch between **Lap Times**, **Tyre Wear**, **Setup**, and **Driver** tabs to explore your data
4. Log more sessions over time — the Setup and Driver views get more useful the more data you have

> **Tip:** For best insights from the Setup Correlator, try different car settings across multiple sessions on the same track.

---

## Data & Privacy

All data is stored **locally in your browser** using IndexedDB. Nothing is sent to any server. Clearing your browser data will erase your session history — so consider exporting important sessions manually.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| Recharts | Charts and visualisations |
| Dexie.js | IndexedDB wrapper for local storage |
| Tailwind CSS | Styling |

---

## Running locally

```bash
git clone https://github.com/nixme1122004/monopststats-reader.git
cd monopststats-reader
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploying updates

```bash
git add .
git commit -m "your change"
git push
npm run deploy
```

---

## About

Built as a portfolio project by [Nithesh](https://github.com/nixme1122004) — a Computer Science student targeting Data/AI/ML roles, demonstrating frontend development, data visualisation, and browser-based storage.

---

*Not affiliated with GABAMA or the official Monoposto game.*
