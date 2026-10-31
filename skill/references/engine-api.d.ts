/**
 * Visual Agent Teacher (VAT) — lesson API v0.1.
 *
 * You write ONE file, `lesson.js`: `export default defineLesson({ ... })`. VAT is a framework: the engine calls
 * your functions (at load, again when the learner changes inputs). You never write HTML, CSS, DOM code or timers.
 *
 * EXECUTION RULES
 *  - `model` is pure and deterministic. Every number shown on screen comes from it (or from inputs).
 *  - `scene` runs once and creates the starting objects. Objects persist for the whole lesson.
 *  - `script` runs SYNCHRONOUSLY. Each verb called inside a chapter/step build function is appended to that step's
 *    timeline in call order (one after another). Use s.together(() => { ... }) for simultaneous actions.
 *    No async/await, no timers, no Math.random/Date.
 *  - Positions are never screen pixels: use regions, { region, u, v }, { near, side }, { between }, { inside },
 *    or plot coordinates { plot, x, y }.
 *  - Unknown members throw a clear error ("Obj has no member 'bol'. Did you mean 'split'?").
 *
 * STOPS AND DETAIL LEVELS
 *  - The learner picks detail 1 (overview), 2 (normal), 3 (micro). A chapter is always a stop. A step is a stop when
 *    its level ≤ chosen detail; otherwise it is folded into the stop before it (played faster, its narration hidden).
 *  - Every chapter/step MUST have its own s.say(...) written for its level (a parent's text is a summary of its
 *    children, not a copy). Build fails otherwise.
 *  - Put a step's own actions BEFORE its child steps. Actions written after a child step belong to the previous stop.
 *  - s.summary(() => {...}): what a parent shows when ALL its children are folded; the children's effects are then
 *    applied instantly after it, so the end state is always the same at every detail level.
 */
export {};

