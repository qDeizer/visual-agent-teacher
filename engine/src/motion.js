// Motion helpers. GSAP plugins render on every frame *and on every seek* (callbacks do not run on seek), so counting
// numbers and curved paths stay correct when the learner jumps or goes back.
import { fmt } from './util.js'

/** Motion tokens (seconds at engine 1×; the player runs at 0.5× by default). */
export const M = {
  focus: 0.25, enter: 0.45, exit: 0.25, draw: 0.7, travel: 0.9, into: 0.5, settle: 0.25, camera: 1.4, count: 0.6, color: 0.4,
  lead: 0.12, // anticipation before a flight
}
export const EASE = {
  enter: 'back.out(1.6)', exit: 'power2.in', travel: 'power2.inOut', settle: 'power2.out', land: 'back.out(3)', count: 'power2.out', focus: 'power2.out',
}

const parseNum = s => {
  if (typeof s !== 'string') return NaN
  const t = s.trim().replace('−', '-').replace(/^%/, '').replace(/%$/, '')
  if (!/^-?\d+([.,]\d+)?$/.test(t)) return NaN
  return Number(t.replace(',', '.'))
}
export const numericText = s => Number.isFinite(parseNum(s))
const decimals = s => { const m = String(s).match(/[.,](\d+)/); return m ? m[1].length : 0 }

/** Point on a quadratic arc from a to b, lifted by `lift` at the middle. */
export function arcPoint(a, b, lift, r) {
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 - lift
  const u = 1 - r
  return { x: u * u * a.x + 2 * u * r * cx + r * r * b.x, y: u * u * a.y + 2 * u * r * cy + r * r * b.y }
}
export const arcLift = (a, b) => Math.min(120, Math.abs(b.x - a.x) * 0.25 + 30)

export function registerMotion(gsap) {
  // { vatNum: { from: '0,56', to: '0,82', lang } } — counts between two formatted numbers
  gsap.registerPlugin({
    name: 'vatNum',
    init(target, v) {
      this.t = target; this.fromS = v.from; this.toS = v.to; this.lang = v.lang
      this.a = parseNum(v.from); this.b = parseNum(v.to); this.dp = Math.max(decimals(v.from), decimals(v.to))
      this.pct = /%/.test(v.to)
    },
    render(ratio, d) {
      if (ratio <= 0) { d.t.textContent = d.fromS; return }
      if (ratio >= 1) { d.t.textContent = d.toS; return }
      let s = fmt(d.a + (d.b - d.a) * ratio, d.dp, d.lang)
      if (d.pct) s = /^tr/i.test(d.lang) ? `%${s}` : `${s}%`
      d.t.textContent = s
    },
  })
  // { vatArc: { from: {x,y}, to: {x,y}, lift, shrink } } — flies along a curved path (sets the transform attribute)
  gsap.registerPlugin({
    name: 'vatArc',
    init(target, v) { this.t = target; this.v = v },
    render(ratio, d) {
      const { from, to, lift = arcLift(from, to), shrink = 0.08 } = d.v
      const p = arcPoint(from, to, lift, ratio)
      const s = 1 - shrink * Math.sin(Math.PI * Math.min(1, Math.max(0, ratio)))
      d.t.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${s.toFixed(4)})`)
    },
  })
  // { vatPoly: { pts: [{x,y}…], dx, dy } } — moves along a polyline by arc length (one easing for the whole path)
  gsap.registerPlugin({
    name: 'vatPoly',
    init(target, v) {
      this.t = target; this.pts = v.pts; this.dx = v.dx || 0; this.dy = v.dy || 0
      const L = [0]
      for (let i = 1; i < v.pts.length; i++) L.push(L[i - 1] + Math.hypot(v.pts[i].x - v.pts[i - 1].x, v.pts[i].y - v.pts[i - 1].y))
      this.L = L
    },
    render(ratio, d) {
      const total = d.L[d.L.length - 1] || 1, want = Math.min(1, Math.max(0, ratio)) * total
      let i = 1
      while (i < d.L.length - 1 && d.L[i] < want) i++
      const a = d.pts[i - 1], b = d.pts[i], seg = (d.L[i] - d.L[i - 1]) || 1, k = (want - d.L[i - 1]) / seg
      d.t.setAttribute('transform', `translate(${(a.x + (b.x - a.x) * k + d.dx).toFixed(2)} ${(a.y + (b.y - a.y) * k + d.dy).toFixed(2)})`)
    },
  })
}

/** Resolve "var(--r1)" to a concrete colour so it can be tweened. */
export function resolveColor(v) {
  const m = /^var\((--[\w-]+)\)$/.exec(String(v || '').trim())
  if (!m) return v
  const c = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim()
  return c || v
}
