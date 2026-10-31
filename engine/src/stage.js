// Stage: world (camera-controlled) + HUD (fixed), regions & placement, primitives, camera, number flights,
// splitting/cloning, counters, escape hatches.
import { VatError, guard, fmt, clamp, escapeHtml } from './util.js'
import { Obj, Sel, rec, svg, dur, T, S, DUR } from './core.js'
import { roleVar, assignRoles } from './design.js'

export const ROOT = { w: 1600, h: 900 }
export const WORLD = { w: 1600, h: 770 }
const ASPECT = WORLD.w / WORLD.h
const M = 40
export const REGIONS = {
  main: { x: M, y: 30, w: WORLD.w - 2 * M, h: WORLD.h - 60 },
  center: { x: 360, y: 150, w: 880, h: 470 },
  left: { x: M, y: 30, w: 730, h: WORLD.h - 60 },
  right: { x: 830, y: 30, w: 730, h: WORLD.h - 60 },
  top: { x: M, y: 24, w: WORLD.w - 2 * M, h: 210 },
  bottom: { x: M, y: 530, w: WORLD.w - 2 * M, h: 216 },
  inset: { x: 1170, y: 30, w: 390, h: 250 },
}
export const GAPS = { xs: 6, sm: 14, md: 28, lg: 56 }
// objects whose text IS a value: a number flying onto them replaces their text
const VALUE_KINDS = new Set(['value', 'table-cell', 'grid-cell', 'net-value', 'net-weight', 'net-bias', 'code-watch'])
const BUILTIN_KINDS = new Set(['table', 'table-cell', 'table-header', 'plot', 'plot-point', 'plot-curve', 'plot-line', 'plot-segment', 'plot-circle', 'plot-region', 'neuralNet', 'net-node', 'net-edge', 'net-weight', 'net-value', 'net-bias', 'graph', 'graph-node', 'graph-edge', 'grid', 'grid-cell', 'grid-window', 'numberLine', 'line-mark', 'line-interval', 'sequence', 'seq-actor', 'seq-message', 'seq-note', 'stateMachine', 'sm-state', 'sm-transition', 'sm-marker', 'codeView', 'code-line', 'code-cursor', 'code-watch', 'container', 'label', 'value', 'box', 'dot', 'arrow', 'counter', 'part', 'magnifier', 'panel'])
export const FONT = { sm: 21, md: 26, lg: 33, xl: 44 }
const DEFAULT_CAM = { x: 0, y: 0, w: WORLD.w, h: WORLD.h }

