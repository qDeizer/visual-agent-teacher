/**
 * Visual Agent Teacher (VAT) — lesson API. DRAFT v0 for the S5a "paper test".
 *
 * You write ONE file, `lesson.js`, containing `export default defineLesson({ ... })`.
 * VAT is a framework: the engine calls your functions (once at load, again on Back/jump,
 * again when inputs change). You never write HTML, CSS, DOM code, timers or animation loops.
 *
 * Execution model (important):
 *  - `model` is pure: same inputs → same output. No Math.random / Date / timers / fetch.
 *  - `scene` creates objects once. They persist for the whole lesson.
 *  - `script` runs SYNCHRONOUSLY. Every verb you call inside a step builder is appended to that
 *    step's timeline, in call order (sequential by default). Do not use async/await.
 *  - Positions are never screen pixels. Use regions, relative placement, or domain coordinates.
 */
export {};

declare global {
  function defineLesson<I extends Record<string, number>, T, R>(def: VAT.LessonDef<I, T, R>): VAT.LessonDef<I, T, R>;
  const vat: VAT.Toolkit;

  namespace VAT {
    // ─────────────────────────────── Lesson definition ───────────────────────────────

    interface LessonDef<I extends Record<string, number>, T, R> {
      meta: Meta;
      /** Every term a zero-knowledge learner may not know. Keys are term ids, used in [[id]] and as `role`. */
      glossary: Record<string, GlossaryEntry>;
      /** Tweakable inputs: example values and allowed ranges. Used for tinkering and practice. */
      inputs?: { [K in keyof I]: InputSpec };
      /** Pure computation of the concept. Every number/state shown on screen must come from here. */
      model(inputs: I, t: TraceBuilder): T;
      /** Independent verification. At least one `known` case taken from an external source. */
      checks: Checks<I>;
      /** Build the stage once. Return handles you need in `script`. */
      scene(stage: Stage, data: T, inputs: I): R;
      /** The lesson itself: chapters → steps → micro steps, with narration and choreography. */
      script(lesson: LessonBuilder, refs: R, data: T, inputs: I): void;
      /** Optional exercise: the learner solves the same problem with new values. */
      practice?: Practice<I>;
    }

    interface Meta {
      title: string;
      /** Language of every learner-facing string, e.g. 'tr' or 'en'. */
      lang: string;
      /** One sentence: what the learner will be able to do after this lesson. */
      goal: string;
    }

    interface GlossaryEntry {
      /** Display form in the lesson language, e.g. 'ağırlık'. */
      term: string;
      /** Plain definition for a zero-knowledge learner (1–2 sentences). */
      short: string;
      /** Optional longer explanation or example. */
      long?: string;
      /** Math symbol in TeX, e.g. 'w_{ij}'. */
      symbol?: string;
      /** true → this term gets its own concept colour. Objects/slots with role = this key use it. Max 5 per lesson. */
      concept?: boolean;
      /** true → appears on the end-of-lesson memory card. */
      memorize?: boolean;
    }

    interface InputSpec {
      default: number;
      min: number;
      max: number;
      step: number;
      /** Term id the input belongs to (shows definition on hover). */
      term?: string;
    }

    // ─────────────────────────────── Model & trace ───────────────────────────────

    /** A computed number that remembers where it came from. */
    interface Val {
      readonly id: string;
      /** Exact value (use for computation). */
      readonly value: number;
      /** Ids of the values this one was computed from. */
      readonly sources: readonly string[];
      /** Display string with engine rounding rules (display only; never feed back into math). */
      fmt(dp?: number): string;
    }

    /** A recorded event for non-numeric processes (protocol messages, cell phases, state changes). */
    interface TraceEvent {
      readonly id: string;
      readonly index: number;
      readonly payload: Record<string, unknown>;
    }

    interface TraceBuilder {
      input(id: string, value: number): Val;
      const(id: string, value: number): Val;
      add(id: string, ...xs: Val[]): Val;
      sub(id: string, a: Val, b: Val): Val;
      mul(id: string, ...xs: Val[]): Val;
      div(id: string, a: Val, b: Val): Val;
      pow(id: string, base: Val, exponent: Val | number): Val;
      /** Any other function, e.g. t.fn('a1', 'sigmoid', z => 1 / (1 + Math.exp(-z)), z1) */
      fn(id: string, name: string, f: (...xs: number[]) => number, ...args: Val[]): Val;
      /** Record a non-numeric event, in order. */
      event(id: string, payload?: Record<string, unknown>): TraceEvent;
    }

    interface Checks<I> {
      /** Cases from an external source (textbook, lecture notes, RFC...). expect: trace id → value. */
      known: Array<{ source: string; inputs: Partial<I>; expect: Record<string, number | string>; tolerance?: number }>;
      /** Rules that must hold for ANY valid inputs. Call fail(msg) on violation. `data` is your model output. */
      invariants?(data: any, inputs: I, fail: (msg: string) => void): void;
    }

    interface Practice<I> {
      /** New inputs for an exercise. Use only `rand` (seeded). */
      generate(rand: Rand): Partial<I>;
      /** Values the learner computes; answers are checked against the trace id. */
      tasks: Array<{ id: string; prompt: string; answer: string; tolerance?: number }>;
    }

    interface Rand {
      float(min: number, max: number, step?: number): number;
      int(min: number, max: number): number;
      pick<X>(xs: readonly X[]): X;
    }

    // ─────────────────────────────── Placement & options ───────────────────────────────

    type Region = 'main' | 'left' | 'right' | 'top' | 'bottom' | 'center' | 'inset';
    type Side = 'top' | 'right' | 'bottom' | 'left';
    type Gap = 'xs' | 'sm' | 'md' | 'lg';
    type Point = { x: number; y: number };

    /** Where an object goes. Never screen pixels. */
    type Placement =
      | Region
      /** u, v in 0..1 inside the region (0,0 = top-left). */
      | { region: Region; u?: number; v?: number }
      | { near: Obj; side: Side; gap?: Gap }
      | { between: [Obj, Obj] }
      | { inside: Obj }
      /** Domain coordinates of a plot. */
      | { plot: Plot; x: number; y: number };

    /** How text/objects react to camera zoom. Defaults: shapes 'world', text 'damped', small labels 'screen'. */
    type SizeMode = 'world' | 'screen' | 'damped';
    /** Animation speed token, or seconds at 1× speed. The learner's speed control scales all of these. */
    type Speed = 'fast' | 'normal' | 'slow' | number;

    interface CommonOpts {
      id?: string;
      at?: Placement;
      /** Glossary key → concept colour + hover definition. */
      role?: string;
      tags?: string[];
      /** Created hidden; appears when a verb shows it. */
      hidden?: boolean;
      textSize?: SizeMode;
      /** Semantic zoom: only visible when camera zoom ≥ this value (1 = overview). */
      minZoom?: number;
    }

    interface VerbOpts {
      speed?: Speed;
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
      /** Custom SVG drawn once (centred at 0,0, roughly 100 units wide). Give parts class="name" to address them with obj.part('name'). */
      shape(svg: string, opts?: CommonOpts & { size?: number; kind?: string }): Obj;
      dot(opts?: CommonOpts & { label?: string }): Obj;
      box(text: string, opts?: CommonOpts): Obj;
      /** Text label. Markup allowed: [[termId]], {{valId}}, **bold**. */
      label(text: string, opts?: CommonOpts): Obj;
      /** A value chip showing a number/string (counts up/down when changed). */
      value(v: Val | number | string, opts?: CommonOpts): Obj;
      arrow(from: Obj, to: Obj, opts?: CommonOpts & { label?: string; curve?: number; dashed?: boolean }): Obj;
      /** Live count shown on stage, e.g. stage.counter('Kanser hücresi', () => stage.select('.cancer').count) */
      counter(label: string, count: () => number, opts?: CommonOpts): Obj;

      // components
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

      // selection — CSS-like: 'cell' (kind), '.cancer' (tag), '#h1' (id), 'cell.cancer'
      select(query: string): Sel;

      // escape hatches
      /** Bring an element you drew yourself (e.g. with D3) into VAT: verbs, selection, camera work on it. */
      adopt(el: SVGElement, opts?: CommonOpts & { kind?: string }): Obj;
      /** Isolated panel with your own rendering (canvas, etc.). Without render(), Back is disabled in that part. */
      panel(adapter: PanelAdapter, opts?: CommonOpts): Obj;
    }

    // ─────────────────────────────── Objects ───────────────────────────────

    /** A persistent object. Verbs append animations to the current step and return the object for chaining. */
    interface Obj {
      readonly id: string;
      readonly kind: string;
      readonly tags: readonly string[];
      readonly generation: number;
      readonly parent: Obj | null;
      readonly exists: boolean;

      /** A named part of a custom shape (class="name" in its SVG). */
      part(name: string): Obj;

      // appearance
      show(o?: VerbOpts): this;
      hide(o?: VerbOpts): this;
      dim(o?: VerbOpts): this;
      undim(o?: VerbOpts): this;
      highlight(o?: VerbOpts & { style?: 'ring' | 'fill' | 'underline' }): this;
      unhighlight(o?: VerbOpts): this;
      /** Short scale pulse to draw the eye. */
      pulse(o?: VerbOpts): this;
      recolor(role: string, o?: VerbOpts): this;
      /** Removes the object from the lesson from now on (it stays reachable for Back). */
      remove(o?: VerbOpts): this;

      // motion (this is the OBJECT moving/growing — use stage.camera to change the view)
      moveTo(place: Placement, o?: VerbOpts): this;
      /** Move along another object's path (e.g. a plot curve) or a function of t∈[0,1] returning domain/world points. */
      along(path: Obj | ((t: number) => Point), o?: VerbOpts & { plot?: Plot }): this;
      scaleTo(k: number, o?: VerbOpts): this;

      // values & text
      setValue(v: Val | number | string, o?: VerbOpts): this;
      setText(text: string, o?: VerbOpts): this;

      // continuous effects — a state that stays on until turned off; other verbs keep working meanwhile
      glow(on?: boolean): this;
      jitter(on?: boolean, strength?: 'low' | 'mid' | 'high'): this;
      breathe(on?: boolean): this;
      /** Moving dashes along a line/arrow (data or signal flowing). */
      flow(on?: boolean): this;

      // logical state
      tag(name: string): this;
      untag(name: string): this;

      // life
      /** Divides into two. The original object lives on as the first child; tags are inherited. */
      split(o?: VerbOpts & { dir?: 'horizontal' | 'vertical' | 'free' | number }): [Obj, Obj];
      clone(o?: VerbOpts & { at?: Placement }): Obj;

      /** Custom verbs registered with vat.defineVerb. */
      do(verb: string, opts?: Record<string, unknown>): this;
    }

    interface Sel {
      readonly count: number;
      tagged(tag: string): Sel;
      except(...xs: Array<Obj | string>): Sel;
      where(f: (o: Obj) => boolean): Sel;
      generation(n: number): Sel;
      descendantsOf(o: Obj): Sel;
      first(): Obj;
      last(): Obj;
      at(i: number): Obj;
      /** Deterministic sample. */
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
      glow(on?: boolean): Sel;
      jitter(on?: boolean, strength?: 'low' | 'mid' | 'high'): Sel;
      breathe(on?: boolean): Sel;
      flow(on?: boolean): Sel;
      tag(name: string): Sel;
      untag(name: string): Sel;
      /** Every object splits; returns all resulting objects. Free space is chosen automatically for dir 'free'. */
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
      /** When weight labels are visible. Default 'on-focus'. */
      weights?: 'always' | 'on-focus' | 'never';
      /** Draw a bias input per neuron. Default true. */
      bias?: boolean;
    }
    interface NeuralNet extends Graph {
      layer(i: number): Sel;
      /** The value chip inside a node (input value, activation). */
      nodeValue(id: string): Obj;
      /** The weight label on an edge. */
      weight(from: string, to: string): Obj;
      /** The bias label of a neuron. */
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
      /** A movable highlighted window, e.g. a convolution kernel. */
      window(r: number, c: number, h: number, w: number, opts?: CommonOpts): GridWindow;
    }
    interface GridWindow extends Obj {
      slideTo(r: number, c: number, o?: VerbOpts): this;
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
      /** draggable.input: dragging this point changes that lesson input (tinkering). */
      point(p: Point, opts?: CommonOpts & { label?: string; draggable?: { inputX?: string; inputY?: string } }): Obj;
      points(ps: Array<Point & { id?: string; role?: string; tags?: string[]; label?: string }>, opts?: CommonOpts): Sel;
      curve(f: (x: number) => number, opts?: CommonOpts & { domain?: [number, number] }): Obj;
      polyline(ps: Point[], opts?: CommonOpts): Obj;
      segment(a: Point, b: Point, opts?: CommonOpts): Obj;
      /** Circle with radius in domain units. */
      circle(center: Point, r: number, opts?: CommonOpts): Obj;
      /** Colour regions: f returns a role (glossary key) or null, e.g. classifier decision regions. */
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
      /** Adds a message arrow below the previous one. Created hidden when called in scene; appears when called in a step. */
      message(from: string, to: string, label: string, opts?: CommonOpts & { detail?: string }): Obj;
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
      /** Move the 'current state' marker along the transition. */
      goTo(id: string, o?: VerbOpts): this;
    }

    interface CodeViewSpec extends CommonOpts {
      code: string;
      lang: string;
    }
    interface CodeView extends Obj {
      line(n: number): Obj;
      lines(from: number, to: number): Sel;
      /** Move the execution cursor to line n. */
      runTo(n: number, o?: VerbOpts): this;
      /** Show/update a watched variable next to the code. */
      watch(name: string, v: Val | number | string): this;
    }

    interface Container extends Obj {
      add(...objs: Obj[]): this;
    }

    // ─────────────────────────────── Camera ───────────────────────────────

    /** The view onto the stage. Moving the camera never changes objects. */
    interface Camera {
      focus(target: Obj | Sel, o?: VerbOpts & { padding?: Gap }): void;
      frame(target: Obj | Sel | Region, o?: VerbOpts): void;
      /** Keep the target in view while it moves, until the end of the current step. */
      follow(target: Obj): void;
      reset(o?: VerbOpts): void;
      /** Picture-in-picture close-up of the target, keeping the overview visible. */
      magnify(target: Obj | Sel, o?: { corner?: 'tl' | 'tr' | 'bl' | 'br' }): Obj;
    }

    // ─────────────────────────────── Script ───────────────────────────────

    type Level = 1 | 2 | 3;

    interface StepOpts {
      title?: string;
      /** 1 = overview, 2 = normal (default), 3 = micro. A step is its own stop when level ≤ learner's chosen detail. */
      level?: Level;
    }

    interface LessonBuilder {
      readonly stage: Stage;
      /** A top-level stage of the process. Chapter titles form the roadmap strip (the pipeline pattern). */
      chapter(id: string, title: string, build: (s: StepBuilder) => void): void;
      /** Add an item to the end-of-lesson memory card. */
      memorize(item: { title: string; formula?: string; words?: string; why?: string }): void;
    }

    interface StepBuilder {
      /** Narration for THIS step at its own level. Markup: [[termId]], {{valId}}, **bold**. Never ask the learner questions. */
      say(text: string): void;
      step(id: string, opts: StepOpts, build: (s: StepBuilder) => void): void;
      /** Everything called inside runs at the same time. */
      together(build: () => void): void;
      pause(beats?: number): void;
      /** Animation for this step when its children are folded (coarser detail). Default: children compressed. */
      summary(build: () => void): void;
      readonly formula: FormulaBar;
      /** Number journey: a value chip flies from an object (or a Val shown somewhere) to a formula slot or object. */
      fly(from: Obj | Val, to: Slot | Obj, o?: VerbOpts): void;
      /** Escape hatch: append any GSAP animation (vat.gsap) to this step. Speed/Back/skip still work. */
      add(anim: unknown): void;
    }

    interface FormulaBar {
      /** TeX with slots \slot{id}{tex}. words: the same formula in plain words (may use {{valId}}). */
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
      /** GSAP, for raw animations added with s.add(). */
      readonly gsap: any;
      fmt(n: number, dp?: number): string;
      defineVerb(name: string, impl: (target: Obj, opts: Record<string, unknown>) => void): void;
      defineComponent(name: string, build: (stage: Stage, spec: Record<string, unknown>) => Obj): void;
      extendComponent(base: string, name: string, extend: (instance: Obj, spec: Record<string, unknown>) => Obj): void;
    }
  }
}
