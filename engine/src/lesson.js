// Compile a lesson definition: model → scene → script (recorded into a step tree) + lint.
import { VatError, guard, fmt } from './util.js'
import { rec } from './core.js'
import { Stage } from './stage.js'
import { FormulaBar } from './formula.js'
import { runModel, inputValues } from './trace.js'
import { createMarkup } from './markup.js'
import { validateDef } from './validate.js'

const LEVEL_NAMES = { 1: 'overview', 2: 'normal', 3: 'micro' }

class Node {
  constructor(id, title, level, parent) { this.id = id; this.title = title; this.level = level; this.parent = parent; this.say = []; this.items = []; this.summary = null; this.kids = [] }
}

export function compileLesson(def, root, { inputs: inputOverrides = {}, verbs, components } = {}) {
  validateDef(def)
  const warnings = []
  const lang = def.meta.lang
  const inputs = inputValues(def, inputOverrides)
  const { data, trace } = runModel(def, inputs, lang)
  const ctx = { lang, glossary: def.glossary, trace, inputs, verbs, components, warnings }
  ctx.markup = createMarkup(ctx)
  const stage = new Stage(root, ctx)
  const formula = new FormulaBar(stage, ctx)
  const formulaApi = guard(formula, 's.formula')
  const dataApi = data && typeof data === 'object' ? guard(data, 'model output (data)') : data

  rec.reset()
  rec.mode = 'scene'
  let refs
  try { refs = def.scene(stage._api, dataApi, Object.freeze({ ...inputs })) } finally { rec.mode = 'idle' }

  const rootNode = new Node('__root', '', 0, null)
  const ids = new Set()
  const memory = []
  const termUse = []
  // numbers typed by hand into text go stale when the learner changes inputs, and "0.4" is wrong in Turkish
  const comma = /^(tr|de|fr|es|it|pt|ru|nl|pl|az)/i.test(lang)
  const handTyped = (text, where) => {
    const plain = String(text).replace(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]/g, '')
    const m = plain.match(comma ? /\d\.\d/ : /\d,\d/)
    const src = String(text), at = src.indexOf(m?.[0])
    if (m) warnings.push(`${where}: "…${src.slice(Math.max(0, at - 16), at + 18)}…" has a hand-typed decimal. Use {{valId}} (model values follow input changes and use the lesson's decimal separator).`)
  }
  ctx.handTyped = handTyped
  const newNode = (id, title, level, parent) => {
    if (typeof id !== 'string' || !id) throw new VatError(`Step ids must be non-empty strings.`)
    if (ids.has(id)) throw new VatError(`Step id '${id}' is used twice. Every chapter/step needs a unique id.`)
    ids.add(id)
    const n = new Node(id, title, level, parent)
    parent.kids.push(n)
    return n
  }
  const builder = node => {
    const sb = {
      say(text) {
        if (typeof text !== 'string') throw new VatError(`s.say(text) needs a string.`)
        ctx.markup.check(text)
        node.say.push(text)
        termUse.push({ node, terms: ctx.markup.terms(text) })
        handTyped(text, `step '${node.id}'`)
      },
      step(id, opts, build) {
        if (typeof opts === 'function') { build = opts; opts = {} }
        if (typeof build !== 'function') throw new VatError(`s.step('${id}', opts, s => { ... }) needs a build function.`)
        if (rec.cap !== node.items) throw new VatError(`s.step('${id}') cannot be called inside together() or summary().`)
        let level = opts?.level ?? 2
        if (![1, 2, 3].includes(level)) throw new VatError(`step '${id}': level must be 1, 2 or 3.`)
        if (level < node.level) { warnings.push(`step '${id}' has level ${level} inside '${node.id}' (level ${node.level}); using ${node.level}.`); level = node.level }
        const child = newNode(id, opts?.title, level, node)
        node.items.push({ k: 'node', node: child })
        const prev = rec.cap
        rec.cap = child.items
        try { build(builder(child)) } finally { rec.cap = prev; stage._follow = null }
      },
      together(build) { rec.par(() => build()) },
      pause(beats = 1) { rec.wait(0.45 * beats) },
      summary(build) {
        if (node.summary) throw new VatError(`step '${node.id}' already has a summary.`)
        node.summary = []
        const prev = rec.cap
        rec.cap = node.summary
        try { build() } finally { rec.cap = prev }
      },
      get formula() { return formulaApi },
      fly(from, to, o) { stage._fly(from, to, o, formula) },
      add(anim) {
        if (!anim || typeof anim.duration !== 'function') throw new VatError(`s.add(anim) needs a GSAP animation, e.g. s.add(vat.gsap.to(el, { ... })).`)
        anim.pause()
        rec.push({ k: 'raw', anim, d: anim.duration() })
      },
    }
    return guard(sb, `step builder (s) of '${node.id}'`)
  }
  const lesson = guard({
    get stage() { return stage._api },
    chapter(id, title, build) {
      if (typeof title !== 'string') throw new VatError(`lesson.chapter(id, title, s => { ... }): title must be a string.`)
      if (typeof build !== 'function') throw new VatError(`lesson.chapter('${id}', '${title}', s => { ... }) needs a build function.`)
      const n = newNode(id, title, 1, rootNode)
      n.chapter = true
      rootNode.items.push({ k: 'node', node: n })
      rec.cap = n.items
      try { build(builder(n)) } finally { rec.cap = null; stage._follow = null }
    },
    memorize(item) {
      if (!item?.title) throw new VatError(`lesson.memorize({ title, formula?, words?, why? }) needs a title.`)
      if (item.words) ctx.markup.check(item.words)
      if (item.why) ctx.markup.check(item.why)
      memory.push(item)
    },
  }, 'lesson')

  rec.mode = 'script'
  try { def.script(lesson, refs, dataApi, Object.freeze({ ...inputs })) } finally { rec.mode = 'idle'; rec.cap = null }

  // ── lint ──
  if (!rootNode.kids.length) throw new VatError(`script() created no chapters. Use lesson.chapter(id, title, s => { ... }).`)
  const walk = (n, f) => { f(n); n.kids.forEach(k => walk(k, f)) }
  walk(rootNode, n => {
    if (n === rootNode) return
    if (!n.say.length) throw new VatError(`step '${n.id}' has no narration. Every chapter/step can be a stop, so each needs s.say('…') written for its own level (${LEVEL_NAMES[n.level]}).`)
    let seenChild = false
    for (const it of n.items) {
      if (it.k === 'node') seenChild = true
      else if (seenChild && it.k !== 'ev') { warnings.push(`step '${n.id}': actions after child step(s) play as part of the previous stop. Put them in their own step.`); break }
    }
  })
  const firstUse = new Map()
  const order = []
  walk(rootNode, n => order.push(n))
  for (const n of order) for (const t of termUse.filter(u => u.node === n).flatMap(u => u.terms)) if (!firstUse.has(t)) firstUse.set(t, n.id)
  for (const id of Object.keys(def.glossary)) if (!firstUse.has(id)) warnings.push(`glossary term '${id}' is never introduced with [[${id}]] in the narration.`)
  const concepts = Object.values(def.glossary).filter(g => g.concept).length
  if (concepts > 6) warnings.push(`${concepts} concept colours: more than 6 become hard to tell apart.`)
  for (const [id, g] of Object.entries(def.glossary)) if (g.memorize) memory.unshift({ title: g.term, formula: g.symbol, words: g.short, why: g.long })

  return { def, stage, formula, tree: rootNode, inputs, data, trace, ctx, warnings, memory, initialEvents: rec.initialEvents.slice() }
}

export function fmtNum(n, lang) { return fmt(n, undefined, lang) }
