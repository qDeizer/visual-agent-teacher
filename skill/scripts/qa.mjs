#!/usr/bin/env node
// Test a built lab in a headless browser.
//   node qa.mjs path/to/lab.html [--sheet] [--film] [--shots] [--no-verify]
// Checks: runtime errors, model checks, "watching a step == jumping to it" (all detail levels),
// layout problems (overlapping/clipped/tiny text, NaN), real playback. Writes qa-report.json next to the HTML
// and, with --shots, one screenshot per stop (normal detail) into qa-shots/; with --sheet also contact sheets\n// (6 stops per image) into qa-sheets/ — review those instead of single shots when images are limited.
// Exit code 0 = no errors; 1 = errors (each message names the step id and what is wrong).
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launch } from './lib/cdp.mjs'

const args = process.argv.slice(2)
const file = args.find(a => !a.startsWith('--'))
if (!file) { console.error('Usage: node qa.mjs <lab.html> [--shots] [--no-verify]'); process.exit(2) }
const html = resolve(file)
if (!existsSync(html)) { console.error(`✗ Not found: ${html}`); process.exit(1) }
const shots = args.includes('--shots')
const sheet = args.includes('--sheet')
const film = args.includes('--film')
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
    if (!args.includes('--no-verify')) for (const L of [3]) {
      const v = await b.eval(`window.__vat.verify(${L})`, { timeout: 180000 })
      report.verify[L] = v
      for (const p of v.problems) report.errors.push(`Step '${p.stop}': ${p.kind === 'play-vs-jump' ? 'watching the animation and jumping to this step give different results' : 'jumping backward to this step differs from jumping forward'}:\n      ${p.details.join('\n      ')}`)
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
    // motion check: a stop whose animation only fades things in/out plays like a slide
    const motion = await b.eval('window.__vat.motion()')
    const slide = motion.filter(m => m.fade > 0 && m.move === 0), still = motion.filter(m => m.fade === 0 && m.move === 0)
    report.motion = { stops: motion.length, slideLike: slide.map(m => m.id), still: still.map(m => m.id) }
    var motionAll = motion
    if (slide.length) report.warnings.push(`Slide-show steps (${slide.length}/${motion.length}) only fade things in/out: ${slide.slice(0, 8).map(m => m.id).join(', ')}${slide.length > 8 ? ' …' : ''}. Transform instead: move, grow (to), count (setValue), fly a number, split, draw a path, camera.focus.`)
    if (still.length > motion.length * 0.3) report.warnings.push(`${still.length}/${motion.length} steps have no animation at all (${still.slice(0, 6).map(m => m.id).join(', ')}…). Every step should show something happening.`)
    // real playback of the first stops (catches problems that seeking hides)
    await b.eval('window.__vat.go(0, 2)')
    await b.eval(`document.querySelector('.speed input').value = 2.5; document.querySelector('.speed input').dispatchEvent(new Event('input'))`)
    const NEXT = `document.querySelector('[data-nav="3"][data-dir="1"]')`
    for (let i = 1; i <= Math.min(4, report.info.levels[2].stops - 1); i++) {
      await b.eval(`${NEXT}.click()`)
      let idx = -1
      for (let k = 0; k < 60; k++) { await sleep(100); idx = await b.eval(`(document.querySelector('.count').textContent.match(/(\\d+)\\s*\\//) || [])[1]`); if (await b.eval(`!document.querySelector('.nav').classList.contains('playing')`)) break }
      if (Number(idx) !== i + 1) { report.errors.push(`Playback: after pressing Continue ${i} time(s) the counter shows step ${idx}, expected ${i + 1}.`); break }
    }
    if (shots || sheet || film) {
      const dir = join(outDir, 'qa-shots')
      for (const d of ['qa-shots', 'qa-sheets', 'qa-film']) rmSync(join(outDir, d), { recursive: true, force: true })
      mkdirSync(dir, { recursive: true })
      const stops = await b.eval('window.__vat.go(0, 2), window.__vat.stops()')
      for (let i = 0; i < stops.length; i++) {
        await b.eval(`window.__vat.go(${i}, 2)`)
        await sleep(60)
        const name = `stop-${String(i + 1).padStart(2, '0')}-${stops[i].id.replace(/[^\w-]/g, '_')}.png`
        writeFileSync(join(dir, name), await b.screenshot())
        report.shots.push(join('qa-shots', name))
      }
      if (sheet) {
        // contact sheets: 6 stops per image (3 × 2), so a model with an image limit can review the whole lesson
        const sdir = join(outDir, 'qa-sheets')
        mkdirSync(sdir, { recursive: true })
        const per = 6, tileW = 466, tileH = Math.round(tileW * 900 / 1440), capH = 26
        for (let s = 0; s * per < report.shots.length; s++) {
          const tiles = report.shots.slice(s * per, s * per + per).map((p, k) => {
            const i = s * per + k
            return `<figure><figcaption>${i + 1}/${stops.length} · ${stops[i].id}</figcaption><img src="${pathToFileURL(join(outDir, p)).href}"></figure>`
          }).join('')
          const page = join(sdir, `_sheet-${s + 1}.html`)
          writeFileSync(page, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:8px;background:#fff;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,${tileW}px);gap:8px}figure{margin:0}figcaption{height:${capH - 4}px}img{width:${tileW}px;height:${tileH}px;border:1px solid #ccd;display:block}</style>${tiles}`)
          await b.goto(pathToFileURL(page).href)
          await sleep(150)
          const rows = Math.ceil(Math.min(per, report.shots.length - s * per) / 3)
          const name = `sheet-${s + 1}.png`
          writeFileSync(join(sdir, name), await b.screenshot({ x: 0, y: 0, width: 3 * tileW + 32, height: rows * (tileH + capH + 8) + 16 }))
          report.sheets = [...(report.sheets || []), join('qa-sheets', name)]
        }
      }
    }
  }
  if (film && report.motion) {
    const fdir = join(outDir, 'qa-film'); mkdirSync(fdir, { recursive: true })
    const busiest = motionAll.map((m, i) => ({ ...m, i })).sort((a, b2) => b2.move - a.move).slice(0, 2)
    for (const st of busiest) {
      await b.goto(pathToFileURL(html).href)
      for (let k = 0; k < 100 && !(await b.eval('!!(window.__vat && window.__vat.ready)').catch(() => false)); k++) await sleep(100)
      const frames = []
      for (const fr of [0.05, 0.2, 0.35, 0.5, 0.7, 1]) {
        await b.eval(`window.__vat.frame(${st.i}, ${fr})`); await sleep(40)
        const name = `f-${st.id.replace(/[^\w-]/g, '_')}-${Math.round(fr * 100)}.png`
        writeFileSync(join(fdir, name), await b.screenshot()); frames.push({ name, fr })
      }
      const tileW = 466, tileH = Math.round(tileW * 900 / 1440)
      const page = join(fdir, `_film-${st.id}.html`)
      writeFileSync(page, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:8px;background:#fff;font:600 15px system-ui;display:grid;grid-template-columns:repeat(3,${tileW}px);gap:8px}figure{margin:0}figcaption{height:22px}img{width:${tileW}px;height:${tileH}px;border:1px solid #ccd;display:block}</style>` + frames.map(f => `<figure><figcaption>${st.id} · ${Math.round(f.fr * 100)}%</figcaption><img src="${pathToFileURL(join(fdir, f.name)).href}"></figure>`).join(''))
      await b.goto(pathToFileURL(page).href); await sleep(150)
      const out = `film-${st.id.replace(/[^\w-]/g, '_')}.png`
      writeFileSync(join(fdir, out), await b.screenshot({ x: 0, y: 0, width: 3 * tileW + 32, height: 2 * (tileH + 30) + 16 }))
      report.film = [...(report.film || []), join('qa-film', out)]
    }
  }
  for (const m of b.console) if (m.type === 'exception' || m.type === 'error') report.errors.push(`Browser console ${m.type}: ${m.text.split('\n')[0]}`)
} finally {
  await b.close()
}

writeFileSync(join(outDir, 'qa-report.json'), JSON.stringify(report, null, 2))
const i = report.info
if (i) console.log(`Lesson: ${i.title} — ${i.objects} objects; ${i.levels[1].stops} chapters, ${i.levels[2].stops} steps, ${i.levels[3].stops} micro stops; plays ${i.levels[3].seconds}s at 1×`)
if (report.warnings.length) { console.log(`\n⚠ ${report.warnings.length} warning(s):`); report.warnings.forEach(w => console.log(`  - ${w}`)) }
if (report.errors.length) {
  console.log(`\n✗ QA failed with ${report.errors.length} error(s):`)
  report.errors.slice(0, 25).forEach((e, k) => console.log(`${k + 1}. ${e}`))
  if (report.errors.length > 25) console.log(`… and ${report.errors.length - 25} more (fix the ones above first; see the report).`)
  console.log(`\nFull report: ${join(outDir, 'qa-report.json')}`)
  process.exit(1)
}
console.log(`\n✓ QA passed${report.sheets ? ` — ${report.sheets.length} contact sheet(s) (6 steps each) in ${join(outDir, 'qa-sheets')}` : shots ? ` — ${report.shots.length} screenshots in ${join(outDir, 'qa-shots')}` : ''}. Full report: ${join(outDir, 'qa-report.json')}`)
