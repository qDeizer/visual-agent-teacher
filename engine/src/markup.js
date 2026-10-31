// Narration / label markup:
//   [[termId]]          glossary term (hover/tap shows the definition)
//   [[termId|shown]]    same term, custom displayed text (e.g. Turkish suffixes: [[cell|hücreden]])
//   {{valId}}           a value from the model trace (or an input)
//   {{valId:2}}         with 2 decimals · {{valId:int}} rounded · {{valId:pct}} as a percentage
//   **bold**
//   ‹the result›        hidden until the step's animation has finished (do not announce a result before it is shown)
import { VatError, fmt, escapeHtml } from './util.js'

const RE = /\[\[([\w-]+)(?:\|([^\]]+))?\]\]|\{\{([\w.-]+)(?::([\w]+))?\}\}|\*\*([^*]+)\*\*|‹([^›]+)›/g

export function createMarkup(ctx) {
  const lang = () => ctx.lang
  const term = (id, shown) => {
    const g = ctx.glossary[id]
    if (!g) throw new VatError(`[[${id}]]: '${id}' is not in the glossary. Add glossary.${id} = { term, short } or fix the id.`)
    return shown ?? g.term
  }
  const value = (id, f) => {
    const v = ctx.trace?.vals.get(id)
    let n
    if (v) n = v.value
    else if (ctx.inputs && id in ctx.inputs) n = ctx.inputs[id]
    else if (ctx.trace?.events.has(id.split('.')[0])) {
      let p = ctx.trace.events.get(id.split('.')[0]).payload
      for (const k of id.split('.').slice(1)) p = p?.[k]
      if (p === undefined) throw new VatError(`{{${id}}}: event field not found.`)
      n = p && typeof p === 'object' && 'value' in p ? p.value : p
      if (typeof n !== 'number') return String(n)
    } else throw new VatError(`{{${id}}}: no value with id '${id}' in the model trace or inputs.`)
    if (f === undefined) return fmt(n, undefined, lang())
    if (/^\d+$/.test(f)) return fmt(n, Number(f), lang())
    if (f === 'int') return fmt(Math.round(n), 0, lang())
    if (f === 'pct') { const s = fmt(n * 100, Math.abs(n * 100) % 1 ? 1 : 0, lang()); return /^tr/i.test(lang()) ? `%${s}` : `${s}%` }
    throw new VatError(`{{${id}:${f}}}: unknown format '${f}'. Use a number of decimals, 'int' or 'pct'.`)
  }
  return {
    plain(s) {
      return String(s).replace(RE, (m, tid, shown, vid, f, bold, late) => tid ? term(tid, shown) : vid ? value(vid, f) : this.plain(bold ?? late))
    },
    html(s) {
      let out = '', last = 0
      const str = String(s)
      for (const m of str.matchAll(RE)) {
        out += escapeHtml(str.slice(last, m.index))
        const [, tid, shown, vid, f, bold, late] = m
        if (tid) out += `<button type="button" class="term" data-term="${escapeHtml(tid)}">${escapeHtml(term(tid, shown))}</button>`
        else if (vid) out += `<span class="val">${escapeHtml(value(vid, f))}</span>`
        else if (late !== undefined) out += `<span class="late">${this.html(late)}</span>`
        else out += `<b>${this.html(bold)}</b>`
        last = m.index + m[0].length
      }
      return out + escapeHtml(str.slice(last))
    },
    terms(s) { return [...String(s).matchAll(RE)].flatMap(m => m[1] ? [m[1]] : m[5] ? this.terms(m[5]) : m[6] ? this.terms(m[6]) : []) },
    check(s) {
      const out = this.plain(s)
      const left = out.match(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]|\*\*/)
      if (left) throw new VatError(`Markup not understood in "${String(s).slice(0, 80)}": "${left[0]}". Use [[termId]], [[termId|text]], {{valId}}, {{valId:2|int|pct}}, **bold** (no nesting of ** inside **).`)
      return true
    },
  }
}
