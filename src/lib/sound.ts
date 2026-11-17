// Synthwave-Soundeffekte, komplett per Web Audio API erzeugt (keine Audiodateien, keine Fremd-Assets).
import { getPrefs } from './prefs'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let echo: { input: GainNode } | null = null
let reverb: ConvolverNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)

    // Feedback-Delay für den 80er-Hall
    const input = ctx.createGain()
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.28
    const fb = ctx.createGain()
    fb.gain.value = 0.32
    const wet = ctx.createGain()
    wet.gain.value = 0.35
    input.connect(delay)
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(wet)
    wet.connect(master)
    echo = { input }

    // Künstlicher Raumhall aus Rauschen
    reverb = ctx.createConvolver()
    const len = ctx.sampleRate * 2.2
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5)
    }
    reverb.buffer = buf
    const revGain = ctx.createGain()
    revGain.gain.value = 0.5
    reverb.connect(revGain)
    revGain.connect(master)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Browser erlauben Audio erst nach einer Nutzer-Geste: beim ersten Tippen entsperren. */
export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    if (getPrefs().sound || getPrefs().station) audio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

interface ToneOpts {
  type?: OscillatorType
  f: number
  fEnd?: number
  start?: number
  dur: number
  vol?: number
  attack?: number
  detune?: number
  cutoff?: number
  fx?: 'echo' | 'reverb'
  out?: AudioNode
}

function tone({ type = 'sawtooth', f, fEnd, start = 0, dur, vol = 0.2, attack = 0.01, detune = 0, cutoff, fx, out }: ToneOpts) {
  const ac = audio()
  if (!ac || !master) return
  const t = ac.currentTime + start
  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(f, t)
  if (fEnd) osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur)
  osc.detune.value = detune
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  let node: AudioNode = osc
  if (cutoff) {
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = cutoff
    osc.connect(lp)
    node = lp
  }
  node.connect(g)
  g.connect(out ?? master)
  if (fx === 'echo' && echo) g.connect(echo.input)
  if (fx === 'reverb' && reverb) g.connect(reverb)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function noise({ start = 0, dur, vol = 0.2, hp, lp, fx }: { start?: number; dur: number; vol?: number; hp?: number; lp?: number; fx?: 'reverb' }) {
  const ac = audio()
  if (!ac || !master) return
  const t = ac.currentTime + start
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  let node: AudioNode = src
  if (hp) {
    const f = ac.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = hp
    node.connect(f)
    node = f
  }
  if (lp) {
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = lp
    node.connect(f)
    node = f
  }
  const g = ac.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  node.connect(g)
  g.connect(master)
  if (fx === 'reverb' && reverb) g.connect(reverb)
  src.start(t)
}

const enabled = () => getPrefs().sound

export const sfx = {
  /** Leises UI-Tick */
  click() {
    if (!enabled()) return
    tone({ type: 'square', f: 1400, fEnd: 900, dur: 0.04, vol: 0.04, attack: 0.002 })
  },
  /** Synthwave-Arpeggio + Akkord für Erfolge */
  success() {
    if (!enabled()) return
    const arp = [57, 61, 64, 69, 73, 76] // A-Dur aufwärts
    arp.forEach((n, i) => tone({ type: 'square', f: freq(n), start: i * 0.07, dur: 0.18, vol: 0.07, cutoff: 3200, fx: 'echo' }))
    ;[57, 61, 64, 69].forEach((n) => {
      tone({ type: 'sawtooth', f: freq(n), start: 0.42, dur: 1.4, vol: 0.06, attack: 0.05, detune: -8, cutoff: 2200, fx: 'reverb' })
      tone({ type: 'sawtooth', f: freq(n), start: 0.42, dur: 1.4, vol: 0.06, attack: 0.05, detune: 8, cutoff: 2200 })
    })
    tone({ type: 'triangle', f: freq(45), start: 0.42, dur: 1.2, vol: 0.18 })
  },
  /** Tiefer, abfallender Ton mit dumpfem Schlag */
  wasted() {
    if (!enabled()) return
    noise({ dur: 0.5, vol: 0.5, lp: 180, fx: 'reverb' })
    tone({ type: 'sine', f: 90, fEnd: 35, dur: 0.6, vol: 0.5 })
    tone({ type: 'sawtooth', f: 220, fEnd: 55, start: 0.15, dur: 1.8, vol: 0.12, attack: 0.08, cutoff: 900, fx: 'reverb' })
    tone({ type: 'sawtooth', f: 233, fEnd: 58, start: 0.15, dur: 1.8, vol: 0.1, attack: 0.08, cutoff: 900 })
  },
  /** Kurze, leise Zwei-Ton-Sirene */
  siren(cycles = 3) {
    if (!enabled()) return
    for (let i = 0; i < cycles * 2; i++) {
      tone({ type: 'square', f: i % 2 ? 960 : 720, start: i * 0.28, dur: 0.27, vol: 0.035, attack: 0.02, cutoff: 2400 })
    }
  },
  /** Kassen-Klingeln */
  cash(big = false) {
    if (!enabled()) return
    noise({ dur: 0.08, vol: 0.25, hp: 3000 })
    tone({ type: 'triangle', f: 2093, start: 0.06, dur: 0.5, vol: 0.14, fx: 'echo' })
    tone({ type: 'triangle', f: 2637, start: 0.13, dur: big ? 1 : 0.6, vol: 0.14, fx: 'echo' })
    if (big) [3136, 4186].forEach((f, i) => tone({ type: 'sine', f, start: 0.25 + i * 0.1, dur: 0.9, vol: 0.08, fx: 'echo' }))
  },
  /** Handy-Benachrichtigung */
  ping() {
    if (!enabled()) return
    tone({ type: 'sine', f: 1318, dur: 0.12, vol: 0.12, fx: 'echo' })
    tone({ type: 'sine', f: 1760, start: 0.1, dur: 0.22, vol: 0.12, fx: 'echo' })
  },
  /** Donnergrollen fürs Gewitter (sehr leise) */
  thunder() {
    // Nur wenn Audio schon durch eine Nutzer-Geste entsperrt ist (kein Autoplay-Warnhinweis)
    if (!enabled() || !ctx || ctx.state !== 'running') return
    noise({ dur: 2.2, vol: 0.12, lp: 120, fx: 'reverb' })
  },
}

