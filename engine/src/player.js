// The app shell: slim (collapsible) top bar, stage, fixed-height narrator with three navigation rows
// (chapter / step / micro). One timeline: every chapter/step is a stop; coarser rows skip whole units.
import { VatError, escapeHtml, fmt, rng } from './util.js'
import { compileLesson } from './lesson.js'
import { layoutLevel } from './layout.js'
import { Effects } from './effects.js'
import { runChecks, runModel, inputValues, traceLookup } from './trace.js'
import { parseTex } from './formula.js'

const BASE_SPEED = 0.5 // "1×" on the slider; animations are calm by default

const UI = {
  tr: { speed: 'Hız', back: 'Geri', next: 'İleri', chapter: 'Bölüm', step: 'Adım', micro: 'Mikro', terms: 'Terimler', tinker: 'Kurcala', memory: 'Ezber', practice: 'Alıştırma', theme: 'Tema', tools: 'Araçlar', hideBar: 'Çubuğu gizle', showBar: 'Çubuğu göster', reset: 'Örnek değerlere dön', newQ: 'Yeni soru', check: 'Kontrol et', showSol: 'Çözümü dersle göster', correct: 'Doğru', wrong: 'Değil, doğrusu', given: 'Verilenler', done: 'Ders bitti', checksFail: 'Doğrulama hatası', restart: 'Baştan', tinkerHint: 'Değerleri değiştir: ders aynı yerden yeni sayılarla devam eder.', noPractice: 'Bu derste alıştırma yok.', answer: 'cevap', keys: '→ mikro · Shift+→ adım · Ctrl+→ bölüm' },
  en: { speed: 'Speed', back: 'Back', next: 'Next', chapter: 'Chapter', step: 'Step', micro: 'Micro', terms: 'Terms', tinker: 'Tinker', memory: 'Memorise', practice: 'Practice', theme: 'Theme', tools: 'Tools', hideBar: 'Hide bar', showBar: 'Show bar', reset: 'Back to example values', newQ: 'New question', check: 'Check', showSol: 'Show the solution in the lesson', correct: 'Correct', wrong: 'Not quite, it is', given: 'Given', done: 'Lesson complete', checksFail: 'Verification failed', restart: 'Restart', tinkerHint: 'Change values: the lesson continues from the same place with new numbers.', noPractice: 'This lesson has no practice.', answer: 'answer', keys: '→ micro · Shift+→ step · Ctrl+→ chapter' },
}

export class Player {
  constructor(def, app, registry) {
    this.def = def
    this.reg = registry
    this.ui = UI[(def.meta?.lang || 'en').slice(0, 2)] || UI.en
    this.level = 3
    this.speed = 1
    this.idx = 0
    this.playing = false
    this.inputs = {}
    this.errors = []
    this.checks = []
    this._buildShell(app)
  }

