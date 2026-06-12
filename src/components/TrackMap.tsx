interface Props {
  highlightedSector?: 1 | 2 | 3 | null
  onSectorClick?: (sector: 1 | 2 | 3 | null) => void
  activeSector?: 1 | 2 | 3 | null
  size?: 'small' | 'large'
}

type Sector = 1 | 2 | 3

const SECTOR_COLORS: Record<Sector, string> = {
  1: '#ef4444',
  2: '#0ea5e9',
  3: '#facc15',
}

const SECTOR_PATHS: Record<Sector, string> = {
  1: 'M 523 480 L 185 480 Q 210 476 198 448 L 173 395 Q 164 374 168 350 L 212 92 Q 218 55 254 55 Q 277 55 300 82 L 348 140 Q 381 178 426 198',
  2: 'M 426 198 Q 477 214 481 259 Q 480 292 444 297 L 374 286 Q 313 278 283 313 L 251 353 Q 236 374 269 378 L 563 378 Q 620 376 598 318 Q 588 286 544 268 Q 494 244 515 184',
  3: 'M 515 184 Q 529 122 572 88 Q 609 57 643 99 L 813 392 Q 840 435 798 480 L 529 480',
}

const CORNERS = [
  { id: '01', x: 115, y: 472 },
  { id: '02', x: 205, y: 430 },
  { id: '03', x: 128, y: 347 },
  { id: '04', x: 229, y: 48 },
  { id: '05', x: 386, y: 177 },
  { id: '06', x: 472, y: 190 },
  { id: '07', x: 430, y: 270 },
  { id: '08', x: 600, y: 355 },
  { id: '09', x: 355, y: 317 },
  { id: '10', x: 238, y: 352 },
  { id: '11', x: 785, y: 354 },
  { id: '12', x: 620, y: 256 },
  { id: '13', x: 675, y: 82 },
  { id: '14', x: 820, y: 452 },
  { id: '15', x: 773, y: 498 },
]

const DRS_ZONES = [
  { label: 'DRS\nDETECTION\nZONE 1', x: 92, y: 542, width: 132, height: 58, line: 'M 158 542 L 158 480' },
  { label: 'DRS\nDETECTION\nZONE 2', x: 255, y: 216, width: 148, height: 62, line: 'M 360 278 L 360 318' },
  { label: 'DRS\nDETECTION\nZONE 3', x: 787, y: 286, width: 143, height: 62, line: 'M 859 348 L 859 436 L 806 436' },
]

function isSectorEmphasized(
  sector: Sector,
  activeSector?: Sector | null,
  highlightedSector?: Sector | null,
) {
  return activeSector === sector || highlightedSector === sector
}

function sectorOpacity(
  sector: Sector,
  activeSector?: Sector | null,
  highlightedSector?: Sector | null,
) {
  if (isSectorEmphasized(sector, activeSector, highlightedSector)) return 1
  if (activeSector || highlightedSector) return 0.28
  return 0.92
}

function CheckeredFlag({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 12 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        return (
          <rect
            key={i}
            x={col * 8}
            y={row * 8}
            width="8"
            height="8"
            fill={(row + col) % 2 === 0 ? '#ffffff' : '#050505'}
          />
        )
      })}
    </g>
  )
}

function DrsBox({ label, x, y, width, height, line }: (typeof DRS_ZONES)[number]) {
  return (
    <g>
      <path d={line} fill="none" stroke="#00d000" strokeWidth="4" strokeLinecap="round" />
      <rect x={x} y={y} width={width} height={height} rx="5" fill="#00c800" />
      {label.split('\n').map((part, index) => (
        <text
          key={part}
          x={x + width / 2}
          y={y + 21 + index * 16}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="800"
        >
          {part}
        </text>
      ))}
    </g>
  )
}

