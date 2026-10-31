# Writing a VAT lesson

You are writing an interactive, visual, step-by-step **learning lab** for a learner who knows **nothing** about the topic.
You write exactly one file, `lesson.js`. The API is defined in `engine-api.d.ts` — use only what is declared there.

## 1. How the framework runs your file

```
defineLesson({ meta, glossary, inputs, model, checks, scene, script, practice })
```

1. `model(inputs, t)` — pure computation of the concept. Build every number with the trace builder `t` so each value knows its sources. Non-numeric processes (protocols, cell phases) record `t.event(...)`.
2. `scene(stage, data, inputs)` — create objects **once**. Return handles (an object) that `script` needs.
3. `script(lesson, refs, data, inputs)` — chapters → steps → micro steps. Runs **synchronously**: each verb call is appended to the current step's timeline in order. No `async`/`await`, no timers.
4. The engine compiles everything into one timeline. Next/Back/speed/detail level/scrubbing all work automatically. When the learner tinkers with an input, the engine re-runs `model`, `scene` and `script` with the new values and keeps the learner's position — so **never hard-code a number** that comes from the model; use `{{valId}}` in text and `Val`s in verbs.

Forbidden in lesson code: `Math.random`, `Date`, `setTimeout`/`setInterval`, `fetch`, direct DOM access, screen-pixel positions.

## 2. Teaching rules (non-negotiable)

- **What and why first.** Before any calculation: what is this thing, why does it exist, what problem does it solve.
- **Zero knowledge.** Every term goes in `glossary` and is introduced (with `[[termId]]`) before it is used in a process. Every formula symbol has a glossary entry.
- **Explain phrases one by one.** If a sentence contains a new idea, that idea gets its own explanation.
- **Formulas twice:** symbols (`formula.show(tex)`) **and** plain words (`words:`), e.g. "input times its weight, plus the bias".
- **Show where numbers come from.** Use `s.fly(source, slot)` so a value visibly travels from where it lives on stage into the formula.
- **Never ask the learner questions in the lesson.** No "what do you predict?". The lesson never waits for input. Tinkering (dragging, changing inputs) is optional and always available; answers are only asked in `practice`.
- **Teach the pattern.** Chapters are the pipeline of the process (they appear as a roadmap strip). End with a short chapter that names the pattern.
- **Mark what must be memorised** (`glossary.memorize` or `lesson.memorize`).
- **Language:** all learner-facing text in `meta.lang`. Keep established foreign technical terms as used in that language's literature.

Recommended lesson arc (adapt to the topic): Question → What → Why → Parts → Process → Result → Pattern → Practice.

## 3. Steps and detail levels

```js
s.step('weighted-sum', { title: 'Ağırlıklı toplam', level: 1 }, s => {
  s.say('Nöron, girdilerini ağırlıklarıyla çarpıp toplar: {{z1}}.')     // overview narration
  s.step('mul-x1', { level: 3 }, s => {
    s.say('[[input]] {{x1}}, [[weight]] {{w11}} ile çarpılır.')          // micro narration
    s.fly(refs.net.nodeValue('x1'), s.formula.slot('x1'))
    s.fly(refs.net.weight('x1', 'h1'), s.formula.slot('w11'))
  })
})
```

- The learner picks detail 1 (overview), 2 (normal), 3 (micro). A step is its own stop when `level ≤ chosen`; otherwise it is folded into its parent.
- **Every step that can be a stop must have its own `say`** written for that level. A parent's narration is a summary, not a concatenation of its children.
- Optional `s.summary(() => {...})`: what the parent shows when its children are folded.
- Use `s.together(() => {...})` for simultaneous actions; otherwise calls run one after another.

## 4. Objects, verbs, effects

- Objects persist. Never re-create something that already exists — move it, change it, tag it.
- Verbs: `show hide dim undim highlight unhighlight pulse recolor remove moveTo along scaleTo setValue setText tag untag split clone`.
- Continuous effects stay on until turned off: `glow() jitter() breathe() flow()` / `glow(false)`.
- `split()` returns `[a, b]`; the original lives on as `a`; tags are inherited by both.
- Selection is CSS-like: `stage.select('cell')`, `stage.select('.cancer')`, `stage.select('#h1')`, then `.except() .tagged() .where() .generation() .first() .sample()`; verbs on a selection apply to all (`{ stagger: 'fast' }` to spread them).
- Custom shapes: `stage.shape('<ellipse rx="50" ry="28"/><circle class="nucleus" r="10"/>', {...})`, then `obj.part('nucleus')`.
- Colours: never write colours. Give objects a `role` = a glossary key with `concept: true` (max 5 concepts).

## 5. Placement

Never screen pixels. Use:
- regions: `'main' 'left' 'right' 'top' 'bottom' 'center' 'inset'` or `{ region: 'main', u: 0.3, v: 0.5 }` (0..1 inside region)
- relative: `{ near: obj, side: 'right', gap: 'md' }`, `{ between: [a, b] }`, `{ inside: container }`
- domain coordinates inside a plot: `{ plot: p, x: 2.5, y: 1 }` or `p.point({ x, y })`