declare global {
  function defineLesson<I extends Record<string, number>, T, R>(def: VAT.LessonDef<I, T, R>): VAT.LessonDef<I, T, R>;
  const vat: VAT.Toolkit;

  namespace VAT {
    // ─────────────────────────────── Lesson definition ───────────────────────────────

    interface LessonDef<I extends Record<string, number>, T, R> {
      meta: Meta;
      /** Every term a zero-knowledge learner may not know. Keys are term ids: used in [[id]] and as `role`. */
      glossary: Record<string, GlossaryEntry>;
      /** Tweakable inputs (example values + allowed range). The learner can change them (Tinker drawer, draggable points). */
      inputs?: { [K in keyof I]: InputSpec };
      /** Pure computation of the concept. Build numbers with `t` so each value knows its sources. Return what scene/script need
       *  (Vals, events, plain data, and pure helper functions such as curves are all fine). */
      model(inputs: I, t: TraceBuilder): T;
      /** Independent verification. Build fails when a check fails. */
      checks: Checks<I>;
      /** Create the starting objects once; return handles for `script`. */
      scene(stage: Stage, data: T, inputs: I): R;
      /** The lesson: chapters → steps → micro steps, with narration and choreography. */
      script(lesson: LessonBuilder, refs: R, data: T, inputs: I): void;
      /** Optional exercise: the same problem with new values; the learner types answers. */
      practice?: Practice<I>;
    }

    interface Meta {
      title: string;
      /** Language of every learner-facing string, e.g. 'tr' or 'en'. Numbers use its decimal separator. */
      lang: string;
      /** One sentence: what the learner can do after the lesson. */
      goal: string;
    }

    interface GlossaryEntry {
      /** Display form in the lesson language, e.g. 'ağırlık'. */
      term: string;
      /** Plain definition for a zero-knowledge learner (1–2 sentences). Shown on hover. */
      short: string;
      long?: string;
      /** Symbol in TeX, e.g. 'w_{ij}'. */
      symbol?: string;
      /** true → gets its own concept colour (max ~6). Objects/slots with role = this key use it. */
      concept?: boolean;
      /** true → listed on the "Memorise" card. */
      memorize?: boolean;
    }

    interface InputSpec {
      default: number;
      min: number;
      max: number;
      step: number;
      /** Glossary key naming this input in the UI. */
      term?: string;
    }

    // ─────────────────────────────── Model & trace ───────────────────────────────

    /** A number that remembers where it came from. Display with {{id}} in text or pass the Val to verbs. */
    interface Val {
      readonly id: string;
      /** Exact value (use for computation). */
      readonly value: number;
      readonly sources: readonly string[];
      /** Display string (lesson-language rounding). Display only — never feed back into math. */
      fmt(dp?: number): string;
    }

    interface TraceEvent {
      readonly id: string;
      readonly index: number;
      readonly payload: Record<string, unknown>;
    }

    /** All ids must be unique ('phase1', 'phase2' …, or 'z' + i in loops). */
    interface TraceBuilder {
      input(id: string, value: number): Val;
      const(id: string, value: number): Val;
      add(id: string, ...xs: Val[]): Val;
      sub(id: string, a: Val, b: Val): Val;
      mul(id: string, ...xs: Val[]): Val;
      /** Throws on division by zero: handle that case explicitly. */
      div(id: string, a: Val, b: Val): Val;
      pow(id: string, base: Val, exponent: Val | number): Val;
      /** Weighted sum Σ xs[i]·ws[i]. */
      dot(id: string, xs: Val[], ws: Val[]): Val;
      /** Any other function: t.fn('a1', 'sigmoid', z => 1 / (1 + Math.exp(-z)), z1) */
      fn(id: string, name: string, f: (...xs: number[]) => number, ...args: Val[]): Val;
      /** Non-numeric event, in order (protocol message, cell phase, state change). Payload values may be numbers/strings. */
      event(id: string, payload?: Record<string, unknown>): TraceEvent;
    }

    interface Checks<I> {
      /** REQUIRED, ≥ 1 case from an external source (textbook example, lecture notes, RFC…). expect: trace id (or
       *  'eventId.field') → expected value. tolerance is absolute (default 1e-6). */
      known: Array<{ source: string; inputs: Partial<I>; expect: Record<string, number | string>; tolerance?: number }>;
      /** Rules that hold for ANY valid inputs; run on defaults, 40 random inputs and practice inputs. Call fail(msg). */
      invariants?(data: any, inputs: I, fail: (msg: string) => void): void;
    }

    interface Practice<I> {
      /** New inputs for an exercise. Use only `rand` (seeded). */
      generate(rand: Rand): Partial<I>;
      /** answer: a trace id. prompt: text (may use {{inputId}} / {{traceId}}) or a function of the inputs.
       *  tolerance: absolute (default 0.5% of the answer). */
      tasks: Array<{ id: string; prompt: string | ((inputs: I) => string); answer: string; tolerance?: number }>;
    }

    interface Rand {
      float(min: number, max: number, step?: number): number;
      int(min: number, max: number): number;
      pick<X>(xs: readonly X[]): X;
    }

    // ─────────────────────────────── Placement & options ───────────────────────────────

    /** Stage regions (world is 1600 × 770 units; the formula bar sits below it). */
    type Region = 'main' | 'center' | 'left' | 'right' | 'top' | 'bottom' | 'inset';
    type Side = 'top' | 'right' | 'bottom' | 'left';
    type Gap = 'xs' | 'sm' | 'md' | 'lg';
    type Point = { x: number; y: number };

    type Placement =
      | Region
      /** u, v in 0..1 inside the region (0,0 = top-left). */
      | { region: Region; u?: number; v?: number }
      | { near: Obj; side: Side; gap?: Gap }
      | { between: [Obj, Obj] }
      | { inside: Obj }
      | { plot: Plot; x: number; y: number };

    /** How an object reacts to camera zoom: 'world' grows fully, 'screen' keeps its size, 'damped' grows a little.
     *  Defaults: shapes/components 'world'; labels, values, boxes 'damped'. */
    type SizeMode = 'world' | 'screen' | 'damped';
    /** Speed token or seconds at 1×. The learner's speed slider scales everything. */
    type Speed = 'fast' | 'normal' | 'slow' | number;
    type TextSize = 'sm' | 'md' | 'lg' | 'xl';

    interface CommonOpts {
      /** Unique id (also selectable as '#id'). */
      id?: string;
      at?: Placement;
      /** Glossary key (colour + meaning) or one of 'neutral' | 'accent' | 'danger' | 'success' | 'warn'. */
      role?: string;
      tags?: string[];
      /** Created hidden; appears when a verb shows it. Objects created inside a step appear in that step automatically. */
      hidden?: boolean;
      textSize?: SizeMode;
      /** Semantic zoom: visible only when camera zoom ≥ this (1 = overview). */
      minZoom?: number;
    }
    interface TextOpts extends CommonOpts {
      size?: TextSize;
      bold?: boolean;
      /** Wrap width in world units (default 520 for labels, 380 for boxes). */
      maxWidth?: number;
    }

    interface VerbOpts {
      speed?: Speed;
      /** Wait this long before the verb (same units as speed). */
      delay?: Speed;
    }
    interface SelVerbOpts extends VerbOpts {
      /** Start each object a little after the previous one. */
      stagger?: Speed;
    }

    // ─────────────────────────────── Stage ───────────────────────────────

    interface Stage {
      readonly camera: Camera;

      // primitives
      /** Custom SVG drawn once, centred on (0,0), about 100 units wide (scaled to `size`). Elements without fill/stroke use the
       *  role colour. Give parts class="name" to address them with obj.part('name'). `kind` names the type for selection
       *  (e.g. 'cell'); built-in kind names are reserved. */
      shape(svg: string, opts?: CommonOpts & { size?: number; kind?: string }): Obj;
      dot(opts?: CommonOpts & { label?: string }): Obj;
      /** Rounded box with text (markup allowed). */
      box(text: string, opts?: TextOpts): Obj;
      /** Text. Markup: [[termId]], [[termId|shown text]], {{valId}}, {{valId:2}}, {{valId:int}}, {{valId:pct}}, **bold**. */
      label(text: string, opts?: TextOpts): Obj;
      /** Value chip (number or string). Its width follows its text. */
      value(v: Val | number | string, opts?: TextOpts): Obj;
      /** Arrow between the CURRENT positions of two objects (create it after moving them). */
      arrow(from: Obj, to: Obj, opts?: CommonOpts & { label?: string; curve?: number; dashed?: boolean }): Obj;
      /** Live count, updated whenever tags/existence change: stage.counter('Kanser', () => stage.select('.cancer').count) */
      counter(label: string, count: () => number, opts?: TextOpts): Obj;

      // components (each fills its region; parts are objects too)
      graph(spec: GraphSpec): Graph;
      neuralNet(spec: NeuralNetSpec): NeuralNet;
      grid(spec: GridSpec): Grid;
      table(spec: TableSpec): Table;
      plot(spec: PlotSpec): Plot;
      numberLine(spec: NumberLineSpec): NumberLine;
      sequence(spec: SequenceSpec): Sequence;
      stateMachine(spec: StateMachineSpec): StateMachine;
      codeView(spec: CodeViewSpec): CodeView;
      container(spec: CommonOpts & { title?: string }): Container;
      /** Components registered with vat.defineComponent / vat.extendComponent. */
      use<C = Obj>(name: string, spec: Record<string, unknown>): C;

      /** CSS-like selection over existing objects: 'cell' (kind), '.cancer' (tag), '#h1' (id), 'cell.cancer'.
       *  Built-in part kinds: table-cell, table-header, grid-cell, net-node, net-edge, net-weight, net-value, net-bias,
       *  graph-node, graph-edge, plot-point, plot-curve, seq-actor, seq-message, sm-state, code-line, … */
      select(query: string): Sel;
      /** Object by id. */
      get(id: string): Obj;

      // escape hatches
      /** Bring your own SVG element (e.g. drawn with D3 via document.createElementNS) into VAT. */
      adopt(el: SVGElement, opts?: CommonOpts & { kind?: string }): Obj;
      /** Isolated panel with your own rendering. render(stepId, data) is called at every stop. */
      panel(adapter: PanelAdapter, opts?: CommonOpts): Obj;
    }

    // ─────────────────────────────── Objects ───────────────────────────────

    /** A persistent object. Verbs append animations to the current step and return the object (chainable). */
    interface Obj {
      readonly id: string;
      readonly kind: string;
      readonly tags: readonly string[];
      readonly generation: number;
      readonly parent: Obj | null;
      readonly exists: boolean;

      part(name: string): Obj;

      show(o?: VerbOpts): this;
      hide(o?: VerbOpts): this;
      /** Fade into the background (focus is elsewhere). undim() restores. */
      dim(o?: VerbOpts): this;
      undim(o?: VerbOpts): this;
      /** Focus ring around the object. */
      highlight(o?: VerbOpts): this;
      unhighlight(o?: VerbOpts): this;
      pulse(o?: VerbOpts): this;
      recolor(role: string, o?: VerbOpts): this;
      /** Leaves the lesson from now on (Back brings it back). */
      remove(o?: VerbOpts): this;

      /** The object itself moves (use stage.camera to change the view instead). */
      moveTo(place: Placement, o?: VerbOpts): this;
      /** Move along a plot curve/line, an arrow, a sequence message, or a function of t∈[0,1] returning
       *  plot coordinates (with { plot }) or u,v in 0..1 of the 'main' region (without). */
      along(path: Obj | ((t: number) => Point), o?: VerbOpts & { plot?: Plot }): this;
      /** The object really grows/shrinks (an event in the topic), not a camera zoom. */
      scaleTo(k: number, o?: VerbOpts): this;

      /** For objects with text (labels, values, boxes, cells, node values, chips). */
      setValue(v: Val | number | string, o?: VerbOpts): this;
      setText(text: string, o?: VerbOpts): this;

      /** Continuous effects: stay on until turned off (glow(false)); other verbs keep working meanwhile. */
      glow(on?: boolean): this;
      jitter(on?: boolean, strength?: 'low' | 'mid' | 'high'): this;
      breathe(on?: boolean): this;
      /** Moving dashes along a line/arrow (signal flowing). */
      flow(on?: boolean): this;

      tag(name: string): this;
      untag(name: string): this;

      /** Divide in two without re-creating: the original lives on as the first child; tags, colour and effects are
       *  inherited. 'free' picks the emptiest direction and packs neighbours like a colony. */
      split(o?: VerbOpts & { dir?: 'horizontal' | 'vertical' | 'free' | number }): [Obj, Obj];
      clone(o?: VerbOpts & { at?: Placement }): Obj;
      /** Custom verb registered with vat.defineVerb. */
      do(verb: string, opts?: Record<string, unknown>): this;
    }

    interface Sel {
      readonly count: number;
      tagged(tag: string): Sel;
      /** Exclude objects, ids or selectors ('.cancer'). */
      except(...xs: Array<Obj | string>): Sel;
      where(f: (o: Obj) => boolean): Sel;
      generation(n: number): Sel;
      descendantsOf(o: Obj): Sel;
      first(): Obj;
      last(): Obj;
      at(i: number): Obj;
      /** Deterministic, evenly spread pick of n objects. */
      sample(n: number): Sel;
      toArray(): Obj[];
      each(f: (o: Obj, i: number) => void): void;

      show(o?: SelVerbOpts): Sel;
      hide(o?: SelVerbOpts): Sel;
      dim(o?: SelVerbOpts): Sel;
      undim(o?: SelVerbOpts): Sel;
      highlight(o?: SelVerbOpts): Sel;
      unhighlight(o?: SelVerbOpts): Sel;
      pulse(o?: SelVerbOpts): Sel;
      recolor(role: string, o?: SelVerbOpts): Sel;
      remove(o?: SelVerbOpts): Sel;
      scaleTo(k: number): Sel;
      glow(on?: boolean): Sel;
      jitter(on?: boolean, strength?: 'low' | 'mid' | 'high'): Sel;
      breathe(on?: boolean): Sel;
      flow(on?: boolean): Sel;
      tag(name: string): Sel;
      untag(name: string): Sel;
      /** Every object splits; returns all resulting objects. */
      split(o?: SelVerbOpts & { dir?: 'horizontal' | 'vertical' | 'free' | number }): Sel;
      do(verb: string, opts?: Record<string, unknown>): Sel;
    }

    // ─────────────────────────────── Components ───────────────────────────────

    interface GraphSpec extends CommonOpts {
      nodes: Array<{ id: string; label?: string; role?: string; tags?: string[] }>;
      edges: Array<{ from: string; to: string; label?: string; role?: string }>;
      layout?: 'layered' | 'tree' | 'force' | 'circle';
      direction?: 'right' | 'down';
    }
    interface Graph extends Obj {
      node(id: string): Obj;
      edge(from: string, to: string): Obj;
      nodes(): Sel;
      edges(): Sel;
    }

    interface NeuralNetSpec extends CommonOpts {
      /** Neurons per layer, e.g. [2, 2, 1]. */
      layers: number[];
      /** Column titles, e.g. ['Girdi', 'Gizli', 'Çıktı']. */
      layerNames?: string[];
      /** Node ids per layer. Default: inputs x1.., one hidden layer h1.. (several: h1_1..), outputs y1.. */
      ids?: string[][];
      /** Initial numbers. weights keys: 'x1>h1'. activations are usually filled during the lesson (setValue / fly). */
      values?: { inputs?: Record<string, Val | number>; weights?: Record<string, Val | number>; biases?: Record<string, Val | number>; activations?: Record<string, Val | number> };
      /** Weight chips: 'always' visible, or 'on-focus' (hidden; show them with net.weight(a, b).show()). Default 'on-focus'. */
      weights?: 'always' | 'on-focus';
      /** Bias badge on every non-input neuron. Default true. */
      bias?: boolean;
    }
    interface NeuralNet extends Graph {
      layer(i: number): Sel;
      /** The number inside a neuron (input value / activation). */
      nodeValue(id: string): Obj;
      /** Weight chip on an edge. */
      weight(from: string, to: string): Obj;
      weights(): Sel;
      /** Bias badge of a neuron. */
      bias(id: string): Obj;
    }

    interface GridSpec extends CommonOpts {
      rows: number;
      cols: number;
      values?: Array<Array<number | string | Val>>;
      showValues?: boolean;
    }
    interface Grid extends Obj {
      cell(r: number, c: number): Obj;
      cells(): Sel;
      row(r: number): Sel;
      col(c: number): Sel;
      /** Movable highlighted window (e.g. a convolution kernel). */
      window(r: number, c: number, h: number, w: number, opts?: CommonOpts): GridWindow;
    }
    interface GridWindow extends Obj {
      slideTo(r: number, c: number, o?: VerbOpts): this;
      /** Cells currently under the window. */
      cells(): Sel;
    }

    interface TableSpec extends CommonOpts {
      columns: string[];
      rows: Array<Array<number | string | Val>>;
    }
    interface Table extends Obj {
      cell(r: number, c: number | string): Obj;
      row(r: number): Sel;
      col(c: number | string): Sel;
      header(c: number | string): Obj;
      /** Appends a row (appears in the current step). */
      addRow(values: Array<number | string | Val>, o?: VerbOpts): Sel;
    }

    interface Axis {
      label: string;
      domain: [number, number];
      term?: string;
    }
    interface PlotSpec extends CommonOpts {
      x: Axis;
      y: Axis;
      grid?: boolean;
    }
    interface Plot extends Obj {
      /** draggable: dragging the point changes these lesson inputs (the lesson recomputes). */
      point(p: Point, opts?: CommonOpts & { label?: string; draggable?: { inputX?: string; inputY?: string } }): Obj;
      points(ps: Array<Point & { id?: string; role?: string; tags?: string[]; label?: string }>, opts?: CommonOpts): Sel;
      /** f(x) = y; drawn (it draws itself in when created inside a step). */
      curve(f: (x: number) => number, opts?: CommonOpts & { domain?: [number, number]; dashed?: boolean }): Obj;
      polyline(ps: Point[], opts?: CommonOpts & { dashed?: boolean }): Obj;
      segment(a: Point, b: Point, opts?: CommonOpts & { dashed?: boolean }): Obj;
      /** Dashed circle; r in x-axis units. */
      circle(center: Point, r: number, opts?: CommonOpts): Obj;
      /** Coloured regions: f returns a role or null (e.g. classifier decision regions). */
      region(f: (x: number, y: number) => string | null, opts?: CommonOpts & { resolution?: number }): Obj;
    }

    interface NumberLineSpec extends CommonOpts {
      domain: [number, number];
      ticks?: number;
    }
    interface NumberLine extends Obj {
      mark(x: number, opts?: CommonOpts & { label?: string }): Obj;
      interval(a: number, b: number, opts?: CommonOpts & { label?: string }): Obj;
    }

    interface SequenceSpec extends CommonOpts {
      actors: Array<{ id: string; label: string; role?: string }>;
    }
    interface Sequence extends Obj {
      actor(id: string): Obj;
      /** Message arrow on the next row. In scene(): created hidden (show it later). In a step: appears with a draw-in. */
      message(from: string, to: string, label: string, opts?: CommonOpts & { detail?: string; dashed?: boolean }): Obj;
      note(actor: string, text: string, opts?: CommonOpts): Obj;
      messages(): Sel;
    }

    interface StateMachineSpec extends CommonOpts {
      states: Array<{ id: string; label: string; role?: string }>;
      transitions: Array<{ from: string; to: string; label?: string }>;
      initial: string;
    }
    interface StateMachine extends Obj {
      state(id: string): Obj;
      transition(from: string, to: string): Obj;
      /** Moves the "current state" marker (and pulses the transition). */
      goTo(id: string, o?: VerbOpts): this;
    }

    interface CodeViewSpec extends CommonOpts {
      code: string;
      lang: string;
    }
    interface CodeView extends Obj {
      line(n: number): Obj;
      lines(from: number, to: number): Sel;
      /** Execution cursor to line n (1-based) and highlight it. */
      runTo(n: number, o?: VerbOpts): this;
      /** Show/update a watched variable beside the code. */
      watch(name: string, v: Val | number | string): this;
    }

    interface Container extends Obj {
      add(...objs: Obj[]): this;
      members(): Sel;
    }

    // ─────────────────────────────── Camera ───────────────────────────────

    /** The view onto the stage. Moving the camera never changes objects. */
    interface Camera {
      focus(target: Obj | Sel, o?: VerbOpts & { padding?: Gap }): void;
      frame(target: Obj | Sel | Region, o?: VerbOpts): void;
      /** Keep the target centred while it moves, until the end of the current step. */
      follow(target: Obj): void;
      reset(o?: VerbOpts): void;
      /** Picture-in-picture close-up of the target, keeping the overview visible. */
      magnify(target: Obj | Sel, o?: { corner?: 'tl' | 'tr' | 'bl' | 'br'; hidden?: boolean }): Obj;
    }

    // ─────────────────────────────── Script ───────────────────────────────

    type Level = 1 | 2 | 3;

    interface StepOpts {
      title?: string;
      /** 1 = overview, 2 = normal (default), 3 = micro. Never lower than the parent's level. */
      level?: Level;
    }

    interface LessonBuilder {
      readonly stage: Stage;
      /** Top-level stage of the process (level 1, always a stop). Chapter titles form the roadmap strip. */
      chapter(id: string, title: string, build: (s: StepBuilder) => void): void;
      /** Add a card to "Memorise". Glossary entries with memorize: true are added automatically. */
      memorize(item: { title: string; formula?: string; words?: string; why?: string }): void;
    }

    interface StepBuilder {
      /** Narration for THIS step at its level. Same markup as labels. Never ask the learner questions. */
      say(text: string): void;
      step(id: string, opts: StepOpts, build: (s: StepBuilder) => void): void;
      /** Everything called inside starts at the same time. */
      together(build: () => void): void;
      /** A short beat (≈0.45 s per beat). */
      pause(beats?: number): void;
      /** Animation for this step when all its children are folded (coarser detail). */
      summary(build: () => void): void;
      readonly formula: FormulaBar;
      /** Number journey: a chip flies from an object (or the object showing a Val) to a formula slot (fills it) or to a
       *  value-like object (replaces its number: value chip, table/grid cell, net value/weight/bias). Onto other objects it
       *  just lands with a pulse. */
      fly(from: Obj | Val, to: Slot | Obj, o?: VerbOpts): void;
      /** Escape hatch: append a GSAP animation (vat.gsap.to(...)) to this step; speed/Back/skip still work. */
      add(anim: unknown): void;
    }

    interface FormulaBar {
      /** TeX subset with slots \slot{id}{tex}: ^{} _{} \frac{}{} \sqrt{} \text{} \cdot \times greek letters \sum …
       *  Write \cdot between factors. A slot whose id is a trace id reserves room for that value.
       *  words: the same formula in plain words (markup allowed). */
      show(tex: string, o?: { words?: string }): void;
      slot(id: string): Slot;
      fill(slotId: string, v: Val | number | string): void;
      highlight(...slotIds: string[]): void;
      clear(): void;
    }

    interface Slot {
      readonly slotId: string;
    }

    // ─────────────────────────────── Toolkit & extension ───────────────────────────────

    interface PanelAdapter {
      mount(el: HTMLElement): void;
      render(stepId: string, data: unknown): void;
      destroy?(): void;
    }

    interface Toolkit {
      /** GSAP, for raw animations added with s.add(). Browser only. */
      readonly gsap: any;
      readonly version: string;
      /** Format a number in the lesson language. */
      fmt(n: number, dp?: number): string;
      defineVerb(name: string, impl: (target: Obj, opts: Record<string, unknown>) => void): void;
      defineComponent(name: string, build: (stage: Stage, spec: Record<string, unknown>) => Obj): void;
      extendComponent(base: string, name: string, extend: (instance: any, spec: Record<string, unknown>) => any): void;
    }
  }
}
