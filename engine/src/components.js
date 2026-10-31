// Built-in components. Each is an Obj (kind = component name) whose children are Objs too, so verbs,
// selection and camera work on every part. Local coordinates: (0,0) = top-left of the component's rectangle.
import { VatError, fmt, niceTicks, clamp } from './util.js'
import { Obj, Sel, rec, svg, T, DUR } from './core.js'
import { FONT, edgePoint } from './stage.js'
import { roleVar } from './design.js'

/** Create a child object at a local position inside `parent`. */
export function child(st, parent, kind, body, pos, o = {}) {
  let id = o.id
  if (id && st._objs.has(id)) id = `${parent.id}.${id}`
  const c = new Obj(st, { kind, id, body, parent, role: o.role, tags: o.tags, text: o.text, textSize: o.textSize, hidden: o.hidden, minZoom: o.minZoom })
  c._st8.x = pos.x - (o.centered === false ? 0 : 0)
  c._st8.y = pos.y
  c._st8.vis = !o.hidden
  window.gsap.set(c._el, { attr: { transform: T(pos.x, pos.y) }, autoAlpha: o.hidden ? 0 : 1 })
  if (o.text) c._curText = o.text.textContent
  if (rec.live) rec.ev({ type: 'exist', obj: c.id, on: true })
  else rec.initialEvents.push({ type: 'exist', obj: c.id, on: true })
  return c
}
const sel = (st, objs) => new Sel(st, objs)._wrap()
/** Resize a chip's background rect when its text changes (setText/setValue/fly). */
const chipFit = (st, rect, size, weight, pad, minW = 0) => function (next) {
  const nw = Math.max(minW, st.measureText(next, size, weight) + pad)
  const cw = this._bgW ?? Number(rect.getAttribute('width'))
  if (Math.abs(nw - cw) < 1) return
  this._bgW = nw
  rec.tw(rect, { attr: { x: -cw / 2, width: cw } }, { attr: { x: -nw / 2, width: nw } }, DUR.fast)
}
const wrapComp = (o, methods) => { Object.assign(o, methods); return o._api }

function cellBody(st, w, h, text, { header = false, role, k = 1 } = {}) {
  const body = svg('g')
  const r = svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0, fill: header ? 'var(--surface-2)' : 'var(--surface)', stroke: 'var(--line)', 'stroke-width': 1.5 }, body)
  const t = st._textEl(body, text, { size: (header ? FONT.sm + 1 : FONT.md) * k, weight: header ? 650 : 450, fill: role ? roleVar(st, role, 'ink') : header ? 'var(--ink-2)' : 'var(--ink)', cls: 'num' })
  return { body, r, t }
}

// ───────────────────────────── table ─────────────────────────────
export function table(st, spec = {}) {
  const o = st._common(spec, 'table')
  if (!Array.isArray(o.columns) || !Array.isArray(o.rows)) throw new VatError(`table({ columns: [...], rows: [[...], ...] }) needs columns and rows arrays.`)
  o.rows.forEach((r, i) => { if (!Array.isArray(r) || r.length !== o.columns.length) throw new VatError(`table: row ${i} has ${Array.isArray(r) ? r.length : 'no'} cells but there are ${o.columns.length} columns.`) })
  const rect = st._rectFor(o.at, 'left')
  const txt = v => st._valText(v)
  const colW0 = o.columns.map((c, j) => Math.max(st.measureText(st._plain(c), FONT.sm + 1, 650), ...o.rows.map(r => st.measureText(txt(r[j]), FONT.md, 450))) + 34)
  const W0 = colW0.reduce((a, b) => a + b, 0), H0 = 42 + 46 * o.rows.length
  // grow with the region (readable from a distance), never shrink below the base size
  const k = clamp(Math.min(rect.w * 0.86 / W0, rect.h * 0.62 / H0), 1, 1.5)
  const colW = colW0.map(w => w * k), rowH = 46 * k, headH = 42 * k
  const W = colW.reduce((a, b) => a + b, 0), H = headH + rowH * o.rows.length
  const body = svg('g')
  const comp = st._create('table', body, o, { at0: { x: rect.x + Math.max(0, (rect.w - W) / 2), y: rect.y + Math.max(0, (rect.h - H) / 2) } })
  const headers = [], cells = []
  let x = 0
  o.columns.forEach((c, j) => {
    const { body: b, t } = cellBody(st, colW[j], headH, st._plain(c), { header: true, k })
    headers.push(child(st, comp, 'table-header', b, { x: x + colW[j] / 2, y: headH / 2 }, { text: t, id: o.id ? `${o.id}.h${j}` : undefined }))
    x += colW[j]
  })
  const addRowCells = (vals, ri, hidden) => {
    let cx = 0
    const row = vals.map((v, j) => {
      const { body: b, t } = cellBody(st, colW[j], rowH, txt(v), { k })
      const c = child(st, comp, 'table-cell', b, { x: cx + colW[j] / 2, y: headH + rowH * ri + rowH / 2 }, { text: t, hidden, id: o.id ? `${o.id}.r${ri}c${j}` : undefined })
      if (v && typeof v === 'object' && v.id) st._valIndex.set(v.id, c)
      cx += colW[j]
      return c
    })
    cells[ri] = row
    return row
  }
  o.rows.forEach((r, i) => addRowCells(r, i, false))
  const colIndex = c => {
    if (typeof c === 'number') { if (c < 0 || c >= o.columns.length) throw new VatError(`table: column ${c} does not exist (0..${o.columns.length - 1}).`); return c }
    const j = o.columns.findIndex(n => n === c || st._plain(n) === c)
    if (j < 0) throw new VatError(`table: no column named '${c}'. Columns: ${o.columns.map(n => `'${n}'`).join(', ')}.`)
    return j
  }
  return wrapComp(comp, {
    cell(r, c) {
      const row = cells[r]
      if (!row) throw new VatError(`table.cell(${r}, …): row ${r} does not exist (0..${cells.length - 1}).`)
      return row[colIndex(c)]._api
    },
    row(r) { if (!cells[r]) throw new VatError(`table.row(${r}): no such row.`); return sel(st, cells[r]) },
    col(c) { const j = colIndex(c); return sel(st, cells.map(r => r[j])) },
    header(c) { return headers[colIndex(c)]._api },
    addRow(vals, opt) {
      if (!Array.isArray(vals) || vals.length !== o.columns.length) throw new VatError(`table.addRow: need ${o.columns.length} values.`)
      const row = addRowCells(vals, cells.length, true)
      rec.par(() => row.forEach(c => c.show(opt)))
      return sel(st, row)
    },
  })
}

