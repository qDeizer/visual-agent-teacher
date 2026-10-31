# Writing a VAT lesson (guide v0.1)

You write **one file, `lesson.js`**. The engine (a framework) turns it into an interactive, offline learning lab.
The exact API is in `engine-api.d.ts`. A complete small lesson is in `example-lesson.js`. Use only what the API declares.

## 1. How your file runs

```js
export default defineLesson({ meta, glossary, inputs, model, checks, scene, script, practice })
```

| Part | Runs | You write |
|---|---|---|
| `model(inputs, t)` | at load and whenever the learner changes inputs | the concept's computation, pure. Build numbers with `t` (`t.input`, `t.mul`, `t.add`, `t.fn`, `t.dot`, `t.event`). |
| `checks` | at build time (+40 random inputs) | `known`: ≥ 1 case from an external source with expected values; `invariants`: rules that always hold |
| `scene(stage, data, inputs)` | once per build | the starting objects; return handles for `script` |
| `script(lesson, refs, data, inputs)` | once per build, **synchronously** | chapters → steps → micro steps: narration + verbs |

Each verb inside a step is appended to that step's timeline **in call order**. Use `s.together(() => {...})` for simultaneous
actions. The engine handles Next / Back / speed / detail level / scrubbing / tinkering automatically.

**Never hard-code a number that comes from the model.** Use `{{valId}}` in text and pass `Val`s to verbs. When the learner
changes an input, the whole lesson is recomputed and everything stays consistent.

Forbidden: `Math.random`, `Date`, timers, `async/await`, `fetch`, `import`, DOM access, HTML/CSS, screen-pixel positions.
The build rejects them with a message telling you what to use instead.

## 2. Teaching rules (non-negotiable)

1. **What and why before how.** First chapters: what is this, why does it exist, what problem does it solve.
2. **Zero knowledge.** Every term the learner might not know is in `glossary` and introduced with `[[termId]]` before the
   process uses it. Every formula symbol has a glossary entry. Plain words, short sentences.
3. **One new idea per stop.** If a sentence introduces two ideas, split it into two steps.
4. **Formulas twice:** symbols (`s.formula.show(tex)`) **and** words (`words:`). Write `\cdot` between factors.
5. **Show where every number comes from:** `s.fly(source, s.formula.slot(id))` or `s.fly(val, targetObject)`.
6. **Never ask the learner questions in the lesson** ("Tahminin nedir?" is forbidden). The lesson never waits for input.
   Tinkering is optional (inputs drawer, draggable plot points). Questions belong only in `practice`.
7. **Teach the pattern.** Chapter titles are the pipeline of the process (they form the roadmap strip). End with a short
   chapter that names the pattern in one sentence (e.g. "multiply → sum → squash").
8. **Mark what must be memorised** (`glossary.memorize: true` or `lesson.memorize({...})`).
9. **Language:** all learner text in `meta.lang`. Keep established technical terms as the field uses them.
   For suffixes write `[[term|shown text]]`, e.g. `[[cell|hücreden]]`.

Recommended arc (adapt to the topic): **Question → What → Why → Parts → Process (one chapter per stage) → Result → Pattern**,
plus `practice`.

## 3. Stops and detail levels

```js
lesson.chapter('hidden', 'Gizli katman', s => {              // chapter = level 1, always a stop
  s.say('Her gizli nöron girdilerini tartıp toplar, sonra sıkıştırır.')      // overview narration
  s.step('h1', { title: 'İlk nöron', level: 2 }, s => {
    s.say('İlk nöronun [[wsum]] değeri {{z1}}.')                             // normal narration
    s.step('h1-x1', { level: 3 }, s => {
      s.say('[[input]] {{x1}}, [[weight]] {{w11}} ile çarpılır: {{p11}}.')   // micro narration
      s.fly(net.nodeValue('x1'), s.formula.slot('x1'))
    })
  })
})
```

- The learner chooses detail 1 / 2 / 3. A step is its own stop when `level ≤ chosen`; otherwise it plays (faster) inside
  the stop before it, with that stop's narration.