// ---------- Ambient-Synthwave-Loop (Am – F – C – G) ----------
let musicTimer: number | null = null
let musicGain: GainNode | null = null
let musicVolume = 1

/** Lautstärke des Live-Synth-Senders (0–1), z. B. fürs Ducking. */
export function setMusicVolume(v: number, rampSeconds = 0.3) {
  musicVolume = v
  if (ctx && musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime)
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), ctx.currentTime)
    musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.5 * v), ctx.currentTime + rampSeconds)
  }
}

/** Radio-Rauschen beim Senderwechsel (läuft auch, wenn Soundeffekte aus sind). */
export function radioStatic(dur = 0.45) {
  noise({ dur, vol: 0.16, hp: 600, lp: 4200 })
  tone({ type: 'sine', f: 2400, fEnd: 600, dur: dur * 0.8, vol: 0.02 })
}

export function startMusic() {
  const ac = audio()
  if (!ac || !master || musicTimer !== null) return
  musicGain = ac.createGain()
  musicGain.gain.setValueAtTime(0.0001, ac.currentTime)
  musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.5 * musicVolume), ac.currentTime + 2)
  musicGain.connect(master)
  if (reverb) musicGain.connect(reverb)

  const chords = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
  ]
  const beat = 60 / 92 // Tempo 92 bpm
  let bar = 0
  let next = ac.currentTime + 0.1

  const schedule = () => {
    if (!musicGain) return
    while (next < ac.currentTime + 1.5) {
      const chord = chords[bar % chords.length]!
      const startIn = next - ac.currentTime
      chord.forEach((n) => {
        tone({ type: 'sawtooth', f: freq(n), start: startIn, dur: beat * 4, vol: 0.03, attack: 0.6, detune: -10, cutoff: 1100, out: musicGain! })
        tone({ type: 'sawtooth', f: freq(n), start: startIn, dur: beat * 4, vol: 0.03, attack: 0.6, detune: 10, cutoff: 1100, out: musicGain! })
      })
      for (let i = 0; i < 8; i++) {
        tone({ type: 'triangle', f: freq(chord[0]! - 24), start: startIn + i * (beat / 2), dur: beat / 2.2, vol: 0.09, out: musicGain! })
        const arpNote = chord[i % 3]! + 12
        tone({ type: 'square', f: freq(arpNote), start: startIn + i * (beat / 2), dur: beat / 3, vol: 0.012, cutoff: 2600, out: musicGain! })
      }
      next += beat * 4
      bar++
    }
  }
  schedule()
  musicTimer = window.setInterval(schedule, 400)
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer)
  musicTimer = null
  if (ctx && musicGain) {
    const g = musicGain
    g.gain.cancelScheduledValues(ctx.currentTime)
    g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8)
    window.setTimeout(() => g.disconnect(), 1000)
  }
  musicGain = null
}