// ───────────────────────────── plot ─────────────────────────────
export function plot(st, spec = {}) {
  const o = st._common(spec, 'plot')
  for (const ax of ['x', 'y']) {
    const a = o[ax]
    if (!a || !Array.isArray(a.domain) || a.domain.length !== 2 || !(a.domain[1] > a.domain[0])) throw new VatError(`plot: ${ax}.domain must be [min, max] with max > min.`)
  }
  const rect = st._rectFor(o.at, 'right')
  const ml = 78, mb = 64, mt = 18, mr = 24
  const iw = rect.w - ml - mr, ih = rect.h - mt - mb
  const [x0, x1] = o.x.domain, [y0, y1] = o.y.domain
  const sx = x => ml + (x - x0) / (x1 - x0) * iw
  const sy = y => mt + ih - (y - y0) / (y1 - y0) * ih
  const body = svg('g')
  const axes = svg('g', { class: 'plot-axes' }, body)
  if (o.grid !== false) {
    for (const t of niceTicks(x0, x1)) svg('line', { x1: sx(t), x2: sx(t), y1: mt, y2: mt + ih, class: 'grid' }, axes)
    for (const t of niceTicks(y0, y1)) svg('line', { x1: ml, x2: ml + iw, y1: sy(t), y2: sy(t), class: 'grid' }, axes)
  }
  svg('line', { x1: ml, x2: ml + iw, y1: mt + ih, y2: mt + ih, class: 'axis' }, axes)
  svg('line', { x1: ml, x2: ml, y1: mt, y2: mt + ih, class: 'axis' }, axes)
  for (const t of niceTicks(x0, x1)) { const e = st._textEl(axes, fmt(t, undefined, st._ctx.lang), { size: FONT.sm - 1, fill: 'var(--ink-3)', cls: 'num' }); e.setAttribute('x', sx(t)); e.setAttribute('y', mt + ih + 20) }
  for (const t of niceTicks(y0, y1)) { const e = st._textEl(axes, fmt(t, undefined, st._ctx.lang), { size: FONT.sm - 1, fill: 'var(--ink-3)', anchor: 'end', cls: 'num' }); e.setAttribute('x', ml - 10); e.setAttribute('y', sy(t)) }
  const xl = st._textEl(axes, st._plain(o.x.label || ''), { size: FONT.sm, weight: 600, fill: 'var(--ink-2)' }); xl.setAttribute('x', ml + iw / 2); xl.setAttribute('y', mt + ih + 48)
  const yl = st._textEl(axes, st._plain(o.y.label || ''), { size: FONT.sm, weight: 600, fill: 'var(--ink-2)' }); yl.setAttribute('transform', `translate(${ml - 56} ${mt + ih / 2}) rotate(-90)`)
  const comp = st._create('plot', body, o, { at0: { x: rect.x, y: rect.y } })
  const toLocal = (x, y) => ({ x: sx(x), y: sy(y) })
  comp._toWorld = (x, y) => { const g = comp._origin(); return { x: comp._st8.x + g.x + sx(x), y: comp._st8.y + g.y + sy(y) } }
  const inDomain = p => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1
  const drawIn = (path, L) => rec.tw(path, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L } }, { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': 0 } }, DUR.slow)
  const lineChild = (kind, localPts, op = {}) => {
    const b = svg('g')
    const d = localPts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    const path = svg('path', { d, fill: 'none', 'stroke-width': op.width ?? 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op.dashed ? { 'stroke-dasharray': '8 7' } : {}) }, b)
    path.setAttribute('stroke', roleVar(st, op.role, 'main'))
    let L = 0
    for (let i = 1; i < localPts.length; i++) L += Math.hypot(localPts[i].x - localPts[i - 1].x, localPts[i].y - localPts[i - 1].y)
    const live = rec.live && !op.hidden
    const c = child(st, comp, kind, b, { x: 0, y: 0 }, { ...op, hidden: rec.live ? true : op.hidden })
    c._paints.push({ el: path, attr: 'stroke', variant: 'main' })
    c._flowEl = path
    Object.defineProperty(c, '_points', { get: () => { const g = comp._origin(); return localPts.map(p => ({ x: comp._st8.x + g.x + p.x, y: comp._st8.y + g.y + p.y })) } })
    if (!op.dashed) { c._drawEl = path; c._drawLen = L }
    if (live) c._setVis(true)
    return c
  }
  return wrapComp(comp, {
    point(p, op = {}) {
      st._checkRole(op.role)
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new VatError(`plot.point({ x, y }) needs numbers (got ${JSON.stringify(p)}).`)
      if (!inDomain(p)) st._warnings.push(`plot.point(${p.x}, ${p.y}) is outside the plot domain.`)
      const b = svg('g')
      const c0 = svg('circle', { r: 9, 'stroke-width': 2.5, stroke: 'var(--surface)' }, b)
      c0.setAttribute('fill', roleVar(st, op.role, 'main'))
      let t = null
      if (op.label) { t = st._textEl(b, st._plain(op.label), { size: FONT.sm, weight: 550, fill: 'var(--ink-2)', anchor: 'start' }); t.setAttribute('x', 14) }
      const hidden = rec.live ? true : op.hidden
      const c = child(st, comp, 'plot-point', b, toLocal(p.x, p.y), { ...op, hidden, text: t })
      c._paints.push({ el: c0, attr: 'fill', variant: 'main' })
      if (op.draggable) { c._el.dataset.drag = JSON.stringify({ plot: comp.id, ...op.draggable, x0, x1, y0, y1 }); c._drag = { sx, sy, ml, mt, iw, ih } }
      if (rec.live && !op.hidden) c._setVis(true, { speed: 'fast' })
      return c._api
    },
    points(ps, op = {}) {
      if (!Array.isArray(ps)) throw new VatError(`plot.points([...]) needs an array of { x, y }.`)
      const objs = []
      rec.par(() => ps.forEach(p => objs.push(st._objOf(this.point({ x: p.x, y: p.y }, { ...op, ...p, label: p.label ?? op.label })))))
      return sel(st, objs)
    },
    curve(f, op = {}) {
      if (typeof f !== 'function') throw new VatError(`plot.curve(f) needs a function x => y.`)
      const [a, b] = op.domain || [x0, x1]
      const pts = []
      for (let i = 0; i <= 160; i++) { const x = a + (b - a) * i / 160, y = f(x); if (Number.isFinite(y)) pts.push(toLocal(x, clamp(y, y0 - (y1 - y0) * 0.02, y1 + (y1 - y0) * 0.02))) }
      if (pts.length < 2) throw new VatError(`plot.curve: f returned no finite values in [${a}, ${b}].`)
      return lineChild('plot-curve', pts, op)._api
    },
    polyline(ps, op = {}) { return lineChild('plot-line', ps.map(p => toLocal(p.x, p.y)), op)._api },
    segment(p, q, op = {}) { return lineChild('plot-segment', [toLocal(p.x, p.y), toLocal(q.x, q.y)], { width: 2.5, ...op })._api },
    circle(c, r, op = {}) {
      const b = svg('g')
      const e = svg('ellipse', { cx: 0, cy: 0, rx: Math.abs(sx(c.x + r) - sx(c.x)), ry: Math.abs(sy(c.y + r) - sy(c.y)), fill: 'none', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, b)
      e.setAttribute('stroke', roleVar(st, op.role, 'main'))
      const ch = child(st, comp, 'plot-circle', b, toLocal(c.x, c.y), { ...op, hidden: rec.live ? true : op.hidden })
      ch._paints.push({ el: e, attr: 'stroke', variant: 'main' })
      if (rec.live && !op.hidden) ch._setVis(true)
      return ch._api
    },
    region(f, op = {}) {
      const nx = op.resolution ?? 48, ny = Math.round(nx * ih / iw)
      const b = svg('g', { opacity: 0.55 })
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = x0 + (x1 - x0) * (i + 0.5) / nx, y = y0 + (y1 - y0) * (j + 0.5) / ny
        const role = f(x, y)
        if (!role) continue
        st._checkRole(role)
        svg('rect', { x: ml + iw * i / nx, y: mt + ih - ih * (j + 1) / ny, width: iw / nx + 0.5, height: ih / ny + 0.5, fill: roleVar(st, role, 'soft') }, b)
      }
      const ch = child(st, comp, 'plot-region', b, { x: 0, y: 0 }, { ...op, hidden: rec.live ? true : op.hidden })
      comp._body.insertBefore(ch._el, comp._body.children[1] || null)
      if (rec.live && !op.hidden) ch._setVis(true)
      return ch._api
    },
  })
}

