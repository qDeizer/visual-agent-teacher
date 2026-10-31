// Turn the recorded step tree into a GSAP timeline for one detail level.
// A node is a stop when node.level <= level. Everything between two stops belongs to the earlier stop.
// Folded steps play compressed inside their stop; with a parent summary() they apply instantly after it.
const GAP = 0.02
const FOLD = 0.7
const OVERLAP = 0.22 // the next action of a step starts while the previous one is settling (no dead stops)

export function layoutLevel(compiled, level, onPause) {
  const gsap = window.gsap
  const tl = gsap.timeline({ paused: true })
  const stops = []
  const events = compiled.initialEvents.map(ev => ({ t: -1, ev }))
  let t = 0
  let cur = null

  const hasStopBelow = n => n.kids.some(k => k.level <= level || hasStopBelow(k))
  const placeItem = (it, t0, f) => {
    switch (it.k) {
      case 'tw': {
        const d = it.d * f
        tl.fromTo(it.el, { ...it.from }, { ...it.to, duration: d, ease: it.ease, immediateRender: false }, t0)
        if (cur && d > 0) { const keys = Object.keys(it.to); if (keys.every(k => k === 'autoAlpha' || k === 'opacity')) cur.motion.fade++; else cur.motion.move++ }
        return t0 + d
      }
      case 'raw': { const a = it.anim; a.paused(false); a.timeScale(f === 1 ? 1 : f === 0 ? 1e6 : 1 / f); tl.add(a, t0); return t0 + it.d * f }
      case 'ev': events.push({ t: t0, ev: it.ev }); return t0
      case 'wait': return t0 + it.d * f
      case 'seq': { let tt = t0; for (const x of it.items) tt = placeItem(x, tt, f); return tt }
      case 'par': { let end = t0; for (const x of it.items) end = Math.max(end, placeItem(x, t0, f)); return end }
      default: throw new Error(`layout: unexpected item ${it.k} inside a group`)
    }
  }
  const visit = (n, folded, factor) => {
    const isStop = !folded && n.level <= level
    if (isStop) {
      if (cur) { cur.end = t + 0.002; t = cur.end + GAP }
      cur = { node: n, id: n.id, start: t, end: t, say: n.say.join(' '), chapter: chapterOf(n), level: n.level, motion: { fade: 0, move: 0 } }
      stops.push(cur)
    }
    const useSummary = isStop && n.summary && !hasStopBelow(n)
    const f = factor
    let prev = null // { start, end } of the previous motion item in this step
    for (const it of n.items) {
      if (it.k === 'node') {
        prev = null
        if (useSummary) continue
        const kidFolded = folded || it.node.level > level
        visit(it.node, kidFolded, kidFolded ? Math.min(f, FOLD) : f)
      } else {
        const motion = it.k === 'tw' || it.k === 'par' || it.k === 'seq'
        let start = t
        if (motion && prev && prev.end > prev.start) start = Math.max(prev.start, prev.end - OVERLAP * (prev.end - prev.start))
        const end = placeItem(it, start, f)
        if (motion) prev = { start, end }; else if (it.k === 'wait') prev = null
        t = Math.max(t, end)
      }
      if (cur) cur.end = Math.max(cur.end, t)
    }
    if (useSummary) {
      for (const it of n.summary) t = placeItem(it, t, 1)
      const instant = m => { for (const it of m.items) { if (it.k === 'node') instant(it.node); else t = placeItem(it, t, 0) } }
      for (const it of n.items) if (it.k === 'node') instant(it.node)
      cur.end = Math.max(cur.end, t)
    }
  }
  for (const it of compiled.tree.items) visit(it.node, false, 1)
  if (cur) cur.end = t + 0.002
  stops.forEach((s, i) => tl.addPause(s.end, onPause ? () => onPause(i) : undefined))
  tl.set({}, {}, (stops.at(-1)?.end ?? 0) + 0.01)
  events.sort((a, b) => a.t - b.t)
  return { level, tl, stops, events, duration: tl.duration() }
}

function chapterOf(n) { while (n.parent && n.parent.id !== '__root') n = n.parent; return n.id }

/** Logical state at time t (fold of events). */
export function logicalAt(events, t) {
  const exist = new Map(), tags = new Map(), fx = new Map()
  for (const { t: et, ev } of events) {
    if (et > t + 1e-6) break
    if (ev.type === 'exist') exist.set(ev.obj, ev.on)
    else if (ev.type === 'tag') { const s = tags.get(ev.obj) || new Set(); ev.on ? s.add(ev.tag) : s.delete(ev.tag); tags.set(ev.obj, s) }
    else if (ev.type === 'fx') { const k = `${ev.obj}|${ev.fx}`; if (ev.on) fx.set(k, ev); else fx.delete(k) }
  }
  return { exist, tags, fx }
}
