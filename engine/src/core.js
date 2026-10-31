// Recorder + persistent objects + selection.
//
// While `script` runs, verbs do NOT touch the DOM. They append operations ("ops") to the current step:
//   { k:'tw', el, from, to, d, ease }   a fromTo tween with explicit start values (deterministic, seekable)
//   { k:'ev', ev }                      a logical event (tags, existence, continuous effects)
//   { k:'par'|'seq', items }            grouping
//   { k:'wait', d }
//   { k:'node', node }                  a child step
// Logical state (position, tags, visibility…) is updated immediately, in call order, so later verbs
// compute their start values from it. layout.js turns the recorded tree into a GSAP timeline per detail level.
import { VatError, guard, fmt } from './util.js'
import { roleVar } from './design.js'
import { M, EASE, numericText, resolveColor } from './motion.js'

export const DUR = { fast: 0.35, normal: 0.6, slow: 1.0 }
export const DIM = 0.22
export function dur(s, def = 'normal') {
  if (s === undefined || s === null) return DUR[def]
  if (typeof s === 'number' && s >= 0) return s
  if (DUR[s] !== undefined) return DUR[s]
  throw new VatError(`Unknown speed '${s}'. Use 'fast', 'normal', 'slow' or a number of seconds.`)
}

const n3 = v => (Math.round(v * 1000) / 1000)
export const T = (x, y) => `translate(${n3(x)} ${n3(y)})`
export const S = (sx, sy = sx) => `scale(${n3(sx)} ${n3(sy)})`

export class Recorder {
  constructor() { this.reset() }
  reset() { this.mode = 'idle'; this.cap = null; this.initialEvents = []; this.hooks = [] }
  push(item) {
    if (this.mode === 'scene' || this.mode === 'build') return this._now(item)
    if (this.mode !== 'script' || !this.cap) throw new VatError('Animated verbs must be called inside a chapter/step build function (or in scene() to set the initial state).')
    this.cap.push(item)
  }
  _now(item) {
    if (item.k === 'tw') window.gsap.set(item.el, { ...item.to })
    else if (item.k === 'ev') this.initialEvents.push(item.ev)
    else if (item.k === 'par' || item.k === 'seq') item.items.forEach(i => this._now(i))
  }
  tw(el, from, to, d = DUR.normal, ease = 'power2.inOut') { this.push({ k: 'tw', el, from, to, d, ease }) }
  set(el, from, to) { this.push({ k: 'tw', el, from, to, d: 0, ease: 'none' }) }
  ev(ev) { this.push({ k: 'ev', ev }) }
  wait(d) { if (this.mode === 'script') this.push({ k: 'wait', d }) }
  group(kind, fn) {
    if (this.mode !== 'script') return fn()
    const g = { k: kind, items: [] }
    this.push(g)
    const prev = this.cap
    this.cap = g.items
    try { return fn() } finally { this.cap = prev }
  }
  par(fn) { return this.group('par', fn) }
  seq(fn) { return this.group('seq', fn) }
  get live() { return this.mode === 'script' }
}
export const rec = new Recorder()

// ───────────────────────────── Objects ─────────────────────────────

const SVGNS = 'http://www.w3.org/2000/svg'
export const svg = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v)
  if (parent) parent.appendChild(e)
  return e
}

