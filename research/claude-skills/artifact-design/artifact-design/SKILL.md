---
name: artifact-design
description: Design guidance and fundamentals for Artifacts (published HTML pages). Load before writing any artifact, including a skill-instructed Markdown one. Markdown is never a shortcut past the design pass.
---

# Artifact design

## Page contract (read before the first publish)

- **Format**: author the page as `.html`. Publish `.md` only when a loaded skill explicitly asks for it. If the user shares a markdown document, build an HTML page from its content, preserving substance, rather than transcribing it one to one.
- **Skeleton**: the file is wrapped in a doctype/head/body skeleton at publish time, so write page content directly: no `<!DOCTYPE>`, `<html>`, `<head>` or `<body>` tags. Put your own `<title>` and `<style>` at the top. The skeleton's head carries only charset, viewport (`viewport-fit=cover`) and a small reset (light `color-scheme`, `:root` padded by the safe-area insets, zero body margin, 14px system font, `img{max-width:100%}`, `[hidden]{display:none!important}`). Keep the `:root` padding. Put `<meta name="claude:viewport-fit-sides" content="cover">` beside the `<title>` only together with both side paddings below.
- **Title**: a short noun phrase (two to four words), specific to the page, never a generic category label, never "Name: explainer". Use the user's own name for the thing when they have one. The explanation goes in the one-sentence `description` parameter. Keep the title stable across redeploys.
- **External resources (CSP-enforced)**: scripts load only from cdnjs.cloudflare.com (preferred), cdn.jsdelivr.net/npm/, unpkg.com, cdn.tailwindcss.com and code.jquery.com; stylesheets only from fonts.googleapis.com (font files from fonts.gstatic.com), each with a real fallback stack. Everything else is blocked silently: inline all other CSS and JS, and embed assets as data: URIs. Pin every library to an exact version at least two weeks old (e.g. `react/18.3.1/umd/react.production.min.js` on cdnjs), UMD builds, placed before the inline script that uses them. `<a download>` links are inert; never offer a file through a plain link. `mailto:`/`tel:` links are unreliable: show the address as selectable text. Mermaid renders natively (`<pre class="mermaid">`), do not load a library. `alert()`, `confirm()`, `prompt()` never show: build confirmations into the page.
- **Viewer frame limits**: `window.print()` does nothing (no Print/Save-as-PDF buttons). Forms are page UI only: handle `submit` with `preventDefault()`. Copy buttons work from a click handler with `navigator.clipboard.writeText`; catch rejection and fall back to selecting the text. Camera, microphone, location, motion and similar device APIs are refused unless a runtime capability grants them. Other sites cannot be embedded; link out with real `<a href>`. Web Workers work from your own files or blob URLs; service workers and WebRTC do not. Only a plain `#name` hash passes through; use ASCII letters, digits and hyphens, never `settings`, `sidebar`, `customize`, `upgrade`, `downloads` or `comment-*`.
- **Browser storage**: localStorage/sessionStorage/IndexedDB work per viewer only and can be empty or throw; wrap every access in try/catch and use only for per-viewer conveniences. State that must be shared, durable or read by Claude belongs in a runtime capability (see `artifact-capabilities`).
- **Size**: rendered page 16MB or smaller, data: URIs included.
- **Responsive**: must work at ~400px wide and never scroll horizontally. Side gutter at least 16px at every width: `padding-left: max(16px, env(safe-area-inset-left, 0px))` and `padding-right: max(16px, env(safe-area-inset-right, 0px))`, set once on `body` or one outer wrapper, with vertical padding as `padding-block`. Use relative units; let flex and grid wrap or stack; give children that hold text, code or tables `min-width: 0`; `max-width: 100%` on images; only tables, diagrams and code blocks may be wider, each in its own `overflow-x: auto` container. Fixed elements add `env(safe-area-inset-*)` to their padding or offsets; a sticky header uses `top: env(safe-area-inset-top, 0px)` with a fixed `body::before` painting the band above it.
- **Theme-aware**: define every color as a token on bare `:root` (light values), redefine in `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ...; color-scheme: dark } }` and again in `:root[data-theme="dark"] { ...; color-scheme: dark }`. `body` gets an explicit token background and color. No color has its only definition inside a media or `[data-theme]` block, and no component uses a literal color that reads in one theme only. A dark-first design mirrors the shape. A deliberately single-look design may drop the dark blocks but still sets background and every color explicitly.
- **Icon** (first publish only): one short generic word such as `chart`, `calendar`, `recipe`; never a brand or emoji. Omit on redeploys.

## Read the request first

