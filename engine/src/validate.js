// Structural validation of a lesson definition. Pure (used by the browser engine and the Node build).
import { VatError } from './util.js'

export function validateDef(def) {
  const errs = []
  if (!def || typeof def !== 'object') throw new VatError(`lesson.js must end with export default defineLesson({ ... }).`)
  for (const k of ['meta', 'glossary', 'model', 'checks', 'scene', 'script']) if (def[k] === undefined) errs.push(`missing '${k}'`)
  if (def.meta) for (const k of ['title', 'lang', 'goal']) if (!def.meta[k]) errs.push(`missing meta.${k}`)
  for (const k of ['model', 'scene', 'script']) if (def[k] !== undefined && typeof def[k] !== 'function') errs.push(`'${k}' must be a function`)
  for (const [id, g] of Object.entries(def.glossary || {})) if (!g || !g.term || !g.short) errs.push(`glossary.${id} needs { term, short }`)
  for (const [id, s] of Object.entries(def.inputs || {})) {
    for (const k of ['default', 'min', 'max', 'step']) if (typeof s?.[k] !== 'number') errs.push(`inputs.${id}.${k} must be a number`)
    if (s && s.min > s.max) errs.push(`inputs.${id}: min > max`)
    if (s && (s.default < s.min || s.default > s.max)) errs.push(`inputs.${id}: default is outside [min, max]`)
    if (s?.term && def.glossary && !def.glossary[s.term]) errs.push(`inputs.${id}.term '${s.term}' is not a glossary key`)
  }
  if (def.checks && !Array.isArray(def.checks.known)) errs.push(`checks.known must be an array`)
  if (def.practice) {
    if (typeof def.practice.generate !== 'function') errs.push(`practice.generate must be a function (rand) => inputs`)
    if (!Array.isArray(def.practice.tasks) || !def.practice.tasks.length) errs.push(`practice.tasks must be a non-empty array`)
    else def.practice.tasks.forEach((t, i) => { if (!t.id || !t.prompt || !t.answer) errs.push(`practice.tasks[${i}] needs { id, prompt, answer }`) })
  }
  const allowed = new Set(['meta', 'glossary', 'inputs', 'model', 'checks', 'scene', 'script', 'practice'])
  for (const k of Object.keys(def)) if (!allowed.has(k)) errs.push(`unknown top-level key '${k}'`)
  if (errs.length) throw new VatError(`defineLesson: ${errs.join('; ')}.`)
}