// ───────────────────────────── neural net ─────────────────────────────
export function neuralNet(st, spec = {}) {
  const o = st._common(spec, 'neuralNet')
  const L = o.layers
  if (!Array.isArray(L) || L.length < 2 || L.some(n => !Number.isInteger(n) || n < 1)) throw new VatError(`neuralNet({ layers: [2, 3, 1] }) needs at least two layer sizes.`)
  const ids = o.ids || L.map((n, li) => Array.from({ length: n }, (_, k) =>
    li === 0 ? `x${k + 1}` : li === L.length - 1 ? `y${k + 1}` : L.length === 3 ? `h${k + 1}` : `h${li}_${k + 1}`))
  if (ids.length !== L.length || ids.some((col, i) => col.length !== L[i])) throw new VatError(`neuralNet: ids must match layers (${JSON.stringify(L)}).`)
  const rect = st._rectFor(o.at, 'center')
  const top = o.layerNames ? 56 : 24, bottom = 24
  const maxN = Math.max(...L)
  const R = clamp(Math.min((rect.h - top - bottom) / maxN * 0.32, 42), 18, 42)
  const colX = i => 60 + (rect.w - 120) * (L.length === 1 ? 0.5 : i / (L.length - 1))
  const rowY = (i, k) => top + (rect.h - top - bottom) * ((k + 0.5) / L[i])
  const body = svg('g')
  const comp = st._create('neuralNet', body, o, { at0: { x: rect.x, y: rect.y } })
  const pos = {}
  ids.forEach((col, i) => col.forEach((id, k) => { pos[id] = { x: colX(i), y: rowY(i, k), layer: i } }))
  if (o.layerNames) o.layerNames.forEach((nm, i) => { const t = st._textEl(body, st._plain(nm), { size: FONT.sm, weight: 650, fill: 'var(--ink-3)' }); t.setAttribute('x', colX(i)); t.setAttribute('y', 18) })
  const nodes = new Map(), edges = new Map(), weights = new Map(), biases = new Map(), nvals = new Map()
  const vals = o.values || {}
  const wKey = (a, b) => `${a}>${b}`
  const showW = o.weights ?? 'on-focus'
  // edges first (below nodes)
  for (let i = 0; i < L.length - 1; i++) ids[i].forEach(a => ids[i + 1].forEach((b, bi) => {
    const pa = pos[a], pb = pos[b]
    const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x)
    const p1 = { x: pa.x + Math.cos(ang) * R, y: pa.y + Math.sin(ang) * R }, p2 = { x: pb.x - Math.cos(ang) * (R + 3), y: pb.y - Math.sin(ang) * (R + 3) }
    const eb = svg('g')
    const line = svg('line', { x1: p1.x - pa.x, y1: p1.y - pa.y, x2: p2.x - pa.x, y2: p2.y - pa.y, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, eb)
    line.setAttribute('stroke', 'var(--line)')
    const e = child(st, comp, 'net-edge', eb, { x: pa.x, y: pa.y }, { id: `${a}-${b}`, tags: [`from-${a}`, `to-${b}`] })
    e._paints.push({ el: line, attr: 'stroke', variant: 'main' })
    e._flowEl = line
    e._drawEl = line; e._drawLen = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    edges.set(wKey(a, b), e)
    // weight chip: spread along edge by target index to avoid collisions
    const t = ids[i + 1].length > 1 ? 0.2 + 0.16 * (bi % 3) : 0.3
    const wv = vals.weights?.[wKey(a, b)] ?? vals.weights?.[`${a}-${b}`]
    const str = wv !== undefined ? st._valText(wv) : 'w'
    const ww = st.measureText(str, FONT.sm, 650) + 14
    const wb = svg('g')
    const wr = svg('rect', { x: -ww / 2, y: -13, width: ww, height: 26, rx: 7, fill: 'var(--surface)', stroke: 'var(--line)', 'stroke-width': 1.2 }, wb)
    const wt = st._textEl(wb, str, { size: FONT.sm, weight: 650, fill: 'var(--ink-2)', cls: 'num' })
    const wo = child(st, comp, 'net-weight', wb, { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }, { id: `w_${a}_${b}`, text: wt, hidden: showW !== 'always', textSize: 'damped' })
    wo._fit = chipFit(st, wr, FONT.sm, 650, 14, 30)
    if (wv && wv.id) st._valIndex.set(wv.id, wo)
    weights.set(wKey(a, b), wo)
  }))
  ids.forEach((col, i) => col.forEach(id => {
    const p = pos[id]
    const nb = svg('g')
    const c = svg('circle', { r: R, 'stroke-width': 2.5 }, nb)
    const lab = st._textEl(nb, id.replace(/^([a-z]+)(\d+)$/i, (m, a, d) => a + d.split('').map(ch => '₀₁₂₃₄₅₆₇₈₉'[ch]).join('')), { size: FONT.sm, weight: 600, fill: 'var(--ink-3)' })
    lab.setAttribute('y', -R - 14)
    const n = child(st, comp, 'net-node', nb, p, { id, tags: [`layer-${i}`] })
    st._paint(n, c, o.role, 'soft', 'main')
    if (!o.role) { c.setAttribute('fill', 'var(--surface)'); c.setAttribute('stroke', 'var(--ink-3)') }
    nodes.set(id, n)
    const v0 = i === 0 ? vals.inputs?.[id] : vals.activations?.[id]
    const vb = svg('g')
    const vt = st._textEl(vb, v0 !== undefined ? st._valText(v0) : '', { size: FONT.md - 1, weight: 650, fill: 'var(--ink)', cls: 'num' })
    const nv = child(st, n, 'net-value', vb, { x: 0, y: 0 }, { id: `v_${id}`, text: vt, textSize: 'damped' })
    nv._curText = vt.textContent
    if (v0 && v0.id) st._valIndex.set(v0.id, nv)
    nvals.set(id, nv)
    if (i > 0 && o.bias !== false) {
      const bv = vals.biases?.[id]
      const str = bv !== undefined ? `b ${st._valText(bv)}` : 'b'
      const bw = st.measureText(str, FONT.sm - 2, 600) + 10
      const bb = svg('g')
      const br = svg('rect', { x: -bw / 2, y: -12, width: bw, height: 24, rx: 7, fill: 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 1 }, bb)
      const bt = st._textEl(bb, str, { size: FONT.sm - 1, weight: 600, fill: 'var(--ink-2)', cls: 'num' })
      const bo = child(st, n, 'net-bias', bb, { x: R * 0.92, y: R * 0.92 }, { id: `b_${id}`, text: bt, textSize: 'damped' })
      bo._fit = chipFit(st, br, FONT.sm - 2, 600, 10, 24)
      if (bv && bv.id) st._valIndex.set(bv.id, bo)
      biases.set(id, bo)
    }
  }))
  const need = (m, k, what) => { const x = m.get(k); if (!x) throw new VatError(`neuralNet.${what}: '${k}' does not exist. Node ids: ${[...nodes.keys()].join(', ')}.`); return x._api }
  return wrapComp(comp, {
    node: id => need(nodes, id, `node('${id}')`),
    nodes: () => sel(st, [...nodes.values()]),
    edge: (a, b) => need(edges, wKey(a, b), `edge('${a}', '${b}')`),
    edges: () => sel(st, [...edges.values()]),
    layer(i) { if (!ids[i]) throw new VatError(`neuralNet.layer(${i}): layers are 0..${ids.length - 1}.`); return sel(st, ids[i].map(id => nodes.get(id))) },
    nodeValue: id => need(nvals, id, `nodeValue('${id}')`),
    weight: (a, b) => need(weights, wKey(a, b), `weight('${a}', '${b}')`),
    weights: () => sel(st, [...weights.values()]),
    bias: id => need(biases, id, `bias('${id}')`),
  })
}

