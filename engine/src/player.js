// The app shell: top bar, roadmap, stage, narrator, controls and drawers. Owns compile → layout → playback.
import { VatError, escapeHtml, fmt, rng } from './util.js'
import { compileLesson } from './lesson.js'
import { layoutLevel } from './layout.js'
import { Effects } from './effects.js'
import { runChecks, runModel, inputValues, traceLookup } from './trace.js'
import { parseTex } from './formula.js'

const UI = {
  tr: { overview: 'Özet', normal: 'Normal', micro: 'Mikro', speed: 'Hız', next: 'Devam', start: 'Başla', back: 'Geri', step: 'Adım', terms: 'Terimler', tinker: 'Kurcala', memory: 'Ezber', practice: 'Alıştırma', theme: 'Tema', reset: 'Örnek değerlere dön', newQ: 'Yeni soru', check: 'Kontrol et', showSol: 'Çözümü dersle göster', correct: 'Doğru', wrong: 'Değil, doğrusu', given: 'Verilenler', done: 'Ders bitti', checksFail: 'Doğrulama hatası', restart: 'Baştan', detail: 'Detay', tinkerHint: 'Değerleri değiştir: ders aynı yerden yeni sayılarla devam eder.', noPractice: 'Bu derste alıştırma yok.', answer: 'cevap' },
  en: { overview: 'Overview', normal: 'Normal', micro: 'Micro', speed: 'Speed', next: 'Continue', start: 'Start', back: 'Back', step: 'Step', terms: 'Terms', tinker: 'Tinker', memory: 'Memorise', practice: 'Practice', theme: 'Theme', reset: 'Back to example values', newQ: 'New question', check: 'Check', showSol: 'Show the solution in the lesson', correct: 'Correct', wrong: 'Not quite, it is', given: 'Given', done: 'Lesson complete', checksFail: 'Verification failed', restart: 'Restart', detail: 'Detail', tinkerHint: 'Change values: the lesson continues from the same place with new numbers.', noPractice: 'This lesson has no practice.', answer: 'answer' },
}

export class Player {
  constructor(def, app, registry) {
    this.def = def
    this.reg = registry
    this.ui = UI[(def.meta?.lang || 'en').slice(0, 2)] || UI.en
    this.level = 2
    this.speed = 1
    this.idx = 0
    this.playing = false
    this.inputs = {}
    this.errors = []
    this.checks = []
    this._layouts = new Map()
    this._buildShell(app)
  }

