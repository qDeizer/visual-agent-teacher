---
name: visual-agent-teacher
description: Turns any topic (machine learning, networks, physics, statistics, maths, biology, algorithms, system design…) into an interactive, visual, step-by-step learning lab — a single offline HTML file where a zero-knowledge learner watches a working model of the concept, controls detail level and speed, sees where every number comes from, and practises with new values. Use when the user asks to learn, teach, explain or visualise a topic step by step ("adım adım anlat", "öğret", "görselleştir", "simülasyon yap", "explain step by step", "interactive lesson").
---

# Visual Agent Teacher

You produce **one file: `lesson.js`**. A prebuilt engine turns it into the lab. You never write HTML, CSS, animation loops
or layout math: you describe *what* the learner sees and hears, step by step, with a small verb API.

## Read first (in this order)

1. `references/engine-guide.md` — how a lesson runs, teaching rules, stops/detail levels, placement, camera, workflow.
2. `references/example-lesson.js` — a complete small lesson (copy its structure, not its topic).
3. `references/engine-api.d.ts` — the exact API. Use only what it declares.

**Do not read `assets/engine.js`** (it is large, internal and costly to read). The three files above describe all the
behaviour you need. When unsure how something behaves, write it, run the build and QA, and read their messages — they
name the problem and the fix. Start writing `lesson.js` soon; iterate with the tools rather than studying internals.

## Non-negotiable rules

- What and why before how. Zero prior knowledge: every term in the glossary, introduced with `[[term]]` before use.
- One new idea per stop. Every chapter/step has its own `s.say(...)` for its detail level.
- Every number comes from `model` (trace values, `{{id}}` in text). Formulas in symbols **and** words.
  Show where numbers come from with `s.fly(...)`.
- **Never ask the learner questions inside the lesson**; questions only in `practice`.
- `checks.known` must use an external source's worked example. Fix the model if a check fails — never weaken a check.
- No `Math.random`, `Date`, timers, `async`, DOM, HTML/CSS, screen pixels.
- Lesson text in the user's language (`meta.lang`); API names stay English.
- Do not ask the user clarifying questions unless the topic is genuinely ambiguous; choose a good worked example yourself.

## Workflow

1. **Plan** (short, no code): the question; what/why; terms to pre-teach; process stages = chapters; worked-example inputs
   (prefer the user's course/textbook example when given); what moves on screen in each step; practice tasks.
2. **Write** `lesson.js` in the output folder (default: a new folder named after the topic in the current directory).
3. **Build**: `node <this skill's directory>/scripts/build.mjs <folder>/lesson.js` → fix all errors → repeat until it passes.
4. **Test**: `node <this skill's directory>/scripts/qa.mjs <folder>/lab.html --sheet` → fix all errors → repeat until it passes.
   Requires Node ≥ 22 and Edge or Chrome (set `VAT_BROWSER` to the browser path if it is not found).
5. **Look**: if you can view images, open the contact sheets in `<folder>/qa-sheets/` (each shows 6 steps). Fix anything
   cramped, cluttered, unclear or ugly; rebuild and re-test. **Image budget: view at most 8 images in the whole task**
   (some providers reject requests with more than 16 images). Prefer sheets over single shots in `qa-shots/`.
6. **Deliver**: give the user the path to `lab.html` and one sentence on how to use it (Continue/Back, detail levels,
   Tinker, Practice).

## When the API is not enough

Prefer the API. Otherwise use the escape hatches in the guide (§9): raw GSAP in a step, `stage.adopt`, `stage.panel`,
`vat.defineVerb/defineComponent/extendComponent` — and say why in a comment.