// ───────────────────────────── graph ─────────────────────────────
export function graph(st, spec = {}) {
  const o = st._common(spec, 'graph')
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) throw new VatError(`graph({ nodes: [...], edges: [...] }) needs nodes and edges.`)
  const rect = st._rectFor(o.at, 'center')
  const ids = o.nodes.map(n => n.id)
  o.edges.forEach(e => { if (!ids.includes(e.from) || !ids.includes(e.to)) throw new VatError(`graph: edge ${e.from} → ${e.to} uses an unknown node id.`) })
  const layout = o.layout || 'layered'
  const pos = {}
  if (layout === 'circle' || layout === 'force') {
    const cx = rect.w / 2, cy = rect.h / 2, r = Math.min(rect.w, rect.h) * 0.36
    ids.forEach((id, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / ids.length; pos[id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r } })
    if (layout === 'force') for (let it = 0; it < 200; it++) {
      for (const a of ids) for (const b of ids) if (a < b) {
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y, d = Math.hypot(dx, dy) || 1, f = 9000 / (d * d)
        pos[a].x -= dx / d * f; pos[a].y -= dy / d * f; pos[b].x += dx / d * f; pos[b].y += dy / d * f
      }
      for (const e of o.edges) { const a = pos[e.from], b = pos[e.to], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 180) * 0.02; a.x += dx / d * f; a.y += dy / d * f; b.x -= dx / d * f; b.y -= dy / d * f }
      for (const id of ids) { pos[id].x = clamp(pos[id].x, 80, rect.w - 80); pos[id].y = clamp(pos[id].y, 40, rect.h - 40) }
    }
  } else {
    const depth = Object.fromEntries(ids.map(id => [id, 0]))
    for (let k = 0; k < ids.length; k++) for (const e of o.edges) depth[e.to] = Math.max(depth[e.to], depth[e.from] + 1)
    const maxD = Math.max(...Object.values(depth))
    const byD = {}
    ids.forEach(id => (byD[depth[id]] = byD[depth[id]] || []).push(id))
    const down = o.direction === 'down'
    for (const [d, list] of Object.entries(byD)) list.forEach((id, k) => {
      const a = maxD ? Number(d) / maxD : 0.5, b = (k + 0.5) / list.length
      pos[id] = down ? { x: 80 + (rect.w - 160) * b, y: 50 + (rect.h - 100) * a } : { x: 90 + (rect.w - 180) * a, y: 40 + (rect.h - 80) * b }
    })
  }
  const body = svg('g')
  const comp = st._create('graph', body, o, { at0: { x: rect.x, y: rect.y } })
  const nodes = new Map(), edges = new Map()
  const boxes = {}
  for (const n of o.nodes) {
    const str = st._plain(n.label ?? n.id)
    const w = Math.max(64, st.measureText(str, FONT.md, 550) + 32), h = 46
    boxes[n.id] = { w, h }
  }
  for (const e of o.edges) {
    const A = { ...boxes[e.from], cx: pos[e.from].x, cy: pos[e.from].y }, B = { ...boxes[e.to], cx: pos[e.to].x, cy: pos[e.to].y }
    const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 4), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8)
    const eb = svg('g')
    const path = svg('path', { d: `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`, fill: 'none', 'stroke-width': 2.4, 'marker-end': `url(#${st._marker(e.role)})` }, eb)
    path.setAttribute('stroke', roleVar(st, e.role, 'main'))
    let t = null
    if (e.label) {
      const lg = svg('g', { transform: T((p1.x + p2.x) / 2, (p1.y + p2.y) / 2) }, eb), s = st._plain(e.label), lw = st.measureText(s, FONT.sm, 550) + 14
      svg('rect', { x: -lw / 2, y: -13, width: lw, height: 26, rx: 7, fill: 'var(--surface)', stroke: 'var(--line-2)' }, lg)
      t = st._textEl(lg, s, { size: FONT.sm, weight: 550, fill: 'var(--ink-2)' })
    }
    const c = child(st, comp, 'graph-edge', eb, { x: 0, y: 0 }, { id: `${e.from}-${e.to}`, text: t, role: e.role })
    c._paints.push({ el: path, attr: 'stroke', variant: 'main' })
    c._flowEl = path
    c._drawEl = path; c._drawLen = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    c._points = Array.from({ length: 25 }, (_, i) => { const g = comp._origin(); return { x: comp._st8.x + g.x + p1.x + (p2.x - p1.x) * i / 24, y: comp._st8.y + g.y + p1.y + (p2.y - p1.y) * i / 24 } })
    edges.set(`${e.from}>${e.to}`, c)
  }
  for (const n of o.nodes) {
    st._checkRole(n.role)
    const { w, h } = boxes[n.id]
    const nb = svg('g')
    const r = svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, 'stroke-width': 2 }, nb)
    const t = st._textEl(nb, st._plain(n.label ?? n.id), { size: FONT.md, weight: 550, fill: n.role ? roleVar(st, n.role, 'ink') : 'var(--ink)' })
    const c = child(st, comp, 'graph-node', nb, pos[n.id], { id: n.id, tags: n.tags, text: t, role: n.role })
    st._paint(c, r, n.role, 'soft', 'main')
    if (!n.role) { r.setAttribute('fill', 'var(--surface)'); r.setAttribute('stroke', 'var(--ink-3)') }
    nodes.set(n.id, c)
  }
  return wrapComp(comp, {
    node(id) { const x = nodes.get(id); if (!x) throw new VatError(`graph.node('${id}'): unknown. Nodes: ${ids.join(', ')}.`); return x._api },
    edge(a, b) { const x = edges.get(`${a}>${b}`); if (!x) throw new VatError(`graph.edge('${a}', '${b}'): no such edge.`); return x._api },
    nodes: () => sel(st, [...nodes.values()]),
    edges: () => sel(st, [...edges.values()]),
  })
}