export class Obj {
  constructor(stage, o) {
    this._st = stage
    this.kind = o.kind
    const id = o.id ?? stage._autoId(o.kind)
    if (stage._objs.has(id)) throw new VatError(`Two objects use the id '${id}'. Ids must be unique.`)
    this.id = id
    this._space = o.space || 'world'
    this._parentObj = o.parent || null
    this._tags = new Set(o.tags || [])
    this._gen = 0
    this._lineage = []
    this._exists = true
    this._role = o.role
    this._textSize = o.textSize || 'world'
    this._minZoom = o.minZoom || 0
    this._paints = []
    this._parts = new Map()

    const el = this._el = svg('g', { class: `vo vo-${o.kind}`, 'data-id': id })
    this._s = svg('g', { class: 'vo-s' }, el)
    this._e = svg('g', { class: 'vo-e' }, this._s) // enter/exit channel (pop in, shrink out)
    this._z = svg('g', { class: 'vo-z' }, this._e)
    this._b = svg('g', { class: 'vo-b' }, this._z)
    this._j = svg('g', { class: 'vo-j' }, this._b)
    this._l = svg('g', { class: 'vo-l' }, this._j)
    this._hl = svg('g', { class: 'vo-hl', opacity: 0 }, this._l)
    this._body = o.body || svg('g')
    this._body.classList.add('vo-body')
    this._l.appendChild(this._body)
    this._text = o.text || null

    this._o = o.origin || null
    const container = o.container || (this._parentObj ? this._parentObj._body : stage._layer(o.layer || 'nodes', this._space))
    if (o.before !== undefined) container.insertBefore(el, o.before)
    else container.appendChild(el)

    const p = o.pos || { x: 0, y: 0 }
    const z = this._space === 'world' ? stage._zoomScale(this._textSize) : 1
    const zVis = this._minZoom && stage._zoom() < this._minZoom ? 0 : 1
    this._st8 = { x: p.x, y: p.y, sx: 1, sy: 1, vis: !o.hidden, dim: false, hl: false, z, zo: zVis }
    window.gsap.set(el, { attr: { transform: T(p.x, p.y) }, autoAlpha: o.hidden ? 0 : 1 })
    window.gsap.set(this._s, { attr: { transform: this._S(1) } })
    window.gsap.set(this._z, { attr: { transform: S(z) }, opacity: zVis })
    window.gsap.set(this._l, { opacity: 1 })
    this._measure()
    window.gsap.set(this._e, { attr: { transform: this._E(1, 0) } })
    stage._register(this)
    this._api = guard(this, `Obj '${id}' (${o.kind})`)
  }

  _S(sx, sy = sx) {
    const s = S(sx, sy)
    return this._o ? `${T(this._o.x, this._o.y)} ${s} ${T(-this._o.x, -this._o.y)}` : s
  }

  /** Enter/exit transform about the object's own centre: scale k, offset dy. */
  _E(k, dy) {
    const cx = (this._bb?.x ?? 0) + (this._bb?.w ?? 0) / 2, cy = (this._bb?.y ?? 0) + (this._bb?.h ?? 0) / 2
    return `${T(cx, cy + dy)} ${S(k)} ${T(-cx, -cy)}`
  }

  // ── read-only logical state ──
  get tags() { return [...this._tags] }
  get generation() { return this._gen }
  get parent() { return this._lineage.length ? this._st._objs.get(this._lineage[this._lineage.length - 1])?._api ?? null : null }
  get exists() { return this._exists }

  _measure() {
    let b
    try { b = this._body.getBBox() } catch { b = { x: 0, y: 0, width: 0, height: 0 } }
    this._bb = { x: b.x, y: b.y, w: b.width, h: b.height }
    this.w = b.width; this.h = b.height
    this._hl.replaceChildren()
    const pad = /cell|header|code-line/.test(this.kind) ? 0 : 6
    if (b.width > 0 || b.height > 0)
      svg('rect', { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad, rx: pad ? 9 : 2, class: 'vo-ring' }, this._hl)
  }

  /** World (or HUD) centre of the object, including parents' positions. */
  _center() {
    let x = this._st8.x + this._bb.x + this._bb.w / 2, y = this._st8.y + this._bb.y + this._bb.h / 2
    for (let p = this._parentObj; p; p = p._parentObj) { x += p._st8.x; y += p._st8.y }
    return { x, y }
  }
  _origin() {
    let x = 0, y = 0
    for (let p = this._parentObj; p; p = p._parentObj) { x += p._st8.x; y += p._st8.y }
    return { x, y }
  }
  _box() {
    const c = this._center()
    const z = this._st8.z * this._st8.sx
    return { x: c.x - (this.w * z) / 2, y: c.y - (this.h * z) / 2, w: this.w * z, h: this.h * z, cx: c.x, cy: c.y }
  }