function CircuitLines({
  activeSector,
  highlightedSector,
  onSectorClick,
  compact = false,
}: {
  activeSector?: Sector | null
  highlightedSector?: Sector | null
  onSectorClick?: (sector: Sector | null) => void
  compact?: boolean
}) {
  return (
    <>
      <path
        d={`${SECTOR_PATHS[1]} ${SECTOR_PATHS[2].replace('M 426 198', '')} ${SECTOR_PATHS[3].replace('M 515 184', '')}`}
        fill="none"
        stroke="#171827"
        strokeWidth={compact ? 26 : 32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {([1, 2, 3] as const).map(sector => (
        <path
          key={sector}
          d={SECTOR_PATHS[sector]}
          fill="none"
          stroke={SECTOR_COLORS[sector]}
          strokeWidth={compact ? 6 : 8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={sectorOpacity(sector, activeSector, highlightedSector)}
          className={onSectorClick ? 'cursor-pointer' : ''}
          onClick={() => onSectorClick?.(activeSector === sector ? null : sector)}
        />
      ))}
    </>
  )
}

export function TrackThumbnail({ track }: { track: string }) {
  if (track !== 'Bahrain') {
    return (
      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
        <span className="text-gray-500 text-xs">Track</span>
      </div>
    )
  }

  return (
    <svg viewBox="80 35 860 575" width="48" height="34" aria-label="Bahrain track thumbnail">
      <rect x="80" y="35" width="860" height="575" rx="24" fill="#000000" />
      <CircuitLines compact />
      <CheckeredFlag x={512} y={445} />
    </svg>
  )
}

export default function TrackMap({
  highlightedSector,
  onSectorClick,
  activeSector,
  size = 'large',
}: Props) {
  const isLarge = size === 'large'
  const width = isLarge ? 620 : 180
  const height = isLarge ? 410 : 119

  return (
    <div className="space-y-3">
      <svg
        viewBox="70 25 890 590"
        width={width}
        height={height}
        className="max-w-full rounded-lg bg-black"
        role="img"
        aria-label="Bahrain International Circuit layout"
      >
        <rect x="70" y="25" width="890" height="590" fill="#000000" />

        <CircuitLines
          activeSector={activeSector}
          highlightedSector={highlightedSector}
          onSectorClick={onSectorClick}
        />

        <text x="167" y="282" fill="#ef4444" fontSize="15" fontWeight="800" transform="rotate(-82 167 282)">
          SECTOR 1
        </text>
        <text x="405" y="344" fill="#0ea5e9" fontSize="16" fontWeight="800" transform="rotate(5 405 344)">
          SECTOR 2
        </text>
        <text x="760" y="279" fill="#facc15" fontSize="15" fontWeight="800" transform="rotate(60 760 279)">
          SECTOR 3
        </text>

        {isLarge && (
          <>
            <path d="M 150 472 L 725 472" stroke="#00d000" strokeWidth="3" strokeDasharray="3 5" opacity="0.9" />
            <path d="M 178 330 L 219 70" stroke="#00d000" strokeWidth="3" strokeDasharray="3 5" opacity="0.9" />
            <path d="M 250 380 L 579 380" stroke="#00d000" strokeWidth="3" strokeDasharray="3 5" opacity="0.9" />

            {DRS_ZONES.map(zone => (
              <DrsBox key={zone.label} {...zone} />
            ))}

            <rect x="214" y="432" width="106" height="45" rx="5" fill="#ec00ff" />
            <text x="267" y="453" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">
              SPEED
            </text>
            <text x="267" y="471" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">
              TRAP
            </text>

            {CORNERS.map(corner => (
              <g key={corner.id}>
                <circle cx={corner.x} cy={corner.y} r="13" fill="#202231" stroke="#36384a" />
                <text
                  x={corner.x}
                  y={corner.y + 5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="800"
                >
                  {corner.id}
                </text>
              </g>
            ))}
          </>
        )}

        <CheckeredFlag x={512} y={445} />

        <circle cx="158" cy="480" r="8" fill="#00c800" />
        <circle cx="359" cy="318" r="8" fill="#00c800" />
        <circle cx="806" cy="436" r="8" fill="#00c800" />
        <circle cx="214" cy="480" r="8" fill="#ec00ff" />
      </svg>

      {isLarge && (
        <div className="flex gap-3 justify-center">
          {([1, 2, 3] as const).map(sector => (
            <button
              key={sector}
              onClick={() => onSectorClick?.(activeSector === sector ? null : sector)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
                activeSector === sector
                  ? 'bg-gray-700 font-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SECTOR_COLORS[sector] }}
              />
              Sector {sector}
            </button>
          ))}
          {activeSector && (
            <button
              onClick={() => onSectorClick?.(null)}
              className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