// ───────────────────────────── grid ─────────────────────────────
export function grid(st, spec = {}) {
  const o = st._common(spec, 'grid')
  if (!(o.rows > 0 && o.cols > 0)) throw new VatError(`grid({ rows, cols }) needs positive sizes.`)
  const rect = st._rectFor(o.at, 'center')
  const s = Math.min((rect.w - 20) / o.cols, (rect.h - 20) / o.rows, 84)
  const W = s * o.cols, H = s * o.rows
  const body = svg('g')
  const comp = st._create('grid', body, o, { at0: { x: rect.x + (rect.w - W) / 2, y: rect.y + (rect.h - H) / 2 } })
  const cells = []
  for (let r = 0; r < o.rows; r++) {
    cells[r] = []
    for (let c = 0; c < o.cols; c++) {
      const v = o.values?.[r]?.[c]
      const b = svg('g')
      const rr = svg('rect', { x: -s / 2, y: -s / 2, width: s, height: s, 'stroke-width': 1.5 }, b)
      let t = null
      if (v !== undefined && o.showValues !== false) t = st._textEl(b, st._valText(v), { size: clamp(s * 0.36, 12, FONT.md), weight: 500, fill: 'var(--ink)', cls: 'num' })
      const ch = child(st, comp, 'grid-cell', b, { x: c * s + s / 2, y: r * s + s / 2 }, { text: t, id: o.id ? `${o.id}.r${r}c${c}` : undefined, tags: [`row-${r}`, `col-${c}`] })
      st._paint(ch, rr, o.role, 'soft', null)
      if (!o.role) rr.setAttribute('fill', 'var(--surface)')
      rr.setAttribute('stroke', 'var(--line)')
      if (v && typeof v === 'object' && v.id) st._valIndex.set(v.id, ch)
      cells[r][c] = ch
    }
  }
  const cell = (r, c) => { const x = cells[r]?.[c]; if (!x) throw new VatError(`grid.cell(${r}, ${c}): outside ${o.rows}×${o.cols}.`); return x }
  return wrapComp(comp, {
    cell: (r, c) => cell(r, c)._api,
    cells: () => sel(st, cells.flat()),
    row: r => sel(st, cells[r] || []),
    col: c => sel(st, cells.map(row => row[c]).filter(Boolean)),
    window(r, c, h, w, op = {}) {
      st._checkRole(op.role)
      const b = svg('g')
      const rr = svg('rect', { x: 0, y: 0, width: w * s, height: h * s, rx: 6, fill: 'none', 'stroke-width': 4 }, b)
      rr.setAttribute('stroke', roleVar(st, op.role || 'accent', 'main'))
      const win = child(st, comp, 'grid-window', b, { x: c * s, y: r * s }, { ...op, hidden: rec.live ? true : op.hidden })
      win._paints.push({ el: rr, attr: 'stroke', variant: 'main' })
      win._rc = { r, c }
      if (rec.live && !op.hidden) win._setVis(true)
      return wrapComp(win, {
        slideTo(nr, nc, so) {
          cell(nr, nc); cell(nr + h - 1, nc + w - 1)
          win._rc = { r: nr, c: nc }
          win._moveLocal(nc * s, nr * s, so)
          return win._api
        },
        cells() { const { r: r0, c: c0 } = win._rc; const out = []; for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) out.push(cell(r0 + i, c0 + j)); return sel(st, out) },
      })
    },
  })
}

