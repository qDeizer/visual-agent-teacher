// Bundle engine/src into skill/assets (engine.js + shell.css + gsap.min.js).
import { build } from 'esbuild'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'skill', 'assets')
mkdirSync(out, { recursive: true })
await build({
  entryPoints: [join(root, 'engine', 'src', 'index.js')],
  bundle: true, format: 'iife', target: 'es2022', outfile: join(out, 'engine.js'),
  minify: false, legalComments: 'none', charset: 'utf8',
  banner: { js: '/* Visual Agent Teacher engine — do not edit; built from engine/src */' },
})
await build({
  entryPoints: [join(root, 'engine', 'src', 'node-entry.js')],
  bundle: true, format: 'esm', platform: 'node', target: 'node20', outfile: join(root, 'skill', 'scripts', 'lib', 'vat-node.mjs'),
  banner: { js: '/* Visual Agent Teacher — Node helpers for build.mjs; built from engine/src */' },
})
copyFileSync(join(root, 'engine', 'src', 'shell.css'), join(out, 'shell.css'))
copyFileSync(join(root, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), join(out, 'gsap.min.js'))
const size = f => (readFileSync(join(out, f)).length / 1024).toFixed(0) + ' KB'
writeFileSync(join(out, 'VERSION'), JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version + '\n')
console.log(`engine.js ${size('engine.js')}, shell.css ${size('shell.css')}, gsap.min.js ${size('gsap.min.js')}`)
