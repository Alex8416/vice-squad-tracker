import { useEffect, useRef, useState } from 'react'
import { fx, type FxEvent } from '../lib/fx'
import { prefersReducedMotion } from '../lib/prefs'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  w: number
  h: number
  color: string
  kind: 'confetti' | 'money'
  wobble: number
}

const COLORS = ['#ff2e88', '#ff8a3d', '#00e5d4', '#ffd23f', '#b46bff', '#ffffff']

/** Vollbild-Effekte: Partikel auf einem Canvas, Blaulicht-Rand, Bildschirmwackeln. */
export default function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const raf = useRef(0)
  const [police, setPolice] = useState(0)

  useEffect(() => {
    const spawn = (kind: Particle['kind'], amount: number) => {
      const w = window.innerWidth
      for (let i = 0; i < amount; i++) {
        const money = kind === 'money'
        particles.current.push({
          kind,
          x: money ? Math.random() * w : w / 2 + (Math.random() - 0.5) * w * 0.3,
          y: money ? -40 - Math.random() * window.innerHeight * 0.8 : window.innerHeight * 0.55,
          vx: money ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 16,
          vy: money ? 1.5 + Math.random() * 2 : -10 - Math.random() * 12,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * (money ? 0.08 : 0.3),
          w: money ? 46 : 6 + Math.random() * 6,
          h: money ? 22 : 10 + Math.random() * 8,
          color: money ? '#3fbf6a' : COLORS[Math.floor(Math.random() * COLORS.length)]!,
          wobble: Math.random() * 10,
        })
      }
      if (!raf.current) raf.current = requestAnimationFrame(loop)
    }

    const loop = () => {
      const c = canvas.current
      const ctx = c?.getContext('2d')
      if (!c || !ctx) return
      const dpr = window.devicePixelRatio || 1
      if (c.width !== window.innerWidth * dpr) {
        c.width = window.innerWidth * dpr
        c.height = window.innerHeight * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const H = window.innerHeight
      particles.current = particles.current.filter((p) => p.y < H + 60)
      for (const p of particles.current) {
        if (p.kind === 'money') {
          p.wobble += 0.05
          p.x += p.vx + Math.sin(p.wobble) * 1.2
          p.y += p.vy
        } else {
          p.vy += 0.35
          p.vx *= 0.985
          p.x += p.vx
          p.y += p.vy
        }
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.kind === 'money') {
          // Eigener Fantasie-Geldschein: grün mit $-Zeichen
          ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.6 + 0.4)
          ctx.fillStyle = '#2f9e57'
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.strokeStyle = '#bff5cf'
          ctx.lineWidth = 1.5
          ctx.strokeRect(-p.w / 2 + 3, -p.h / 2 + 3, p.w - 6, p.h - 6)
          ctx.fillStyle = '#e6ffe9'
          ctx.font = 'bold 14px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('$', 0, 1)
        } else {
          ctx.fillStyle = p.color
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
        ctx.restore()
      }
      if (particles.current.length) raf.current = requestAnimationFrame(loop)
      else {
        raf.current = 0
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }

    const handle = (e: FxEvent) => {
      if (e.type === 'police') {
        setPolice((n) => n + 1)
        return
      }
      if (prefersReducedMotion()) return
      if (e.type === 'confetti') spawn('confetti', e.amount ?? 160)
      if (e.type === 'money') spawn('money', e.amount ?? 70)
      if (e.type === 'shake') {
        document.body.classList.remove('screen-shake')
        void document.body.offsetWidth
        document.body.classList.add('screen-shake')
        window.setTimeout(() => document.body.classList.remove('screen-shake'), 700)
      }
    }

    const off = fx.on(handle)
    return () => {
      off()
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [])

  return (
    <>
      <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
      {police > 0 && (
        <div
          key={police}
          aria-hidden
          className="police-lights pointer-events-none fixed inset-0 z-[55]"
          onAnimationEnd={() => setPolice(0)}
        />
      )}
    </>
  )
}