// ───────────────────────────── number line ─────────────────────────────
export function numberLine(st, spec = {}) {
  const o = st._common(spec, 'numberLine')
  const [a, b] = o.domain || []
  if (!(b > a)) throw new VatError(`numberLine({ domain: [min, max] }) needs max > min.`)
  const rect = st._rectFor(o.at, 'bottom')
  const W = rect.w - 80, y = rect.h / 2
  const sx = x => 40 + (x - a) / (b - a) * W
  const body = svg('g')
  svg('line', { x1: 30, x2: W + 50, y1: y, y2: y, class: 'axis' }, body)
  for (const t of niceTicks(a, b, o.ticks ?? 10)) {
    svg('line', { x1: sx(t), x2: sx(t), y1: y - 7, y2: y + 7, class: 'axis' }, body)
    const e = st._textEl(body, fmt(t, undefined, st._ctx.lang), { size: FONT.sm, fill: 'var(--ink-3)', cls: 'num' }); e.setAttribute('x', sx(t)); e.setAttribute('y', y + 26)
  }
  const comp = st._create('numberLine', body, o, { at0: { x: rect.x, y: rect.y } })
  return wrapComp(comp, {
    mark(x, op = {}) {
      st._checkRole(op.role)
      const g = svg('g')
      const c = svg('circle', { r: 10, stroke: 'var(--surface)', 'stroke-width': 2.5 }, g)
      c.setAttribute('fill', roleVar(st, op.role || 'accent', 'main'))
      let t = null
      if (op.label) { t = st._textEl(g, st._plain(op.label), { size: FONT.sm, weight: 600, fill: roleVar(st, op.role, 'ink') }); t.setAttribute('y', -26) }
      const m = child(st, comp, 'line-mark', g, { x: sx(x), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden })
      m._paints.push({ el: c, attr: 'fill', variant: 'main' })
      m._toX = v => sx(v)
      if (rec.live && !op.hidden) m._setVis(true)
      return m._api
    },
    interval(x0, x1, op = {}) {
      const g = svg('g')
      const l = svg('line', { x1: 0, x2: sx(x1) - sx(x0), y1: 0, y2: 0, 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.7 }, g)
      l.setAttribute('stroke', roleVar(st, op.role || 'accent', 'main'))
      let t = null
      if (op.label) { t = st._textEl(g, st._plain(op.label), { size: FONT.sm, weight: 600, fill: 'var(--ink-2)' }); t.setAttribute('x', (sx(x1) - sx(x0)) / 2); t.setAttribute('y', -22) }
      const m = child(st, comp, 'line-interval', g, { x: sx(x0), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden })
      m._paints.push({ el: l, attr: 'stroke', variant: 'main' })
      if (rec.live && !op.hidden) m._setVis(true)
      return m._api
    },
  })
}

// ───────────────────────────── sequence diagram ─────────────────────────────
export function sequence(st, spec = {}) {
  const o = st._common(spec, 'sequence')
  if (!Array.isArray(o.actors) || o.actors.length < 2) throw new VatError(`sequence({ actors: [{ id, label }, …] }) needs at least two actors.`)
  const rect = st._rectFor(o.at, 'main')
  const n = o.actors.length
  const ax = i => 110 + (rect.w - 220) * (n === 1 ? 0.5 : i / (n - 1))
  const body = svg('g')
  const comp = st._create('sequence', body, o, { at0: { x: rect.x, y: rect.y } })
  const actors = new Map()
  o.actors.forEach((a, i) => {
    st._checkRole(a.role)
    svg('line', { x1: ax(i), x2: ax(i), y1: 60, y2: rect.h - 10, class: 'lifeline' }, body)
    const g = svg('g')
    const str = st._plain(a.label)
    const w = Math.max(120, st.measureText(str, FONT.md, 650) + 36)
    const r = svg('rect', { x: -w / 2, y: -24, width: w, height: 48, rx: 12, 'stroke-width': 2 }, g)
    const t = st._textEl(g, str, { size: FONT.md, weight: 650, fill: a.role ? roleVar(st, a.role, 'ink') : 'var(--ink)' })
    const c = child(st, comp, 'seq-actor', g, { x: ax(i), y: 30 }, { id: a.id, text: t, role: a.role })
    st._paint(c, r, a.role, 'soft', 'main')
    actors.set(a.id, { c, x: ax(i) })
  })
  let row = 0
  const msgs = []
  const nextY = () => 110 + 72 * row++
  const actor = id => { const a = actors.get(id); if (!a) throw new VatError(`sequence: unknown actor '${id}'. Actors: ${[...actors.keys()].join(', ')}.`); return a }
  return wrapComp(comp, {
    actor: id => actor(id).c._api,
    messages: () => sel(st, msgs),
    message(from, to, label, op = {}) {
      st._checkRole(op.role)
      const A = actor(from), B = actor(to), y = nextY()
      const dir = B.x > A.x ? 1 : -1
      const x1 = A.x + 6 * dir, x2 = B.x - 10 * dir
      const g = svg('g')
      const path = svg('path', { d: `M${x1} 0 L${x2} 0`, fill: 'none', 'stroke-width': 3, 'marker-end': `url(#${st._marker(op.role)})`, ...(op.dashed ? { 'stroke-dasharray': '8 6' } : {}) }, g)
      path.setAttribute('stroke', roleVar(st, op.role, 'main'))
      const str = st._plain(label)
      const lw = st.measureText(str, FONT.md, 650) + 22
      const lg = svg('g', { transform: T((x1 + x2) / 2, -22) }, g)
      const mr = svg('rect', { x: -lw / 2, y: -16, width: lw, height: 32, rx: 8, fill: 'var(--surface)', stroke: roleVar(st, op.role, 'main'), 'stroke-width': 1.5 }, lg)
      const t = st._textEl(lg, str, { size: FONT.md, weight: 650, fill: roleVar(st, op.role, 'ink') })
      if (op.detail) { const d = st._textEl(g, st._plain(op.detail), { size: FONT.sm, fill: 'var(--ink-2)' }); d.setAttribute('x', (x1 + x2) / 2); d.setAttribute('y', 20) }
      const L = Math.abs(x2 - x1)
      const live = rec.live
      const m = child(st, comp, 'seq-message', g, { x: 0, y }, { ...op, text: t, hidden: true, tags: [...(op.tags || []), `from-${from}`, `to-${to}`] })
      m._paints.push({ el: path, attr: 'stroke', variant: 'main' })
      m._flowEl = path
      m._fit = chipFit(st, mr, FONT.md, 650, 22, 40)
      m._points = Array.from({ length: 25 }, (_, i) => { const gg = comp._origin(); return { x: comp._st8.x + gg.x + x1 + (x2 - x1) * i / 24, y: comp._st8.y + gg.y + y } })
      msgs.push(m)
      if (!op.dashed) { m._drawEl = path; m._drawLen = L }
      if (live && !op.hidden) m._setVis(true)
      return m._api
    },
    note(actorId, text, op = {}) {
      const A = actor(actorId), y = nextY()
      const g = svg('g')
      const str = st._plain(text)
      const lines = st._wrapLines(str, FONT.sm, 450, 260)
      const w = Math.max(...lines.map(l => st.measureText(l, FONT.sm, 450))) + 24, h = lines.length * FONT.sm * 1.25 + 16
      svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 8, fill: 'var(--warn-soft)', stroke: 'var(--line)' }, g)
      const t = st._textEl(g, lines.join('\n'), { size: FONT.sm, fill: 'var(--ink)' })
      const isLast = [...actors.values()].pop() === A
      const nn = child(st, comp, 'seq-note', g, { x: A.x + (isLast ? -w / 2 - 14 : w / 2 + 14), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden })
      if (rec.live && !op.hidden) nn._setVis(true)
      return nn._api
    },
  })
}