export class Stage {
  constructor(root, ctx) {
    this._ctx = ctx // { lang, glossary, trace, lessonDef }
    this._root = root
    this._objs = new Map()
    this._order = []
    this._idc = {}
    this._valIndex = new Map()
    this._counters = []
    this._verbs = ctx.verbs
    this._components = ctx.components
    this._panels = []
    this._follow = null
    this._roleSlots = assignRoles(ctx.glossary)
    this._warnings = ctx.warnings

    root.replaceChildren()
    root.setAttribute('viewBox', `0 0 ${ROOT.w} ${ROOT.h}`)
    const defs = svg('defs', {}, root)
    defs.innerHTML = `<filter id="vat-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    this._defs = defs
    this._worldSvg = svg('svg', { id: 'vat-world', x: 0, y: 0, width: WORLD.w, height: WORLD.h, viewBox: vb(DEFAULT_CAM), overflow: 'visible' }, root)
    this._worldG = svg('g', { id: 'vat-world-content' }, this._worldSvg)
    this._layers = {}
    for (const l of ['bg', 'edges', 'nodes', 'labels', 'top']) this._layers[l] = svg('g', { class: `layer-${l}` }, this._worldG)
    this._hudG = svg('g', { id: 'vat-hud' }, root)
    this._hudLayers = {}
    for (const l of ['formula', 'nodes', 'fly']) this._hudLayers[l] = svg('g', { class: `hud-${l}` }, this._hudG)
    this._measureG = svg('g', { 'aria-hidden': 'true', style: 'visibility:hidden' }, root)
    this.camera = guard(new Camera(this), 'stage.camera')
    this._api = guard(this, 'stage')
  }

  // ── registry ──
  _autoId(kind) { this._idc[kind] = (this._idc[kind] || 0) + 1; let id = `${kind}${this._idc[kind]}`; while (this._objs.has(id)) id = `${kind}${++this._idc[kind]}`; return id }
  _register(o) { this._objs.set(o.id, o); this._order.push(o) }
  _layer(name, space = 'world') {
    const L = space === 'hud' ? this._hudLayers : this._layers
    if (!L[name]) throw new VatError(`Unknown layer '${name}'.`)
    return L[name]
  }
  _live() { return this._order.filter(o => o._exists) }
  _query(q) {
    if (typeof q !== 'string' || !q.trim()) throw new VatError(`select() needs a selector string like 'cell', '.cancer', '#h1' or 'cell.cancer'.`)
    const m = q.trim().match(/^([A-Za-z_][\w-]*)?((?:[.#][\w-]+)*)$/)
    if (!m) throw new VatError(`Unsupported selector '${q}'. Use kind ('cell'), .tag ('.cancer'), #id ('#h1') or combinations ('cell.cancer').`)
    const kind = m[1], rest = m[2] || ''
    const tags = [...rest.matchAll(/\.([\w-]+)/g)].map(x => x[1]), ids = [...rest.matchAll(/#([\w-]+)/g)].map(x => x[1])
    return this._live().filter(o => (!kind || o.kind === kind) && tags.every(t => o._tags.has(t)) && ids.every(i => o.id === i))
  }
  select(q) { return new Sel(this, this._query(q))._wrap() }
  get(id) {
    const o = this._objs.get(id)
    if (!o) throw new VatError(`No object with id '${id}'.`)
    return o._api
  }

  // ── geometry ──
  _zoom() { return WORLD.h / this.camera._v.h }
  _zoomScale(mode, zoom = this._zoom()) { return mode === 'screen' ? 1 / zoom : mode === 'damped' ? Math.pow(zoom, -0.6) : 1 }
  _worldToHud(p) { const c = this.camera._v; return { x: (p.x - c.x) * WORLD.w / c.w, y: (p.y - c.y) * WORLD.h / c.h } }
  _regionRect(name) {
    const r = REGIONS[name]
    if (!r) throw new VatError(`Unknown region '${name}'. Regions: ${Object.keys(REGIONS).join(', ')}.`)
    return { ...r }
  }
  /** Rectangle a component should fill, from its `at`. */
  _rectFor(at, def = 'center', size) {
    if (at === undefined) at = def
    if (typeof at === 'string') return this._regionRect(at)
    if (at && at.region && at.u === undefined && at.v === undefined) return this._regionRect(at.region)
    if (at && at.inside) return at.inside._api ? at.inside._box() : this._objOf(at.inside)._box()
    const p = this._resolve(at)
    const w = size?.w ?? 600, h = size?.h ?? 360
    return { x: p.x - w / 2, y: p.y - h / 2, w, h }
  }
  _objOf(x) {
    if (x && x._st8) return x
    if (x && x._objs && Array.isArray(x._objs)) throw new VatError(`Expected one object but got a selection of ${x._objs.length}. Use .first(), .at(i) or .each(o => …); camera.focus/frame accept selections.`)
    if (x && typeof x.id === 'string' && this._objs.has(x.id)) return this._objs.get(x.id)
    throw new VatError(`Expected an object created by the stage (got ${typeof x === 'object' ? JSON.stringify(x)?.slice(0, 80) : String(x)}).`)
  }
  /** Placement → world point (centre). `self` is the object being placed (for its size). */
  _resolve(place, self) {
    if (place === undefined || place === null) place = 'center'
    if (typeof place === 'string') {
      const r = this._regionRect(place)
      return { x: r.x + r.w / 2, y: r.y + r.h / 2 }
    }
    if (typeof place !== 'object') throw new VatError(`Invalid placement ${JSON.stringify(place)}.`)
    if (place.region) {
      const r = this._regionRect(place.region)
      const u = clamp(place.u ?? 0.5, 0, 1), v = clamp(place.v ?? 0.5, 0, 1)
      return { x: r.x + u * r.w, y: r.y + v * r.h }
    }
    if (place.near) {
      const t = this._objOf(place.near)._box()
      const gap = GAPS[place.gap || 'sm'] ?? GAPS.sm
      const sw = self ? self.w * self._st8.z / 2 : 0, sh = self ? self.h * self._st8.z / 2 : 0
      switch (place.side || 'right') {
        case 'top': return { x: t.cx, y: t.y - gap - sh }
        case 'bottom': return { x: t.cx, y: t.y + t.h + gap + sh }
        case 'left': return { x: t.x - gap - sw, y: t.cy }
        case 'right': return { x: t.x + t.w + gap + sw, y: t.cy }
        default: throw new VatError(`side must be 'top', 'right', 'bottom' or 'left' (got '${place.side}').`)
      }
    }
    if (place.between) {
      const [a, b] = place.between.map(o => this._objOf(o)._center())
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }
    if (place.inside) return this._objOf(place.inside)._center()
    if (place.plot) {
      const p = this._objOf(place.plot)
      if (!p._toWorld) throw new VatError(`{ plot } placement needs a plot created with stage.plot().`)
      return p._toWorld(place.x, place.y)
    }
    if ('x' in place || 'y' in place) throw new VatError(`Raw {x, y} positions are not allowed (no screen pixels). Use a region ('left', 'main', …), { region, u, v } with u,v in 0..1, { near: obj, side }, or { plot, x, y } for plot coordinates.`)
    throw new VatError(`Invalid placement ${JSON.stringify(place)}. See Placement in engine-api.d.ts.`)
  }
  _pathPoints(path, plot) {
    const N = 48
    if (typeof path === 'function') {
      const P = plot ? this._objOf(plot) : null
      const pts = []
      for (let i = 0; i <= N; i++) {
        const q = path(i / N)
        if (!q || !Number.isFinite(q.x) || !Number.isFinite(q.y)) throw new VatError(`along(): path(${(i / N).toFixed(2)}) returned ${JSON.stringify(q)}, expected { x, y } numbers.`)
        pts.push(P ? P._toWorld(q.x, q.y) : this._resolve({ region: 'main', u: q.x, v: q.y }))
      }
      return pts
    }
    const o = this._objOf(path)
    if (!o._points) throw new VatError(`along(obj): '${o.id}' is not a path. Use a plot curve/polyline/segment, an arrow, or a function t => ({x, y}).`)
    return o._points
  }

  // ── text helpers ──
  _valText(v) {
    if (v && typeof v === 'object' && 'value' in v && typeof v.fmt === 'function') return v.fmt()
    if (typeof v === 'number') return fmt(v, undefined, this._ctx.lang)
    if (v === undefined || v === null) throw new VatError(`A value is ${v}. Pass a Val from the model, a number or a string.`)
    return String(v)
  }
  /** Markup → plain text (labels in SVG). */
  _plain(s) { return this._ctx.markup.plain(s) }
  measureText(str, size = FONT.md, weight = 400, family) {
    const t = svg('text', { 'font-size': size, 'font-weight': weight, ...(family ? { style: `font-family:${family}` } : {}) }, this._measureG)
    t.textContent = str
    let w = 0
    try { w = t.getComputedTextLength() } catch {}
    t.remove()
    return w
  }
  _wrapLines(str, size, weight, maxW) {
    const out = []
    for (const para of String(str).split('\n')) {
      let line = ''
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? line + ' ' + word : word
        if (line && this.measureText(test, size, weight) > maxW) { out.push(line); line = word } else line = test
      }
      out.push(line)
    }
    return out
  }
  _textEl(parent, str, { size = FONT.md, weight = 400, fill = 'var(--ink)', anchor = 'middle', maxW, cls, family } = {}) {
    const lines = maxW ? this._wrapLines(str, size, weight, maxW) : String(str).split('\n')
    const t = svg('text', { 'font-size': size, 'font-weight': weight, fill, 'text-anchor': anchor, class: cls, ...(family ? { style: `font-family:${family}` } : {}) }, parent)
    const lh = size * 1.25
    if (lines.length === 1) { t.setAttribute('dominant-baseline', 'central'); t.textContent = lines[0] }
    else lines.forEach((ln, i) => { const ts = svg('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * lh, 'dominant-baseline': 'central' }, t); ts.textContent = ln })
    return t
  }

  // ── creation ──
  _checkRole(role) {
    if (!role) return
    if (['neutral', 'accent', 'danger', 'success', 'warn'].includes(role)) return
    if (!this._ctx.glossary[role]) throw new VatError(`role '${role}' is not a glossary key. Roles are glossary keys (with concept: true for a colour) or one of neutral, accent, danger, success, warn.`)
  }
  _common(opts, kind) {
    if (opts && typeof opts !== 'object') throw new VatError(`${kind}: options must be an object.`)
    const o = opts || {}
    this._checkRole(o.role)
    if (o.textSize && !['world', 'screen', 'damped'].includes(o.textSize)) throw new VatError(`textSize must be 'world', 'screen' or 'damped'.`)
    return o
  }
  /** Create an object; placement and appearance follow the record mode. */
  _create(kind, body, opts = {}, extra = {}) {
    const live = rec.live
    const o = new Obj(this, {
      kind, id: opts.id, body, role: opts.role, tags: opts.tags, textSize: opts.textSize ?? extra.textSize, minZoom: opts.minZoom,
      hidden: true, layer: extra.layer, text: extra.text, space: extra.space, parent: extra.parent, origin: extra.origin,
    })
    if (extra.fit) o._fit = extra.fit.bind(o)
    if (extra.points) o._points = extra.points
    if (extra.at0) { o._st8.x = extra.at0.x; o._st8.y = extra.at0.y }
    else {
      const p = extra.pos ?? this._resolve(opts.at, o)
      const c = o._center()
      o._st8.x += p.x - c.x; o._st8.y += p.y - c.y
    }
    window.gsap.set(o._el, { attr: { transform: T(o._st8.x, o._st8.y) } })
    if (live) {
      o._exists = true
      rec.ev({ type: 'exist', obj: o.id, on: true })
      if (!opts.hidden) {
        if (extra.drawIn) rec.par(() => { o._setVis(true, { speed: 'fast' }); extra.drawIn(o) })
        else o._setVis(true, { speed: 'fast' })
      }
    } else {
      o._st8.vis = !opts.hidden
      window.gsap.set(o._el, { autoAlpha: opts.hidden ? 0 : 1 })
      rec.initialEvents.push({ type: 'exist', obj: o.id, on: true })
    }
    this._refreshCounters()
    return o
  }
  _paint(o, el, role, fillV = 'soft', strokeV = 'main') {
    if (fillV) { el.setAttribute('fill', roleVar(this, role, fillV)); o._paints.push({ el, attr: 'fill', variant: fillV }) }
    if (strokeV) { el.setAttribute('stroke', roleVar(this, role, strokeV)); o._paints.push({ el, attr: 'stroke', variant: strokeV }) }
  }

  shape(markup, opts) {
    const o = this._common(opts, 'shape')
    if (typeof markup !== 'string') throw new VatError(`shape(svg) needs an SVG string, e.g. '<ellipse rx="50" ry="30"/>'.`)
    const body = svg('g', { 'stroke-width': 3, 'stroke-linejoin': 'round' })
    const inner = svg('g', { transform: `scale(${(o.size ?? 100) / 100})` }, body)
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml')
    if (doc.querySelector('parsererror')) throw new VatError(`shape(): the SVG markup is not valid XML. Check quotes and closing tags.`)
    for (const n of [...doc.documentElement.childNodes]) inner.appendChild(document.importNode(n, true))
    if (o.kind && BUILTIN_KINDS.has(o.kind)) throw new VatError(`shape kind '${o.kind}' is reserved by a built-in component. Choose another kind name.`)
    const obj = this._create(o.kind || 'shape', body, o, {})
    this._paint(obj, body, o.role, 'soft', 'main')
    obj.kind = o.kind || 'shape'
    return obj._api
  }
  dot(opts) {
    const o = this._common(opts, 'dot')
    const body = svg('g')
    const c = svg('circle', { r: 11, 'stroke-width': 2.5 }, body)
    let text = null
    if (o.label) text = this._textEl(body, this._plain(o.label), { size: FONT.sm, fill: 'var(--ink-2)' }), text.setAttribute('y', 26)
    const obj = this._create('dot', body, o, { text })
    this._paint(obj, c, o.role, 'main', null)
    c.setAttribute('stroke', 'var(--surface)')
    return obj._api
  }
  label(text, opts) {
    const o = this._common(opts, 'label')
    const body = svg('g')
    const size = FONT[o.size || 'md'] ?? FONT.md
    const t = this._textEl(body, this._plain(String(text)), { size, weight: o.bold ? 650 : 450, fill: o.role ? roleVar(this, o.role, 'ink') : 'var(--ink)', maxW: o.maxWidth ?? 520 })
    const obj = this._create('label', body, o, { text: t, textSize: 'damped' })
    obj._curText = t.textContent
    return obj._api
  }
  value(v, opts) {
    const o = this._common(opts, 'value')
    const body = svg('g')
    const str = this._valText(v)
    const size = FONT[o.size || 'md'] ?? FONT.md
    const w = Math.max(44, this.measureText(str, size, 650) + 24), h = size + 18
    const r = svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 9, 'stroke-width': 2 }, body)
    const t = this._textEl(body, str, { size, weight: 650, fill: o.role ? roleVar(this, o.role, 'ink') : 'var(--ink)', cls: 'num' })
    const self = this
    const obj = this._create('value', body, o, {
      text: t, textSize: 'damped',
      fit(next) {
        const nw = Math.max(44, self.measureText(next, size, 650) + 24)
        const cw = this._bgW ?? w
        if (Math.abs(nw - cw) < 1) return
        this._bgW = nw
        rec.tw(r, { attr: { x: -cw / 2, width: cw } }, { attr: { x: -nw / 2, width: nw } }, DUR.fast)
      },
    })
    this._paint(obj, r, o.role, 'soft', 'main')
    obj._curText = str
    if (v && typeof v === 'object' && v.id) this._valIndex.set(v.id, obj)
    return obj._api
  }
  box(text, opts) {
    const o = this._common(opts, 'box')
    const body = svg('g')
    const size = FONT[o.size || 'md'] ?? FONT.md
    const str = this._plain(String(text))
    const lines = this._wrapLines(str, size, 500, o.maxWidth ?? 380)
    const w = Math.max(...lines.map(l => this.measureText(l, size, 500))) + 36
    const h = lines.length * size * 1.25 + 26
    const r = svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, 'stroke-width': 2 }, body)
    const t = this._textEl(body, lines.join('\n'), { size, weight: 500, fill: o.role ? roleVar(this, o.role, 'ink') : 'var(--ink)' })
    const obj = this._create('box', body, o, { text: t, textSize: 'damped' })
    this._paint(obj, r, o.role, o.role ? 'soft' : null, o.role ? 'main' : null)
    if (!o.role) { r.setAttribute('fill', 'var(--surface)'); r.setAttribute('stroke', 'var(--line)') }
    obj._curText = t.textContent
    return obj._api
  }
  arrow(from, to, opts) {
    const o = this._common(opts, 'arrow')
    const A = this._objOf(from)._box(), B = this._objOf(to)._box()
    const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 6), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8)
    const body = svg('g')
    const curve = o.curve ?? 0
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
    const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1
    const cx = mx - (dy / len) * curve * len * 0.5, cy = my + (dx / len) * curve * len * 0.5
    const d = curve ? `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x} ${p2.y}` : `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`
    const path = svg('path', { d, fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'marker-end': `url(#${this._marker(o.role)})`, ...(o.dashed ? { 'stroke-dasharray': '7 6' } : {}) }, body)
    path.setAttribute('stroke', roleVar(this, o.role, 'main'))
    let text = null
    if (o.label) {
      const lx = curve ? (mx + cx) / 2 : mx, ly = curve ? (my + cy) / 2 : my
      const g = svg('g', { transform: `translate(${lx} ${ly})` }, body)
      const str = this._plain(o.label), lw = this.measureText(str, FONT.sm, 550) + 14
      svg('rect', { x: -lw / 2, y: -13, width: lw, height: 26, rx: 7, fill: 'var(--surface)', stroke: 'var(--line-2)' }, g)
      text = this._textEl(g, str, { size: FONT.sm, weight: 550, fill: o.role ? roleVar(this, o.role, 'ink') : 'var(--ink-2)' })
    }
    const pts = []
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(curve ? { x: (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * cx + t * t * p2.x, y: (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * cy + t * t * p2.y } : { x: p1.x + t * dx, y: p1.y + t * dy }) }
    const L = curve ? approxLen(pts) : len
    const obj = this._create('arrow', body, o, {
      layer: 'edges', text, pos: { x: (p1.x + p2.x) / 2 + (curve ? (cx - mx) / 2 : 0), y: (p1.y + p2.y) / 2 + (curve ? (cy - my) / 2 : 0) }, points: pts,
      drawIn: o.dashed ? null : () => rec.tw(path, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L } }, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': 0 } }, DUR.normal),
    })
    obj._paints.push({ el: path, attr: 'stroke', variant: 'main' })
    obj._flowEl = path
    if (text) obj._curText = text.textContent
    return obj._api
  }
  _marker(role) {
    const id = `vat-arrow-${role || 'neutral'}`
    if (!this._defs.querySelector('#' + id)) {
      const m = svg('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, this._defs)
      svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: roleVar(this, role, 'main') }, m)
    }
    return id
  }
  counter(labelText, count, opts) {
    const o = this._common(opts, 'counter')
    if (typeof count !== 'function') throw new VatError(`counter(label, count): count must be a function, e.g. () => stage.select('.cancer').count`)
    const v = count()
    const api = this.box(`${this._plain(labelText)}: ${fmt(v, undefined, this._ctx.lang)}`, { ...o, maxWidth: 600 })
    const obj = this._objOf(api)
    obj.kind = 'counter'
    this._counters.push({ obj, label: labelText, count, last: v })
    return api
  }
  _refreshCounters() {
    for (const c of this._counters) {
      let v
      try { v = c.count() } catch { continue }
      if (v !== c.last) { c.last = v; c.obj.setText(`${this._plain(c.label)}: ${fmt(v, undefined, this._ctx.lang)}`, { speed: 'fast' }) }
    }
  }

  // ── components ──
  use(name, spec) {
    const f = this._components.get(name)
    if (!f) throw new VatError(`Unknown component '${name}'. Built-in components are methods on stage (stage.table, stage.plot, …); custom ones must be registered with vat.defineComponent.`)
    return f(this._api, spec || {})
  }

  // ── number flight ──
  _fly(from, to, o, formula) {
    let src = null, text, role
    if (from && from._st8 || (from && this._objs.has(from.id) && !(typeof from.fmt === 'function'))) {
      const fo = this._objOf(from)
      src = fo._space === 'hud' ? fo._center() : this._worldToHud(fo._center())
      text = fo._curText ?? fo._text?.textContent ?? ''
      role = fo._role
    } else if (from && typeof from.fmt === 'function') {
      text = from.fmt()
      const shown = this._valIndex.get(from.id)
      if (shown) { src = shown._space === 'hud' ? shown._center() : this._worldToHud(shown._center()); role = shown._role }
    } else throw new VatError(`fly(from, to): 'from' must be a stage object or a Val from the model.`)
    let dst, land
    if (to && typeof to === 'object' && 'slotId' in to) {
      const sl = formula._slotGeom(to.slotId)
      dst = sl.center
      land = () => formula._fillNow(to.slotId, text)
    } else {
      const tobj = this._objOf(to)
      dst = tobj._space === 'hud' ? tobj._center() : this._worldToHud(tobj._center())
      land = () => { if (tobj._text && VALUE_KINDS.has(tobj.kind)) tobj.setText(text, { speed: 'fast' }); else tobj.pulse({ speed: 'fast' }) }
    }
    if (!src) src = { x: dst.x, y: dst.y - 70 }
    const g = svg('g', { class: 'vat-chip', style: 'visibility:hidden;opacity:0' }, this._hudLayers.fly)
    const w = this.measureText(text, FONT.md, 650) + 22
    svg('rect', { x: -w / 2, y: -17, width: w, height: 34, rx: 9, fill: 'var(--surface)', stroke: roleVar(this, role, 'main'), 'stroke-width': 2.5 }, g)
    this._textEl(g, text, { size: FONT.md, weight: 650, fill: roleVar(this, role, 'ink') })
    g.setAttribute('transform', T(src.x, src.y))
    const d = dur(o?.speed, 'normal') * 1.15
    rec.seq(() => {
      rec.tw(g, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.15, 'power1.out')
      rec.tw(g, { attr: { transform: T(src.x, src.y) } }, { attr: { transform: T(dst.x, dst.y) } }, d, 'power2.inOut')
      rec.par(() => { rec.tw(g, { autoAlpha: 1 }, { autoAlpha: 0 }, 0.18); land() })
    })
  }

  // ── follow ──
  _withFollow(obj, fn, o) {
    if (this._follow !== obj || !rec.live) return fn()
    return rec.par(() => {
      rec.seq(fn)
      const c = obj._center(), v = this.camera._v
      this.camera._go({ x: c.x - v.w / 2, y: c.y - v.h / 2, w: v.w, h: v.h }, { speed: o?.speed ?? 'normal' })
    })
  }

  // ── life: clone / split ──
  _cloneObj(a) {
    const el = a._el.cloneNode(true)
    el.setAttribute('data-id', '')
    const body = el.querySelector('.vo-body')
    const textIdx = a._text ? [...a._body.querySelectorAll('text')].indexOf(a._text) : -1
    const b = new Obj(this, { kind: a.kind, body, role: a._role, tags: [...a._tags], textSize: a._textSize, minZoom: a._minZoom, hidden: true, parent: a._parentObj, space: a._space, layer: layerOf(a), origin: a._o })
    if (textIdx >= 0) b._text = body.querySelectorAll('text')[textIdx]
    // paints: map by index
    const allA = [...a._body.querySelectorAll('*')], allB = [...body.querySelectorAll('*')]
    for (const p of a._paints) {
      const i = p.el === a._body ? -1 : allA.indexOf(p.el)
      const elB = i === -1 ? body : allB[i]
      if (elB) { b._paints.push({ el: elB, attr: p.attr, variant: p.variant }); const now = p.el.getAttribute(p.attr + '-role-now'); if (now) elB.setAttribute(p.attr, now) }
    }
    b._curText = a._curText
    if (b._text && a._curText !== undefined) b._text.textContent = a._curText
    b._fit = a._fit
    b._points = a._points
    b._st8 = { ...a._st8, vis: false }
    b._gen = a._gen
    b._lineage = [...a._lineage, a.id]
    b._exists = true
    window.gsap.set(b._el, { attr: { transform: T(b._st8.x, b._st8.y) }, autoAlpha: 0 })
    window.gsap.set(b._s, { attr: { transform: b._S(b._st8.sx, b._st8.sy) } })
    window.gsap.set(b._l, { opacity: b._st8.dim ? 0.22 : 1 })
    window.gsap.set(b._hl, { opacity: b._st8.hl ? 1 : 0 })
    window.gsap.set(b._z, { attr: { transform: S(b._st8.z) }, opacity: b._st8.zo })
    b._measure()
    if (rec.live) rec.ev({ type: 'exist', obj: b.id, on: true })
    else rec.initialEvents.push({ type: 'exist', obj: b.id, on: true })
    if (a._fxOn) for (const [fx, extra] of a._fxOn) b._fx(fx, true, extra)
    return b
  }
  _split(objs, o = {}) {
    if (!objs.length) return []
    const d = dur(o.speed, 'normal')
    const live = this._live()
    const angle = a => {
      const dir = o.dir ?? 'free'
      if (dir === 'horizontal') return 0
      if (dir === 'vertical') return Math.PI / 2
      if (typeof dir === 'number') return dir * Math.PI / 180
      if (dir !== 'free') throw new VatError(`split dir must be 'horizontal', 'vertical', 'free' or an angle in degrees.`)
      const c = a._center(), r = Math.max(a.w, a.h) * 0.6
      let best = 0, bestScore = -Infinity
      for (let k = 0; k < 12; k++) {
        const th = k * Math.PI / 12
        const p1 = { x: c.x - Math.cos(th) * r, y: c.y - Math.sin(th) * r }, p2 = { x: c.x + Math.cos(th) * r, y: c.y + Math.sin(th) * r }
        let score = Infinity
        for (const q of live) if (q !== a && q.kind === a.kind && q._st8.vis) { const qc = q._center(); score = Math.min(score, Math.hypot(qc.x - p1.x, qc.y - p1.y), Math.hypot(qc.x - p2.x, qc.y - p2.y)) }
        const wall = Math.min(p1.x, p2.x, WORLD.w - p1.x, WORLD.w - p2.x, p1.y, p2.y, WORLD.h - p1.y, WORLD.h - p2.y) * 1.5
        score = Math.min(score, wall) - (k === 0 ? 0 : 0.01)
        if (score > bestScore) { bestScore = score; best = th }
      }
      return best
    }
    const pairs = objs.map(a => ({ a, th: angle(a) }))
    // 1) squash
    rec.par(() => pairs.forEach(({ a, th }) => {
      const { sx, sy } = a._st8, hor = Math.abs(Math.cos(th)) >= Math.abs(Math.sin(th))
      a._sq = hor ? [sx * 1.2, sy * 0.86] : [sx * 0.86, sy * 1.2]
      rec.tw(a._s, { attr: { transform: a._S(sx, sy) } }, { attr: { transform: a._S(...a._sq) } }, d * 0.5, 'power2.in')
    }))
    // 2) clones appear in place, everyone separates and relaxes
    for (const p of pairs) { p.a._gen += 1; p.b = this._cloneObj(p.a); p.b._st8.sx = p.a._sq[0]; p.b._st8.sy = p.a._sq[1]; window.gsap.set(p.b._s, { attr: { transform: p.b._S(...p.a._sq) } }) }
    const targets = new Map()
    for (const { a, b, th } of pairs) {
      const c = a._center(), r = Math.max(a.w, a.h) * 0.55
      targets.set(a, { x: c.x - Math.cos(th) * r, y: c.y - Math.sin(th) * r })
      targets.set(b, { x: c.x + Math.cos(th) * r, y: c.y + Math.sin(th) * r })
    }
    const kinds = new Set(objs.map(a => a.kind))
    const crowd = this._live().filter(q => kinds.has(q.kind) && q._space === 'world' && (q._st8.vis || targets.has(q)))
    relax(crowd, targets)
    rec.par(() => {
      for (const { a, b } of pairs) {
        b._st8.vis = true
        rec.tw(b._el, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.01, 'none')
        for (const x of [a, b]) {
          const [fx, fy] = a._sq
          rec.tw(x._s, { attr: { transform: x._S(fx, fy) } }, { attr: { transform: x._S(a._st8.sx, a._st8.sy) } }, d, 'back.out(1.6)')
        }
        b._st8.sx = a._st8.sx; b._st8.sy = a._st8.sy
      }
      for (const [q, p] of targets) q._moveCenterTo(p, { speed: d })
    })
    this._refreshCounters()
    return pairs.map(p => [p.a._api, p.b._api])
  }

  _wrapPart(owner, el, name) {
    const parent = el.parentNode, before = el.nextSibling
    let bb = { x: 0, y: 0, width: 0, height: 0 }
    try { bb = el.getBBox() } catch {}
    const origin = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }
    const p = new Obj(this, { kind: 'part', id: `${owner.id}:${name}`, body: el, container: parent, before, origin, role: owner._role })
    p._parentObj = owner
    p._st8.vis = true
    window.gsap.set(p._el, { attr: { transform: T(0, 0) }, autoAlpha: 1 })
    p._paints = [{ el, attr: 'fill', variant: 'soft' }, { el, attr: 'stroke', variant: 'main' }].filter(x => el.getAttribute(x.attr) !== null || true)
    return p
  }

  // ── escape hatches ──
  adopt(el, opts) {
    const o = this._common(opts, 'adopt')
    if (!(el instanceof SVGElement)) throw new VatError(`adopt(el) needs an SVG element you created (e.g. with document.createElementNS or D3).`)
    const body = svg('g'); body.appendChild(el)
    return this._create(o.kind || 'adopted', body, o, { pos: { x: 0, y: 0 } })._api
  }
  panel(adapter, opts) {
    const o = this._common(opts, 'panel')
    if (!adapter || typeof adapter.mount !== 'function') throw new VatError(`panel(adapter) needs { mount(el), render(stepId, data), destroy?() }.`)
    const r = this._rectFor(o.at, 'right')
    const body = svg('g')
    const fo = svg('foreignObject', { x: -r.w / 2, y: -r.h / 2, width: r.w, height: r.h }, body)
    const div = document.createElement('div'); div.className = 'vat-panel'; fo.appendChild(div)
    const obj = this._create('panel', body, o, { pos: { x: r.x + r.w / 2, y: r.y + r.h / 2 } })
    adapter.mount(div)
    this._panels.push({ adapter, obj })
    if (typeof adapter.render !== 'function') this._warnings.push(`panel '${obj.id}' has no render(): Back/jump cannot restore it.`)
    return obj._api
  }

  // ── components can ask for these helpers ──
  get _svg() { return svg }
}