  // ───────── shell ─────────
  _buildShell(app) {
    const u = this.ui, def = this.def
    app.innerHTML = `
<div class="app">
  <header class="topbar">
    <div class="brand"></div>
    <div class="tools">
      <div class="seg" role="radiogroup" aria-label="${u.detail}">
        <button type="button" data-level="1">${u.overview}</button><button type="button" data-level="2">${u.normal}</button><button type="button" data-level="3">${u.micro}</button>
      </div>
      <label class="speed"><span>${u.speed}</span><input type="range" min="0.25" max="2.5" step="0.25" value="1"><output>1×</output></label>
      <span class="sep"></span>
      <div class="drawer-btns">
        <button type="button" class="tbtn" data-drawer="terms">${u.terms}</button>
        <button type="button" class="tbtn" data-drawer="tinker">${u.tinker}</button>
        <button type="button" class="tbtn" data-drawer="memory">${u.memory}</button>
        <button type="button" class="tbtn" data-drawer="practice">${u.practice}</button>
        <button type="button" class="tbtn theme" title="${u.theme}" aria-label="${u.theme}">◐</button>
      </div>
    </div>
  </header>
  <nav class="stages"></nav>
  <main class="main">
    <div class="scene-wrap"><div class="board"><svg id="vat-root" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg><div class="banner" hidden></div></div></div>
    <aside class="drawer" aria-hidden="true"><div class="drawer-in"><div class="drawer-head"><span class="drawer-title"></span><button type="button" class="x" aria-label="×">✕</button></div><div class="drawer-body"></div></div></aside>
  </main>
  <section class="dock"><div class="narrator">
    <div class="say"><p class="say-text"></p></div>
    <div class="nav"><span class="count"></span><button type="button" class="btn btn-ghost back" aria-label="${u.back}">◀</button><button type="button" class="btn btn-primary next">${u.next} ▶</button></div>
  </div></section>
</div>
<div class="bubble" role="tooltip"></div>
<div class="error-overlay" hidden></div>`
    const $ = s => app.querySelector(s)
    this.$ = { brand: $('.brand'), seg: $('.seg'), speed: $('.speed input'), speedOut: $('.speed output'), stages: $('.stages'), root: $('#vat-root'), banner: $('.banner'),
      main: $('.main'), drawer: $('.drawer'), drawerTitle: $('.drawer-title'), drawerBody: $('.drawer-body'), say: $('.say-text'), count: $('.count'), back: $('.back'), next: $('.next'), bubble: app.querySelector('.bubble'), err: app.querySelector('.error-overlay') }
    this.$.brand.textContent = def.meta?.title || 'Lab'
    document.title = def.meta?.title || 'Lab'
    document.documentElement.lang = def.meta?.lang || 'en'
    this.$.seg.addEventListener('click', e => { const b = e.target.closest('[data-level]'); if (b) this.setLevel(Number(b.dataset.level)) })
    this.$.speed.addEventListener('input', () => this.setSpeed(Number(this.$.speed.value)))
    this.$.next.addEventListener('click', () => this.next())
    this.$.back.addEventListener('click', () => this.back())
    app.querySelector('.x').addEventListener('click', () => this.closeDrawer())
    app.querySelectorAll('[data-drawer]').forEach(b => b.addEventListener('click', () => this.toggleDrawer(b.dataset.drawer)))
    app.querySelector('.theme').addEventListener('click', () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark' })
    document.addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,select')) return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.back() }
      else if (['1', '2', '3'].includes(e.key)) this.setLevel(Number(e.key))
    })
    // glossary bubbles
    const showBubble = (btn) => {
      const g = this.def.glossary[btn.dataset.term]; if (!g) return
      const b = this.$.bubble
      b.innerHTML = `<b>${escapeHtml(g.term)}${g.symbol ? ` <span class="sym">${escapeHtml(texPlain(g.symbol))}</span>` : ''}</b>${escapeHtml(g.short)}`
      const r = btn.getBoundingClientRect()
      b.classList.add('on')
      const bw = b.offsetWidth, bh = b.offsetHeight
      b.style.left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)) + 'px'
      b.style.top = Math.max(8, r.top - bh - 10) + 'px'
    }
    app.addEventListener('mouseover', e => { const t = e.target.closest('.term'); if (t) showBubble(t) })
    app.addEventListener('mouseout', e => { if (e.target.closest('.term')) this.$.bubble.classList.remove('on') })
    app.addEventListener('click', e => { const t = e.target.closest('.term'); if (t) showBubble(t) })
    this._dragSetup()
  }

  // ───────── compile & layout ─────────
  build(inputOverrides = {}, keepStopId) {
    const t0 = performance.now()
    this._teardown()
    this.inputs = inputValues(this.def, inputOverrides)
    try {
      this.compiled = compileLesson(this.def, this.$.root, { inputs: this.inputs, verbs: this.reg.verbs, components: this.reg.components })
    } catch (e) { this._fatal(e); return false }
    this.effects = new Effects(this.compiled.stage)
    this._layouts.clear()
    this._useLevel(this.level, keepStopId)
    this._renderStages()
    this.compileMs = performance.now() - t0
    return true
  }
  _teardown() {
    if (this.lay) { this.lay.tl.pause(); this.lay.tl.seek(0); this.lay.tl.kill() }
    this.effects?.stopAll()
    this.lay = null
    this.playing = false
  }
  _layout(level) {
    // a timeline can only drive the DOM while it is the active one, so layouts are rebuilt on demand
    return layoutLevel(this.compiled, level, i => this._onPause(i))
  }
  _useLevel(level, keepStopId) {
    let keep = keepStopId ?? this.lay?.stops[this.idx]?.id
    if (this.lay) { this.lay.tl.pause(); this.lay.tl.seek(0); this.lay.tl.kill(); this.effects.stopAll() }
    this.level = level
    this.lay = this._layout(level)
    this.lay.tl.timeScale(this.speed)
    this.effects.setEvents(this.lay.events)
    this.$.seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(Number(b.dataset.level) === level)))
    let i = 0
    if (keep) i = this._mapStop(keep)
    this.jump(i)
  }
  _mapStop(id) {
    const stops = this.lay.stops
    let j = stops.findIndex(s => s.id === id)
    if (j >= 0) return j
    // walk up the tree to the nearest ancestor that is a stop at this level
    const find = (n, nid) => { if (n.id === nid) return n; for (const k of n.kids) { const r = find(k, nid); if (r) return r } return null }
    let n = find(this.compiled.tree, id)
    while (n && n.parent) { n = n.parent; j = stops.findIndex(s => s.id === n.id); if (j >= 0) return j }
    return 0
  }

  // ───────── playback ─────────
  get stops() { return this.lay?.stops || [] }
  jump(i) {
    if (!this.lay) return
    i = Math.max(0, Math.min(this.stops.length - 1, i))
    this.lay.tl.pause()
    this.lay.tl.seek(this.stops[i].end)
    this.playing = false
    this.idx = i
    this.effects.sync(this.lay.tl.time())
    this._showStop(i)
  }
  next() {
    if (!this.lay) return
    if (this.playing) { this.jump(this.idx); return }
    if (this.idx >= this.stops.length - 1) { this._showStop(this.idx, true); return }
    const i = this.idx + 1
    this.idx = i
    this._showStop(i)
    this.playing = true
    this.$.next.classList.add('playing')
    this.lay.tl.seek(this.stops[i - 1].end + 0.001).play()
    this._tick()
  }
  back() {
    if (!this.lay || this.idx === 0) { if (this.lay) this.jump(0); return }
    const i = this.idx - 1
    this.lay.tl.pause()
    const from = this.lay.tl.time(), to = this.stops[i].end
    this.playing = true
    this.idx = i
    this._showStop(i)
    window.gsap.to(this.lay.tl, { time: to, duration: Math.min(0.55, Math.max(0.2, (from - to) * 0.25)), ease: 'power2.inOut', overwrite: true, onUpdate: () => this.effects.sync(this.lay.tl.time()), onComplete: () => { this.playing = false; this.effects.sync(to); this.$.next.classList.remove('playing') } })
  }
  _tick() {
    if (!this.playing || !this.lay) return
    this.effects.sync(this.lay.tl.time())
    requestAnimationFrame(() => this._tick())
  }
  _onPause(i) {
    this.playing = false
    this.$.next.classList.remove('playing')
    this.effects.sync(this.lay.tl.time())
    if (i !== this.idx) { this.idx = i; this._showStop(i) }
    this._panelsRender()
  }
  setSpeed(v) { this.speed = v; this.$.speedOut.textContent = `${v}×`; this.lay?.tl.timeScale(v) }
  setLevel(L) { if (L !== this.level && this.lay) this._useLevel(L) }

  // ───────── narrator / roadmap ─────────
  _showStop(i, end = false) {
    const s = this.stops[i]
    if (!s) return
    let html
    try { html = this.compiled.ctx.markup.html(s.say) } catch (e) { html = escapeHtml(s.say) }
    this.$.say.innerHTML = html
    this.$.say.dataset.stop = s.id
    this.$.count.textContent = `${this.ui.step} ${i + 1} / ${this.stops.length}`
    this.$.back.disabled = i === 0
    const last = i === this.stops.length - 1
    this.$.next.textContent = last ? (end ? `${this.ui.restart} ↺` : `${this.ui.done} ✓`) : `${i === 0 ? this.ui.next : this.ui.next} ▶`
    if (last && end) { this.jump(0); return }
    const chIdx = this.compiled.tree.kids.findIndex(c => c.id === s.chapter)
    this.$.stages.querySelectorAll('.st').forEach((b, k) => { b.classList.toggle('current', k === chIdx); b.classList.toggle('done', k < chIdx) })
    this._panelsRender()
  }
  _renderStages() {
    const u = this.$.stages
    u.innerHTML = this.compiled.tree.kids.map((c, k) => `<button type="button" class="st" data-ch="${escapeHtml(c.id)}"><span class="dot"></span>${escapeHtml(c.title)}</button>`).join('')
    u.querySelectorAll('.st').forEach(b => b.addEventListener('click', () => { const j = this.stops.findIndex(s => s.chapter === b.dataset.ch); if (j >= 0) this.jump(j) }))
  }
  _panelsRender() {
    for (const p of this.compiled?.stage._panels || []) try { p.adapter.render(this.stops[this.idx]?.id, this.compiled.data) } catch (e) { console.error(e) }
  }

  // ───────── drawers ─────────
  toggleDrawer(name) { if (this._drawer === name) this.closeDrawer(); else this.openDrawer(name) }
  closeDrawer() { this._drawer = null; this.$.main.classList.remove('open'); this.$.drawer.setAttribute('aria-hidden', 'true'); document.querySelectorAll('[data-drawer]').forEach(b => b.setAttribute('aria-pressed', 'false')) }
  openDrawer(name) {
    this._drawer = name
    this.$.main.classList.add('open'); this.$.drawer.setAttribute('aria-hidden', 'false')
    document.querySelectorAll('[data-drawer]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.drawer === name)))
    const u = this.ui, body = this.$.drawerBody, def = this.def
    this.$.drawerTitle.textContent = u[name]
    const mk = s => { try { return this.compiled.ctx.markup.html(s) } catch { return escapeHtml(s) } }
    if (name === 'terms') {
      body.innerHTML = Object.entries(def.glossary).map(([k, g]) => `<div class="gl-item"><b>${escapeHtml(g.term)}${g.symbol ? ` <span class="sym">${escapeHtml(texPlain(g.symbol))}</span>` : ''}</b><span>${escapeHtml(g.short)}</span>${g.long ? `<p class="long">${escapeHtml(g.long)}</p>` : ''}</div>`).join('')
    } else if (name === 'memory') {
      body.innerHTML = this.compiled.memory.map(m => `<div class="fm-card"><b>${escapeHtml(m.title)}</b>${m.formula ? `<div class="sym">${escapeHtml(texPlain(m.formula))}</div>` : ''}${m.words ? `<div class="w">${mk(m.words)}</div>` : ''}${m.why ? `<div class="why">${mk(m.why)}</div>` : ''}</div>`).join('') || '—'
    } else if (name === 'tinker') {
      const ins = Object.entries(def.inputs || {})
      body.innerHTML = ins.length ? `<p class="hint">${u.tinkerHint}</p>` + ins.map(([k, s]) => {
        const label = s.term && def.glossary[s.term] ? def.glossary[s.term].term : k
        return `<div class="ctl"><label for="in-${k}">${escapeHtml(label)} <code>${escapeHtml(k)}</code></label><input id="in-${k}" type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${this.inputs[k]}" data-input="${k}"><output>${fmt(this.inputs[k], undefined, def.meta.lang)}</output></div>`
      }).join('') + `<button type="button" class="btn btn-soft reset">${u.reset}</button>` : '—'
      let timer
      body.querySelectorAll('[data-input]').forEach(inp => inp.addEventListener('input', () => {
        inp.nextElementSibling.textContent = fmt(Number(inp.value), undefined, def.meta.lang)
        clearTimeout(timer)
        timer = setTimeout(() => this.setInputs({ ...this.inputs, [inp.dataset.input]: Number(inp.value) }), 160)
      }))
      body.querySelector('.reset')?.addEventListener('click', () => { this.setInputs({}); this.openDrawer('tinker') })
    } else if (name === 'practice') this._practice(body)
  }
  setInputs(inputs) {
    const keep = this.stops[this.idx]?.id
    const prev = this.inputs
    if (!this.build(inputs, keep)) { this.build(prev, keep) }
  }
  _practice(body) {
    const u = this.ui, def = this.def, P = def.practice
    if (!P) { body.innerHTML = `<p>${u.noPractice}</p>`; return }
    this._pseed = (this._pseed || 0) + 1
    let inputs
    try { inputs = inputValues(def, P.generate(rng(this._pseed * 7919))) } catch (e) { body.innerHTML = `<p class="bad">${escapeHtml(e.message)}</p>`; return }
    const { trace } = runModel(def, inputs, def.meta.lang)
    const lang = def.meta.lang
    const prompt = t => typeof t.prompt === 'function' ? t.prompt(inputs) : String(t.prompt).replace(/\{\{([\w.-]+)\}\}/g, (m, id) => { const v = inputs[id] ?? traceLookup(trace, id); return v === undefined ? m : fmt(v, undefined, lang) })
    body.innerHTML = `<h4>${u.given}</h4><table class="dt">${Object.keys(def.inputs || {}).map(k => `<tr><td>${escapeHtml(def.inputs[k].term && def.glossary[def.inputs[k].term] ? def.glossary[def.inputs[k].term].term : k)} <code>${k}</code></td><td>${fmt(inputs[k], undefined, lang)}</td></tr>`).join('')}</table>` +
      P.tasks.map(t => `<div class="task" data-task="${escapeHtml(t.id)}"><p>${escapeHtml(prompt(t))}</p><div class="row"><input class="ans" inputmode="decimal" aria-label="${u.answer}"><button type="button" class="btn btn-soft chk">${u.check}</button></div><p class="fb"></p></div>`).join('') +
      `<div class="row"><button type="button" class="btn btn-soft newq">${u.newQ}</button><button type="button" class="btn btn-soft sol">${u.showSol}</button></div>`
    body.querySelectorAll('.task').forEach(el => el.querySelector('.chk').addEventListener('click', () => {
      const t = P.tasks.find(x => x.id === el.dataset.task)
      const want = traceLookup(trace, t.answer)
      const raw = el.querySelector('.ans').value.trim().replace(/\s/g, '').replace('−', '-').replace(',', '.')
      const got = Number(raw)
      const tol = t.tolerance ?? Math.max(1e-9, Math.abs(want) * 0.005)
      const ok = raw !== '' && Number.isFinite(got) && Math.abs(got - want) <= tol
      el.querySelector('.fb').innerHTML = ok ? `<span class="ok">✓ ${u.correct}</span>` : `<span class="bad">✗ ${u.wrong} ${fmt(want, undefined, lang)}</span>`
    }))
    body.querySelector('.newq').addEventListener('click', () => this._practice(body))
    body.querySelector('.sol').addEventListener('click', () => { this.build(inputs); this.closeDrawer() })
  }

  // ───────── dragging plot points (tinkering) ─────────
  _dragSetup() {
    const root = this.$.root
    let drag = null
    root.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-drag]')
      if (!el) return
      const info = JSON.parse(el.dataset.drag)
      const obj = this.compiled.stage._objs.get(el.dataset.id)
      const plot = this.compiled.stage._objs.get(info.plot)
      if (!obj || !plot) return
      drag = { el, info, obj, plot, start: { x: obj._st8.x, y: obj._st8.y } }
      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    })
    const toLocal = e => {
      const world = this.compiled.stage._worldSvg
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(drag.plot._body.getScreenCTM().inverse())
      return pt
    }
    root.addEventListener('pointermove', e => {
      if (!drag) return
      const p = toLocal(e)
      drag.el.setAttribute('transform', `translate(${p.x} ${p.y})`)
      drag.last = p
    })
    root.addEventListener('pointerup', () => {
      if (!drag) return
      const { info, obj, last } = drag
      drag = null
      if (!last) return
      const g = obj._drag
      const dx = info.x0 + (last.x - g.ml) / g.iw * (info.x1 - info.x0)
      const dy = info.y0 + (g.mt + g.ih - last.y) / g.ih * (info.y1 - info.y0)
      const next = { ...this.inputs }
      const snap = (k, v) => { const s = this.def.inputs?.[k]; if (!s) return; next[k] = Math.min(s.max, Math.max(s.min, Math.round((v - s.min) / s.step) * s.step + s.min)) }
      if (info.inputX) snap(info.inputX, dx)
      if (info.inputY) snap(info.inputY, dy)
      this.setInputs(next)
    })
  }

  // ───────── errors / checks ─────────
  _fatal(e) {
    this.errors.push({ message: e.message, stack: e.stack })
    const lineInfo = (e.stack || '').split('\n').find(l => l.includes('lesson.js'))?.trim() || ''
    this.$.err.hidden = false
    this.$.err.innerHTML = `<div class="err-card"><h2>Lesson error</h2><p>${escapeHtml(e.message)}</p>${lineInfo ? `<pre>${escapeHtml(lineInfo)}</pre>` : ''}</div>`
    console.error('[VAT]', e.message, lineInfo)
  }
  runChecks() {
    try { this.checks = runChecks(this.def, { lang: this.def.meta.lang, rngFactory: rng }) } catch (e) { this.checks = [{ ok: false, message: `checks threw: ${e.message}` }] }
    const bad = this.checks.filter(c => !c.ok)
    if (bad.length) { this.$.banner.hidden = false; this.$.banner.textContent = `⚠ ${this.ui.checksFail}: ${bad[0].message}`; console.warn('[VAT] checks failed:', bad.map(b => b.message).join(' | ')) }
    return this.checks
  }
}

function texPlain(tex) {
  try {
    const out = []
    const walk = n => {
      if (!n) return
      if (n.t === 'txt') out.push(n.s)
      else if (n.t === 'row') n.items.forEach(walk)
      else if (n.t === 'script') { walk(n.base); if (n.sub) { out.push('_'); walk(n.sub) } if (n.sup) { out.push('^'); walk(n.sup) } }
      else if (n.t === 'frac') { out.push('('); walk(n.num); out.push(')/('); walk(n.den); out.push(')') }
      else if (n.t === 'slot') walk(n.content)
      else if (n.t === 'sqrt') { out.push('√('); walk(n.arg); out.push(')') }
      else if (n.t === 'space') out.push(' ')
    }
    walk(parseTex(tex))
    return out.join('')
  } catch { return tex }
}
