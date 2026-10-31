#!/usr/bin/env node
// Build a lesson: lint lesson.js, run the model checks, and produce one self-contained offline HTML file.
//   node build.mjs path/to/lesson.js [path/to/out.html]
// Exit code 0 = built and all checks passed; 1 = errors (read the messages: each says what to fix).
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { runChecks, validateDef, rng, fmt } from './lib/vat-node.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const assets = join(here, '..', 'assets')
const [, , lessonArg, outArg] = process.argv
if (!lessonArg) { console.error('Usage: node build.mjs <lesson.js> [out.html]'); process.exit(2) }
const lessonPath = resolve(lessonArg)
if (!existsSync(lessonPath)) { console.error(`✗ File not found: ${lessonPath}`); process.exit(1) }
const outPath = resolve(outArg || join(dirname(lessonPath), 'lab.html'))
const src = readFileSync(lessonPath, 'utf8')
const errors = [], warnings = []

// ── 1. static lint ──
const RULES = [
  [/\bMath\.random\s*\(/, 'Math.random is not allowed (lessons must be deterministic). Use the seeded `rand` given to practice.generate, or fixed values.'],
  [/\bnew\s+Date\b|\bDate\.now\s*\(/, 'Date is not allowed (lessons must be deterministic).'],
  [/\b(setTimeout|setInterval|requestAnimationFrame)\s*\(/, 'Timers are not allowed. Steps run in order automatically; use s.pause() for a beat.'],
  [/\b(fetch|XMLHttpRequest)\b/, 'Network access is not allowed: the lab must work offline.'],
  [/^\s*import\s/m, 'import statements are not allowed. Everything you need is global: defineLesson, vat.'],
  [/\b(async\s+(function|\()|async\s+\w+\s*=>|\bawait\s)/, 'async/await is not allowed. Script runs synchronously: each verb is appended to the step timeline in order.'],
  [/\bdocument\.(getElementById|querySelector|querySelectorAll|body|write)\b/, 'Direct DOM access is not allowed. Use the stage API (or stage.adopt / stage.panel for escape hatches).'],
  [/<\/?(html|body|style)\b/i, 'Do not write HTML/CSS. The engine provides the page; you only write lesson.js.'],
]
src.split('\n').forEach((line, i) => {
  if (/^\s*\/\//.test(line)) return
  for (const [re, msg] of RULES) if (re.test(line)) errors.push(`lesson.js:${i + 1}: ${msg}\n      ${line.trim().slice(0, 120)}`)
})
const exports = src.match(/export\s+default\s+/g) || []
if (exports.length !== 1) errors.push(`lesson.js must contain exactly one \`export default defineLesson({ ... })\` (found ${exports.length}).`)
if (/\{\s*x\s*:\s*-?\d+(\.\d+)?\s*,\s*y\s*:\s*-?\d+(\.\d+)?\s*\}/.test(src) && !/plot\s*[:,]/.test(src)) warnings.push('Raw { x, y } objects found: positions must not be screen pixels. Use regions, { near, side }, { region, u, v } or plot coordinates.')

// ── 2. load in Node and run the model checks ──
let def
if (!errors.length) {
  const dir = mkdtempSync(join(tmpdir(), 'vat-build-'))
  const tmp = join(dir, 'lesson.mjs')
  writeFileSync(tmp, src)
  globalThis.defineLesson = d => d
  globalThis.vat = { fmt: (n, dp) => fmt(n, dp, 'en'), gsap: new Proxy({}, { get() { throw new Error('vat.gsap is only available in the browser (inside steps).') } }), defineVerb() {}, defineComponent() {}, extendComponent() {}, version: 'node' }
  try { def = (await import(pathToFileURL(tmp).href)).default }
  catch (e) { errors.push(`lesson.js could not be loaded: ${e.message}`) }
  finally { try { rmSync(dir, { recursive: true, force: true }) } catch {} }
  if (def) {
    try { validateDef(def) } catch (e) { errors.push(e.message) }
  }
  if (def && !errors.length) {
    const res = runChecks(def, { lang: def.meta.lang, fuzz: 40, rngFactory: rng })
    for (const r of res) (r.ok ? null : errors.push(`check: ${r.message}`))
    const okCount = res.filter(r => r.ok).length
    if (okCount) console.log(`✓ ${okCount} known-value check(s) passed`)
  }
}

if (errors.length) {
  // group repeated messages (e.g. the same model error for every random input)
  const groups = new Map()
  for (const e of errors) {
    const key = e.replace(/\(random #\d+, inputs \{[^}]*\}\)|random #\d+|practice #\d+|known case "[^"]*"|default inputs/g, '…')
    const g = groups.get(key) || { first: e, n: 0 }; g.n++; groups.set(key, g)
  }
  console.error(`✗ Build failed with ${groups.size} distinct error(s):\n`)
  ;[...groups.values()].forEach((g, i) => console.error(`${i + 1}. ${g.first}${g.n > 1 ? `\n   (same error in ${g.n} runs)` : ''}\n`))
  warnings.forEach(w => console.error(`⚠ ${w}`))
  process.exit(1)
}

// ── 3. assemble the HTML ──
const css = readFileSync(join(assets, 'shell.css'), 'utf8')
const gsap = readFileSync(join(assets, 'gsap.min.js'), 'utf8')
const engine = readFileSync(join(assets, 'engine.js'), 'utf8')
const safe = s => s.replace(/<\/script/gi, '<\\/script')
const lessonCode = src.replace(/export\s+default\s+/, 'window.__VAT_LESSON__ = ')
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const html = `<!doctype html>
<html lang="${esc(def.meta.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="Visual Agent Teacher ${readFileSync(join(assets, 'VERSION'), 'utf8').trim()}">
<title>${esc(def.meta.title)}</title>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>${safe(gsap)}</script>
<script>${safe(engine)}</script>
<script>(function(){${safe(lessonCode)}
})()
//# sourceURL=lesson.js
</script>
</body>
</html>
`
writeFileSync(outPath, html)
warnings.forEach(w => console.log(`⚠ ${w}`))
console.log(`✓ Built ${basename(outPath)} (${(html.length / 1024).toFixed(0)} KB): ${outPath}`)
console.log(`  Next: node ${join(here, 'qa.mjs')} "${outPath}"`)