// ───────────────────────────── state machine ─────────────────────────────
export function stateMachine(st, spec = {}) {
  const o = st._common(spec, 'stateMachine')
  if (!Array.isArray(o.states) || !o.states.length) throw new VatError(`stateMachine({ states: [{ id, label }], transitions: [...], initial }) needs states.`)
  const ids = o.states.map(s => s.id)
  if (!ids.includes(o.initial)) throw new VatError(`stateMachine: initial '${o.initial}' is not a state id (${ids.join(', ')}).`)
  const rect = st._rectFor(o.at, 'center')
  const n = ids.length
  const sizes = {}
  for (const s of o.states) sizes[s.id] = { w: Math.max(90, st.measureText(st._plain(s.label), FONT.sm + 1, 650) + 30), h: 46 }
  // go vertical when the row would be too tight for the states plus their transition labels
  const need = Object.values(sizes).reduce((a, s) => a + s.w, 0) + (o.transitions || []).reduce((a, t) => a + (t.label ? st.measureText(st._plain(t.label), FONT.sm - 1, 600) + 24 : 40), 0)
  const vertical = rect.h > rect.w * 1.2 || need > rect.w * 0.95
  const pos = {}
  const maxW = Math.max(...Object.values(sizes).map(s => s.w))
  ids.forEach((id, i) => { const t = n === 1 ? 0.5 : i / (n - 1); pos[id] = vertical ? { x: Math.min(rect.w / 2, maxW / 2 + 20), y: 40 + (rect.h - 80) * t } : { x: 80 + (rect.w - 160) * t, y: rect.h / 2 } })
  const body = svg('g')
  const comp = st._create('stateMachine', body, o, { at0: { x: rect.x, y: rect.y } })
  const trans = new Map()
  for (const t of o.transitions || []) {
    if (!pos[t.from] || !pos[t.to]) throw new VatError(`stateMachine: transition ${t.from} → ${t.to} uses an unknown state.`)
    const A = { ...sizes[t.from], cx: pos[t.from].x, cy: pos[t.from].y }, B = { ...sizes[t.to], cx: pos[t.to].x, cy: pos[t.to].y }
    const back = (o.transitions || []).some(u => u.from === t.to && u.to === t.from)
    const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 3), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8)
    const off = back ? (vertical ? 26 : -26) * (ids.indexOf(t.from) < ids.indexOf(t.to) ? 1 : -1) : 0
    const mx = (p1.x + p2.x) / 2 + (vertical ? off : 0), my = (p1.y + p2.y) / 2 + (vertical ? 0 : off)
    const g = svg('g')
    const path = svg('path', { d: `M${p1.x} ${p1.y} Q${mx} ${my} ${p2.x} ${p2.y}`, fill: 'none', 'stroke-width': 2.2, stroke: 'var(--ink-3)', 'marker-end': `url(#${st._marker()})` }, g)
    let tx = null
    if (t.label) {
      const lg = svg('g', { transform: vertical ? T(Math.max(mx, (p1.x + p2.x) / 2) + 16 + (off > 0 ? off : 0), my) : T(mx, my + (off ? Math.sign(off) * 14 : -16)) }, g)
      tx = st._textEl(lg, st._plain(t.label), { size: FONT.sm - 1, weight: 600, fill: 'var(--ink-2)', anchor: vertical ? 'start' : 'middle' })
    }
    const c = child(st, comp, 'sm-transition', g, { x: 0, y: 0 }, { id: `${t.from}->${t.to}`, text: tx })
    c._paints.push({ el: path, attr: 'stroke', variant: 'main' })
    c._flowEl = path
    trans.set(`${t.from}>${t.to}`, c)
  }
  const states = new Map()
  for (const s of o.states) {
    st._checkRole(s.role)
    const { w, h } = sizes[s.id]
    const g = svg('g')
    const r = svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, 'stroke-width': 2 }, g)
    const t = st._textEl(g, st._plain(s.label), { size: FONT.sm + 1, weight: 650, fill: s.role ? roleVar(st, s.role, 'ink') : 'var(--ink)' })
    const c = child(st, comp, 'sm-state', g, pos[s.id], { id: s.id, text: t, role: s.role })
    st._paint(c, r, s.role, 'soft', 'main')
    if (!s.role) { r.setAttribute('fill', 'var(--surface)'); r.setAttribute('stroke', 'var(--ink-3)') }
    states.set(s.id, c)
  }
  const mk = svg('g')
  const s0 = sizes[o.initial]
  svg('rect', { x: -s0.w / 2 - 7, y: -s0.h / 2 - 7, width: s0.w + 14, height: s0.h + 14, rx: (s0.h + 14) / 2, fill: 'none', stroke: 'var(--focus-ring)', 'stroke-width': 3.5, class: 'sm-marker' }, mk)
  const marker = child(st, comp, 'sm-marker', mk, pos[o.initial], { id: o.id ? `${o.id}.current` : undefined })
  let current = o.initial
  return wrapComp(comp, {
    state(id) { const x = states.get(id); if (!x) throw new VatError(`stateMachine.state('${id}'): unknown. States: ${ids.join(', ')}.`); return x._api },
    transition(a, b) { const x = trans.get(`${a}>${b}`); if (!x) throw new VatError(`stateMachine.transition('${a}', '${b}'): not declared.`); return x._api },
    goTo(id, op) {
      if (!states.has(id)) throw new VatError(`stateMachine.goTo('${id}'): unknown state.`)
      const tr = trans.get(`${current}>${id}`)
      rec.par(() => {
        if (tr) tr.pulse({ speed: 'fast' })
        marker._moveLocal(pos[id].x, pos[id].y, op)
        const sz = sizes[id], r = marker._body.querySelector('rect'), osz = sizes[current]
        rec.tw(r, { attr: { x: -osz.w / 2 - 7, width: osz.w + 14 } }, { attr: { x: -sz.w / 2 - 7, width: sz.w + 14 } }, DUR.normal)
      })
      current = id
      return comp._api
    },
  })
}

