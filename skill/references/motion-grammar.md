# Motion grammar (read before writing the script)

A lab that only fades things in and out is a slide show. The learner must **watch the idea happen**. The engine already
makes every verb move well (pop-in with overshoot, lines that draw themselves, numbers that count, values that fly on an
arc and land with a bounce, cascades, colour tweens). Your job is the **choreography**: what transforms into what, in
which order.

## The seven rules

1. **One orchestrated moment per stop.** Each stop has one main movement (the thing the narration is about). Everything
   else supports it and starts slightly before or after it.
2. **Transform, don't replace.** The same quantity is the same object for the whole lesson. Move it, grow it
   (`obj.to({ height })`), recolour it, split it, merge it, count it (`setValue`). Never hide one thing and show another
   in its place.
3. **Every number comes from somewhere.** Source swells → the value flies (`s.fly`) → lands in the formula or the target
   → the result is born there (`formula.fill`, `value.setValue`) → it settles. No number appears out of nowhere.
4. **Build the scene as you speak.** An object is born on the beat its name is said. Do not create everything visible in
   `scene()`: create it hidden and `show()` it in the step that introduces it.
5. **No cuts.** If you need a second picture, move the first one aside (`moveTo`, `scaleTo`) or use the camera
   (`stage.camera.focus(...)` for a close-up, `camera.reset()` to come back). Never swap whole scenes with hide/show.
6. **Rhythm:** anticipation (0.2–0.3 s) → main action (0.6–1.2 s) → settle and result (0.3–0.5 s) → breath. The engine
   overlaps consecutive actions slightly; use `s.together` only for things that truly happen at once, and
   `{ stagger }` on selections for cascades.
7. **The result after its cause.** Wrap the result in narration with `‹…›`: it appears when the stop's animation has
   finished, so the text never announces what the learner has not seen yet.

## Verbs that make motion (prefer these)

| Want | Write |
|---|---|
| something is born | `obj.show()` (pops in; lines/arrows/curves draw themselves) |
| a quantity grows/shrinks | `bar.to({ y: -h, height: h })`, `circle.to({ r })`, `obj.scaleTo(k)` |
| a shape changes form | `path.to({ d: newD })` (same command structure morphs) |
| a number changes | `chip.setValue(val)` (counts) |
| a value goes somewhere | `s.fly(source, s.formula.slot('x'))`, `s.fly(val, targetChip)` |
| an object travels | `obj.moveTo({ x, y })`, `obj.along(curve)`, `obj.along(t => ({ x, y }), { plot })` |
| a group appears | `sel.show({ stagger: 'fast' })` (cascade) |
| one becomes two / many | `obj.split()`, `sel.split({ dir: 'free' })` |
| category / state change | `obj.recolor(role)` (colour tween), `obj.tag('x')` |
| look closer | `stage.camera.focus(obj)` … `stage.camera.reset()` |
| something is active | `edge.flow()`, `obj.glow()` (turn off afterwards) |
| attention | `obj.pulse()`, `highlight()` — supporting only, never the main action |

`dim()` / `highlight()` / `hide()` are supporting moves. **A stop made only of them is a slide** (QA warns).

## Anti-patterns (QA or review will flag them)

- a stop where things only fade in/out; three or more unrelated movements at the same time
- text on top of text; a result shown before the movement that produces it
- a value that pops up without a source; an object "teleporting" (hide here, show there)
- empty boxes or placeholders left on screen; everything visible from the first stop

## Visual design is yours

Components (`neuralNet`, `plot`, `table`, `graph`, …) are **starting points**, not the only way. If the topic needs a
different picture (hexagonal cells, a water tank, a pipeline of machines, a pizza cut in slices), draw it with
`stage.shape(svg, { kind })` at world coordinates `{ x, y }` (x 0–1600, y 0–770) and animate it with the verbs above.
Encode meaning visually (size ∝ value, thickness ∝ weight, colour = concept). Keep at most ~5 labelled things in view.

## Plan each stop before coding

Write this table in your plan (one row per stop):

| stop | main movement (verb + object) | result that is born | narration (‹result›) |
|---|---|---|---|
