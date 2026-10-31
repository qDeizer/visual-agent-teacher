// In-page QA API (window.__vat). Used by skill/scripts/qa.mjs through the DevTools protocol.
import { logicalAt } from './layout.js'

export function qaApi(player) {
  const st = () => player.compiled.stage
  const visible = el => {
    let o = 1
    for (let e = el; e && e.nodeType === 1 && e.id !== 'vat-root'; e = e.parentNode) {
      const cs = getComputedStyle(e)
      if (cs.visibility === 'hidden' || cs.display === 'none') return 0
      o *= Number(cs.opacity)
      const ao = e.getAttribute && e.getAttribute('opacity'); if (ao !== null) o *= Number(ao)
    }
    return o
  }
  const rootRect = () => player.$.root.getBoundingClientRect()
  const toRoot = r => { const R = rootRect(), k = 1600 / R.width; return { x: (r.left - R.left) * k, y: (r.top - R.top) * k, w: r.width * k, h: r.height * k } }
  const nums = s => (String(s || '').match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)

  function snapshot() {
    const t = player.lay.tl.time()
    const L = logicalAt(player.lay.events, t)
    const objs = []
    for (const o of st()._order) {
      const vis = visible(o._el)
      objs.push({
        id: o.id, vis: Math.round(vis * 100) / 100,
        pos: nums(o._el.getAttribute('transform')), s: nums(o._s.getAttribute('transform')), z: nums(o._z.getAttribute('transform')),
        dim: Number(getComputedStyle(o._l).opacity), hl: Number(getComputedStyle(o._hl).opacity),
        text: o._text ? o._text.textContent : null,
        exists: L.exist.get(o.id) ?? false, tags: [...(L.tags.get(o.id) || o._tags && [] || [])].sort(),
      })
    }
    const fxs = [...L.fx.keys()].sort()
    const formula = [...document.querySelectorAll('#vat-hud .fm')].map(g => ({ vis: Math.round(visible(g) * 100) / 100, vals: [...g.querySelectorAll('.fm-val')].map(v => `${v.textContent}@${Math.round(visible(v) * 100) / 100}`) }))
    return { t, camera: st()._worldSvg.getAttribute('viewBox'), objs, fxs, formula }
  }
  function diff(a, b) {
    const out = []
    if (nums(a.camera).some((v, i) => Math.abs(v - nums(b.camera)[i]) > 0.6)) out.push(`camera ${a.camera} vs ${b.camera}`)
    const bm = new Map(b.objs.map(o => [o.id, o]))
    for (const x of a.objs) {
      const y = bm.get(x.id); if (!y) { out.push(`${x.id}: missing`); continue }
      if (Math.abs(x.vis - y.vis) > 0.05) out.push(`${x.id}: visibility ${x.vis} vs ${y.vis}`)
      for (const k of ['pos', 's', 'z']) if (x[k].length !== y[k].length || x[k].some((v, i) => Math.abs(v - y[k][i]) > 0.6)) out.push(`${x.id}: ${k} ${x[k].join(',')} vs ${y[k].join(',')}`)
      if (Math.abs(x.dim - y.dim) > 0.05) out.push(`${x.id}: dim ${x.dim} vs ${y.dim}`)
      if (Math.abs(x.hl - y.hl) > 0.05) out.push(`${x.id}: highlight ${x.hl} vs ${y.hl}`)
      if (x.text !== y.text && x.vis > 0.05) out.push(`${x.id}: text "${x.text}" vs "${y.text}"`)
      if (x.exists !== y.exists) out.push(`${x.id}: exists ${x.exists} vs ${y.exists}`)
      if (x.tags.join() !== y.tags.join()) out.push(`${x.id}: tags [${x.tags}] vs [${y.tags}]`)
    }
    if (a.fxs.join() !== b.fxs.join()) out.push(`effects [${a.fxs}] vs [${b.fxs}]`)
    if (JSON.stringify(a.formula) !== JSON.stringify(b.formula)) out.push(`formula ${JSON.stringify(a.formula)} vs ${JSON.stringify(b.formula)}`)
    return out
  }

  /** "Every path, same result": watching each stop play == jumping to it. */
  function verify(level) {
    player.setLevel(level)
    const tl = player.lay.tl, stops = player.lay.stops
    tl.pause()
    const P = []
    tl.seek(0)
    let si = 0
    const dt = 1 / 30
    for (let t = 0; si < stops.length;) {
      const end = stops[si].end
      if (t + dt >= end) { tl.seek(end); P.push(snapshot()); si++; t = end + 0.001; continue }
      t += dt
      tl.seek(t)
    }
    const order = stops.map((_, i) => i).sort((a, b) => ((a * 7919) % 13) - ((b * 7919) % 13))
    const J = []
    for (const i of order) { tl.seek(stops[i].end); J[i] = snapshot() }
    // also: going backwards from the end
    const back = []
    for (let i = stops.length - 1; i >= 0; i--) { tl.seek(stops[i].end); back[i] = snapshot() }
    const problems = []
    stops.forEach((s, i) => {
      const d1 = diff(P[i], J[i]); if (d1.length) problems.push({ stop: s.id, kind: 'play-vs-jump', details: d1.slice(0, 6) })
      const d2 = diff(J[i], back[i]); if (d2.length) problems.push({ stop: s.id, kind: 'jump-vs-backward', details: d2.slice(0, 6) })
    })
    player.jump(0)
    return { level, stops: stops.length, duration: Math.round(player.lay.duration * 10) / 10, problems }
  }

  /** Layout problems at every stop of a level. */
  function layout(level = 2) {
    player.setLevel(level)
    const issues = []
    const stops = player.lay.stops
    for (let i = 0; i < stops.length; i++) {
      player.jump(i)
      const texts = []
      for (const tEl of document.querySelectorAll('#vat-root text')) {
        if (!tEl.textContent.trim()) continue
        const v = visible(tEl); if (v < 0.2) continue
        const r = tEl.getBoundingClientRect(); if (!r.width) continue
        const owner = tEl.closest('.vo')
        texts.push({ el: tEl, r: toRoot(r), text: tEl.textContent.trim(), owner: owner?.dataset.id || (tEl.closest('.fm') ? 'formula' : '?') })
        if (/NaN|Infinity|undefined|null|\[object/.test(tEl.textContent)) issues.push({ stop: stops[i].id, kind: 'bad-value', text: tEl.textContent.trim(), owner: owner?.dataset.id })
        const fsPx = Number(getComputedStyle(tEl).fontSize.replace('px', '')) * (tEl.getScreenCTM()?.a || 1) * (1440 / innerWidth)
        if (fsPx < 10.5 && !tEl.closest('#vat-world .vo-z[style*="opacity: 0"]')) issues.push({ stop: stops[i].id, kind: 'text-too-small', text: tEl.textContent.trim().slice(0, 40), px: Math.round(fsPx * 10) / 10, owner: owner?.dataset.id })
        // world text is clipped by the camera viewport (0..1600 × 0..770 in root units); fully outside = off-camera on
        // purpose, partially outside = cut in half (a real problem)
        const R = toRoot(r)
        const inWorld = !!tEl.closest('#vat-world')
        const B = { x: 0, y: 0, w: 1600, h: 900 }
        const zoomed = st()._worldSvg.getAttribute('viewBox') !== '0 0 1600 770'
        const fullyOut = R.x > B.x + B.w || R.x + R.w < B.x || R.y > B.y + B.h || R.y + R.h < B.y
        const partly = !fullyOut && (R.x < B.x - 2 || R.y < B.y - 2 || R.x + R.w > B.x + B.w + 2 || R.y + R.h > B.y + B.h + 2)
        if (partly) issues.push({ stop: stops[i].id, kind: inWorld && zoomed ? 'clipped-zoomed' : 'clipped', text: tEl.textContent.trim().slice(0, 40), owner: owner?.dataset.id })
        if (fullyOut) continue
      }
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a], B = texts[b]
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue
        if (A.owner === 'formula' && B.owner === 'formula' && A.el.closest('.fm') === B.el.closest('.fm')) continue
        const ix = Math.max(0, Math.min(A.r.x + A.r.w, B.r.x + B.r.w) - Math.max(A.r.x, B.r.x))
        const iy = Math.max(0, Math.min(A.r.y + A.r.h, B.r.y + B.r.h) - Math.max(A.r.y, B.r.y))
        const inter = ix * iy, small = Math.min(A.r.w * A.r.h, B.r.w * B.r.h)
        if (small > 0 && inter / small > 0.2) issues.push({ stop: stops[i].id, kind: 'text-overlap', a: `${A.owner}: ${A.text.slice(0, 30)}`, b: `${B.owner}: ${B.text.slice(0, 30)}`, overlap: Math.round(inter / small * 100) + '%' })
      }
    }
    player.jump(0)
    // de-duplicate identical issues across stops
    const seen = new Map()
    for (const x of issues) { const k = JSON.stringify({ ...x, stop: undefined }); if (seen.has(k)) seen.get(k).stops.push(x.stop); else seen.set(k, { ...x, stops: [x.stop] }) }
    return [...seen.values()].map(x => { delete x.stop; return x })
  }

  return {
    get ready() { return !!player.lay || player.errors.length > 0 },
    get errors() { return player.errors },
    get warnings() { return player.compiled?.warnings || [] },
    get checks() { return player.checks },
    info() {
      const st = player.lay.stops
      const units = L => new Set(st.map(s => s.unit[L])).size
      const out = { title: player.def.meta?.title, compileMs: Math.round(player.compileMs || 0), objects: player.compiled?.stage._order.length, levels: {} }
      for (const L of [1, 2, 3]) out.levels[L] = { stops: units(L), seconds: Math.round(player.lay.duration / 0.5 * 10) / 10 }
      player.jump(0)
      return out
    },
    stops: () => player.lay.stops.map(s => ({ id: s.id, chapter: s.chapter, level: s.level, say: s.say })),
    go(i, level) { if (level) player.setLevel(level); player.jump(i); return player.lay.stops[i]?.id },
    play(i) { player.jump(Math.max(0, i - 1)); player.next(); return player.lay.stops[i]?.id },
    snapshot, verify, layout,
    /** Per stop: how many tweens only fade vs. move/transform/count/draw something. */
    motion: () => player.lay.stops.map(s => ({ id: s.id, ...s.motion })),
    /** Seek inside stop i: frac 0 = its start, 1 = its end (for film strips). */
    frame(i, frac) { const s = player.lay.stops[i]; const prev = i ? player.lay.stops[i - 1].end : 0; player.jump(Math.max(0, i - 1)); const t = prev + (s.end - prev) * frac; player.lay.tl.seek(t); player.effects.sync(t); return t },
  }
}
