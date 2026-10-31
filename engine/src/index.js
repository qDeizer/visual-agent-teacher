// Visual Agent Teacher runtime entry. Expects window.gsap and window.__VAT_LESSON__ (set by the lesson script).
import { VatError, fmt, rng } from './util.js'
import { Stage } from './stage.js'
import { BUILTIN_COMPONENTS } from './components.js'
import { Player } from './player.js'
import { qaApi } from './qa.js'
import { registerMotion } from './motion.js'

registerMotion(window.gsap)

for (const [name, f] of Object.entries(BUILTIN_COMPONENTS)) Stage.prototype[name] = function (spec) { return f(this, spec) }

const verbs = new Map()
const components = new Map()
let currentLang = 'en'

window.defineLesson = def => def
window.vat = {
  get gsap() { return window.gsap },
  version: '0.1.0',
  fmt: (n, dp) => fmt(n, dp, currentLang),
  defineVerb(name, impl) {
    if (typeof impl !== 'function') throw new VatError(`vat.defineVerb(name, (obj, opts) => { ... })`)
    verbs.set(name, impl)
  },
  defineComponent(name, build) {
    if (typeof build !== 'function') throw new VatError(`vat.defineComponent(name, (stage, spec) => obj)`)
    components.set(name, build)
  },
  extendComponent(base, name, extend) {
    components.set(name, (stage, spec) => {
      const inst = BUILTIN_COMPONENTS[base] ? stage[base](spec) : stage.use(base, spec)
      return extend(inst, spec) || inst
    })
  },
}

function boot() {
  const def = window.__VAT_LESSON__
  const app = document.getElementById('app')
  if (!def) { app.textContent = 'No lesson found (window.__VAT_LESSON__ is empty).'; return }
  currentLang = def.meta?.lang || 'en'
  const player = new Player(def, app, { verbs, components })
  window.__vat = qaApi(player)
  player.runChecks()
  player.build()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()