Components lay themselves out internally (neuralNet, graph, grid, table, sequence...).

## 6. Camera

The camera changes the view, never the objects. `stage.camera.focus(obj)`, `.frame(selection)`, `.follow(obj)`, `.reset()`, `.magnify(obj)` (picture-in-picture). Call these inside steps like any verb. Use `minZoom` on details that should only appear when zoomed in.

## 7. Correctness

`checks.known` must contain at least one case from an external source (textbook example, lecture notes, RFC, standard) with its expected values. `checks.invariants` states rules that always hold (probabilities sum to 1, sequence numbers increase, …). The build fails if these fail.

## 8. Escape hatches

If the API cannot express something: `s.add(vat.gsap.to(...))` for a raw animation inside a step; `stage.adopt(svgElement)` to bring your own drawing into VAT; `stage.panel(adapter)` for fully custom rendering; `vat.defineVerb` / `vat.defineComponent` / `vat.extendComponent` for reusable additions. Prefer the API; use these only when needed, and say why in a comment.

## 9. A complete small example

```js
export default defineLesson({
  meta: { title: 'Ağırlıklı ortalama', lang: 'tr', goal: 'Notların ağırlıklı ortalamasını adım adım hesaplayabilmek.' },

  glossary: {
    grade:  { term: 'not', short: 'Bir sınavdan aldığın puan.', concept: true },
    weight: { term: 'ağırlık', short: 'Bir notun ortalamada ne kadar söz sahibi olduğu.', symbol: 'w', concept: true },
    wavg:   { term: 'ağırlıklı ortalama', short: 'Her notun ağırlığıyla çarpılıp toplanması, sonra ağırlıkların toplamına bölünmesi.', memorize: true },
  },

  inputs: {
    midterm: { default: 60, min: 0, max: 100, step: 5, term: 'grade' },
    final:   { default: 80, min: 0, max: 100, step: 5, term: 'grade' },
  },

  model(inp, t) {
    const m = t.input('midterm', inp.midterm), f = t.input('final', inp.final)
    const wm = t.const('wm', 0.4), wf = t.const('wf', 0.6)
    const pm = t.mul('pm', m, wm), pf = t.mul('pf', f, wf)
    const avg = t.add('avg', pm, pf)
    return { m, f, wm, wf, pm, pf, avg }
  },

  checks: {
    known: [{ source: 'Örnek: 60 vize, 80 final, %40/%60 → 72', inputs: { midterm: 60, final: 80 }, expect: { avg: 72 } }],
    invariants(d, inp, fail) {
      const lo = Math.min(inp.midterm, inp.final), hi = Math.max(inp.midterm, inp.final)
      if (d.avg.value < lo || d.avg.value > hi) fail('ortalama iki notun arasında olmalı')
    },
  },

  scene(stage, d) {
    const table = stage.table({ at: 'left', columns: ['Sınav', 'Not', 'Ağırlık'], rows: [['Vize', d.m, d.wm], ['Final', d.f, d.wf]] })
    const result = stage.value(d.avg, { at: 'right', role: 'grade', hidden: true })
    return { table, result }
  },

  script(lesson, { table, result }, d) {
    lesson.chapter('what', 'Ne?', s => {
      s.say('Her sınav ortalamaya eşit katılmaz. [[weight]] bir notun ne kadar söz sahibi olduğunu söyler.')
      table.col('Ağırlık').highlight()
    })
    lesson.chapter('compute', 'Hesap', s => {
      s.say('Her notu ağırlığıyla çarpıp topluyoruz: sonuç {{avg}}.')
      s.formula.show('\\slot{pm}{0.4 \\cdot \\text{vize}} + \\slot{pf}{0.6 \\cdot \\text{final}}', { words: 'vize çarpı ağırlığı, artı final çarpı ağırlığı' })
      s.step('mid', { level: 3 }, s => {
        s.say('Vize {{midterm}}, ağırlığı {{wm}} ile çarpılır: {{pm}}.')
        s.fly(table.cell(0, 'Not'), s.formula.slot('pm'))
      })
      s.step('fin', { level: 3 }, s => {
        s.say('Final {{final}}, ağırlığı {{wf}} ile çarpılır: {{pf}}.')
        s.fly(table.cell(1, 'Not'), s.formula.slot('pf'))
      })
      result.show().pulse()
    })
    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp: **çarp → topla**. Ağırlıklar toplamı 1 olduğu için bölmeye gerek kalmadı.')
    })
  },

  practice: {
    generate: r => ({ midterm: r.int(0, 20) * 5, final: r.int(0, 20) * 5 }),
    tasks: [{ id: 'p', prompt: 'Ağırlıklı ortalama kaç?', answer: 'avg', tolerance: 0.01 }],
  },
})
```
