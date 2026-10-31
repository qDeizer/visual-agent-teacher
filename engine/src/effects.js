// Continuous effects (glow, jitter, breathe, flow). They are not part of the timeline (they loop forever);
// sync(t) starts/stops them so that the set of running effects always matches the timeline position.
import { logicalAt } from './layout.js'
import { rng } from './util.js'

const AMP = { low: 1.6, mid: 3.2, high: 5.5 }

export class Effects {
  constructor(stage) { this._st = stage; this._events = []; this._running = new Map() }
  setEvents(events) { this._events = events; }
  sync(t) {
    const want = logicalAt(this._events, t).fx
    for (const [k, h] of this._running) if (!want.has(k)) { h.stop(); this._running.delete(k) }
    for (const [k, ev] of want) if (!this._running.has(k)) {
      const o = this._st._objs.get(ev.obj)
      if (!o) continue
      this._running.set(k, this._start(o, ev))
    }
  }
  stopAll() { for (const h of this._running.values()) h.stop(); this._running.clear() }
  _start(o, ev) {
    const gsap = window.gsap
    switch (ev.fx) {
      case 'glow': {
        o._l.setAttribute('filter', 'url(#vat-glow)')
        return { stop: () => o._l.removeAttribute('filter') }
      }
      case 'jitter': {
        const a = AMP[ev.strength] ?? AMP.low
        const r = rng(o.id.length * 97 + 13)
        const tw = gsap.to(o._j, { x: () => (r.next() * 2 - 1) * a, y: () => (r.next() * 2 - 1) * a, duration: 0.07, repeat: -1, repeatRefresh: true, ease: 'none' })
        return { stop: () => { tw.kill(); gsap.set(o._j, { x: 0, y: 0 }) } }
      }
      case 'breathe': {
        const tw = gsap.to(o._b, { scale: 1.05, transformOrigin: '50% 50%', duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        return { stop: () => { tw.kill(); gsap.set(o._b, { scale: 1 }) } }
      }
      case 'flow': {
        const el = o._flowEl || o._body.querySelector('path,line,polyline')
        if (!el) return { stop() {} }
        const prev = el.getAttribute('stroke-dasharray')
        el.setAttribute('stroke-dasharray', '10 8')
        const tw = gsap.fromTo(el, { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -36 }, duration: 0.8, repeat: -1, ease: 'none' })
        return { stop: () => { tw.kill(); if (prev === null) el.removeAttribute('stroke-dasharray'); else el.setAttribute('stroke-dasharray', prev); el.removeAttribute('stroke-dashoffset') } }
      }
      default: return { stop() {} }
    }
  }
}