// ───────────────────────────── Camera ─────────────────────────────

class Camera {
  constructor(stage) { this._st = stage; this._v = { ...DEFAULT_CAM } }
  _go(v, o = {}) {
    const from = this._v
    if (['x', 'y', 'w', 'h'].every(k => Math.abs(from[k] - v[k]) < 0.5)) return
    this._v = { ...v }
    const d = dur(o.speed, 'slow')
    const st = this._st
    rec.par(() => {
      rec.tw(st._worldSvg, { attr: { viewBox: vb(from) } }, { attr: { viewBox: vb(v) } }, d, 'power2.inOut')
      const z = st._zoom()
      for (const ob of st._order) {
        if (ob._space !== 'world' || ob._parentObj && ob._textSize === 'world') continue
        const nz = st._zoomScale(ob._textSize, z), nzo = ob._minZoom && z < ob._minZoom ? 0 : 1
        if (Math.abs(nz - ob._st8.z) > 1e-3 || nzo !== ob._st8.zo) {
          rec.tw(ob._z, { attr: { transform: S(ob._st8.z) }, opacity: ob._st8.zo }, { attr: { transform: S(nz) }, opacity: nzo }, d, 'power2.inOut')
          ob._st8.z = nz; ob._st8.zo = nzo
        }
      }
    })
  }
  _fit(box, pad) {
    let w = Math.max(box.w + 2 * pad, (box.h + 2 * pad) * ASPECT)
    w = clamp(w, WORLD.w / 3.2, WORLD.w * 1.4)
    const h = w / ASPECT
    return { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h }
  }
  _boxOf(target) {
    const objs = target && target._objs ? target._objs : [this._st._objOf(target)]
    if (!objs.length) throw new VatError(`camera: the selection is empty.`)
    const bs = objs.map(o => o._box())
    const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y))
    const x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h))
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }
  focus(target, o = {}) { this._go(this._fit(this._boxOf(target), GAPS[o.padding || 'md'] * 2), o) }
  frame(target, o = {}) {
    const box = typeof target === 'string' ? this._st._regionRect(target) : this._boxOf(target)
    this._go(this._fit(box, GAPS.sm), o)
  }
  follow(target) { this._st._follow = this._st._objOf(target) }
  reset(o = {}) { this._go(DEFAULT_CAM, o) }
  magnify(target, o = {}) {
    const st = this._st
    const box = this._boxOf(target)
    const corner = o.corner || 'tr'
    const W = 420, H = Math.round(W / ASPECT)
    const pad = 24
    let w = Math.max(box.w + 2 * pad, (box.h + 2 * pad) * ASPECT), h = w / ASPECT
    const view = { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h }
    const body = svg('g')
    svg('rect', { x: -W / 2 - 3, y: -H / 2 - 3, width: W + 6, height: H + 6, rx: 12, fill: 'var(--surface)', stroke: 'var(--focus-ring)', 'stroke-width': 3 }, body)
    const inner = svg('svg', { x: -W / 2, y: -H / 2, width: W, height: H, viewBox: vb(view), overflow: 'hidden' }, body)
    svg('use', { href: '#vat-world-content' }, inner)
    const cx = corner.endsWith('r') ? WORLD.w - W / 2 - 24 : W / 2 + 24
    const cy = corner.startsWith('t') ? H / 2 + 24 : WORLD.h - H / 2 - 24
    return st._create('magnifier', body, { hidden: o.hidden }, { space: 'hud', pos: { x: cx, y: cy } })._api
  }
}

