// Model trace: every number knows where it came from. Pure; shared by the browser engine and the Node build.
import { fmt, VatError, guard } from './util.js'

export class Val {
  constructor(id, value, sources, op, lang) {
    this.id = id
    this.value = value
    this.sources = Object.freeze(sources)
    this.op = op
    this._lang = lang
  }
  fmt(dp) { return fmt(this.value, dp, this._lang) }
  toString() { return this.fmt() }
  valueOf() { return this.value }
}

export class TraceEvent {
  constructor(id, index, payload) { this.id = id; this.index = index; this.payload = Object.freeze({ ...payload }) }
}

export function createTrace(lang = 'en') {
  const vals = new Map()
  const events = new Map()
  const order = []
  const reg = (id, v) => {
    if (typeof id !== 'string' || !id) throw new VatError(`Trace ids must be non-empty strings (got ${JSON.stringify(id)}).`)
    if (vals.has(id) || events.has(id)) throw new VatError(`Trace id '${id}' is used twice. Every value/event needs its own id (e.g. '${id}1', '${id}2', or '${id}-' + i in a loop).`)
    if (!Number.isFinite(v.value)) throw new VatError(`Trace value '${id}' is ${v.value}. Check the inputs of this computation (division by zero? missing input?).`)
    vals.set(id, v); order.push(id); return v
  }
  const need = (id, xs) => xs.forEach((x, i) => {
    if (!(x instanceof Val)) throw new VatError(`t.* for '${id}': argument ${i + 1} is ${JSON.stringify(x)}, expected a Val created by the trace builder (t.input/t.const/...).`)
  })
  const t = {
    input: (id, value) => reg(id, new Val(id, Number(value), [], 'input', lang)),
    const: (id, value) => reg(id, new Val(id, Number(value), [], 'const', lang)),
    add: (id, ...xs) => (need(id, xs), reg(id, new Val(id, xs.reduce((s, x) => s + x.value, 0), xs.map(x => x.id), 'add', lang))),
    sub: (id, a, b) => (need(id, [a, b]), reg(id, new Val(id, a.value - b.value, [a.id, b.id], 'sub', lang))),
    mul: (id, ...xs) => (need(id, xs), reg(id, new Val(id, xs.reduce((s, x) => s * x.value, 1), xs.map(x => x.id), 'mul', lang))),
    div: (id, a, b) => {
      need(id, [a, b])
      if (b.value === 0) throw new VatError(`t.div('${id}'): division by zero ('${b.id}' is 0). Handle this case explicitly in the model.`)
      return reg(id, new Val(id, a.value / b.value, [a.id, b.id], 'div', lang))
    },
    pow: (id, base, e) => {
      need(id, [base]); const ev = e instanceof Val ? e.value : Number(e)
      return reg(id, new Val(id, Math.pow(base.value, ev), e instanceof Val ? [base.id, e.id] : [base.id], 'pow', lang))
    },
    fn: (id, name, f, ...args) => {
      need(id, args)
      return reg(id, new Val(id, Number(f(...args.map(a => a.value))), args.map(a => a.id), name, lang))
    },
    dot: (id, xs, ws) => {
      need(id, [...xs, ...ws])
      if (xs.length !== ws.length) throw new VatError(`t.dot('${id}'): ${xs.length} values vs ${ws.length} weights.`)
      return reg(id, new Val(id, xs.reduce((s, x, i) => s + x.value * ws[i].value, 0), [...xs, ...ws].map(v => v.id), 'dot', lang))
    },
    event(id, payload = {}) {
      if (vals.has(id) || events.has(id)) throw new VatError(`Trace id '${id}' is used twice. Every value/event needs its own id (e.g. '${id}1', '${id}2', or '${id}-' + i in a loop).`)
      const e = new TraceEvent(id, events.size, payload); events.set(id, e); order.push(id); return e
    },
  }
  return { t: guard(t, 'TraceBuilder (t)'), vals, events, order }
}

