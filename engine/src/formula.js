// Formula bar (HUD): a small TeX subset laid out as SVG so every part is addressable.
// Supported: x^{2}, x_{i}, \frac{a}{b}, \sqrt{x}, \text{..}, \slot{id}{tex}, greek letters, \cdot \times \div \pm
// \le \ge \neq \approx \to \infty \sum \prod \log \ln \exp \sin \cos \max \min, \left( \right), \, \; \quad.
import { VatError } from './util.js'
import { rec, svg, T, DUR } from './core.js'
import { ROOT, WORLD } from './stage.js'

const SYM = {
  cdot: '·', times: '×', div: '÷', pm: '±', le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', ne: '≠', approx: '≈', to: '→', rightarrow: '→',
  leftarrow: '←', infty: '∞', ldots: '…', cdots: '⋯', sum: 'Σ', prod: 'Π', partial: '∂', nabla: '∇', in: '∈', cdotp: '·', circ: '∘',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω', hat: '', bar: '',
}
const FUNCS = new Set(['log', 'ln', 'exp', 'sin', 'cos', 'tan', 'max', 'min', 'argmax', 'argmin', 'mod', 'lim', 'sgn', 'det'])
const BIN = new Set(['+', '−', '=', '<', '>', '≤', '≥', '≠', '≈', '×', '÷', '·', '±', '→', '∈'])

export function parseTex(src) {
  let i = 0
  const s = String(src)
  const peek = () => s[i]
  const readBraceRaw = () => {
    while (s[i] === ' ') i++
    if (s[i] !== '{') throw new VatError(`Formula: expected '{' at position ${i} in "${s}".`)
    let depth = 0, out = ''
    for (; i < s.length; i++) {
      if (s[i] === '{') { if (depth++) out += '{'; continue }
      if (s[i] === '}') { if (--depth === 0) { i++; return out } out += '}'; continue }
      out += s[i]
    }
    throw new VatError(`Formula: missing '}' in "${s}".`)
  }
  const parseArg = () => {
    while (s[i] === ' ') i++
    if (s[i] === '{') { i++; const r = parseRow('}'); return r }
    return parseRow(null, true)
  }
  function parseRow(end, single = false) {
    const items = []
    while (i < s.length) {
      const c = s[i]
      if (end && c === end) { i++; break }
      if (c === ' ') { i++; continue }
      if (c === '{') { i++; items.push(parseRow('}')) }
      else if (c === '^' || c === '_') {
        i++
        const arg = parseArg()
        let prev = items.pop() || { t: 'txt', s: '' }
        if (prev.t !== 'script') prev = { t: 'script', base: prev }
        prev[c === '^' ? 'sup' : 'sub'] = arg
        items.push(prev)
      } else if (c === '\\') {
        i++
        let name = ''
        if (/[A-Za-z]/.test(s[i])) while (/[A-Za-z]/.test(s[i])) name += s[i++]
        else name = s[i++]
        if (name === 'slot') { const id = readBraceRaw().trim(); const content = parseArg(); items.push({ t: 'slot', id, content }) }
        else if (name === 'frac' || name === 'dfrac' || name === 'tfrac') { const num = parseArg(), den = parseArg(); items.push({ t: 'frac', num, den }) }
        else if (name === 'sqrt') items.push({ t: 'sqrt', arg: parseArg() })
        else if (name === 'text' || name === 'mathrm' || name === 'textrm' || name === 'operatorname' || name === 'textbf' || name === 'mathbf') items.push({ t: 'txt', s: readBraceRaw(), up: true, bold: name.endsWith('bf') })
        else if (name === 'left' || name === 'right' || name === 'big' || name === 'Big') { /* delimiter follows as normal char */ }
        else if (name === ',' || name === ':' || name === ';' || name === ' ') items.push({ t: 'space', w: 0.22 })
        else if (name === 'quad') items.push({ t: 'space', w: 1 })
        else if (name === 'qquad') items.push({ t: 'space', w: 2 })
        else if (name === '{' || name === '}' || name === '%' || name === '_' || name === '#') items.push({ t: 'txt', s: name, up: true })
        else if (FUNCS.has(name)) items.push({ t: 'txt', s: name, up: true, fn: true })
        else if (SYM[name] !== undefined) {
          const ch = SYM[name]
          if (name === 'hat' || name === 'bar') items.push(parseArg())
          else items.push({ t: 'txt', s: ch, up: !/[a-zα-ω]/.test(ch) || /[Α-Ω]/.test(ch), op: BIN.has(ch), big: name === 'sum' || name === 'prod' })
        } else throw new VatError(`Formula: unsupported command \\${name} in "${s}".`)
      } else if (/[A-Za-z]/.test(c)) { items.push({ t: 'txt', s: c }); i++ }
      else if (/[0-9.,]/.test(c)) { let n = ''; while (i < s.length && /[0-9.,]/.test(s[i])) n += s[i++]; items.push({ t: 'txt', s: n, up: true }) }
      else { const ch = c === '-' ? '−' : c === '*' ? '·' : c; items.push({ t: 'txt', s: ch, up: true, op: BIN.has(ch) }); i++ }
      if (single) break
    }
    return { t: 'row', items }
  }
  const row = parseRow(null)
  return row
}