// ───────────────────────────── code view ─────────────────────────────
export function codeView(st, spec = {}) {
  const o = st._common(spec, 'codeView')
  if (typeof o.code !== 'string') throw new VatError(`codeView({ code: '...', lang: 'python' }) needs code as a string.`)
  const rect = st._rectFor(o.at, 'left')
  const lines = o.code.replace(/\t/g, '    ').split('\n')
  const lh = 34, fs = 19, mono = 'var(--font-mono)'
  const W = Math.min(rect.w, Math.max(...lines.map(l => st.measureText(l || ' ', fs, 400, mono))) + 90), H = lines.length * lh + 24
  const body = svg('g')
  svg('rect', { x: 0, y: 0, width: W, height: H, rx: 14, fill: 'var(--surface-2)', stroke: 'var(--line)' }, body)
  const comp = st._create('codeView', body, o, { at0: { x: rect.x + Math.max(0, (rect.w - W) / 2), y: rect.y + Math.max(0, (rect.h - H) / 2) } })
  const lineObjs = lines.map((ln, i) => {
    const g = svg('g')
    svg('rect', { x: -W / 2 + 8, y: -lh / 2 + 2, width: W - 16, height: lh - 4, rx: 6, fill: 'transparent', class: 'code-bg' }, g)
    const no = st._textEl(g, String(i + 1), { size: fs - 3, fill: 'var(--ink-3)', anchor: 'end', family: mono }); no.setAttribute('x', -W / 2 + 40)
    const t = st._textEl(g, ln, { size: fs, fill: 'var(--ink)', anchor: 'start', family: mono }); t.setAttribute('x', -W / 2 + 54); t.setAttribute('xml:space', 'preserve')
    return child(st, comp, 'code-line', g, { x: W / 2, y: 12 + lh * i + lh / 2 }, { id: o.id ? `${o.id}.L${i + 1}` : undefined, text: t, tags: [`line-${i + 1}`] })
  })
  const cur = svg('g')
  svg('path', { d: 'M-8 -9 L6 0 L-8 9 z', fill: 'var(--focus-ring)' }, cur)
  const cursor = child(st, comp, 'code-cursor', cur, { x: 14, y: 12 + lh / 2 }, { hidden: true })
  let curLine = 0
  const watches = new Map()
  const lineOf = n => { const x = lineObjs[n - 1]; if (!x) throw new VatError(`codeView: line ${n} does not exist (1..${lineObjs.length}).`); return x }
  return wrapComp(comp, {
    line: n => lineOf(n)._api,
    lines: (a, b) => sel(st, lineObjs.slice(a - 1, b)),
    runTo(n, op) {
      const L = lineOf(n)
      rec.par(() => {
        if (!cursor._st8.vis) cursor._setVis(true, { speed: 'fast' })
        cursor._moveLocal(14, L._st8.y, op)
        if (curLine) lineObjs[curLine - 1].unhighlight({ speed: 'fast' })
        L.highlight({ speed: 'fast' })
      })
      curLine = n
      return comp._api
    },
    watch(name, v) {
      const str = `${name} = ${st._valText(v)}`
      if (watches.has(name)) { watches.get(name).setText(str); return comp._api }
      const g = svg('g')
      const t = st._textEl(g, str, { size: fs, weight: 600, fill: 'var(--ink)', anchor: 'start', family: mono })
      const w = child(st, comp, 'code-watch', g, { x: W + 30, y: 30 + watches.size * 38 }, { text: t, hidden: rec.live })
      w._curText = str
      if (rec.live) w._setVis(true)
      watches.set(name, w)
      return comp._api
    },
  })
}

// ───────────────────────────── container ─────────────────────────────
export function container(st, spec = {}) {
  const o = st._common(spec, 'container')
  const rect = st._rectFor(o.at, 'center')
  const body = svg('g')
  svg('rect', { x: 0, y: 0, width: rect.w, height: rect.h, rx: 18, fill: 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '2 0' }, body)
  if (o.title) { const t = st._textEl(body, st._plain(o.title), { size: FONT.sm + 1, weight: 650, fill: 'var(--ink-2)', anchor: 'start' }); t.setAttribute('x', 18); t.setAttribute('y', 24) }
  const comp = st._create('container', body, o, { at0: { x: rect.x, y: rect.y }, layer: 'bg' })
  const members = []
  return wrapComp(comp, { add(...objs) { objs.flat().forEach(x => members.push(st._objOf(x))); return comp._api }, members: () => sel(st, members) })
}

export const BUILTIN_COMPONENTS = { table, plot, neuralNet, graph, grid, numberLine, sequence, stateMachine, codeView, container }
