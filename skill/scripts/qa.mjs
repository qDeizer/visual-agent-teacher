#!/usr/bin/env node
// Test a built lab in a headless browser.
//   node qa.mjs path/to/lab.html [--shots] [--no-verify]
// Checks: runtime errors, model checks, "watching a step == jumping to it" (all detail levels),
// layout problems (overlapping/clipped/tiny text, NaN), real playback. Writes qa-report.json next to the HTML
// and, with --shots, one screenshot per stop (normal detail) into qa-shots/.
// Exit code 0 = no errors; 1 = errors (each message names the step id and what is wrong).
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launch } from './lib/cdp.mjs'

const args = process.argv.slice(2)
const file = args.find(a => !a.startsWith('--'))
if (!file) { console.error('Usage: node qa.mjs <lab.html> [--shots] [--no-verify]'); process.exit(2) }
const html = resolve(file)
if (!existsSync(html)) { console.error(`✗ Not found: ${html}`); process.exit(1) }
const shots = args.includes('--shots')
const outDir = dirname(html)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const report = { file: html, errors: [], warnings: [], info: null, verify: {}, layout: [], shots: [] }
const b = await launch({ width: 1440, height: 900 })
try {
  await b.goto(pathToFileURL(html).href)
  let ready = false
  for (let i = 0; i < 100 && !ready; i++) { ready = await b.eval('!!(window.__vat && window.__vat.ready)').catch(() => false); if (!ready) await sleep(100) }
  if (!ready) report.errors.push('The page did not start (window.__vat never became ready). Open the HTML in a browser and check the console.')
  const errs = ready ? await b.eval('window.__vat.errors') : []
  for (const e of errs) report.errors.push(`Lesson error: ${e.message}${(e.stack || '').split('\n').find(l => l.includes('lesson.js')) ? `\n      at ${(e.stack || '').split('\n').find(l => l.includes('lesson.js')).trim()}` : ''}`)
  if (ready && !errs.length) {
    const checks = await b.eval('window.__vat.checks')
    for (const c of checks) if (!c.ok) report.errors.push(`Check failed: ${c.message}`)
    for (const w of await b.eval('window.__vat.warnings')) report.warnings.push(w)
    report.info = await b.eval('window.__vat.info()')
    if (!args.includes('--no-verify')) for (const L of [1, 2, 3]) {
      const v = await b.eval(`window.__vat.verify(${L})`, { timeout: 180000 })
      report.verify[L] = v
      for (const p of v.problems) report.errors.push(`Detail ${L}, step '${p.stop}': ${p.kind === 'play-vs-jump' ? 'watching the animation and jumping to this step give different results' : 'jumping backward to this step differs from jumping forward'}:\n      ${p.details.join('\n      ')}`)
    }
    report.layout = await b.eval('window.__vat.layout(2)', { timeout: 180000 })
    for (const x of report.layout) {
      const where = `step(s) ${x.stops.slice(0, 4).join(', ')}${x.stops.length > 4 ? ` (+${x.stops.length - 4} more)` : ''}`
      if (x.kind === 'text-overlap') report.errors.push(`Overlapping text at ${where}: "${x.a}" and "${x.b}" overlap ${x.overlap}. Move one of them (placement 'near' with another side, a different region, or hide/dim one).`)
      else if (x.kind === 'bad-value') report.errors.push(`Invalid value shown at ${where}: "${x.text}" (object ${x.owner}).`)
      else if (x.kind === 'clipped') report.errors.push(`Text cut off at the edge of the view at ${where}: "${x.text}" (object ${x.owner}). Move it inside the stage, use a smaller region, or frame it with the camera.`)
      else if (x.kind === 'clipped-zoomed') report.warnings.push(`While the camera is zoomed, text is cut at the edge of the view at ${where}: "${x.text}" (object ${x.owner}). Fine if intended; otherwise frame it fully.`)
      else if (x.kind === 'text-too-small') report.warnings.push(`Text rendered at ${x.px}px (too small) at ${where}: "${x.text}" (object ${x.owner}).`)
    }
    // real playback of the first stops (catches problems that seeking hides)
    await b.eval('window.__vat.go(0, 2)')
    await b.eval(`document.querySelector('.speed input').value = 2.5; document.querySelector('.speed input').dispatchEvent(new Event('input'))`)
    for (let i = 1; i <= Math.min(4, report.info.levels[2].stops - 1); i++) {
      await b.eval(`document.querySelector('.next').click()`)
      let idx = -1
      for (let k = 0; k < 60; k++) { await sleep(100); idx = await b.eval(`(document.querySelector('.count').textContent.match(/(\\d+)\\s*\\//) || [])[1]`); if (await b.eval(`!document.querySelector('.next').classList.contains('playing')`)) break }
      if (Number(idx) !== i + 1) { report.errors.push(`Playback: after pressing Continue ${i} time(s) the counter shows step ${idx}, expected ${i + 1}.`); break }
    }
    if (shots) {
      const dir = join(outDir, 'qa-shots')
      mkdirSync(dir, { recursive: true })
      const stops = await b.eval('window.__vat.go(0, 2), window.__vat.stops()')
      for (let i = 0; i < stops.length; i++) {
        await b.eval(`window.__vat.go(${i}, 2)`)
        await sleep(60)
        const name = `stop-${String(i + 1).padStart(2, '0')}-${stops[i].id.replace(/[^\w-]/g, '_')}.png`
        writeFileSync(join(dir, name), await b.screenshot())
        report.shots.push(join('qa-shots', name))
      }
    }
  }
  for (const m of b.console) if (m.type === 'exception' || m.type === 'error') report.errors.push(`Browser console ${m.type}: ${m.text.split('\n')[0]}`)
} finally {
  await b.close()
}

writeFileSync(join(outDir, 'qa-report.json'), JSON.stringify(report, null, 2))
const i = report.info
if (i) console.log(`Lesson: ${i.title} — ${i.objects} objects; stops: overview ${i.levels[1].stops}, normal ${i.levels[2].stops}, micro ${i.levels[3].stops}; normal detail plays ${i.levels[2].seconds}s at 1×`)
if (report.warnings.length) { console.log(`\n⚠ ${report.warnings.length} warning(s):`); report.warnings.forEach(w => console.log(`  - ${w}`)) }
if (report.errors.length) {
  console.log(`\n✗ QA failed with ${report.errors.length} error(s):`)
  report.errors.slice(0, 25).forEach((e, k) => console.log(`${k + 1}. ${e}`))
  if (report.errors.length > 25) console.log(`… and ${report.errors.length - 25} more (fix the ones above first; see the report).`)
  console.log(`\nFull report: ${join(outDir, 'qa-report.json')}`)
  process.exit(1)
}
console.log(`\n✓ QA passed${shots ? ` — ${report.shots.length} screenshots in ${join(outDir, 'qa-shots')}` : ''}. Full report: ${join(outDir, 'qa-report.json')}`)