// ───────────────────────────── helpers ─────────────────────────────

export const vb = v => `${round(v.x)} ${round(v.y)} ${round(v.w)} ${round(v.h)}`
const round = x => Math.round(x * 100) / 100
function layerOf(o) { const p = o._el.parentNode; return p?.classList?.[0]?.replace(/^layer-|^hud-/, '') || 'nodes' }
function approxLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L }
export function edgePoint(box, toward, pad = 0) {
  const cx = box.cx, cy = box.cy, dx = toward.x - cx, dy = toward.y - cy
  if (!dx && !dy) return { x: cx, y: cy }
  const hw = box.w / 2 + pad, hh = box.h / 2 + pad
  const t = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh)
  return { x: cx + dx * t, y: cy + dy * t }
}
/** Push overlapping circles apart (colony packing). `targets` holds fixed desired positions for some objects. */
function relax(objs, targets) {
  const P = objs.map(o => { const t = targets.get(o) || o._center(); return { o, x: t.x, y: t.y, r: Math.max(o.w, o.h) * 0.5 * o._st8.sx } })
  for (let it = 0; it < 40; it++) {
    let moved = false
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j]
      let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy)
      const need = (a.r + b.r) * 1.04
      if (dist < need) {
        if (dist < 1e-6) { dx = 1; dy = 0; dist = 1 }
        const push = (need - dist) / 2
        a.x -= dx / dist * push; a.y -= dy / dist * push
        b.x += dx / dist * push; b.y += dy / dist * push
        moved = true
      }
    }
    for (const p of P) { p.x = clamp(p.x, p.r + 10, WORLD.w - p.r - 10); p.y = clamp(p.y, p.r + 10, WORLD.h - p.r - 10) }
    if (!moved) break
  }
  for (const p of P) { const c = p.o._center(); if (Math.hypot(c.x - p.x, c.y - p.y) > 0.5 || targets.has(p.o)) targets.set(p.o, { x: p.x, y: p.y }) }
}
