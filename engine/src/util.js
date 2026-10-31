// Small shared helpers. No DOM here (also used by the Node build script).

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/** Seeded PRNG (mulberry32). */
export function rng(seed = 1) {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    float(min, max, step) {
      const v = min + next() * (max - min)
      return step ? clamp(Math.round((v - min) / step) * step + min, min, max) : v
    },
    int(min, max) { return Math.floor(min + next() * (max - min + 1)) },
    pick(xs) { return xs[Math.floor(next() * xs.length)] },
  }
}

/** Number formatting for display. Uses the lesson language's decimal separator and a real minus sign. */
export function fmt(n, dp, lang = 'en') {
  if (typeof n === 'string') return n
  if (n === null || n === undefined) return '—'
  if (!Number.isFinite(n)) return String(n)
  let d = dp
  if (d === undefined) {
    const a = Math.abs(n)
    d = Number.isInteger(n) ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4
  }
  let s = n.toFixed(d)
  if (dp === undefined && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  if (/^-0(\.0*)?$/.test(s)) s = s.slice(1)
  const comma = /^(tr|de|fr|es|it|pt|ru|nl|pl|cs|sv|da|fi|nb|az)/i.test(lang)
  if (comma) s = s.replace('.', ',')
  return s.replace(/^-/, '−')
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 1; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}

// Common non-English guesses → real API names (models sometimes translate method names).
const ALIASES = {
  bol: 'split', bol2: 'split', bolun: 'split', tasi: 'moveTo', tasi2: 'moveTo', tasimak: 'moveTo', move: 'moveTo',
  soldur: 'dim', goster: 'show', gizle: 'hide', parlat: 'glow', titre: 'jitter', vurgula: 'highlight',
  sec: 'select', etiketle: 'tag', nabiz: 'pulse', buyut: 'scaleTo', scale: 'scaleTo', fade: 'dim',
  fadeIn: 'show', fadeOut: 'hide', appear: 'show', disappear: 'hide', wait: 'pause', sleep: 'pause',
  parallel: 'together', narrate: 'say', text: 'setText', value: 'setValue', color: 'recolor', emphasize: 'highlight',
}

/** Suggest the closest names for an unknown property. */
export function suggest(name, options) {
  const out = []
  if (ALIASES[name] && options.includes(ALIASES[name])) out.push(ALIASES[name])
  const lower = String(name).toLowerCase()
  options
    .map(o => [o, levenshtein(lower, o.toLowerCase())])
    .filter(([o, d]) => d <= Math.max(2, Math.floor(o.length / 3)) || o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()))
    .sort((a, b) => a[1] - b[1])
    .forEach(([o]) => { if (!out.includes(o)) out.push(o) })
  return out.slice(0, 3)
}

export class VatError extends Error {
  constructor(message, hint) { super(message); this.name = 'VatError'; this.hint = hint }
}

/**
 * Wrap an API object so that a misspelled/unknown member throws a helpful error instead of
 * "x is not a function". `label` is the type name shown to the lesson author.
 */
export function guard(target, label) {
  return new Proxy(target, {
    get(t, p, r) {
      if (typeof p === 'symbol' || p in t) return Reflect.get(t, p, r)
      if (p === 'then' || p === 'toJSON' || p === 'constructor' || p.startsWith('_') || p === '$$typeof') return undefined
      const opts = publicMembers(t)
      const s = suggest(p, opts)
      throw new VatError(
        `${label} has no member '${String(p)}'.` + (s.length ? ` Did you mean ${s.map(x => `'${x}'`).join(' or ')}?` : '') +
        ` Available: ${opts.join(', ')}.`,
      )
    },
  })
}

export function publicMembers(obj) {
  const names = new Set()
  let o = obj
  while (o && o !== Object.prototype) {
    for (const k of Object.getOwnPropertyNames(o)) if (!k.startsWith('_') && k !== 'constructor') names.add(k)
    o = Object.getPrototypeOf(o)
  }
  return [...names].sort()
}

/** "Nice" axis ticks. */
export function niceTicks(a, b, count = 6) {
  const span = b - a
  if (!(span > 0)) return [a]
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) || 10 * mag
  const out = []
  for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push(Math.round(v / step) * step)
  return out
}

export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