  // ── appearance ──
  /** Appear: pop in (rise + scale with a little overshoot), lines draw themselves. Disappear: quick shrink + fade. */
  _setVis(on, o) {
    const from = this._st8.vis ? 1 : 0, to = on ? 1 : 0
    if (from === to) return
    this._st8.vis = on
    const k = o?.speed !== undefined ? dur(o.speed) / DUR.normal : 1
    if (on) rec.par(() => {
      rec.tw(this._el, { autoAlpha: 0 }, { autoAlpha: 1 }, M.enter * 0.55 * k, 'power1.out')
      if (this._drawEl) {
        const L = this._drawLen || 400
        rec.tw(this._drawEl, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L } }, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': 0 } }, M.draw * k, 'power2.inOut')
      } else rec.tw(this._e, { attr: { transform: this._E(0.82, 10) } }, { attr: { transform: this._E(1, 0) } }, M.enter * k, EASE.enter)
    })
    else rec.par(() => {
      rec.tw(this._el, { autoAlpha: 1 }, { autoAlpha: 0 }, M.exit * k, EASE.exit)
      rec.tw(this._e, { attr: { transform: this._E(1, 0) } }, { attr: { transform: this._E(0.9, 0) } }, M.exit * k, EASE.exit)
    })
  }
  show(o) { this._delay(o); this._setVis(true, o); return this._api }
  hide(o) { this._delay(o); this._setVis(false, o); return this._api }
  dim(o) {
    this._delay(o)
    if (!this._st8.dim) { this._st8.dim = true; rec.tw(this._l, { opacity: 1 }, { opacity: DIM }, dur(o?.speed, 'fast')) }
    return this._api
  }
  undim(o) {
    this._delay(o)
    if (this._st8.dim) { this._st8.dim = false; rec.tw(this._l, { opacity: DIM }, { opacity: 1 }, dur(o?.speed, 'fast')) }
    return this._api
  }
  highlight(o) {
    this._delay(o)
    if (this._st8.dim) this.undim({ speed: 'fast' })
    if (!this._st8.hl) { this._st8.hl = true; rec.tw(this._hl, { opacity: 0 }, { opacity: 1 }, dur(o?.speed, 'fast')) }
    return this._api
  }
  unhighlight(o) {
    this._delay(o)
    if (this._st8.hl) { this._st8.hl = false; rec.tw(this._hl, { opacity: 1 }, { opacity: 0 }, dur(o?.speed, 'fast')) }
    return this._api
  }
  pulse(o) {
    this._delay(o)
    const { sx, sy } = this._st8, d = dur(o?.speed, 'fast')
    rec.seq(() => {
      rec.tw(this._s, { attr: { transform: this._S(sx, sy) } }, { attr: { transform: this._S(sx * 1.14, sy * 1.14) } }, d / 2, 'power2.out')
      rec.tw(this._s, { attr: { transform: this._S(sx * 1.14, sy * 1.14) } }, { attr: { transform: this._S(sx, sy) } }, d / 2, 'power2.in')
    })
    return this._api
  }
  recolor(role, o) {
    this._delay(o)
    this._st._checkRole(role)
    rec.par(() => {
      for (const p of this._paints) {
        const from = p.el.getAttribute(p.attr + '-role-now') || p.el.getAttribute(p.attr)
        const to = roleVar(this._st, role, p.variant)
        p.el.setAttribute(p.attr + '-role-now', to)
        // colours are CSS variables: tween the resolved colours, then settle on the variable (theme-aware)
        if (rec.live) rec.seq(() => {
          rec.tw(p.el, { attr: { [p.attr]: resolveColor(from) } }, { attr: { [p.attr]: resolveColor(to) } }, M.color, 'power1.inOut')
          rec.set(p.el, { attr: { [p.attr]: resolveColor(to) } }, { attr: { [p.attr]: to } })
        })
        else rec.set(p.el, { attr: { [p.attr]: from } }, { attr: { [p.attr]: to } })
      }
    })
    this._role = role
    return this._api
  }
  remove(o) {
    this._delay(o)
    this._setVis(false, o)
    this._exists = false
    rec.ev({ type: 'exist', obj: this.id, on: false })
    this._st._refreshCounters()
    return this._api
  }

  // ── motion ──
  _moveLocal(x, y, o, ease = 'power2.inOut') {
    const { x: fx, y: fy } = this._st8
    if (Math.abs(fx - x) < 0.01 && Math.abs(fy - y) < 0.01) return
    this._st8.x = x; this._st8.y = y
    rec.tw(this._el, { attr: { transform: T(fx, fy) } }, { attr: { transform: T(x, y) } }, dur(o?.speed), ease)
  }
  /** Move so that the object's centre lands on world point p. */
  _moveCenterTo(p, o) {
    const c = this._center()
    this._moveLocal(this._st8.x + (p.x - c.x), this._st8.y + (p.y - c.y), o)
  }
  moveTo(place, o) {
    this._delay(o)
    const p = this._st._resolve(place, this)
    this._st._withFollow(this, () => this._moveCenterTo(p, o), o)
    return this._api
  }
  along(path, o = {}) {
    this._delay(o)
    const pts = this._st._pathPoints(path, o.plot)
    const c0 = this._center()
    const ox = this._st8.x - c0.x, oy = this._st8.y - c0.y
    // start from where the object is now, then follow the path with one easing over its whole length
    const all = [{ x: c0.x, y: c0.y }, ...pts]
    let len = 0
    for (let i = 1; i < all.length; i++) len += Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y)
    const total = o.speed !== undefined ? dur(o.speed) : Math.min(2.4, Math.max(M.travel, len / 520))
    const from = { x: this._st8.x, y: this._st8.y }
    this._st._withFollow(this, () => {
      rec.tw(this._el, { attr: { transform: T(from.x, from.y) } }, { vatPoly: { pts: all, dx: ox, dy: oy } }, total, o.ease || 'sine.inOut')
      const last = all[all.length - 1]
      this._st8.x = last.x + ox; this._st8.y = last.y + oy
    }, o)
    return this._api
  }
  scaleTo(k, o) {
    this._delay(o)
    const { sx, sy } = this._st8
    this._st8.sx = k; this._st8.sy = k
    rec.tw(this._s, { attr: { transform: this._S(sx, sy) } }, { attr: { transform: this._S(k) } }, dur(o?.speed))
    return this._api
  }

  // ── values & text ──
  setValue(v, o) {
    if (v && typeof v === 'object' && 'value' in v && 'id' in v) this._st._valIndex.set(v.id, this)
    return this.setText(this._st._valText(v), o)
  }
  setText(text, o) {
    this._delay(o)
    if (!this._text) throw new VatError(`Obj '${this.id}' (${this.kind}) has no text to change. Use setValue/setText on labels, values, boxes, cells or node values.`)
    const el = this._text
    const from = this._curText ?? el.textContent
    const to = this._st._plain(String(text))
    if (from === to) return this._api
    this._curText = to
    if (!rec.live) { el.textContent = to; if (this._fit) this._fit(to); return this._api }
    const k = o?.speed !== undefined ? dur(o.speed) / DUR.normal : 1
    if (numericText(from) && numericText(to)) {
      // numbers count from the old value to the new one
      rec.par(() => {
        rec.tw(el, {}, { vatNum: { from, to, lang: this._st._ctx.lang } }, M.count * k, EASE.count)
        if (this._fit) this._fit(to)
      })
    } else {
      // words slide: old text leaves upward, new text arrives from below
      rec.seq(() => {
        rec.tw(el, { opacity: 1, attr: { transform: 'translate(0 0)' } }, { opacity: 0, attr: { transform: 'translate(0 -10)' } }, 0.14 * k, 'power2.in')
        rec.set(el, { textContent: from }, { textContent: to })
        if (this._fit) this._fit(to)
        rec.tw(el, { opacity: 0, attr: { transform: 'translate(0 10)' } }, { opacity: 1, attr: { transform: 'translate(0 0)' } }, 0.22 * k, 'power2.out')
      })
    }
    return this._api
  }

  /** Tween any SVG attributes of the object's main shape (or of a part): obj.to({ r: 40, fill: 'accent' }).
   *  Colours may be roles. Paths morph when the new `d` has the same command structure. */
  to(attrs, o = {}) {
    this._delay(o)
    if (!attrs || typeof attrs !== 'object') throw new VatError(`obj.to({ attr: value, … }) needs an object of SVG attributes (r, width, height, x, y, d, fill, stroke, opacity…).`)
    const target = o.part ? this._st._objOf(this.part(o.part))._body : this._prim || this._body.querySelector('rect,circle,ellipse,path,line,polygon,polyline,text') || this._body
    target._now = target._now || {}
    const from = {}, to = {}
    for (const [k, v0] of Object.entries(attrs)) {
      let v = v0
      if ((k === 'fill' || k === 'stroke') && typeof v === 'string' && !/^(#|rgb|hsl|var\(|none)/.test(v)) { this._st._checkRole(v); v = roleVar(this._st, v, k === 'fill' ? 'soft' : 'main') }
      const cur = target._now[k] ?? target.getAttribute(k) ?? (k === 'opacity' ? 1 : 0)
      const isColor = k === 'fill' || k === 'stroke'
      from[k] = isColor ? resolveColor(cur) : cur
      to[k] = isColor ? resolveColor(v) : v
      target._now[k] = v
    }
    if (!rec.live) { for (const [k, v] of Object.entries(to)) target.setAttribute(k, v); this._measure(); return this._api }
    rec.tw(target, { attr: from }, { attr: to }, o.speed !== undefined ? dur(o.speed) : M.travel * 0.8, o.ease || 'power2.inOut')
    return this._api
  }

  // ── continuous effects (logical events; effects.js plays them) ──
  _fx(fx, on, extra) {
    this._fxOn = this._fxOn || new Map()
    if (on !== false) this._fxOn.set(fx, extra || {}); else this._fxOn.delete(fx)
    rec.ev({ type: 'fx', obj: this.id, fx, on: on !== false, ...extra })
    return this._api
  }
  glow(on) { return this._fx('glow', on) }
  jitter(on, strength = 'low') { return this._fx('jitter', on, { strength }) }
  breathe(on) { return this._fx('breathe', on) }
  flow(on) { return this._fx('flow', on) }

  // ── logical ──
  tag(name) {
    if (!this._tags.has(name)) { this._tags.add(name); rec.ev({ type: 'tag', obj: this.id, tag: name, on: true }); this._st._refreshCounters() }
    return this._api
  }
  untag(name) {
    if (this._tags.has(name)) { this._tags.delete(name); rec.ev({ type: 'tag', obj: this.id, tag: name, on: false }); this._st._refreshCounters() }
    return this._api
  }

  // ── life ──
  split(o = {}) { return this._st._split([this], o)[0] }
  clone(o = {}) {
    const c = this._st._cloneObj(this)
    const target = o.at ? this._st._resolve(o.at, c) : (() => { const p = this._center(); return { x: p.x + this.w * 1.1, y: p.y } })()
    rec.seq(() => {
      c._setVis(true, { speed: 'fast' })
      c._moveCenterTo(target, o)
    })
    this._st._refreshCounters()
    return c._api
  }
  part(name) {
    if (this._parts.has(name)) return this._parts.get(name)._api
    const el = this._body.querySelector(`.${CSS.escape(name)}`)
    if (!el) throw new VatError(`Obj '${this.id}' has no part '${name}'. Parts are elements with class="${name}" inside the shape's SVG.`)
    const p = this._st._wrapPart(this, el, name)
    this._parts.set(name, p)
    return p._api
  }
  do(verb, opts = {}) {
    const impl = this._st._verbs.get(verb)
    if (!impl) throw new VatError(`Unknown custom verb '${verb}'. Register it first with vat.defineVerb('${verb}', (obj, opts) => { ... }).`)
    impl(this._api, opts)
    return this._api
  }

  _delay(o) { if (o?.delay !== undefined && rec.live) rec.wait(dur(o.delay)) }
}

// ───────────────────────────── Selection ─────────────────────────────

const SEL_VERBS = ['show', 'hide', 'dim', 'undim', 'highlight', 'unhighlight', 'pulse', 'remove', 'scaleTo']

export class Sel {
  constructor(stage, objs) { this._st = stage; this._objs = objs }
  get count() { return this._objs.length }
  _new(objs) { return new Sel(this._st, objs)._wrap() }
  _wrap() { return (this._api = guard(this, 'Selection')) }
  tagged(tag) { return this._new(this._objs.filter(o => o._tags.has(tag))) }
  except(...xs) {
    const ids = new Set()
    for (const x of xs.flat()) {
      if (typeof x === 'string' && (x.startsWith('.') || x.startsWith('#') || /^[a-z]/i.test(x)) && !this._st._objs.has(x)) this._st._query(x).forEach(o => ids.add(o.id))
      else ids.add(typeof x === 'string' ? x : x.id)
    }
    return this._new(this._objs.filter(o => !ids.has(o.id)))
  }
  where(f) { return this._new(this._objs.filter(o => f(o._api))) }
  generation(n) { return this._new(this._objs.filter(o => o._gen === n)) }
  descendantsOf(x) { const id = typeof x === 'string' ? x : x.id; return this._new(this._objs.filter(o => o.id === id || o._lineage.includes(id))) }
  first() { return this._one(0) }
  last() { return this._one(this._objs.length - 1) }
  at(i) { return this._one(i) }
  _one(i) {
    const o = this._objs[i]
    if (!o) throw new VatError(`Selection has ${this._objs.length} object(s); index ${i} does not exist.`)
    return o._api
  }
  sample(n) {
    // deterministic: evenly spaced picks
    const k = Math.min(n, this._objs.length), out = []
    for (let i = 0; i < k; i++) out.push(this._objs[Math.floor((i + 0.5) * this._objs.length / k)])
    return this._new(out)
  }
  toArray() { return this._objs.map(o => o._api) }
  each(f) { this._objs.forEach((o, i) => f(o._api, i)) }
  _apply(verb, args, o) {
    // a cascade by default (never all at once, never slow): ~55 ms apart, at most 0.4 s for the whole group
    const stagger = o?.stagger !== undefined ? dur(o.stagger) : Math.min(0.055, 0.4 / Math.max(1, this._objs.length - 1))
    rec.par(() => this._objs.forEach((obj, i) => rec.seq(() => {
      if (stagger && i) rec.wait(stagger * i)
      obj[verb](...args)
    })))
    return this._api
  }
  glow(on) { this._objs.forEach(o => o.glow(on)); return this._api }
  jitter(on, s) { this._objs.forEach(o => o.jitter(on, s)); return this._api }
  breathe(on) { this._objs.forEach(o => o.breathe(on)); return this._api }
  flow(on) { this._objs.forEach(o => o.flow(on)); return this._api }
  tag(name) { this._objs.forEach(o => o.tag(name)); return this._api }
  untag(name) { this._objs.forEach(o => o.untag(name)); return this._api }
  recolor(role, o) { return this._apply('recolor', [role, { speed: o?.speed }], o) }
  split(o = {}) { return this._new(this._st._split(this._objs, o).flat()) }
  do(verb, opts) { this._objs.forEach(x => x.do(verb, opts)); return this._api }
}
for (const v of SEL_VERBS) Sel.prototype[v] = function (o) { return this._apply(v, v === 'scaleTo' ? [o] : [{ speed: o?.speed }], typeof o === 'object' ? o : undefined) }

export { fmt }