export class FormulaBar {
  constructor(stage, ctx) {
    this._st = stage
    this._ctx = ctx
    this._cur = null
    this._n = 0
    this._api = null
  }
  _measure(str, size, italic, bold) {
    const st = this._st
    return st.measureText(str, size, bold ? 650 : 400, 'var(--font-math)') * (italic ? 1.06 : 1) + (italic ? size * 0.04 : 0)
  }
  _lay(node, size, parent) {
    const g = svg('g', {}, parent)
    switch (node.t) {
      case 'txt': {
        const pad = node.op ? size * 0.22 : node.fn ? size * 0.06 : 0
        const fs = node.big ? size * 1.3 : size
        const t = svg('text', { x: pad, y: node.big ? size * 0.1 : 0, 'font-size': fs, 'font-style': node.up ? 'normal' : 'italic', 'font-weight': node.bold ? 650 : 400, class: 'fm-t' }, g)
        t.textContent = node.s
        const w = this._measure(node.s, fs, !node.up, node.bold) + 2 * pad
        return { g, w, a: fs * 0.72, d: fs * 0.24 }
      }
      case 'space': return { g, w: size * node.w, a: 0, d: 0 }
      case 'row': {
        let x = 0, a = size * 0.6, d = size * 0.2
        for (const it of node.items) {
          const r = this._lay(it, size, g)
          r.g.setAttribute('transform', T(x, 0))
          x += r.w; a = Math.max(a, r.a); d = Math.max(d, r.d)
        }
        return { g, w: x, a, d }
      }
      case 'script': {
        const b = this._lay(node.base, size, g)
        let w = b.w, a = b.a, d = b.d, ex = 0
        if (node.sup) { const r = this._lay(node.sup, size * 0.68, g); r.g.setAttribute('transform', T(b.w + 1, -size * 0.42)); ex = Math.max(ex, r.w); a = Math.max(a, size * 0.42 + r.a) }
        if (node.sub) { const r = this._lay(node.sub, size * 0.68, g); r.g.setAttribute('transform', T(b.w + 1, size * 0.24)); ex = Math.max(ex, r.w); d = Math.max(d, size * 0.24 + r.d) }
        return { g, w: w + ex + 2, a, d }
      }
      case 'frac': {
        const fs = size * 0.86
        const n = this._lay(node.num, fs, g), dn = this._lay(node.den, fs, g)
        const w = Math.max(n.w, dn.w) + size * 0.3, axis = size * 0.3
        n.g.setAttribute('transform', T((w - n.w) / 2, -axis - 5 - n.d))
        dn.g.setAttribute('transform', T((w - dn.w) / 2, -axis + 5 + dn.a))
        svg('line', { x1: 2, x2: w - 2, y1: -axis, y2: -axis, class: 'fm-line' }, g)
        return { g, w: w + 4, a: axis + 5 + n.a + n.d, d: -axis + 5 + dn.a + dn.d }
      }
      case 'sqrt': {
        const r = this._lay(node.arg, size, g)
        const sw = size * 0.55
        r.g.setAttribute('transform', T(sw + 2, 0))
        svg('path', { d: `M0 ${-size * 0.25} L${sw * 0.3} ${size * 0.1} L${sw * 0.75} ${-r.a - 4} L${sw + r.w + 4} ${-r.a - 4}`, class: 'fm-line', fill: 'none' }, g)
        return { g, w: sw + r.w + 6, a: r.a + 6, d: r.d }
      }
      case 'slot': {
        const bg = svg('rect', { class: 'fm-slot-bg', rx: 8, opacity: 0 }, g)
        const sym = this._lay(node.content, size, g)
        const valText = this._expected(node.id)
        const vw = valText ? this._measure(valText, size * 0.95, false, true) : 0
        const w = Math.max(sym.w, vw) + 10
        sym.g.setAttribute('transform', T((w - sym.w) / 2, 0))
        const val = svg('text', { x: w / 2, y: 0, 'text-anchor': 'middle', 'font-size': size * 0.95, 'font-weight': 650, class: 'fm-val', opacity: 0 }, g)
        const a = Math.max(sym.a, size * 0.72), d = Math.max(sym.d, size * 0.24)
        bg.setAttribute('x', 0); bg.setAttribute('y', -a - 4); bg.setAttribute('width', w); bg.setAttribute('height', a + d + 8)
        const ul = svg('line', { x1: 3, x2: w - 3, y1: d + 3, y2: d + 3, class: 'fm-slot-ul' }, g)
        this._slots.set(node.id, { g, sym: sym.g, val, bg, ul, w, a, d, filled: null, hl: false })
        return { g, w, a, d }
      }
      default: throw new VatError(`Formula: internal node ${node.t}`)
    }
  }
  _expected(id) {
    const v = this._ctx.trace?.vals.get(id)
    return v ? v.fmt() : null
  }