/** Resolve 'id' or 'eventId.field' against a trace. Returns undefined when missing. */
export function traceLookup(trace, key) {
  if (trace.vals.has(key)) return trace.vals.get(key).value
  if (trace.events.has(key)) return trace.events.get(key).payload
  const dot = key.indexOf('.')
  if (dot > 0) {
    const ev = trace.events.get(key.slice(0, dot))
    if (ev) {
      let v = ev.payload
      for (const part of key.slice(dot + 1).split('.')) v = v == null ? undefined : v[part]
      return v instanceof Val ? v.value : v
    }
  }
  return undefined
}

/** Input values: defaults merged with overrides. */
export function inputValues(def, overrides = {}) {
  const out = {}
  for (const [k, spec] of Object.entries(def.inputs || {})) out[k] = spec.default
  return Object.assign(out, overrides)
}

export function runModel(def, inputs, lang) {
  const tr = createTrace(lang)
  const data = def.model(Object.freeze({ ...inputs }), tr.t)
  return { data, trace: tr }
}

/** Run checks.known + invariants. Returns a list of { ok, message }. Used in Node (build) and browser (boot). */
export function runChecks(def, { lang = 'en', fuzz = 0, seedBase = 1, rngFactory } = {}) {
  const results = []
  const known = def.checks?.known || []
  if (!known.length) results.push({ ok: false, message: 'checks.known is empty: add at least one case from an external source (textbook, lecture notes, RFC…).' })
  for (const c of known) {
    let run
    try { run = runModel(def, inputValues(def, c.inputs || {}), lang) } catch (e) { results.push({ ok: false, message: `known case "${c.source}": model threw: ${e.message}` }); continue }
    for (const [key, expected] of Object.entries(c.expect || {})) {
      const got = traceLookup(run.trace, key)
      const tol = c.tolerance ?? 1e-6
      const ok = typeof expected === 'number'
        ? typeof got === 'number' && Math.abs(got - expected) <= Math.max(tol, Math.abs(expected) * 1e-12)
        : String(got) === String(expected)
      results.push({ ok, message: ok ? `known "${c.source}": ${key} = ${expected}` : `known "${c.source}": ${key} expected ${expected}, model gives ${got === undefined ? '(no such trace id)' : got}` })
    }
  }
  const runInvariants = (inputs, label) => {
    if (!def.checks?.invariants) return
    let run
    try { run = runModel(def, inputs, lang) } catch (e) { results.push({ ok: false, message: `${label}: model threw: ${e.message}` }); return }
    const fails = []
    try { def.checks.invariants(run.data, inputs, m => fails.push(m)) } catch (e) { fails.push(`invariants threw: ${e.message}`) }
    fails.forEach(m => results.push({ ok: false, message: `invariant failed (${label}, inputs ${JSON.stringify(inputs)}): ${m}` }))
  }
  runInvariants(inputValues(def), 'default inputs')
  if (fuzz && def.inputs && rngFactory) {
    const r = rngFactory(seedBase)
    for (let i = 0; i < fuzz; i++) {
      const inp = {}
      for (const [k, s] of Object.entries(def.inputs)) inp[k] = r.float(s.min, s.max, s.step)
      runInvariants(inputValues(def, inp), `random #${i + 1}`)
    }
  }
  if (def.practice?.generate && rngFactory) {
    for (let i = 0; i < 10; i++) {
      let inp
      try { inp = def.practice.generate(rngFactory(1000 + i)) } catch (e) { results.push({ ok: false, message: `practice.generate threw: ${e.message}` }); break }
      runInvariants(inputValues(def, inp), `practice #${i + 1}`)
      for (const task of def.practice.tasks || []) {
        let run
        try { run = runModel(def, inputValues(def, inp), lang) } catch { break }
        if (traceLookup(run.trace, task.answer) === undefined) { results.push({ ok: false, message: `practice task '${task.id}': answer '${task.answer}' is not a trace id` }); break }
      }
    }
  }
  return results
}