- **Every chapter and step needs its own `s.say(...)`, written for its level.** A parent's text summarises its children.
- **Put a step's own actions before its child steps.** Actions after a child belong to the previous stop (build warns).
- `s.summary(() => {...})` = what a parent shows when all its children are folded (their effects are applied instantly after).

## 4. Objects, verbs, effects, selection

- **Objects persist.** Never re-create something that exists — move it, change it, tag it, dim it.
- Verbs: `show hide dim undim highlight unhighlight pulse recolor remove moveTo along scaleTo setValue setText tag untag split clone`.
- Continuous effects stay on until turned off: `glow() jitter('low'|'mid'|'high') breathe() flow()`, off with `glow(false)` …
- `split()` returns `[a, b]`; `a` is the original; tags, colour and effects are inherited; `dir: 'free'` packs a colony.
- Focus = **dim the rest + highlight the subject**: `net.nodes().except('h1').dim(); net.node('h1').highlight()`.
- Selection: `stage.select('cell')` (your kind), `'.cancer'` (tag), `'#h1'` (id), then `.except() .tagged() .where()
  .generation() .first() .sample()`; verbs on a selection apply to all, `{ stagger: 'fast' }` spreads them.
- Built-in part kinds are prefixed (`table-cell`, `net-node`, `seq-message` …); give your own shapes a `kind`.
- Custom shapes: `stage.shape('<ellipse rx="50" ry="30"/><circle class="nucleus" r="12"/>', { kind: 'cell', role: 'cell', size: 70 })`,
  then `obj.part('nucleus')`.
- Colours: never write colours. `role` = a glossary key with `concept: true` (concept = colour everywhere: the same
  colour for a concept in the scene, in labels and in formula slots). Also `neutral accent danger success warn`.

## 5. Placement and layout

- Regions (world 1600 × 770): `main` (all), `center`, `left`, `right`, `top`, `bottom`, `inset` (top-right corner).
  `{ region: 'main', u: 0.3, v: 0.5 }` with u, v in 0..1. Components (table, plot, net, graph, sequence …) **fill their
  region** — give two components two different regions.
- Relative: `{ near: obj, side: 'right', gap: 'md' }`, `{ between: [a, b] }`, `{ inside: container }`.
- Plot coordinates: `plot.point({ x, y })` or `{ plot, x, y }`.
- Keep ≤ ~5 labelled things in view at once. Use `dim`, `hide` and the camera to declutter.
- The formula bar lives below the stage; one formula at a time.

## 6. Camera

The camera changes the view, never the objects: `stage.camera.focus(obj | selection)`, `.frame('left' | selection)`,
`.follow(obj)` (until step end), `.reset()`, `.magnify(obj)` (picture-in-picture). Use it for close-ups (one neuron, one
cell), then `reset()`. Labels grow only a little when zoomed (`damped`); `minZoom` shows details only when zoomed in.

## 7. Correctness

- `checks.known`: values from a real external source (cite it). Not "2+2=4"-style self-checks only.
- `checks.invariants`: properties of the concept (probabilities sum to 1, sequence numbers increase, result within bounds…).
- The build runs both on defaults, 40 random inputs and the practice inputs, and fails on any violation.

## 8. Workflow (always)

1. Plan (no code): the question, what/why, terms to pre-teach, process stages (= chapters), the worked example inputs,
   what moves on screen in each step, practice tasks.
2. Write `lesson.js`.
3. `node <skill>/scripts/build.mjs lesson.js` → fix every error (messages say what to do) → repeat.
4. `node <skill>/scripts/qa.mjs lab.html --shots` → fix every error (overlaps, clipped text, play-vs-jump differences) → repeat.
5. Look at a few screenshots in `qa-shots/` if you can view images: is the subject obvious, is anything cramped, ugly or
   confusing? Fix and rebuild.
6. Deliver the path to `lab.html`.

## 9. Escape hatches (only when the API cannot express it)

`s.add(vat.gsap.to(el, {...}))` inside a step; `stage.adopt(svgElement)`; `stage.panel({ mount, render })`;
`vat.defineVerb` / `vat.defineComponent` / `vat.extendComponent`. Say why in a comment.
