// Eigener Sunset-Hintergrund mit Palmen-Silhouetten (keine Fremd-Assets)
function Palm({ x, scale, flip = false, delay = 0 }: { x: number; scale: number; flip?: boolean; delay?: number }) {
  return (
    <g transform={`translate(${x} 600) scale(${flip ? -scale : scale} ${scale})`} fill="#0b0420">
      <g className="palm-sway" style={{ animationDelay: `${delay}s` }}>
      <path d="M0 0 C 6 -80, 14 -170, 4 -260 L 14 -260 C 26 -170, 18 -80, 12 0 Z" />
      <g transform="translate(9 -262)">
        <path d="M0 0 C -40 -30, -90 -20, -120 20 C -80 -5, -40 -5, 0 6 Z" />
        <path d="M0 0 C -30 -50, -80 -70, -110 -55 C -70 -45, -35 -25, 0 4 Z" />
        <path d="M0 0 C 0 -45, 20 -80, 50 -95 C 30 -60, 18 -30, 4 4 Z" />
        <path d="M0 0 C 40 -40, 90 -40, 125 -10 C 85 -20, 45 -10, 2 6 Z" />
        <path d="M0 0 C 45 -10, 95 10, 115 50 C 80 20, 40 10, 0 8 Z" />
        <path d="M0 0 C -45 0, -85 30, -95 70 C -70 35, -35 18, 0 8 Z" />
      </g>
      </g>
    </g>
  )
}

export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0420_0%,#1a0b3d_45%,#4a1460_70%,#ff2e88_88%,#ff8a3d_100%)]" />
      <svg className="absolute bottom-0 left-1/2 h-[70vh] min-w-[900px] w-full -translate-x-1/2" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd23f" />
            <stop offset="0.55" stopColor="#ff8a3d" />
            <stop offset="1" stopColor="#ff2e88" />
          </linearGradient>
          <mask id="sun-stripes">
            <rect width="1000" height="600" fill="white" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x="0" y={400 + i * 22} width="1000" height={4 + i * 2} fill="black" />
            ))}
          </mask>
        </defs>
        <g className="sun-rise">
          <circle className="sun-pulse" cx="500" cy="420" r="210" fill="url(#sun)" mask="url(#sun-stripes)" opacity="0.9" />
        </g>
        {/* Meer-Horizont */}
        <rect x="0" y="540" width="1000" height="60" fill="#12062e" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            className="sea-glint"
            style={{ animationDelay: `${i * 0.7}s` }}
            x={260 - i * 40}
            y={550 + i * 12}
            width={480 + i * 80}
            height="2"
            fill="#ff8a3d"
          />
        ))}
      </svg>
      {/* Palmen an den Rändern verankert, damit sie auch auf dem Handy sichtbar sind */}
      <svg className="absolute bottom-0 left-0 h-[30vh] sm:h-[48vh] max-h-[460px]" viewBox="-60 300 260 300" preserveAspectRatio="xMinYMax meet">
        <Palm x={20} scale={1.1} />
        <Palm x={120} scale={0.75} flip delay={-2.5} />
      </svg>
      <svg className="absolute right-0 bottom-0 h-[27vh] sm:h-[44vh] max-h-[420px]" viewBox="-60 300 260 300" preserveAspectRatio="xMaxYMax meet">
        <Palm x={140} scale={1.05} flip delay={-4} />
        <Palm x={40} scale={0.7} delay={-1.2} />
      </svg>
      <div className="scanlines absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0b0420cc_100%)]" />
    </div>
  )
}