Decide the treatment. A doc gets the same craft as a landing page; only the treatment differs. Utilitarian requests (a plan, memo, demo) still get real typographic hierarchy, considered spacing and a proper palette, without over-designing. Editorial requests (landing page, game, app or tool they'll keep or share) get a distinctive point of view. If unsure: a well-composed page is always acceptable; an over-designed visual identity sometimes isn't.

## Fundamentals for every artifact

- **Respect what exists.** Look for an existing design system first (CLAUDE.md, tokens, theme file, component styles). Precedence: the user's words, then the project's system, then your choices.
- **Ground it in the subject.** Define one concrete subject, its audience and the page's single job. Include at least one detail only this subject would have (real units, document conventions, terms of art). Use real content, never lorem ipsum.
- **Pair typefaces.** Google Fonts is the only font host allowed; link it directly with `display=swap` and declare a fallback stack. Running text near 65 characters wide. Set a type scale and keep to it; `text-wrap: balance` on headings; letter-spacing on uppercase labels.
- **Load libraries instead of inlining them**, only when the page really needs one; most pages don't.
- **Choose neutrals deliberately.** Greys with a slight hue bias toward the accent; pure white or near-black only when chosen.
- **Design both themes** with the token structure above. Give the second theme equal care; keep contrast legible and the accent working on both backgrounds.
- **Use layout for spacing.** Flex/grid with `gap`, not per-element margins. Use `font-variant-numeric: tabular-nums` where digits line up. Size a one-screen app with `height: 100%` on `html` and `body`, not `100vh`.
- **Make repeated elements consistent**: same edges, baselines and padding; let content set height; choose column counts the items fill; text that can outgrow its track wraps or scrolls.
- **Use card styling selectively.** Border, fill, radius and shadow mark separate objects; apply by role. Open with big-number tiles only when those figures are the point.
- **Draw charts to scale.** One scale for marks, ticks and labels; label only values the chart reaches; color chart text from theme tokens; leave room in the SVG viewBox for outer labels and give every shape an explicit fill. (For charts, also load the `dataviz` skill.)
- **Make the page complete at rest.** Everything meant to be read is visible on load; no content left at `opacity: 0` waiting for an observer; size a hero to its content, not `100vh`. A tool opens in a realistic working state with clearly marked example data. For `db`-backed pages, design an empty state, then seed through `ArtifactData` after the first publish.
- **Avoid AI-generated design clichés** when no direction is given: warm cream (#F4F1EA) + serif display + terracotta accent; near-black with a lone acid-green or vermilion pop; broadsheet hairline rules with dense columns; purple-to-blue gradient hero on white; Inter or Space Grotesk as the "safe" face; emoji as section markers; everything centered; `rounded-lg` everywhere; accent rail on rounded cards. If the user specifies a direction, follow it exactly.
- **Build cleanly.** No overlaps or silent font fallbacks; close every non-void element; double-quote attributes; visible keyboard focus; respect `prefers-reduced-motion`; stable `id` on every form control; Canvas/WebGL for generative graphics instead of long SVG paths.
- **CSS specificity.** Structure the cascade so classes don't cancel each other's spacing.
- **Copy.** Write from the user's side of the screen; active voice; controls say exactly what happens; errors say what went wrong and how to fix it; specific over clever. Avoid em-dash asides, "not X, but Y" framing, colon-then-reveal sentences, scare quotes and stock phrases.
- **Name the page like a product**, not a caption (see Title above).
- **Structure is information.** Numbering, eyebrows, dividers and labels must encode something true; use numbers only for real sequences.
- **UIs (dashboards, tools)** are scanned and operated: summary before detail; encode state in form (pill, chip, severity stripe); semantic good/warning/critical colors are separate from the accent; sparklines and charts get the same care as type; interactive elements look interactive.

## Process

Start from what the viewer should be able to do. If the page should take input, keep shared state, show live data or ask Claude something, load `artifact-capabilities` first.

Before writing the page, settle a compact design plan and put it in the file as the `:root` block at the top of `<style>`: **Color** (4-6 named tokens), **Type** (display face used with restraint, a body face, a utility face if needed), **Layout** (one-line comment above the tokens). Build everything from those tokens. The plan is working material: say at most one plain sentence about the direction, with no hex values or font names.

**Write, check once, publish.** You may look at the rendered page once (one preview or screenshot where the session offers it), make one pass of edits, then publish. Pages charting real numbers take the look and spend it on the chart. Pages declaring `capabilities` take the look and then one functional pass after the first publish (read back what the page stores). No loops: if the user reports something visibly broken, fix it and republish once.

**Open viewers** get published changes automatically. For pages with state a viewer would miss, register `window.claude?.hot?.snapshot(...)` and boot through `window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {})`.

## When the request is editorial

The client has already rejected templated proposals and wants a distinctive point of view. Make opinionated decisions and take one real aesthetic risk where it serves the work. Review the design plan against the subject; if any part reads like the default for any similar page, revise it before building.

- The hero states the thesis: open with the most characteristic thing in the subject's world.
- Typography sets the personality: pair display and body faces deliberately, avoid the families you'd use on any project, set a clear scale and make the type treatment itself memorable.
- Use motion deliberately: one orchestrated moment beats scattered effects; sometimes less is more.
- Match complexity to the vision: maximalist needs elaborate execution, minimal needs precision.
- Put boldness in one place and keep everything around it quiet. If the accent clashes with the background, shift it toward an analogous hue or desaturate it.