  show(tex, o = {}) {
    if (typeof tex !== 'string') throw new VatError(`formula.show(tex) needs a TeX string, e.g. 'z = \\slot{x1}{x_1} \\cdot \\slot{w1}{w_1}'.`)
    const st = this._st
    const layer = st._layer('formula', 'hud')
    const g = svg('g', { class: 'fm', style: 'visibility:hidden;opacity:0' }, layer)
    this._slots = new Map()
    const size = 38
    const panel = svg('rect', { class: 'fm-panel', rx: 16 }, g)
    const content = svg('g', {}, g)
    const tree = parseTex(tex)
    // two factors written side by side read as one number once slots fill ("0,05 0,15"): ask for \cdot
    const factor = n => n && (n.t === 'slot' || (n.t === 'txt' && !n.op && n.s.trim() && !'()[]'.includes(n.s)) || (n.t === 'script' && factor(n.base)))
    const lint = n => {
      if (!n || typeof n !== 'object') return
      if (n.t === 'row') n.items.forEach((a, i) => {
        const b = n.items[i + 1]
        if (factor(a) && factor(b) && (a.t === 'slot' || b.t === 'slot')) this._ctx.warnings.push(`formula "${tex}": put \\cdot between neighbouring factors (a filled slot next to another factor reads like one number).`)
      })
      for (const k of ['items', 'base', 'sup', 'sub', 'num', 'den', 'content', 'arg']) { const v = n[k]; if (Array.isArray(v)) v.forEach(lint); else if (v) lint(v) }
    }
    lint(tree)
    const r = this._lay(tree, size, content)
    let words = null, ww = 0
    if (o.words) {
      words = svg('text', { class: 'fm-words', 'text-anchor': 'middle', 'font-size': 19 }, g)
      words.textContent = st._plain(o.words)
      ww = st.measureText(words.textContent, 19, 450)
    }
    const W = Math.max(r.w, ww) + 48
    const maxW = ROOT.w - 80
    const k = Math.min(1, maxW / W)
    const top = WORLD.h + 6, H = r.a + r.d + (words ? 34 : 0) + 22
    const cx = ROOT.w / 2
    content.setAttribute('transform', T(-r.w / 2, 11 + r.a))
    panel.setAttribute('x', -W / 2); panel.setAttribute('y', 0); panel.setAttribute('width', W); panel.setAttribute('height', H)
    if (words) { words.setAttribute('x', 0); words.setAttribute('y', 11 + r.a + r.d + 26) }
    const sc = k < 1 ? ` scale(${k})` : ''
    g.setAttribute('transform', `${T(cx, top + Math.max(0, (ROOT.h - WORLD.h - 12 - H * k) / 2))}${sc}`)
    const prev = this._cur
    const cur = { g, slots: this._slots, k, ox: cx - (r.w / 2) * k, oy: 0, content, base: 11 + r.a }
    cur.oy = top + Math.max(0, (ROOT.h - WORLD.h - 12 - H * k) / 2)
    this._cur = cur
    rec.par(() => {
      if (prev) rec.tw(prev.g, { autoAlpha: 1 }, { autoAlpha: 0 }, DUR.fast)
      rec.tw(g, { autoAlpha: 0 }, { autoAlpha: 1 }, DUR.fast)
    })
  }
  slot(id) {
    if (!this._cur || !this._cur.slots.has(id)) throw new VatError(`formula.slot('${id}'): no such slot in the current formula. Show a formula containing \\slot{${id}}{…} first.` + (this._cur ? ` Current slots: ${[...this._cur.slots.keys()].join(', ') || '(none)'}.` : ''))
    return Object.freeze({ slotId: id })
  }
  _slot(id) { this.slot(id); return this._cur.slots.get(id) }
  _slotGeom(id) {
    const s = this._slot(id), c = this._cur
    // slot g is nested in content rows; compute its offset via CTM relative to formula group
    const m = s.g.getCTM(), mg = c.g.getCTM()
    let lx = 0, ly = 0
    if (m && mg) { const inv = mg.inverse(); const r = inv.multiply(m); lx = r.e; ly = r.f }
    const k = c.k
    const gx = ROOT.w / 2, gy = c.oy
    return { center: { x: gx + (lx + s.w / 2) * k, y: gy + (ly - (s.a - s.d) / 2) * k } }
  }
  _fillNow(id, text) {
    const s = this._slot(id)
    const from = s.filled
    s.filled = text
    rec.par(() => {
      if (from === null) {
        rec.tw(s.sym, { opacity: 1 }, { opacity: 0 }, DUR.fast)
        rec.set(s.val, { textContent: '' }, { textContent: text })
        rec.tw(s.val, { opacity: 0 }, { opacity: 1 }, DUR.fast)
      } else {
        rec.seq(() => {
          rec.tw(s.val, { opacity: 1 }, { opacity: 0 }, DUR.fast / 2)
          rec.set(s.val, { textContent: from }, { textContent: text })
          rec.tw(s.val, { opacity: 0 }, { opacity: 1 }, DUR.fast / 2)
        })
      }
    })
  }
  fill(slotId, v) { this._fillNow(slotId, this._st._valText(v)) }
  highlight(...ids) {
    const want = new Set(ids.flat())
    for (const id of want) this._slot(id)
    rec.par(() => {
      for (const [id, s] of this._cur.slots) {
        const on = want.has(id)
        if (on !== s.hl) { s.hl = on; rec.tw(s.bg, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }, DUR.fast) }
      }
    })
  }
  clear() {
    if (!this._cur) return
    rec.tw(this._cur.g, { autoAlpha: 1 }, { autoAlpha: 0 }, DUR.fast)
    this._cur = null
  }
}