  // ───────── shell ─────────
  _buildShell(app) {
    const u = this.ui
    const row = (L, label) => `<div class="nav-row nav-${L}" data-row="${L}"><span class="nav-label">${label}</span><button type="button" class="nb back" data-nav="${L}" data-dir="-1" aria-label="${u.back} ${label}">‹</button><button type="button" class="nb next" data-nav="${L}" data-dir="1" aria-label="${u.next} ${label}">›</button></div>`
    app.innerHTML = `
<div class="app">
  <header class="topbar">
    <div class="brand"></div>
    <nav class="stages" aria-label="roadmap"></nav>
    <div class="tools">
      <button type="button" class="tbtn tools-btn" aria-expanded="false">${u.tools} ▾</button>
      <button type="button" class="tbtn hide-bar" title="${u.hideBar}" aria-label="${u.hideBar}">⌃</button>
    </div>
    <div class="tools-panel" hidden>
      <label class="speed"><span>${u.speed}</span><input type="range" min="0.25" max="2.5" step="0.25" value="1"><output>1×</output></label>
      <div class="panel-btns">
        <button type="button" class="pbtn" data-drawer="terms">${u.terms}</button>
        <button type="button" class="pbtn" data-drawer="tinker">${u.tinker}</button>
        <button type="button" class="pbtn" data-drawer="memory">${u.memory}</button>
        <button type="button" class="pbtn" data-drawer="practice">${u.practice}</button>
        <button type="button" class="pbtn theme">${u.theme} ◐</button>
      </div>
      <p class="keys">${u.keys}</p>
    </div>
  </header>
  <button type="button" class="show-bar" title="${u.showBar}" aria-label="${u.showBar}" hidden>⌄</button>
  <main class="main">
    <div class="scene-wrap"><div class="board"><svg id="vat-root" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg><div class="banner" hidden></div></div></div>
    <aside class="drawer" aria-hidden="true"><div class="drawer-in"><div class="drawer-head"><span class="drawer-title"></span><button type="button" class="x" aria-label="×">✕</button></div><div class="drawer-body"></div></div></aside>
  </main>
  <section class="dock"><div class="narrator">
    <div class="say"><p class="say-text"></p></div>
    <div class="nav">${row(1, u.chapter)}${row(2, u.step)}${row(3, u.micro)}<span class="count"></span></div>
  </div></section>
</div>
<div class="bubble" role="tooltip"></div>
<div class="error-overlay" hidden></div>`
    const $ = s => app.querySelector(s)
    this.$ = { app: $('.app'), brand: $('.brand'), speed: $('.speed input'), speedOut: $('.speed output'), stages: $('.stages'), root: $('#vat-root'), banner: $('.banner'),
      main: $('.main'), drawer: $('.drawer'), drawerTitle: $('.drawer-title'), drawerBody: $('.drawer-body'), say: $('.say-text'), count: $('.count'), nav: $('.nav'),
      bubble: app.querySelector('.bubble'), err: app.querySelector('.error-overlay'), panel: $('.tools-panel'), toolsBtn: $('.tools-btn'), showBar: $('.show-bar') }
    const def = this.def
    this.$.brand.textContent = def.meta?.title || 'Lab'
    document.title = def.meta?.title || 'Lab'
    document.documentElement.lang = def.meta?.lang || 'en'
    this.$.nav.addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) this.navigate(Number(b.dataset.nav), Number(b.dataset.dir)) })
    this.$.speed.addEventListener('input', () => this.setSpeed(Number(this.$.speed.value)))
    this.$.toolsBtn.addEventListener('click', () => { const open = this.$.panel.hidden; this.$.panel.hidden = !open; this.$.toolsBtn.setAttribute('aria-expanded', String(open)) })
    $('.hide-bar').addEventListener('click', () => { this.$.app.classList.add('bar-hidden'); this.$.showBar.hidden = false; this.$.panel.hidden = true })
    this.$.showBar.addEventListener('click', () => { this.$.app.classList.remove('bar-hidden'); this.$.showBar.hidden = true })
    app.querySelector('.x').addEventListener('click', () => this.closeDrawer())
    app.querySelectorAll('[data-drawer]').forEach(b => b.addEventListener('click', () => { this.$.panel.hidden = true; this.toggleDrawer(b.dataset.drawer) }))
    app.querySelector('.theme').addEventListener('click', () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark' })
    document.addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,select')) return
      const L = e.ctrlKey || e.metaKey ? 1 : e.shiftKey ? 2 : 3
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.navigate(e.key === 'ArrowRight' ? L : 3, 1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.navigate(L, -1) }
    })
    const showBubble = btn => {
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
    this.lay = layoutLevel(this.compiled, 3, i => this._onPause(i))
    this.lay.tl.timeScale(this.speed * BASE_SPEED)
    this.effects.setEvents(this.lay.events)
    this._units()
    this._renderStages()
    let i = 0
    if (keepStopId) { const j = this.stops.findIndex(s => s.id === keepStopId); if (j >= 0) i = j }
    this.jump(i)
    this.compileMs = performance.now() - t0
    return true
  }
  _teardown() {
    if (this.lay) { this.lay.tl.pause(); this.lay.tl.seek(0); this.lay.tl.kill() }
    this.effects?.stopAll()
    this.lay = null
    this.playing = false
  }
  /** For each stop: the chapter (level 1) and step (level ≤ 2) units it belongs to. */
  _units() {
    for (const s of this.stops) {
      let n = s.node, u2 = null
      for (let m = n; m && m.id !== '__root'; m = m.parent) if (!u2 && m.level <= 2) u2 = m
      s.unit = { 1: s.chapter, 2: u2?.id ?? s.chapter, 3: s.id }
      s.unitNode = { 1: chapterNode(n), 2: u2 ?? chapterNode(n), 3: n }
    }
  }
  setLevel() { /* single timeline; kept for QA compatibility */ }

  // ───────── playback ─────────
  get stops() { return this.lay?.stops || [] }
  jump(i, sayNode) {
    if (!this.lay) return
    i = Math.max(0, Math.min(this.stops.length - 1, i))
    window.gsap.killTweensOf(this.lay.tl)
    this.lay.tl.pause()
    this.lay.tl.seek(this.stops[i].end)
    this.playing = false
    this.idx = i
    this.effects.sync(this.lay.tl.time())
    this._showStop(i, sayNode)
  }
  /** dir +1/−1 at level L (1 chapter, 2 step, 3 micro). */
  navigate(L, dir) {
    if (!this.lay) return
    const st = this.stops, cur = this.idx
    if (this.playing) { this.jump(cur); if (dir > 0) return }
    if (L === 3 && dir > 0) return this._playNext()
    const unit = i => st[i]?.unit[L]
    let target
    if (dir > 0) {
      if (cur >= st.length - 1) { this.jump(0); return }
      let last = cur
      while (last + 1 < st.length && unit(last + 1) === unit(cur)) last++
      if (last === cur) { const u = unit(cur + 1); last = cur + 1; while (last + 1 < st.length && unit(last + 1) === u) last++ }
      target = last
    } else {
      if (cur === 0) return
      let first = cur
      while (first > 0 && unit(first - 1) === unit(cur)) first--
      target = first === cur ? Math.max(0, (() => { let f = cur - 1; while (f > 0 && unit(f - 1) === unit(cur - 1)) f--; return f })()) : first
      if (L === 3) target = cur - 1
    }
    this._scrubTo(target, L)
  }
  _playNext() {
    const i = this.idx + 1
    if (i >= this.stops.length) { this.jump(0); return }
    this.idx = i
    this._showStop(i)
    this.playing = true
    this._setPlaying(true)
    this.lay.tl.seek(this.stops[i - 1].end + 0.001).play()
    this._tick()
  }
  /** Fast scrub (forward or backward) to stop `target`, showing the narration of its unit at level L. */
  _scrubTo(target, L) {
    const tl = this.lay.tl
    tl.pause()
    const to = this.stops[target].end, from = tl.time()
    const sayNode = L < 3 ? this.stops[target].unitNode[L] : null
    this.idx = target
    this._showStop(target, sayNode)
    this.playing = true
    this._setPlaying(true)
    window.gsap.to(tl, {
      time: to, duration: Math.min(1.6, Math.max(0.35, Math.abs(to - from) * 0.12)), ease: 'power2.inOut', overwrite: true,
      onUpdate: () => this.effects.sync(tl.time()),
      onComplete: () => { this.playing = false; this._setPlaying(false); tl.pause(); this.effects.sync(to); this._panelsRender() },
    })
  }
  _setPlaying(on) { this.$.nav.classList.toggle('playing', on) }
  _tick() {
    if (!this.playing || !this.lay) return
    this.effects.sync(this.lay.tl.time())
    requestAnimationFrame(() => this._tick())
  }
  _onPause(i) {
    if (!this.playing) return
    this.playing = false
    this._setPlaying(false)
    this.effects.sync(this.lay.tl.time())
    if (i !== this.idx) { this.idx = i; this._showStop(i) }
    this._panelsRender()
  }
  setSpeed(v) { this.speed = v; this.$.speedOut.textContent = `${v}×`; this.lay?.tl.timeScale(v * BASE_SPEED) }

  // ───────── narrator / roadmap ─────────
  _showStop(i, sayNode) {
    const s = this.stops[i]
    if (!s) return
    const text = sayNode ? sayNode.say.join(' ') : s.say
    let html
    try { html = this.compiled.ctx.markup.html(text) } catch { html = escapeHtml(text) }
    const el = this.$.say
    el.innerHTML = html
    el.dataset.stop = s.id
    // keep the narrator's height fixed: shrink the text instead of growing the box (the stage never resizes)
    el.style.fontSize = ''
    for (let fs = 17; fs >= 13 && el.scrollHeight > el.clientHeight + 1; fs -= 0.5) el.style.fontSize = fs + 'px'
    this.$.count.textContent = `${i + 1} / ${this.stops.length}`
    for (const L of [1, 2, 3]) {
      this.$.nav.querySelector(`[data-nav="${L}"][data-dir="-1"]`).disabled = i === 0
    }
    const chIdx = this.compiled.tree.kids.findIndex(c => c.id === s.chapter)
    this.$.stages.querySelectorAll('.st').forEach((b, k) => { b.classList.toggle('current', k === chIdx); b.classList.toggle('done', k < chIdx) })
    this.$.app.classList.toggle('at-end', i === this.stops.length - 1)
    this._panelsRender()
  }
  _renderStages() {
    const u = this.$.stages
    u.innerHTML = this.compiled.tree.kids.map(c => `<button type="button" class="st" data-ch="${escapeHtml(c.id)}" title="${escapeHtml(c.title)}"><span class="dot"></span><span class="st-t">${escapeHtml(c.title)}</span></button>`).join('')
    u.querySelectorAll('.st').forEach(b => b.addEventListener('click', () => {
      const j = this.stops.findIndex(s => s.chapter === b.dataset.ch)
      if (j >= 0) this._scrubTo(j, 1)
    }))
  }
  _panelsRender() {
    for (const p of this.compiled?.stage._panels || []) try { p.adapter.render(this.stops[this.idx]?.id, this.compiled.data) } catch (e) { console.error(e) }
  }

  // ───────── drawers ─────────
  toggleDrawer(name) { if (this._drawer === name) this.closeDrawer(); else this.openDrawer(name) }
  closeDrawer() { this._drawer = null; this.$.main.classList.remove('open'); this.$.drawer.setAttribute('aria-hidden', 'true') }
  openDrawer(name) {
    this._drawer = name
    this.$.main.classList.add('open'); this.$.drawer.setAttribute('aria-hidden', 'false')
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
      }).join('') + `<button type="button" class="btn-soft reset">${u.reset}</button>` : '—'
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
    if (!this.build(inputs, keep)) this.build(prev, keep)
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
      P.tasks.map(t => `<div class="task" data-task="${escapeHtml(t.id)}"><p>${escapeHtml(prompt(t))}</p><div class="row"><input class="ans" inputmode="decimal" aria-label="${u.answer}"><button type="button" class="btn-soft chk">${u.check}</button></div><p class="fb"></p></div>`).join('') +
      `<div class="row"><button type="button" class="btn-soft newq">${u.newQ}</button><button type="button" class="btn-soft sol">${u.showSol}</button></div>`
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
      drag = { el, info, obj, plot }
      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    })
    root.addEventListener('pointermove', e => {
      if (!drag) return
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(drag.plot._body.getScreenCTM().inverse())
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

function chapterNode(n) { while (n.parent && n.parent.id !== '__root') n = n.parent; return n }

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
