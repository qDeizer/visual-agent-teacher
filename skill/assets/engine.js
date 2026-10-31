/* Visual Agent Teacher engine — do not edit; built from engine/src */
(() => {
  // engine/src/util.js
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(seed = 1) {
    let s = seed >>> 0;
    const next = () => {
      s = s + 1831565813 >>> 0;
      let t = s;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    return {
      next,
      float(min, max, step) {
        const v = min + next() * (max - min);
        return step ? clamp(Math.round((v - min) / step) * step + min, min, max) : v;
      },
      int(min, max) {
        return Math.floor(min + next() * (max - min + 1));
      },
      pick(xs) {
        return xs[Math.floor(next() * xs.length)];
      }
    };
  }
  function fmt(n, dp, lang = "en") {
    if (typeof n === "string") return n;
    if (n === null || n === void 0) return "—";
    if (!Number.isFinite(n)) return String(n);
    let d = dp;
    if (d === void 0) {
      const a = Math.abs(n);
      d = Number.isInteger(n) ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    }
    let s = n.toFixed(d);
    if (dp === void 0 && s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
    if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
    const comma = /^(tr|de|fr|es|it|pt|ru|nl|pl|cs|sv|da|fi|nb|az)/i.test(lang);
    if (comma) s = s.replace(".", ",");
    return s.replace(/^-/, "−");
  }
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  var ALIASES = {
    bol: "split",
    bol2: "split",
    bolun: "split",
    tasi: "moveTo",
    tasi2: "moveTo",
    tasimak: "moveTo",
    move: "moveTo",
    soldur: "dim",
    goster: "show",
    gizle: "hide",
    parlat: "glow",
    titre: "jitter",
    vurgula: "highlight",
    sec: "select",
    etiketle: "tag",
    nabiz: "pulse",
    buyut: "scaleTo",
    scale: "scaleTo",
    fade: "dim",
    fadeIn: "show",
    fadeOut: "hide",
    appear: "show",
    disappear: "hide",
    wait: "pause",
    sleep: "pause",
    parallel: "together",
    narrate: "say",
    text: "setText",
    value: "setValue",
    color: "recolor",
    emphasize: "highlight"
  };
  function suggest(name, options) {
    const out = [];
    if (ALIASES[name] && options.includes(ALIASES[name])) out.push(ALIASES[name]);
    const lower = String(name).toLowerCase();
    options.map((o) => [o, levenshtein(lower, o.toLowerCase())]).filter(([o, d]) => d <= Math.max(2, Math.floor(o.length / 3)) || o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())).sort((a, b) => a[1] - b[1]).forEach(([o]) => {
      if (!out.includes(o)) out.push(o);
    });
    return out.slice(0, 3);
  }
  var VatError = class extends Error {
    constructor(message, hint) {
      super(message);
      this.name = "VatError";
      this.hint = hint;
    }
  };
  function guard(target, label) {
    return new Proxy(target, {
      get(t, p, r) {
        if (typeof p === "symbol" || p in t) return Reflect.get(t, p, r);
        if (p === "then" || p === "toJSON" || p === "constructor" || p.startsWith("_") || p === "$$typeof") return void 0;
        const opts = publicMembers(t);
        const s = suggest(p, opts);
        throw new VatError(
          `${label} has no member '${String(p)}'.` + (s.length ? ` Did you mean ${s.map((x) => `'${x}'`).join(" or ")}?` : "") + ` Available: ${opts.join(", ")}.`
        );
      }
    });
  }
  function publicMembers(obj) {
    const names = /* @__PURE__ */ new Set();
    let o = obj;
    while (o && o !== Object.prototype) {
      for (const k of Object.getOwnPropertyNames(o)) if (!k.startsWith("_") && k !== "constructor") names.add(k);
      o = Object.getPrototypeOf(o);
    }
    return [...names].sort();
  }
  function niceTicks(a, b, count = 6) {
    const span = b - a;
    if (!(span > 0)) return [a];
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
    return out;
  }
  var escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // engine/src/design.js
  var BUILTIN = { neutral: "neutral", accent: "r5", danger: "bad", success: "ok", warn: "warn" };
  var PALETTE = ["r1", "r2", "r3", "r4", "r5", "r6"];
  function assignRoles(glossary) {
    const map = /* @__PURE__ */ new Map();
    let i = 0;
    for (const [key, g] of Object.entries(glossary || {})) if (g && g.concept) map.set(key, PALETTE[i++ % PALETTE.length]);
    return map;
  }
  function roleSlot(stage, role) {
    if (!role) return "neutral";
    if (BUILTIN[role]) return BUILTIN[role];
    return stage._roleSlots.get(role) || "neutral";
  }
  function roleVar(stage, role, variant = "main") {
    const s = roleSlot(stage, role);
    if (s === "neutral") return variant === "soft" ? "var(--neutral-soft)" : variant === "ink" ? "var(--ink-2)" : "var(--neutral)";
    if (s === "ok" || s === "bad" || s === "warn") return variant === "soft" ? `var(--${s}-soft)` : `var(--${s})`;
    return variant === "main" ? `var(--${s})` : `var(--${s}-${variant})`;
  }

  // engine/src/core.js
  var DUR = { fast: 0.35, normal: 0.6, slow: 1 };
  var DIM = 0.22;
  function dur(s, def = "normal") {
    if (s === void 0 || s === null) return DUR[def];
    if (typeof s === "number" && s >= 0) return s;
    if (DUR[s] !== void 0) return DUR[s];
    throw new VatError(`Unknown speed '${s}'. Use 'fast', 'normal', 'slow' or a number of seconds.`);
  }
  var n3 = (v) => Math.round(v * 1e3) / 1e3;
  var T = (x, y) => `translate(${n3(x)} ${n3(y)})`;
  var S = (sx, sy = sx) => `scale(${n3(sx)} ${n3(sy)})`;
  var Recorder = class {
    constructor() {
      this.reset();
    }
    reset() {
      this.mode = "idle";
      this.cap = null;
      this.initialEvents = [];
      this.hooks = [];
    }
    push(item) {
      if (this.mode === "scene" || this.mode === "build") return this._now(item);
      if (this.mode !== "script" || !this.cap) throw new VatError("Animated verbs must be called inside a chapter/step build function (or in scene() to set the initial state).");
      this.cap.push(item);
    }
    _now(item) {
      if (item.k === "tw") window.gsap.set(item.el, { ...item.to });
      else if (item.k === "ev") this.initialEvents.push(item.ev);
      else if (item.k === "par" || item.k === "seq") item.items.forEach((i) => this._now(i));
    }
    tw(el, from, to, d = DUR.normal, ease = "power2.inOut") {
      this.push({ k: "tw", el, from, to, d, ease });
    }
    set(el, from, to) {
      this.push({ k: "tw", el, from, to, d: 0, ease: "none" });
    }
    ev(ev) {
      this.push({ k: "ev", ev });
    }
    wait(d) {
      if (this.mode === "script") this.push({ k: "wait", d });
    }
    group(kind, fn) {
      if (this.mode !== "script") return fn();
      const g = { k: kind, items: [] };
      this.push(g);
      const prev = this.cap;
      this.cap = g.items;
      try {
        return fn();
      } finally {
        this.cap = prev;
      }
    }
    par(fn) {
      return this.group("par", fn);
    }
    seq(fn) {
      return this.group("seq", fn);
    }
    get live() {
      return this.mode === "script";
    }
  };
  var rec = new Recorder();
  var SVGNS = "http://www.w3.org/2000/svg";
  var svg = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== void 0 && v !== null) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  var Obj = class {
    constructor(stage, o) {
      this._st = stage;
      this.kind = o.kind;
      const id = o.id ?? stage._autoId(o.kind);
      if (stage._objs.has(id)) throw new VatError(`Two objects use the id '${id}'. Ids must be unique.`);
      this.id = id;
      this._space = o.space || "world";
      this._parentObj = o.parent || null;
      this._tags = new Set(o.tags || []);
      this._gen = 0;
      this._lineage = [];
      this._exists = true;
      this._role = o.role;
      this._textSize = o.textSize || "world";
      this._minZoom = o.minZoom || 0;
      this._paints = [];
      this._parts = /* @__PURE__ */ new Map();
      const el = this._el = svg("g", { class: `vo vo-${o.kind}`, "data-id": id });
      this._s = svg("g", { class: "vo-s" }, el);
      this._z = svg("g", { class: "vo-z" }, this._s);
      this._b = svg("g", { class: "vo-b" }, this._z);
      this._j = svg("g", { class: "vo-j" }, this._b);
      this._l = svg("g", { class: "vo-l" }, this._j);
      this._hl = svg("g", { class: "vo-hl", opacity: 0 }, this._l);
      this._body = o.body || svg("g");
      this._body.classList.add("vo-body");
      this._l.appendChild(this._body);
      this._text = o.text || null;
      this._o = o.origin || null;
      const container2 = o.container || (this._parentObj ? this._parentObj._body : stage._layer(o.layer || "nodes", this._space));
      if (o.before !== void 0) container2.insertBefore(el, o.before);
      else container2.appendChild(el);
      const p = o.pos || { x: 0, y: 0 };
      const z = this._space === "world" ? stage._zoomScale(this._textSize) : 1;
      const zVis = this._minZoom && stage._zoom() < this._minZoom ? 0 : 1;
      this._st8 = { x: p.x, y: p.y, sx: 1, sy: 1, vis: !o.hidden, dim: false, hl: false, z, zo: zVis };
      window.gsap.set(el, { attr: { transform: T(p.x, p.y) }, autoAlpha: o.hidden ? 0 : 1 });
      window.gsap.set(this._s, { attr: { transform: this._S(1) } });
      window.gsap.set(this._z, { attr: { transform: S(z) }, opacity: zVis });
      window.gsap.set(this._l, { opacity: 1 });
      this._measure();
      stage._register(this);
      this._api = guard(this, `Obj '${id}' (${o.kind})`);
    }
    _S(sx, sy = sx) {
      const s = S(sx, sy);
      return this._o ? `${T(this._o.x, this._o.y)} ${s} ${T(-this._o.x, -this._o.y)}` : s;
    }
    // ── read-only logical state ──
    get tags() {
      return [...this._tags];
    }
    get generation() {
      return this._gen;
    }
    get parent() {
      return this._lineage.length ? this._st._objs.get(this._lineage[this._lineage.length - 1])?._api ?? null : null;
    }
    get exists() {
      return this._exists;
    }
    _measure() {
      let b;
      try {
        b = this._body.getBBox();
      } catch {
        b = { x: 0, y: 0, width: 0, height: 0 };
      }
      this._bb = { x: b.x, y: b.y, w: b.width, h: b.height };
      this.w = b.width;
      this.h = b.height;
      this._hl.replaceChildren();
      const pad = /cell|header|code-line/.test(this.kind) ? 0 : 6;
      if (b.width > 0 || b.height > 0)
        svg("rect", { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad, rx: pad ? 9 : 2, class: "vo-ring" }, this._hl);
    }
    /** World (or HUD) centre of the object, including parents' positions. */
    _center() {
      let x = this._st8.x + this._bb.x + this._bb.w / 2, y = this._st8.y + this._bb.y + this._bb.h / 2;
      for (let p = this._parentObj; p; p = p._parentObj) {
        x += p._st8.x;
        y += p._st8.y;
      }
      return { x, y };
    }
    _origin() {
      let x = 0, y = 0;
      for (let p = this._parentObj; p; p = p._parentObj) {
        x += p._st8.x;
        y += p._st8.y;
      }
      return { x, y };
    }
    _box() {
      const c = this._center();
      const z = this._st8.z * this._st8.sx;
      return { x: c.x - this.w * z / 2, y: c.y - this.h * z / 2, w: this.w * z, h: this.h * z, cx: c.x, cy: c.y };
    }
    // ── appearance ──
    _setVis(on, o) {
      const from = this._st8.vis ? 1 : 0, to = on ? 1 : 0;
      if (from === to) return;
      this._st8.vis = on;
      rec.tw(this._el, { autoAlpha: from }, { autoAlpha: to }, dur(o?.speed, "fast"), "power1.inOut");
    }
    show(o) {
      this._delay(o);
      this._setVis(true, o);
      return this._api;
    }
    hide(o) {
      this._delay(o);
      this._setVis(false, o);
      return this._api;
    }
    dim(o) {
      this._delay(o);
      if (!this._st8.dim) {
        this._st8.dim = true;
        rec.tw(this._l, { opacity: 1 }, { opacity: DIM }, dur(o?.speed, "fast"));
      }
      return this._api;
    }
    undim(o) {
      this._delay(o);
      if (this._st8.dim) {
        this._st8.dim = false;
        rec.tw(this._l, { opacity: DIM }, { opacity: 1 }, dur(o?.speed, "fast"));
      }
      return this._api;
    }
    highlight(o) {
      this._delay(o);
      if (this._st8.dim) this.undim({ speed: "fast" });
      if (!this._st8.hl) {
        this._st8.hl = true;
        rec.tw(this._hl, { opacity: 0 }, { opacity: 1 }, dur(o?.speed, "fast"));
      }
      return this._api;
    }
    unhighlight(o) {
      this._delay(o);
      if (this._st8.hl) {
        this._st8.hl = false;
        rec.tw(this._hl, { opacity: 1 }, { opacity: 0 }, dur(o?.speed, "fast"));
      }
      return this._api;
    }
    pulse(o) {
      this._delay(o);
      const { sx, sy } = this._st8, d = dur(o?.speed, "fast");
      rec.seq(() => {
        rec.tw(this._s, { attr: { transform: this._S(sx, sy) } }, { attr: { transform: this._S(sx * 1.14, sy * 1.14) } }, d / 2, "power2.out");
        rec.tw(this._s, { attr: { transform: this._S(sx * 1.14, sy * 1.14) } }, { attr: { transform: this._S(sx, sy) } }, d / 2, "power2.in");
      });
      return this._api;
    }
    recolor(role, o) {
      this._delay(o);
      this._st._checkRole(role);
      rec.par(() => {
        for (const p of this._paints) {
          const from = p.el.getAttribute(p.attr + "-role-now") || p.el.getAttribute(p.attr);
          const to = roleVar(this._st, role, p.variant);
          p.el.setAttribute(p.attr + "-role-now", to);
          rec.set(p.el, { attr: { [p.attr]: from } }, { attr: { [p.attr]: to } });
        }
      });
      this._role = role;
      return this._api;
    }
    remove(o) {
      this._delay(o);
      this._setVis(false, o);
      this._exists = false;
      rec.ev({ type: "exist", obj: this.id, on: false });
      this._st._refreshCounters();
      return this._api;
    }
    // ── motion ──
    _moveLocal(x, y, o, ease = "power2.inOut") {
      const { x: fx, y: fy } = this._st8;
      if (Math.abs(fx - x) < 0.01 && Math.abs(fy - y) < 0.01) return;
      this._st8.x = x;
      this._st8.y = y;
      rec.tw(this._el, { attr: { transform: T(fx, fy) } }, { attr: { transform: T(x, y) } }, dur(o?.speed), ease);
    }
    /** Move so that the object's centre lands on world point p. */
    _moveCenterTo(p, o) {
      const c = this._center();
      this._moveLocal(this._st8.x + (p.x - c.x), this._st8.y + (p.y - c.y), o);
    }
    moveTo(place, o) {
      this._delay(o);
      const p = this._st._resolve(place, this);
      this._st._withFollow(this, () => this._moveCenterTo(p, o), o);
      return this._api;
    }
    along(path, o = {}) {
      this._delay(o);
      const pts = this._st._pathPoints(path, o.plot);
      const total = dur(o.speed, "slow") * 1.4;
      const c0 = this._center();
      const ox = this._st8.x - c0.x, oy = this._st8.y - c0.y;
      this._st._withFollow(this, () => rec.seq(() => {
        const segs = pts.length - 1;
        for (let i = 1; i <= segs; i++) {
          const a = pts[i - 1], b = pts[i];
          const fx = a.x + ox, fy = a.y + oy, tx = b.x + ox, ty = b.y + oy;
          rec.tw(this._el, { attr: { transform: T(i === 1 ? this._st8.x : fx, i === 1 ? this._st8.y : fy) } }, { attr: { transform: T(tx, ty) } }, total / segs, "none");
        }
        const last = pts[pts.length - 1];
        this._st8.x = last.x + ox;
        this._st8.y = last.y + oy;
      }), o);
      return this._api;
    }
    scaleTo(k, o) {
      this._delay(o);
      const { sx, sy } = this._st8;
      this._st8.sx = k;
      this._st8.sy = k;
      rec.tw(this._s, { attr: { transform: this._S(sx, sy) } }, { attr: { transform: this._S(k) } }, dur(o?.speed));
      return this._api;
    }
    // ── values & text ──
    setValue(v, o) {
      if (v && typeof v === "object" && "value" in v && "id" in v) this._st._valIndex.set(v.id, this);
      return this.setText(this._st._valText(v), o);
    }
    setText(text, o) {
      this._delay(o);
      if (!this._text) throw new VatError(`Obj '${this.id}' (${this.kind}) has no text to change. Use setValue/setText on labels, values, boxes, cells or node values.`);
      const el = this._text;
      const from = this._curText ?? el.textContent;
      const to = this._st._plain(String(text));
      if (from === to) return this._api;
      this._curText = to;
      const d = dur(o?.speed, "fast");
      rec.seq(() => {
        rec.tw(el, { opacity: 1 }, { opacity: 0 }, d * 0.4, "power1.in");
        rec.set(el, { textContent: from }, { textContent: to });
        if (this._fit) this._fit(to);
        rec.tw(el, { opacity: 0 }, { opacity: 1 }, d * 0.6, "power1.out");
      });
      if (!rec.live) {
        el.textContent = to;
        if (this._fit) this._fit(to);
      }
      return this._api;
    }
    // ── continuous effects (logical events; effects.js plays them) ──
    _fx(fx, on, extra) {
      this._fxOn = this._fxOn || /* @__PURE__ */ new Map();
      if (on !== false) this._fxOn.set(fx, extra || {});
      else this._fxOn.delete(fx);
      rec.ev({ type: "fx", obj: this.id, fx, on: on !== false, ...extra });
      return this._api;
    }
    glow(on) {
      return this._fx("glow", on);
    }
    jitter(on, strength = "low") {
      return this._fx("jitter", on, { strength });
    }
    breathe(on) {
      return this._fx("breathe", on);
    }
    flow(on) {
      return this._fx("flow", on);
    }
    // ── logical ──
    tag(name) {
      if (!this._tags.has(name)) {
        this._tags.add(name);
        rec.ev({ type: "tag", obj: this.id, tag: name, on: true });
        this._st._refreshCounters();
      }
      return this._api;
    }
    untag(name) {
      if (this._tags.has(name)) {
        this._tags.delete(name);
        rec.ev({ type: "tag", obj: this.id, tag: name, on: false });
        this._st._refreshCounters();
      }
      return this._api;
    }
    // ── life ──
    split(o = {}) {
      return this._st._split([this], o)[0];
    }
    clone(o = {}) {
      const c = this._st._cloneObj(this);
      const target = o.at ? this._st._resolve(o.at, c) : (() => {
        const p = this._center();
        return { x: p.x + this.w * 1.1, y: p.y };
      })();
      rec.seq(() => {
        c._setVis(true, { speed: "fast" });
        c._moveCenterTo(target, o);
      });
      this._st._refreshCounters();
      return c._api;
    }
    part(name) {
      if (this._parts.has(name)) return this._parts.get(name)._api;
      const el = this._body.querySelector(`.${CSS.escape(name)}`);
      if (!el) throw new VatError(`Obj '${this.id}' has no part '${name}'. Parts are elements with class="${name}" inside the shape's SVG.`);
      const p = this._st._wrapPart(this, el, name);
      this._parts.set(name, p);
      return p._api;
    }
    do(verb, opts = {}) {
      const impl = this._st._verbs.get(verb);
      if (!impl) throw new VatError(`Unknown custom verb '${verb}'. Register it first with vat.defineVerb('${verb}', (obj, opts) => { ... }).`);
      impl(this._api, opts);
      return this._api;
    }
    _delay(o) {
      if (o?.delay !== void 0 && rec.live) rec.wait(dur(o.delay));
    }
  };
  var SEL_VERBS = ["show", "hide", "dim", "undim", "highlight", "unhighlight", "pulse", "remove", "scaleTo"];
  var Sel = class _Sel {
    constructor(stage, objs) {
      this._st = stage;
      this._objs = objs;
    }
    get count() {
      return this._objs.length;
    }
    _new(objs) {
      return new _Sel(this._st, objs)._wrap();
    }
    _wrap() {
      return this._api = guard(this, "Selection");
    }
    tagged(tag) {
      return this._new(this._objs.filter((o) => o._tags.has(tag)));
    }
    except(...xs) {
      const ids = /* @__PURE__ */ new Set();
      for (const x of xs.flat()) {
        if (typeof x === "string" && (x.startsWith(".") || x.startsWith("#") || /^[a-z]/i.test(x)) && !this._st._objs.has(x)) this._st._query(x).forEach((o) => ids.add(o.id));
        else ids.add(typeof x === "string" ? x : x.id);
      }
      return this._new(this._objs.filter((o) => !ids.has(o.id)));
    }
    where(f) {
      return this._new(this._objs.filter((o) => f(o._api)));
    }
    generation(n) {
      return this._new(this._objs.filter((o) => o._gen === n));
    }
    descendantsOf(x) {
      const id = typeof x === "string" ? x : x.id;
      return this._new(this._objs.filter((o) => o.id === id || o._lineage.includes(id)));
    }
    first() {
      return this._one(0);
    }
    last() {
      return this._one(this._objs.length - 1);
    }
    at(i) {
      return this._one(i);
    }
    _one(i) {
      const o = this._objs[i];
      if (!o) throw new VatError(`Selection has ${this._objs.length} object(s); index ${i} does not exist.`);
      return o._api;
    }
    sample(n) {
      const k = Math.min(n, this._objs.length), out = [];
      for (let i = 0; i < k; i++) out.push(this._objs[Math.floor((i + 0.5) * this._objs.length / k)]);
      return this._new(out);
    }
    toArray() {
      return this._objs.map((o) => o._api);
    }
    each(f) {
      this._objs.forEach((o, i) => f(o._api, i));
    }
    _apply(verb, args, o) {
      const stagger = o?.stagger !== void 0 ? dur(o.stagger) : 0;
      rec.par(() => this._objs.forEach((obj, i) => rec.seq(() => {
        if (stagger && i) rec.wait(stagger * i);
        obj[verb](...args);
      })));
      return this._api;
    }
    glow(on) {
      this._objs.forEach((o) => o.glow(on));
      return this._api;
    }
    jitter(on, s) {
      this._objs.forEach((o) => o.jitter(on, s));
      return this._api;
    }
    breathe(on) {
      this._objs.forEach((o) => o.breathe(on));
      return this._api;
    }
    flow(on) {
      this._objs.forEach((o) => o.flow(on));
      return this._api;
    }
    tag(name) {
      this._objs.forEach((o) => o.tag(name));
      return this._api;
    }
    untag(name) {
      this._objs.forEach((o) => o.untag(name));
      return this._api;
    }
    recolor(role, o) {
      return this._apply("recolor", [role, { speed: o?.speed }], o);
    }
    split(o = {}) {
      return this._new(this._st._split(this._objs, o).flat());
    }
    do(verb, opts) {
      this._objs.forEach((x) => x.do(verb, opts));
      return this._api;
    }
  };
  for (const v of SEL_VERBS) Sel.prototype[v] = function(o) {
    return this._apply(v, v === "scaleTo" ? [o] : [{ speed: o?.speed }], typeof o === "object" ? o : void 0);
  };

  // engine/src/stage.js
  var ROOT = { w: 1600, h: 900 };
  var WORLD = { w: 1600, h: 770 };
  var ASPECT = WORLD.w / WORLD.h;
  var M = 40;
  var REGIONS = {
    main: { x: M, y: 30, w: WORLD.w - 2 * M, h: WORLD.h - 60 },
    center: { x: 360, y: 150, w: 880, h: 470 },
    left: { x: M, y: 30, w: 730, h: WORLD.h - 60 },
    right: { x: 830, y: 30, w: 730, h: WORLD.h - 60 },
    top: { x: M, y: 24, w: WORLD.w - 2 * M, h: 210 },
    bottom: { x: M, y: 530, w: WORLD.w - 2 * M, h: 216 },
    inset: { x: 1170, y: 30, w: 390, h: 250 }
  };
  var GAPS = { xs: 6, sm: 14, md: 28, lg: 56 };
  var VALUE_KINDS = /* @__PURE__ */ new Set(["value", "table-cell", "grid-cell", "net-value", "net-weight", "net-bias", "code-watch"]);
  var BUILTIN_KINDS = /* @__PURE__ */ new Set(["table", "table-cell", "table-header", "plot", "plot-point", "plot-curve", "plot-line", "plot-segment", "plot-circle", "plot-region", "neuralNet", "net-node", "net-edge", "net-weight", "net-value", "net-bias", "graph", "graph-node", "graph-edge", "grid", "grid-cell", "grid-window", "numberLine", "line-mark", "line-interval", "sequence", "seq-actor", "seq-message", "seq-note", "stateMachine", "sm-state", "sm-transition", "sm-marker", "codeView", "code-line", "code-cursor", "code-watch", "container", "label", "value", "box", "dot", "arrow", "counter", "part", "magnifier", "panel"]);
  var FONT = { sm: 17, md: 21, lg: 27, xl: 36 };
  var DEFAULT_CAM = { x: 0, y: 0, w: WORLD.w, h: WORLD.h };
  var Stage = class {
    constructor(root, ctx) {
      this._ctx = ctx;
      this._root = root;
      this._objs = /* @__PURE__ */ new Map();
      this._order = [];
      this._idc = {};
      this._valIndex = /* @__PURE__ */ new Map();
      this._counters = [];
      this._verbs = ctx.verbs;
      this._components = ctx.components;
      this._panels = [];
      this._follow = null;
      this._roleSlots = assignRoles(ctx.glossary);
      this._warnings = ctx.warnings;
      root.replaceChildren();
      root.setAttribute("viewBox", `0 0 ${ROOT.w} ${ROOT.h}`);
      const defs = svg("defs", {}, root);
      defs.innerHTML = `<filter id="vat-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      this._defs = defs;
      this._worldSvg = svg("svg", { id: "vat-world", x: 0, y: 0, width: WORLD.w, height: WORLD.h, viewBox: vb(DEFAULT_CAM), overflow: "visible" }, root);
      this._worldG = svg("g", { id: "vat-world-content" }, this._worldSvg);
      this._layers = {};
      for (const l of ["bg", "edges", "nodes", "labels", "top"]) this._layers[l] = svg("g", { class: `layer-${l}` }, this._worldG);
      this._hudG = svg("g", { id: "vat-hud" }, root);
      this._hudLayers = {};
      for (const l of ["formula", "nodes", "fly"]) this._hudLayers[l] = svg("g", { class: `hud-${l}` }, this._hudG);
      this._measureG = svg("g", { "aria-hidden": "true", style: "visibility:hidden" }, root);
      this.camera = guard(new Camera(this), "stage.camera");
      this._api = guard(this, "stage");
    }
    // ── registry ──
    _autoId(kind) {
      this._idc[kind] = (this._idc[kind] || 0) + 1;
      let id = `${kind}${this._idc[kind]}`;
      while (this._objs.has(id)) id = `${kind}${++this._idc[kind]}`;
      return id;
    }
    _register(o) {
      this._objs.set(o.id, o);
      this._order.push(o);
    }
    _layer(name, space = "world") {
      const L = space === "hud" ? this._hudLayers : this._layers;
      if (!L[name]) throw new VatError(`Unknown layer '${name}'.`);
      return L[name];
    }
    _live() {
      return this._order.filter((o) => o._exists);
    }
    _query(q) {
      if (typeof q !== "string" || !q.trim()) throw new VatError(`select() needs a selector string like 'cell', '.cancer', '#h1' or 'cell.cancer'.`);
      const m = q.trim().match(/^([A-Za-z_][\w-]*)?((?:[.#][\w-]+)*)$/);
      if (!m) throw new VatError(`Unsupported selector '${q}'. Use kind ('cell'), .tag ('.cancer'), #id ('#h1') or combinations ('cell.cancer').`);
      const kind = m[1], rest = m[2] || "";
      const tags = [...rest.matchAll(/\.([\w-]+)/g)].map((x) => x[1]), ids = [...rest.matchAll(/#([\w-]+)/g)].map((x) => x[1]);
      return this._live().filter((o) => (!kind || o.kind === kind) && tags.every((t) => o._tags.has(t)) && ids.every((i) => o.id === i));
    }
    select(q) {
      return new Sel(this, this._query(q))._wrap();
    }
    get(id) {
      const o = this._objs.get(id);
      if (!o) throw new VatError(`No object with id '${id}'.`);
      return o._api;
    }
    // ── geometry ──
    _zoom() {
      return WORLD.h / this.camera._v.h;
    }
    _zoomScale(mode, zoom = this._zoom()) {
      return mode === "screen" ? 1 / zoom : mode === "damped" ? Math.pow(zoom, -0.6) : 1;
    }
    _worldToHud(p) {
      const c = this.camera._v;
      return { x: (p.x - c.x) * WORLD.w / c.w, y: (p.y - c.y) * WORLD.h / c.h };
    }
    _regionRect(name) {
      const r = REGIONS[name];
      if (!r) throw new VatError(`Unknown region '${name}'. Regions: ${Object.keys(REGIONS).join(", ")}.`);
      return { ...r };
    }
    /** Rectangle a component should fill, from its `at`. */
    _rectFor(at, def = "center", size) {
      if (at === void 0) at = def;
      if (typeof at === "string") return this._regionRect(at);
      if (at && at.region && at.u === void 0 && at.v === void 0) return this._regionRect(at.region);
      if (at && at.inside) return at.inside._api ? at.inside._box() : this._objOf(at.inside)._box();
      const p = this._resolve(at);
      const w = size?.w ?? 600, h = size?.h ?? 360;
      return { x: p.x - w / 2, y: p.y - h / 2, w, h };
    }
    _objOf(x) {
      if (x && x._st8) return x;
      if (x && x._objs && Array.isArray(x._objs)) throw new VatError(`Expected one object but got a selection of ${x._objs.length}. Use .first(), .at(i) or .each(o => …); camera.focus/frame accept selections.`);
      if (x && typeof x.id === "string" && this._objs.has(x.id)) return this._objs.get(x.id);
      throw new VatError(`Expected an object created by the stage (got ${typeof x === "object" ? JSON.stringify(x)?.slice(0, 80) : String(x)}).`);
    }
    /** Placement → world point (centre). `self` is the object being placed (for its size). */
    _resolve(place, self) {
      if (place === void 0 || place === null) place = "center";
      if (typeof place === "string") {
        const r = this._regionRect(place);
        return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      }
      if (typeof place !== "object") throw new VatError(`Invalid placement ${JSON.stringify(place)}.`);
      if (place.region) {
        const r = this._regionRect(place.region);
        const u = clamp(place.u ?? 0.5, 0, 1), v = clamp(place.v ?? 0.5, 0, 1);
        return { x: r.x + u * r.w, y: r.y + v * r.h };
      }
      if (place.near) {
        const t = this._objOf(place.near)._box();
        const gap = GAPS[place.gap || "sm"] ?? GAPS.sm;
        const sw = self ? self.w * self._st8.z / 2 : 0, sh = self ? self.h * self._st8.z / 2 : 0;
        switch (place.side || "right") {
          case "top":
            return { x: t.cx, y: t.y - gap - sh };
          case "bottom":
            return { x: t.cx, y: t.y + t.h + gap + sh };
          case "left":
            return { x: t.x - gap - sw, y: t.cy };
          case "right":
            return { x: t.x + t.w + gap + sw, y: t.cy };
          default:
            throw new VatError(`side must be 'top', 'right', 'bottom' or 'left' (got '${place.side}').`);
        }
      }
      if (place.between) {
        const [a, b] = place.between.map((o) => this._objOf(o)._center());
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
      if (place.inside) return this._objOf(place.inside)._center();
      if (place.plot) {
        const p = this._objOf(place.plot);
        if (!p._toWorld) throw new VatError(`{ plot } placement needs a plot created with stage.plot().`);
        return p._toWorld(place.x, place.y);
      }
      if ("x" in place || "y" in place) throw new VatError(`Raw {x, y} positions are not allowed (no screen pixels). Use a region ('left', 'main', …), { region, u, v } with u,v in 0..1, { near: obj, side }, or { plot, x, y } for plot coordinates.`);
      throw new VatError(`Invalid placement ${JSON.stringify(place)}. See Placement in engine-api.d.ts.`);
    }
    _pathPoints(path, plot2) {
      const N = 48;
      if (typeof path === "function") {
        const P = plot2 ? this._objOf(plot2) : null;
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const q = path(i / N);
          if (!q || !Number.isFinite(q.x) || !Number.isFinite(q.y)) throw new VatError(`along(): path(${(i / N).toFixed(2)}) returned ${JSON.stringify(q)}, expected { x, y } numbers.`);
          pts.push(P ? P._toWorld(q.x, q.y) : this._resolve({ region: "main", u: q.x, v: q.y }));
        }
        return pts;
      }
      const o = this._objOf(path);
      if (!o._points) throw new VatError(`along(obj): '${o.id}' is not a path. Use a plot curve/polyline/segment, an arrow, or a function t => ({x, y}).`);
      return o._points;
    }
    // ── text helpers ──
    _valText(v) {
      if (v && typeof v === "object" && "value" in v && typeof v.fmt === "function") return v.fmt();
      if (typeof v === "number") return fmt(v, void 0, this._ctx.lang);
      if (v === void 0 || v === null) throw new VatError(`A value is ${v}. Pass a Val from the model, a number or a string.`);
      return String(v);
    }
    /** Markup → plain text (labels in SVG). */
    _plain(s) {
      return this._ctx.markup.plain(s);
    }
    measureText(str, size = FONT.md, weight = 400, family) {
      const t = svg("text", { "font-size": size, "font-weight": weight, ...family ? { style: `font-family:${family}` } : {} }, this._measureG);
      t.textContent = str;
      let w = 0;
      try {
        w = t.getComputedTextLength();
      } catch {
      }
      t.remove();
      return w;
    }
    _wrapLines(str, size, weight, maxW) {
      const out = [];
      for (const para of String(str).split("\n")) {
        let line = "";
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const test = line ? line + " " + word : word;
          if (line && this.measureText(test, size, weight) > maxW) {
            out.push(line);
            line = word;
          } else line = test;
        }
        out.push(line);
      }
      return out;
    }
    _textEl(parent, str, { size = FONT.md, weight = 400, fill = "var(--ink)", anchor = "middle", maxW, cls, family } = {}) {
      const lines = maxW ? this._wrapLines(str, size, weight, maxW) : String(str).split("\n");
      const t = svg("text", { "font-size": size, "font-weight": weight, fill, "text-anchor": anchor, class: cls, ...family ? { style: `font-family:${family}` } : {} }, parent);
      const lh = size * 1.25;
      if (lines.length === 1) {
        t.setAttribute("dominant-baseline", "central");
        t.textContent = lines[0];
      } else lines.forEach((ln, i) => {
        const ts = svg("tspan", { x: 0, y: (i - (lines.length - 1) / 2) * lh, "dominant-baseline": "central" }, t);
        ts.textContent = ln;
      });
      return t;
    }
    // ── creation ──
    _checkRole(role) {
      if (!role) return;
      if (["neutral", "accent", "danger", "success", "warn"].includes(role)) return;
      if (!this._ctx.glossary[role]) throw new VatError(`role '${role}' is not a glossary key. Roles are glossary keys (with concept: true for a colour) or one of neutral, accent, danger, success, warn.`);
    }
    _common(opts, kind) {
      if (opts && typeof opts !== "object") throw new VatError(`${kind}: options must be an object.`);
      const o = opts || {};
      this._checkRole(o.role);
      if (o.textSize && !["world", "screen", "damped"].includes(o.textSize)) throw new VatError(`textSize must be 'world', 'screen' or 'damped'.`);
      return o;
    }
    /** Create an object; placement and appearance follow the record mode. */
    _create(kind, body, opts = {}, extra = {}) {
      const live = rec.live;
      const o = new Obj(this, {
        kind,
        id: opts.id,
        body,
        role: opts.role,
        tags: opts.tags,
        textSize: opts.textSize ?? extra.textSize,
        minZoom: opts.minZoom,
        hidden: true,
        layer: extra.layer,
        text: extra.text,
        space: extra.space,
        parent: extra.parent,
        origin: extra.origin
      });
      if (extra.fit) o._fit = extra.fit.bind(o);
      if (extra.points) o._points = extra.points;
      if (extra.at0) {
        o._st8.x = extra.at0.x;
        o._st8.y = extra.at0.y;
      } else {
        const p = extra.pos ?? this._resolve(opts.at, o);
        const c = o._center();
        o._st8.x += p.x - c.x;
        o._st8.y += p.y - c.y;
      }
      window.gsap.set(o._el, { attr: { transform: T(o._st8.x, o._st8.y) } });
      if (live) {
        o._exists = true;
        rec.ev({ type: "exist", obj: o.id, on: true });
        if (!opts.hidden) {
          if (extra.drawIn) rec.par(() => {
            o._setVis(true, { speed: "fast" });
            extra.drawIn(o);
          });
          else o._setVis(true, { speed: "fast" });
        }
      } else {
        o._st8.vis = !opts.hidden;
        window.gsap.set(o._el, { autoAlpha: opts.hidden ? 0 : 1 });
        rec.initialEvents.push({ type: "exist", obj: o.id, on: true });
      }
      this._refreshCounters();
      return o;
    }
    _paint(o, el, role, fillV = "soft", strokeV = "main") {
      if (fillV) {
        el.setAttribute("fill", roleVar(this, role, fillV));
        o._paints.push({ el, attr: "fill", variant: fillV });
      }
      if (strokeV) {
        el.setAttribute("stroke", roleVar(this, role, strokeV));
        o._paints.push({ el, attr: "stroke", variant: strokeV });
      }
    }
    shape(markup, opts) {
      const o = this._common(opts, "shape");
      if (typeof markup !== "string") throw new VatError(`shape(svg) needs an SVG string, e.g. '<ellipse rx="50" ry="30"/>'.`);
      const body = svg("g", { "stroke-width": 3, "stroke-linejoin": "round" });
      const inner = svg("g", { transform: `scale(${(o.size ?? 100) / 100})` }, body);
      const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, "image/svg+xml");
      if (doc.querySelector("parsererror")) throw new VatError(`shape(): the SVG markup is not valid XML. Check quotes and closing tags.`);
      for (const n of [...doc.documentElement.childNodes]) inner.appendChild(document.importNode(n, true));
      if (o.kind && BUILTIN_KINDS.has(o.kind)) throw new VatError(`shape kind '${o.kind}' is reserved by a built-in component. Choose another kind name.`);
      const obj = this._create(o.kind || "shape", body, o, {});
      this._paint(obj, body, o.role, "soft", "main");
      obj.kind = o.kind || "shape";
      return obj._api;
    }
    dot(opts) {
      const o = this._common(opts, "dot");
      const body = svg("g");
      const c = svg("circle", { r: 11, "stroke-width": 2.5 }, body);
      let text = null;
      if (o.label) text = this._textEl(body, this._plain(o.label), { size: FONT.sm, fill: "var(--ink-2)" }), text.setAttribute("y", 26);
      const obj = this._create("dot", body, o, { text });
      this._paint(obj, c, o.role, "main", null);
      c.setAttribute("stroke", "var(--surface)");
      return obj._api;
    }
    label(text, opts) {
      const o = this._common(opts, "label");
      const body = svg("g");
      const size = FONT[o.size || "md"] ?? FONT.md;
      const t = this._textEl(body, this._plain(String(text)), { size, weight: o.bold ? 650 : 450, fill: o.role ? roleVar(this, o.role, "ink") : "var(--ink)", maxW: o.maxWidth ?? 520 });
      const obj = this._create("label", body, o, { text: t, textSize: "damped" });
      obj._curText = t.textContent;
      return obj._api;
    }
    value(v, opts) {
      const o = this._common(opts, "value");
      const body = svg("g");
      const str = this._valText(v);
      const size = FONT[o.size || "md"] ?? FONT.md;
      const w = Math.max(44, this.measureText(str, size, 650) + 24), h = size + 18;
      const r = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 9, "stroke-width": 2 }, body);
      const t = this._textEl(body, str, { size, weight: 650, fill: o.role ? roleVar(this, o.role, "ink") : "var(--ink)", cls: "num" });
      const self = this;
      const obj = this._create("value", body, o, {
        text: t,
        textSize: "damped",
        fit(next) {
          const nw = Math.max(44, self.measureText(next, size, 650) + 24);
          const cw = this._bgW ?? w;
          if (Math.abs(nw - cw) < 1) return;
          this._bgW = nw;
          rec.tw(r, { attr: { x: -cw / 2, width: cw } }, { attr: { x: -nw / 2, width: nw } }, DUR.fast);
        }
      });
      this._paint(obj, r, o.role, "soft", "main");
      obj._curText = str;
      if (v && typeof v === "object" && v.id) this._valIndex.set(v.id, obj);
      return obj._api;
    }
    box(text, opts) {
      const o = this._common(opts, "box");
      const body = svg("g");
      const size = FONT[o.size || "md"] ?? FONT.md;
      const str = this._plain(String(text));
      const lines = this._wrapLines(str, size, 500, o.maxWidth ?? 380);
      const w = Math.max(...lines.map((l) => this.measureText(l, size, 500))) + 36;
      const h = lines.length * size * 1.25 + 26;
      const r = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, "stroke-width": 2 }, body);
      const t = this._textEl(body, lines.join("\n"), { size, weight: 500, fill: o.role ? roleVar(this, o.role, "ink") : "var(--ink)" });
      const obj = this._create("box", body, o, { text: t, textSize: "damped" });
      this._paint(obj, r, o.role, o.role ? "soft" : null, o.role ? "main" : null);
      if (!o.role) {
        r.setAttribute("fill", "var(--surface)");
        r.setAttribute("stroke", "var(--line)");
      }
      obj._curText = t.textContent;
      return obj._api;
    }
    arrow(from, to, opts) {
      const o = this._common(opts, "arrow");
      const A = this._objOf(from)._box(), B = this._objOf(to)._box();
      const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 6), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8);
      const body = svg("g");
      const curve = o.curve ?? 0;
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
      const cx = mx - dy / len * curve * len * 0.5, cy = my + dx / len * curve * len * 0.5;
      const d = curve ? `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x} ${p2.y}` : `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`;
      const path = svg("path", { d, fill: "none", "stroke-width": 2.5, "stroke-linecap": "round", "marker-end": `url(#${this._marker(o.role)})`, ...o.dashed ? { "stroke-dasharray": "7 6" } : {} }, body);
      path.setAttribute("stroke", roleVar(this, o.role, "main"));
      let text = null;
      if (o.label) {
        const lx = curve ? (mx + cx) / 2 : mx, ly = curve ? (my + cy) / 2 : my;
        const g = svg("g", { transform: `translate(${lx} ${ly})` }, body);
        const str = this._plain(o.label), lw = this.measureText(str, FONT.sm, 550) + 14;
        svg("rect", { x: -lw / 2, y: -13, width: lw, height: 26, rx: 7, fill: "var(--surface)", stroke: "var(--line-2)" }, g);
        text = this._textEl(g, str, { size: FONT.sm, weight: 550, fill: o.role ? roleVar(this, o.role, "ink") : "var(--ink-2)" });
      }
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        pts.push(curve ? { x: (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * cx + t * t * p2.x, y: (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * cy + t * t * p2.y } : { x: p1.x + t * dx, y: p1.y + t * dy });
      }
      const L = curve ? approxLen(pts) : len;
      const obj = this._create("arrow", body, o, {
        layer: "edges",
        text,
        pos: { x: (p1.x + p2.x) / 2 + (curve ? (cx - mx) / 2 : 0), y: (p1.y + p2.y) / 2 + (curve ? (cy - my) / 2 : 0) },
        points: pts,
        drawIn: o.dashed ? null : () => rec.tw(path, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": L } }, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": 0 } }, DUR.normal)
      });
      obj._paints.push({ el: path, attr: "stroke", variant: "main" });
      obj._flowEl = path;
      if (text) obj._curText = text.textContent;
      return obj._api;
    }
    _marker(role) {
      const id = `vat-arrow-${role || "neutral"}`;
      if (!this._defs.querySelector("#" + id)) {
        const m = svg("marker", { id, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, this._defs);
        svg("path", { d: "M0 0 L10 5 L0 10 z", fill: roleVar(this, role, "main") }, m);
      }
      return id;
    }
    counter(labelText, count, opts) {
      const o = this._common(opts, "counter");
      if (typeof count !== "function") throw new VatError(`counter(label, count): count must be a function, e.g. () => stage.select('.cancer').count`);
      const v = count();
      const api = this.box(`${this._plain(labelText)}: ${fmt(v, void 0, this._ctx.lang)}`, { ...o, maxWidth: 600 });
      const obj = this._objOf(api);
      obj.kind = "counter";
      this._counters.push({ obj, label: labelText, count, last: v });
      return api;
    }
    _refreshCounters() {
      for (const c of this._counters) {
        let v;
        try {
          v = c.count();
        } catch {
          continue;
        }
        if (v !== c.last) {
          c.last = v;
          c.obj.setText(`${this._plain(c.label)}: ${fmt(v, void 0, this._ctx.lang)}`, { speed: "fast" });
        }
      }
    }
    // ── components ──
    use(name, spec) {
      const f = this._components.get(name);
      if (!f) throw new VatError(`Unknown component '${name}'. Built-in components are methods on stage (stage.table, stage.plot, …); custom ones must be registered with vat.defineComponent.`);
      return f(this._api, spec || {});
    }
    // ── number flight ──
    _fly(from, to, o, formula) {
      let src = null, text, role;
      if (from && from._st8 || from && this._objs.has(from.id) && !(typeof from.fmt === "function")) {
        const fo = this._objOf(from);
        src = fo._space === "hud" ? fo._center() : this._worldToHud(fo._center());
        text = fo._curText ?? fo._text?.textContent ?? "";
        role = fo._role;
      } else if (from && typeof from.fmt === "function") {
        text = from.fmt();
        const shown = this._valIndex.get(from.id);
        if (shown) {
          src = shown._space === "hud" ? shown._center() : this._worldToHud(shown._center());
          role = shown._role;
        }
      } else throw new VatError(`fly(from, to): 'from' must be a stage object or a Val from the model.`);
      let dst, land;
      if (to && typeof to === "object" && "slotId" in to) {
        const sl = formula._slotGeom(to.slotId);
        dst = sl.center;
        land = () => formula._fillNow(to.slotId, text);
      } else {
        const tobj = this._objOf(to);
        dst = tobj._space === "hud" ? tobj._center() : this._worldToHud(tobj._center());
        land = () => {
          if (tobj._text && VALUE_KINDS.has(tobj.kind)) tobj.setText(text, { speed: "fast" });
          else tobj.pulse({ speed: "fast" });
        };
      }
      if (!src) src = { x: dst.x, y: dst.y - 70 };
      const g = svg("g", { class: "vat-chip", style: "visibility:hidden;opacity:0" }, this._hudLayers.fly);
      const w = this.measureText(text, FONT.md, 650) + 22;
      svg("rect", { x: -w / 2, y: -17, width: w, height: 34, rx: 9, fill: "var(--surface)", stroke: roleVar(this, role, "main"), "stroke-width": 2.5 }, g);
      this._textEl(g, text, { size: FONT.md, weight: 650, fill: roleVar(this, role, "ink") });
      g.setAttribute("transform", T(src.x, src.y));
      const d = dur(o?.speed, "normal") * 1.15;
      rec.seq(() => {
        rec.tw(g, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.15, "power1.out");
        rec.tw(g, { attr: { transform: T(src.x, src.y) } }, { attr: { transform: T(dst.x, dst.y) } }, d, "power2.inOut");
        rec.par(() => {
          rec.tw(g, { autoAlpha: 1 }, { autoAlpha: 0 }, 0.18);
          land();
        });
      });
    }
    // ── follow ──
    _withFollow(obj, fn, o) {
      if (this._follow !== obj || !rec.live) return fn();
      return rec.par(() => {
        rec.seq(fn);
        const c = obj._center(), v = this.camera._v;
        this.camera._go({ x: c.x - v.w / 2, y: c.y - v.h / 2, w: v.w, h: v.h }, { speed: o?.speed ?? "normal" });
      });
    }
    // ── life: clone / split ──
    _cloneObj(a) {
      const el = a._el.cloneNode(true);
      el.setAttribute("data-id", "");
      const body = el.querySelector(".vo-body");
      const textIdx = a._text ? [...a._body.querySelectorAll("text")].indexOf(a._text) : -1;
      const b = new Obj(this, { kind: a.kind, body, role: a._role, tags: [...a._tags], textSize: a._textSize, minZoom: a._minZoom, hidden: true, parent: a._parentObj, space: a._space, layer: layerOf(a), origin: a._o });
      if (textIdx >= 0) b._text = body.querySelectorAll("text")[textIdx];
      const allA = [...a._body.querySelectorAll("*")], allB = [...body.querySelectorAll("*")];
      for (const p of a._paints) {
        const i = p.el === a._body ? -1 : allA.indexOf(p.el);
        const elB = i === -1 ? body : allB[i];
        if (elB) {
          b._paints.push({ el: elB, attr: p.attr, variant: p.variant });
          const now = p.el.getAttribute(p.attr + "-role-now");
          if (now) elB.setAttribute(p.attr, now);
        }
      }
      b._curText = a._curText;
      if (b._text && a._curText !== void 0) b._text.textContent = a._curText;
      b._fit = a._fit;
      b._points = a._points;
      b._st8 = { ...a._st8, vis: false };
      b._gen = a._gen;
      b._lineage = [...a._lineage, a.id];
      b._exists = true;
      window.gsap.set(b._el, { attr: { transform: T(b._st8.x, b._st8.y) }, autoAlpha: 0 });
      window.gsap.set(b._s, { attr: { transform: b._S(b._st8.sx, b._st8.sy) } });
      window.gsap.set(b._l, { opacity: b._st8.dim ? 0.22 : 1 });
      window.gsap.set(b._hl, { opacity: b._st8.hl ? 1 : 0 });
      window.gsap.set(b._z, { attr: { transform: S(b._st8.z) }, opacity: b._st8.zo });
      b._measure();
      if (rec.live) rec.ev({ type: "exist", obj: b.id, on: true });
      else rec.initialEvents.push({ type: "exist", obj: b.id, on: true });
      if (a._fxOn) for (const [fx, extra] of a._fxOn) b._fx(fx, true, extra);
      return b;
    }
    _split(objs, o = {}) {
      if (!objs.length) return [];
      const d = dur(o.speed, "normal");
      const live = this._live();
      const angle = (a) => {
        const dir = o.dir ?? "free";
        if (dir === "horizontal") return 0;
        if (dir === "vertical") return Math.PI / 2;
        if (typeof dir === "number") return dir * Math.PI / 180;
        if (dir !== "free") throw new VatError(`split dir must be 'horizontal', 'vertical', 'free' or an angle in degrees.`);
        const c = a._center(), r = Math.max(a.w, a.h) * 0.6;
        let best = 0, bestScore = -Infinity;
        for (let k = 0; k < 12; k++) {
          const th = k * Math.PI / 12;
          const p1 = { x: c.x - Math.cos(th) * r, y: c.y - Math.sin(th) * r }, p2 = { x: c.x + Math.cos(th) * r, y: c.y + Math.sin(th) * r };
          let score = Infinity;
          for (const q of live) if (q !== a && q.kind === a.kind && q._st8.vis) {
            const qc = q._center();
            score = Math.min(score, Math.hypot(qc.x - p1.x, qc.y - p1.y), Math.hypot(qc.x - p2.x, qc.y - p2.y));
          }
          const wall = Math.min(p1.x, p2.x, WORLD.w - p1.x, WORLD.w - p2.x, p1.y, p2.y, WORLD.h - p1.y, WORLD.h - p2.y) * 1.5;
          score = Math.min(score, wall) - (k === 0 ? 0 : 0.01);
          if (score > bestScore) {
            bestScore = score;
            best = th;
          }
        }
        return best;
      };
      const pairs = objs.map((a) => ({ a, th: angle(a) }));
      rec.par(() => pairs.forEach(({ a, th }) => {
        const { sx, sy } = a._st8, hor = Math.abs(Math.cos(th)) >= Math.abs(Math.sin(th));
        a._sq = hor ? [sx * 1.2, sy * 0.86] : [sx * 0.86, sy * 1.2];
        rec.tw(a._s, { attr: { transform: a._S(sx, sy) } }, { attr: { transform: a._S(...a._sq) } }, d * 0.5, "power2.in");
      }));
      for (const p of pairs) {
        p.a._gen += 1;
        p.b = this._cloneObj(p.a);
        p.b._st8.sx = p.a._sq[0];
        p.b._st8.sy = p.a._sq[1];
        window.gsap.set(p.b._s, { attr: { transform: p.b._S(...p.a._sq) } });
      }
      const targets = /* @__PURE__ */ new Map();
      for (const { a, b, th } of pairs) {
        const c = a._center(), r = Math.max(a.w, a.h) * 0.55;
        targets.set(a, { x: c.x - Math.cos(th) * r, y: c.y - Math.sin(th) * r });
        targets.set(b, { x: c.x + Math.cos(th) * r, y: c.y + Math.sin(th) * r });
      }
      const kinds = new Set(objs.map((a) => a.kind));
      const crowd = this._live().filter((q) => kinds.has(q.kind) && q._space === "world" && (q._st8.vis || targets.has(q)));
      relax(crowd, targets);
      rec.par(() => {
        for (const { a, b } of pairs) {
          b._st8.vis = true;
          rec.tw(b._el, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.01, "none");
          for (const x of [a, b]) {
            const [fx, fy] = a._sq;
            rec.tw(x._s, { attr: { transform: x._S(fx, fy) } }, { attr: { transform: x._S(a._st8.sx, a._st8.sy) } }, d, "back.out(1.6)");
          }
          b._st8.sx = a._st8.sx;
          b._st8.sy = a._st8.sy;
        }
        for (const [q, p] of targets) q._moveCenterTo(p, { speed: d });
      });
      this._refreshCounters();
      return pairs.map((p) => [p.a._api, p.b._api]);
    }
    _wrapPart(owner, el, name) {
      const parent = el.parentNode, before = el.nextSibling;
      let bb = { x: 0, y: 0, width: 0, height: 0 };
      try {
        bb = el.getBBox();
      } catch {
      }
      const origin = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
      const p = new Obj(this, { kind: "part", id: `${owner.id}:${name}`, body: el, container: parent, before, origin, role: owner._role });
      p._parentObj = owner;
      p._st8.vis = true;
      window.gsap.set(p._el, { attr: { transform: T(0, 0) }, autoAlpha: 1 });
      p._paints = [{ el, attr: "fill", variant: "soft" }, { el, attr: "stroke", variant: "main" }].filter((x) => el.getAttribute(x.attr) !== null || true);
      return p;
    }
    // ── escape hatches ──
    adopt(el, opts) {
      const o = this._common(opts, "adopt");
      if (!(el instanceof SVGElement)) throw new VatError(`adopt(el) needs an SVG element you created (e.g. with document.createElementNS or D3).`);
      const body = svg("g");
      body.appendChild(el);
      return this._create(o.kind || "adopted", body, o, { pos: { x: 0, y: 0 } })._api;
    }
    panel(adapter, opts) {
      const o = this._common(opts, "panel");
      if (!adapter || typeof adapter.mount !== "function") throw new VatError(`panel(adapter) needs { mount(el), render(stepId, data), destroy?() }.`);
      const r = this._rectFor(o.at, "right");
      const body = svg("g");
      const fo = svg("foreignObject", { x: -r.w / 2, y: -r.h / 2, width: r.w, height: r.h }, body);
      const div = document.createElement("div");
      div.className = "vat-panel";
      fo.appendChild(div);
      const obj = this._create("panel", body, o, { pos: { x: r.x + r.w / 2, y: r.y + r.h / 2 } });
      adapter.mount(div);
      this._panels.push({ adapter, obj });
      if (typeof adapter.render !== "function") this._warnings.push(`panel '${obj.id}' has no render(): Back/jump cannot restore it.`);
      return obj._api;
    }
    // ── components can ask for these helpers ──
    get _svg() {
      return svg;
    }
  };
  var Camera = class {
    constructor(stage) {
      this._st = stage;
      this._v = { ...DEFAULT_CAM };
    }
    _go(v, o = {}) {
      const from = this._v;
      if (["x", "y", "w", "h"].every((k) => Math.abs(from[k] - v[k]) < 0.5)) return;
      this._v = { ...v };
      const d = dur(o.speed, "slow");
      const st = this._st;
      rec.par(() => {
        rec.tw(st._worldSvg, { attr: { viewBox: vb(from) } }, { attr: { viewBox: vb(v) } }, d, "power2.inOut");
        const z = st._zoom();
        for (const ob of st._order) {
          if (ob._space !== "world" || ob._parentObj && ob._textSize === "world") continue;
          const nz = st._zoomScale(ob._textSize, z), nzo = ob._minZoom && z < ob._minZoom ? 0 : 1;
          if (Math.abs(nz - ob._st8.z) > 1e-3 || nzo !== ob._st8.zo) {
            rec.tw(ob._z, { attr: { transform: S(ob._st8.z) }, opacity: ob._st8.zo }, { attr: { transform: S(nz) }, opacity: nzo }, d, "power2.inOut");
            ob._st8.z = nz;
            ob._st8.zo = nzo;
          }
        }
      });
    }
    _fit(box, pad) {
      let w = Math.max(box.w + 2 * pad, (box.h + 2 * pad) * ASPECT);
      w = clamp(w, WORLD.w / 3.2, WORLD.w * 1.4);
      const h = w / ASPECT;
      return { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h };
    }
    _boxOf(target) {
      const objs = target && target._objs ? target._objs : [this._st._objOf(target)];
      if (!objs.length) throw new VatError(`camera: the selection is empty.`);
      const bs = objs.map((o) => o._box());
      const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
      const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    focus(target, o = {}) {
      this._go(this._fit(this._boxOf(target), GAPS[o.padding || "md"] * 2), o);
    }
    frame(target, o = {}) {
      const box = typeof target === "string" ? this._st._regionRect(target) : this._boxOf(target);
      this._go(this._fit(box, GAPS.sm), o);
    }
    follow(target) {
      this._st._follow = this._st._objOf(target);
    }
    reset(o = {}) {
      this._go(DEFAULT_CAM, o);
    }
    magnify(target, o = {}) {
      const st = this._st;
      const box = this._boxOf(target);
      const corner = o.corner || "tr";
      const W = 420, H = Math.round(W / ASPECT);
      const pad = 24;
      let w = Math.max(box.w + 2 * pad, (box.h + 2 * pad) * ASPECT), h = w / ASPECT;
      const view = { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h };
      const body = svg("g");
      svg("rect", { x: -W / 2 - 3, y: -H / 2 - 3, width: W + 6, height: H + 6, rx: 12, fill: "var(--surface)", stroke: "var(--focus-ring)", "stroke-width": 3 }, body);
      const inner = svg("svg", { x: -W / 2, y: -H / 2, width: W, height: H, viewBox: vb(view), overflow: "hidden" }, body);
      svg("use", { href: "#vat-world-content" }, inner);
      const cx = corner.endsWith("r") ? WORLD.w - W / 2 - 24 : W / 2 + 24;
      const cy = corner.startsWith("t") ? H / 2 + 24 : WORLD.h - H / 2 - 24;
      return st._create("magnifier", body, { hidden: o.hidden }, { space: "hud", pos: { x: cx, y: cy } })._api;
    }
  };
  var vb = (v) => `${round(v.x)} ${round(v.y)} ${round(v.w)} ${round(v.h)}`;
  var round = (x) => Math.round(x * 100) / 100;
  function layerOf(o) {
    const p = o._el.parentNode;
    return p?.classList?.[0]?.replace(/^layer-|^hud-/, "") || "nodes";
  }
  function approxLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return L;
  }
  function edgePoint(box, toward, pad = 0) {
    const cx = box.cx, cy = box.cy, dx = toward.x - cx, dy = toward.y - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const hw = box.w / 2 + pad, hh = box.h / 2 + pad;
    const t = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  function relax(objs, targets) {
    const P = objs.map((o) => {
      const t = targets.get(o) || o._center();
      return { o, x: t.x, y: t.y, r: Math.max(o.w, o.h) * 0.5 * o._st8.sx };
    });
    for (let it = 0; it < 40; it++) {
      let moved = false;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const a = P[i], b = P[j];
        let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
        const need = (a.r + b.r) * 1.04;
        if (dist < need) {
          if (dist < 1e-6) {
            dx = 1;
            dy = 0;
            dist = 1;
          }
          const push = (need - dist) / 2;
          a.x -= dx / dist * push;
          a.y -= dy / dist * push;
          b.x += dx / dist * push;
          b.y += dy / dist * push;
          moved = true;
        }
      }
      for (const p of P) {
        p.x = clamp(p.x, p.r + 10, WORLD.w - p.r - 10);
        p.y = clamp(p.y, p.r + 10, WORLD.h - p.r - 10);
      }
      if (!moved) break;
    }
    for (const p of P) {
      const c = p.o._center();
      if (Math.hypot(c.x - p.x, c.y - p.y) > 0.5 || targets.has(p.o)) targets.set(p.o, { x: p.x, y: p.y });
    }
  }

  // engine/src/components.js
  function child(st, parent, kind, body, pos, o = {}) {
    let id = o.id;
    if (id && st._objs.has(id)) id = `${parent.id}.${id}`;
    const c = new Obj(st, { kind, id, body, parent, role: o.role, tags: o.tags, text: o.text, textSize: o.textSize, hidden: o.hidden, minZoom: o.minZoom });
    c._st8.x = pos.x - (o.centered === false ? 0 : 0);
    c._st8.y = pos.y;
    c._st8.vis = !o.hidden;
    window.gsap.set(c._el, { attr: { transform: T(pos.x, pos.y) }, autoAlpha: o.hidden ? 0 : 1 });
    if (o.text) c._curText = o.text.textContent;
    if (rec.live) rec.ev({ type: "exist", obj: c.id, on: true });
    else rec.initialEvents.push({ type: "exist", obj: c.id, on: true });
    return c;
  }
  var sel = (st, objs) => new Sel(st, objs)._wrap();
  var chipFit = (st, rect, size, weight, pad, minW = 0) => function(next) {
    const nw = Math.max(minW, st.measureText(next, size, weight) + pad);
    const cw = this._bgW ?? Number(rect.getAttribute("width"));
    if (Math.abs(nw - cw) < 1) return;
    this._bgW = nw;
    rec.tw(rect, { attr: { x: -cw / 2, width: cw } }, { attr: { x: -nw / 2, width: nw } }, DUR.fast);
  };
  var wrapComp = (o, methods) => {
    Object.assign(o, methods);
    return o._api;
  };
  function cellBody(st, w, h, text, { header = false, role, k = 1 } = {}) {
    const body = svg("g");
    const r = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0, fill: header ? "var(--surface-2)" : "var(--surface)", stroke: "var(--line)", "stroke-width": 1.5 }, body);
    const t = st._textEl(body, text, { size: (header ? FONT.sm + 1 : FONT.md) * k, weight: header ? 650 : 450, fill: role ? roleVar(st, role, "ink") : header ? "var(--ink-2)" : "var(--ink)", cls: "num" });
    return { body, r, t };
  }
  function table(st, spec = {}) {
    const o = st._common(spec, "table");
    if (!Array.isArray(o.columns) || !Array.isArray(o.rows)) throw new VatError(`table({ columns: [...], rows: [[...], ...] }) needs columns and rows arrays.`);
    o.rows.forEach((r, i) => {
      if (!Array.isArray(r) || r.length !== o.columns.length) throw new VatError(`table: row ${i} has ${Array.isArray(r) ? r.length : "no"} cells but there are ${o.columns.length} columns.`);
    });
    const rect = st._rectFor(o.at, "left");
    const txt = (v) => st._valText(v);
    const colW0 = o.columns.map((c, j) => Math.max(st.measureText(st._plain(c), FONT.sm + 1, 650), ...o.rows.map((r) => st.measureText(txt(r[j]), FONT.md, 450))) + 34);
    const W0 = colW0.reduce((a, b) => a + b, 0), H0 = 42 + 46 * o.rows.length;
    const k = clamp(Math.min(rect.w * 0.86 / W0, rect.h * 0.62 / H0), 1, 1.5);
    const colW = colW0.map((w) => w * k), rowH = 46 * k, headH = 42 * k;
    const W = colW.reduce((a, b) => a + b, 0), H = headH + rowH * o.rows.length;
    const body = svg("g");
    const comp = st._create("table", body, o, { at0: { x: rect.x + Math.max(0, (rect.w - W) / 2), y: rect.y + Math.max(0, (rect.h - H) / 2) } });
    const headers = [], cells = [];
    let x = 0;
    o.columns.forEach((c, j) => {
      const { body: b, t } = cellBody(st, colW[j], headH, st._plain(c), { header: true, k });
      headers.push(child(st, comp, "table-header", b, { x: x + colW[j] / 2, y: headH / 2 }, { text: t, id: o.id ? `${o.id}.h${j}` : void 0 }));
      x += colW[j];
    });
    const addRowCells = (vals, ri, hidden) => {
      let cx = 0;
      const row = vals.map((v, j) => {
        const { body: b, t } = cellBody(st, colW[j], rowH, txt(v), { k });
        const c = child(st, comp, "table-cell", b, { x: cx + colW[j] / 2, y: headH + rowH * ri + rowH / 2 }, { text: t, hidden, id: o.id ? `${o.id}.r${ri}c${j}` : void 0 });
        if (v && typeof v === "object" && v.id) st._valIndex.set(v.id, c);
        cx += colW[j];
        return c;
      });
      cells[ri] = row;
      return row;
    };
    o.rows.forEach((r, i) => addRowCells(r, i, false));
    const colIndex = (c) => {
      if (typeof c === "number") {
        if (c < 0 || c >= o.columns.length) throw new VatError(`table: column ${c} does not exist (0..${o.columns.length - 1}).`);
        return c;
      }
      const j = o.columns.findIndex((n) => n === c || st._plain(n) === c);
      if (j < 0) throw new VatError(`table: no column named '${c}'. Columns: ${o.columns.map((n) => `'${n}'`).join(", ")}.`);
      return j;
    };
    return wrapComp(comp, {
      cell(r, c) {
        const row = cells[r];
        if (!row) throw new VatError(`table.cell(${r}, …): row ${r} does not exist (0..${cells.length - 1}).`);
        return row[colIndex(c)]._api;
      },
      row(r) {
        if (!cells[r]) throw new VatError(`table.row(${r}): no such row.`);
        return sel(st, cells[r]);
      },
      col(c) {
        const j = colIndex(c);
        return sel(st, cells.map((r) => r[j]));
      },
      header(c) {
        return headers[colIndex(c)]._api;
      },
      addRow(vals, opt) {
        if (!Array.isArray(vals) || vals.length !== o.columns.length) throw new VatError(`table.addRow: need ${o.columns.length} values.`);
        const row = addRowCells(vals, cells.length, true);
        rec.par(() => row.forEach((c) => c.show(opt)));
        return sel(st, row);
      }
    });
  }
  function plot(st, spec = {}) {
    const o = st._common(spec, "plot");
    for (const ax of ["x", "y"]) {
      const a = o[ax];
      if (!a || !Array.isArray(a.domain) || a.domain.length !== 2 || !(a.domain[1] > a.domain[0])) throw new VatError(`plot: ${ax}.domain must be [min, max] with max > min.`);
    }
    const rect = st._rectFor(o.at, "right");
    const ml = 78, mb = 64, mt = 18, mr = 24;
    const iw = rect.w - ml - mr, ih = rect.h - mt - mb;
    const [x0, x1] = o.x.domain, [y0, y1] = o.y.domain;
    const sx = (x) => ml + (x - x0) / (x1 - x0) * iw;
    const sy = (y) => mt + ih - (y - y0) / (y1 - y0) * ih;
    const body = svg("g");
    const axes = svg("g", { class: "plot-axes" }, body);
    if (o.grid !== false) {
      for (const t of niceTicks(x0, x1)) svg("line", { x1: sx(t), x2: sx(t), y1: mt, y2: mt + ih, class: "grid" }, axes);
      for (const t of niceTicks(y0, y1)) svg("line", { x1: ml, x2: ml + iw, y1: sy(t), y2: sy(t), class: "grid" }, axes);
    }
    svg("line", { x1: ml, x2: ml + iw, y1: mt + ih, y2: mt + ih, class: "axis" }, axes);
    svg("line", { x1: ml, x2: ml, y1: mt, y2: mt + ih, class: "axis" }, axes);
    for (const t of niceTicks(x0, x1)) {
      const e = st._textEl(axes, fmt(t, void 0, st._ctx.lang), { size: FONT.sm - 1, fill: "var(--ink-3)", cls: "num" });
      e.setAttribute("x", sx(t));
      e.setAttribute("y", mt + ih + 20);
    }
    for (const t of niceTicks(y0, y1)) {
      const e = st._textEl(axes, fmt(t, void 0, st._ctx.lang), { size: FONT.sm - 1, fill: "var(--ink-3)", anchor: "end", cls: "num" });
      e.setAttribute("x", ml - 10);
      e.setAttribute("y", sy(t));
    }
    const xl = st._textEl(axes, st._plain(o.x.label || ""), { size: FONT.sm, weight: 600, fill: "var(--ink-2)" });
    xl.setAttribute("x", ml + iw / 2);
    xl.setAttribute("y", mt + ih + 48);
    const yl = st._textEl(axes, st._plain(o.y.label || ""), { size: FONT.sm, weight: 600, fill: "var(--ink-2)" });
    yl.setAttribute("transform", `translate(${ml - 56} ${mt + ih / 2}) rotate(-90)`);
    const comp = st._create("plot", body, o, { at0: { x: rect.x, y: rect.y } });
    const toLocal = (x, y) => ({ x: sx(x), y: sy(y) });
    comp._toWorld = (x, y) => {
      const g = comp._origin();
      return { x: comp._st8.x + g.x + sx(x), y: comp._st8.y + g.y + sy(y) };
    };
    const inDomain = (p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
    const drawIn = (path, L) => rec.tw(path, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": L } }, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": 0 } }, DUR.slow);
    const lineChild = (kind, localPts, op = {}) => {
      const b = svg("g");
      const d = localPts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
      const path = svg("path", { d, fill: "none", "stroke-width": op.width ?? 3, "stroke-linecap": "round", "stroke-linejoin": "round", ...op.dashed ? { "stroke-dasharray": "8 7" } : {} }, b);
      path.setAttribute("stroke", roleVar(st, op.role, "main"));
      let L = 0;
      for (let i = 1; i < localPts.length; i++) L += Math.hypot(localPts[i].x - localPts[i - 1].x, localPts[i].y - localPts[i - 1].y);
      const live = rec.live && !op.hidden;
      const c = child(st, comp, kind, b, { x: 0, y: 0 }, { ...op, hidden: rec.live ? true : op.hidden });
      c._paints.push({ el: path, attr: "stroke", variant: "main" });
      c._flowEl = path;
      Object.defineProperty(c, "_points", { get: () => {
        const g = comp._origin();
        return localPts.map((p) => ({ x: comp._st8.x + g.x + p.x, y: comp._st8.y + g.y + p.y }));
      } });
      if (live) rec.par(() => {
        c._setVis(true, { speed: "fast" });
        if (!op.dashed) drawIn(path, L);
      });
      return c;
    };
    return wrapComp(comp, {
      point(p, op = {}) {
        st._checkRole(op.role);
        if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new VatError(`plot.point({ x, y }) needs numbers (got ${JSON.stringify(p)}).`);
        if (!inDomain(p)) st._warnings.push(`plot.point(${p.x}, ${p.y}) is outside the plot domain.`);
        const b = svg("g");
        const c0 = svg("circle", { r: 9, "stroke-width": 2.5, stroke: "var(--surface)" }, b);
        c0.setAttribute("fill", roleVar(st, op.role, "main"));
        let t = null;
        if (op.label) {
          t = st._textEl(b, st._plain(op.label), { size: FONT.sm, weight: 550, fill: "var(--ink-2)", anchor: "start" });
          t.setAttribute("x", 14);
        }
        const hidden = rec.live ? true : op.hidden;
        const c = child(st, comp, "plot-point", b, toLocal(p.x, p.y), { ...op, hidden, text: t });
        c._paints.push({ el: c0, attr: "fill", variant: "main" });
        if (op.draggable) {
          c._el.dataset.drag = JSON.stringify({ plot: comp.id, ...op.draggable, x0, x1, y0, y1 });
          c._drag = { sx, sy, ml, mt, iw, ih };
        }
        if (rec.live && !op.hidden) c._setVis(true, { speed: "fast" });
        return c._api;
      },
      points(ps, op = {}) {
        if (!Array.isArray(ps)) throw new VatError(`plot.points([...]) needs an array of { x, y }.`);
        const objs = [];
        rec.par(() => ps.forEach((p) => objs.push(st._objOf(this.point({ x: p.x, y: p.y }, { ...op, ...p, label: p.label ?? op.label })))));
        return sel(st, objs);
      },
      curve(f, op = {}) {
        if (typeof f !== "function") throw new VatError(`plot.curve(f) needs a function x => y.`);
        const [a, b] = op.domain || [x0, x1];
        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const x = a + (b - a) * i / 160, y = f(x);
          if (Number.isFinite(y)) pts.push(toLocal(x, clamp(y, y0 - (y1 - y0) * 0.02, y1 + (y1 - y0) * 0.02)));
        }
        if (pts.length < 2) throw new VatError(`plot.curve: f returned no finite values in [${a}, ${b}].`);
        return lineChild("plot-curve", pts, op)._api;
      },
      polyline(ps, op = {}) {
        return lineChild("plot-line", ps.map((p) => toLocal(p.x, p.y)), op)._api;
      },
      segment(p, q, op = {}) {
        return lineChild("plot-segment", [toLocal(p.x, p.y), toLocal(q.x, q.y)], { width: 2.5, ...op })._api;
      },
      circle(c, r, op = {}) {
        const b = svg("g");
        const e = svg("ellipse", { cx: 0, cy: 0, rx: Math.abs(sx(c.x + r) - sx(c.x)), ry: Math.abs(sy(c.y + r) - sy(c.y)), fill: "none", "stroke-width": 2.5, "stroke-dasharray": "7 6" }, b);
        e.setAttribute("stroke", roleVar(st, op.role, "main"));
        const ch = child(st, comp, "plot-circle", b, toLocal(c.x, c.y), { ...op, hidden: rec.live ? true : op.hidden });
        ch._paints.push({ el: e, attr: "stroke", variant: "main" });
        if (rec.live && !op.hidden) ch._setVis(true);
        return ch._api;
      },
      region(f, op = {}) {
        const nx = op.resolution ?? 48, ny = Math.round(nx * ih / iw);
        const b = svg("g", { opacity: 0.55 });
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x = x0 + (x1 - x0) * (i + 0.5) / nx, y = y0 + (y1 - y0) * (j + 0.5) / ny;
          const role = f(x, y);
          if (!role) continue;
          st._checkRole(role);
          svg("rect", { x: ml + iw * i / nx, y: mt + ih - ih * (j + 1) / ny, width: iw / nx + 0.5, height: ih / ny + 0.5, fill: roleVar(st, role, "soft") }, b);
        }
        const ch = child(st, comp, "plot-region", b, { x: 0, y: 0 }, { ...op, hidden: rec.live ? true : op.hidden });
        comp._body.insertBefore(ch._el, comp._body.children[1] || null);
        if (rec.live && !op.hidden) ch._setVis(true);
        return ch._api;
      }
    });
  }
  function neuralNet(st, spec = {}) {
    const o = st._common(spec, "neuralNet");
    const L = o.layers;
    if (!Array.isArray(L) || L.length < 2 || L.some((n) => !Number.isInteger(n) || n < 1)) throw new VatError(`neuralNet({ layers: [2, 3, 1] }) needs at least two layer sizes.`);
    const ids = o.ids || L.map((n, li) => Array.from({ length: n }, (_, k) => li === 0 ? `x${k + 1}` : li === L.length - 1 ? `y${k + 1}` : L.length === 3 ? `h${k + 1}` : `h${li}_${k + 1}`));
    if (ids.length !== L.length || ids.some((col, i) => col.length !== L[i])) throw new VatError(`neuralNet: ids must match layers (${JSON.stringify(L)}).`);
    const rect = st._rectFor(o.at, "center");
    const top = o.layerNames ? 56 : 24, bottom = 24;
    const maxN = Math.max(...L);
    const R = clamp(Math.min((rect.h - top - bottom) / maxN * 0.32, 42), 18, 42);
    const colX = (i) => 60 + (rect.w - 120) * (L.length === 1 ? 0.5 : i / (L.length - 1));
    const rowY = (i, k) => top + (rect.h - top - bottom) * ((k + 0.5) / L[i]);
    const body = svg("g");
    const comp = st._create("neuralNet", body, o, { at0: { x: rect.x, y: rect.y } });
    const pos = {};
    ids.forEach((col, i) => col.forEach((id, k) => {
      pos[id] = { x: colX(i), y: rowY(i, k), layer: i };
    }));
    if (o.layerNames) o.layerNames.forEach((nm, i) => {
      const t = st._textEl(body, st._plain(nm), { size: FONT.sm, weight: 650, fill: "var(--ink-3)" });
      t.setAttribute("x", colX(i));
      t.setAttribute("y", 18);
    });
    const nodes = /* @__PURE__ */ new Map(), edges = /* @__PURE__ */ new Map(), weights = /* @__PURE__ */ new Map(), biases = /* @__PURE__ */ new Map(), nvals = /* @__PURE__ */ new Map();
    const vals = o.values || {};
    const wKey = (a, b) => `${a}>${b}`;
    const showW = o.weights ?? "on-focus";
    for (let i = 0; i < L.length - 1; i++) ids[i].forEach((a) => ids[i + 1].forEach((b, bi) => {
      const pa = pos[a], pb = pos[b];
      const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      const p1 = { x: pa.x + Math.cos(ang) * R, y: pa.y + Math.sin(ang) * R }, p2 = { x: pb.x - Math.cos(ang) * (R + 3), y: pb.y - Math.sin(ang) * (R + 3) };
      const eb = svg("g");
      const line = svg("line", { x1: p1.x - pa.x, y1: p1.y - pa.y, x2: p2.x - pa.x, y2: p2.y - pa.y, "stroke-width": 2.2, "stroke-linecap": "round" }, eb);
      line.setAttribute("stroke", "var(--line)");
      const e = child(st, comp, "net-edge", eb, { x: pa.x, y: pa.y }, { id: `${a}-${b}`, tags: [`from-${a}`, `to-${b}`] });
      e._paints.push({ el: line, attr: "stroke", variant: "main" });
      e._flowEl = line;
      edges.set(wKey(a, b), e);
      const t = 0.28 + 0.44 * (ids[i + 1].length > 1 ? (ids[i].indexOf(a) + bi) % 3 / 2 : 0.5);
      const wv = vals.weights?.[wKey(a, b)] ?? vals.weights?.[`${a}-${b}`];
      const str = wv !== void 0 ? st._valText(wv) : "w";
      const ww = st.measureText(str, FONT.sm, 650) + 14;
      const wb = svg("g");
      const wr = svg("rect", { x: -ww / 2, y: -13, width: ww, height: 26, rx: 7, fill: "var(--surface)", stroke: "var(--line)", "stroke-width": 1.2 }, wb);
      const wt = st._textEl(wb, str, { size: FONT.sm, weight: 650, fill: "var(--ink-2)", cls: "num" });
      const wo = child(st, comp, "net-weight", wb, { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }, { id: `w_${a}_${b}`, text: wt, hidden: showW !== "always", textSize: "damped" });
      wo._fit = chipFit(st, wr, FONT.sm, 650, 14, 30);
      if (wv && wv.id) st._valIndex.set(wv.id, wo);
      weights.set(wKey(a, b), wo);
    }));
    ids.forEach((col, i) => col.forEach((id) => {
      const p = pos[id];
      const nb = svg("g");
      const c = svg("circle", { r: R, "stroke-width": 2.5 }, nb);
      const lab = st._textEl(nb, id.replace(/^([a-z]+)(\d+)$/i, (m, a, d) => a + d.split("").map((ch) => "₀₁₂₃₄₅₆₇₈₉"[ch]).join("")), { size: FONT.sm, weight: 600, fill: "var(--ink-3)" });
      lab.setAttribute("y", -R - 14);
      const n = child(st, comp, "net-node", nb, p, { id, tags: [`layer-${i}`] });
      st._paint(n, c, o.role, "soft", "main");
      if (!o.role) {
        c.setAttribute("fill", "var(--surface)");
        c.setAttribute("stroke", "var(--ink-3)");
      }
      nodes.set(id, n);
      const v0 = i === 0 ? vals.inputs?.[id] : vals.activations?.[id];
      const vb2 = svg("g");
      const vt = st._textEl(vb2, v0 !== void 0 ? st._valText(v0) : "", { size: FONT.md - 1, weight: 650, fill: "var(--ink)", cls: "num" });
      const nv = child(st, n, "net-value", vb2, { x: 0, y: 0 }, { id: `v_${id}`, text: vt, textSize: "damped" });
      nv._curText = vt.textContent;
      if (v0 && v0.id) st._valIndex.set(v0.id, nv);
      nvals.set(id, nv);
      if (i > 0 && o.bias !== false) {
        const bv = vals.biases?.[id];
        const str = bv !== void 0 ? `b ${st._valText(bv)}` : "b";
        const bw = st.measureText(str, FONT.sm - 2, 600) + 10;
        const bb = svg("g");
        const br = svg("rect", { x: -bw / 2, y: -12, width: bw, height: 24, rx: 7, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 1 }, bb);
        const bt = st._textEl(bb, str, { size: FONT.sm - 1, weight: 600, fill: "var(--ink-2)", cls: "num" });
        const bo = child(st, n, "net-bias", bb, { x: R * 0.92, y: R * 0.92 }, { id: `b_${id}`, text: bt, textSize: "damped" });
        bo._fit = chipFit(st, br, FONT.sm - 2, 600, 10, 24);
        if (bv && bv.id) st._valIndex.set(bv.id, bo);
        biases.set(id, bo);
      }
    }));
    const need = (m, k, what) => {
      const x = m.get(k);
      if (!x) throw new VatError(`neuralNet.${what}: '${k}' does not exist. Node ids: ${[...nodes.keys()].join(", ")}.`);
      return x._api;
    };
    return wrapComp(comp, {
      node: (id) => need(nodes, id, `node('${id}')`),
      nodes: () => sel(st, [...nodes.values()]),
      edge: (a, b) => need(edges, wKey(a, b), `edge('${a}', '${b}')`),
      edges: () => sel(st, [...edges.values()]),
      layer(i) {
        if (!ids[i]) throw new VatError(`neuralNet.layer(${i}): layers are 0..${ids.length - 1}.`);
        return sel(st, ids[i].map((id) => nodes.get(id)));
      },
      nodeValue: (id) => need(nvals, id, `nodeValue('${id}')`),
      weight: (a, b) => need(weights, wKey(a, b), `weight('${a}', '${b}')`),
      weights: () => sel(st, [...weights.values()]),
      bias: (id) => need(biases, id, `bias('${id}')`)
    });
  }
  function graph(st, spec = {}) {
    const o = st._common(spec, "graph");
    if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) throw new VatError(`graph({ nodes: [...], edges: [...] }) needs nodes and edges.`);
    const rect = st._rectFor(o.at, "center");
    const ids = o.nodes.map((n) => n.id);
    o.edges.forEach((e) => {
      if (!ids.includes(e.from) || !ids.includes(e.to)) throw new VatError(`graph: edge ${e.from} → ${e.to} uses an unknown node id.`);
    });
    const layout = o.layout || "layered";
    const pos = {};
    if (layout === "circle" || layout === "force") {
      const cx = rect.w / 2, cy = rect.h / 2, r = Math.min(rect.w, rect.h) * 0.36;
      ids.forEach((id, i) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / ids.length;
        pos[id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      });
      if (layout === "force") for (let it = 0; it < 200; it++) {
        for (const a of ids) for (const b of ids) if (a < b) {
          const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y, d = Math.hypot(dx, dy) || 1, f = 9e3 / (d * d);
          pos[a].x -= dx / d * f;
          pos[a].y -= dy / d * f;
          pos[b].x += dx / d * f;
          pos[b].y += dy / d * f;
        }
        for (const e of o.edges) {
          const a = pos[e.from], b = pos[e.to], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 180) * 0.02;
          a.x += dx / d * f;
          a.y += dy / d * f;
          b.x -= dx / d * f;
          b.y -= dy / d * f;
        }
        for (const id of ids) {
          pos[id].x = clamp(pos[id].x, 80, rect.w - 80);
          pos[id].y = clamp(pos[id].y, 40, rect.h - 40);
        }
      }
    } else {
      const depth = Object.fromEntries(ids.map((id) => [id, 0]));
      for (let k = 0; k < ids.length; k++) for (const e of o.edges) depth[e.to] = Math.max(depth[e.to], depth[e.from] + 1);
      const maxD = Math.max(...Object.values(depth));
      const byD = {};
      ids.forEach((id) => (byD[depth[id]] = byD[depth[id]] || []).push(id));
      const down = o.direction === "down";
      for (const [d, list] of Object.entries(byD)) list.forEach((id, k) => {
        const a = maxD ? Number(d) / maxD : 0.5, b = (k + 0.5) / list.length;
        pos[id] = down ? { x: 80 + (rect.w - 160) * b, y: 50 + (rect.h - 100) * a } : { x: 90 + (rect.w - 180) * a, y: 40 + (rect.h - 80) * b };
      });
    }
    const body = svg("g");
    const comp = st._create("graph", body, o, { at0: { x: rect.x, y: rect.y } });
    const nodes = /* @__PURE__ */ new Map(), edges = /* @__PURE__ */ new Map();
    const boxes = {};
    for (const n of o.nodes) {
      const str = st._plain(n.label ?? n.id);
      const w = Math.max(64, st.measureText(str, FONT.md, 550) + 32), h = 46;
      boxes[n.id] = { w, h };
    }
    for (const e of o.edges) {
      const A = { ...boxes[e.from], cx: pos[e.from].x, cy: pos[e.from].y }, B = { ...boxes[e.to], cx: pos[e.to].x, cy: pos[e.to].y };
      const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 4), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8);
      const eb = svg("g");
      const path = svg("path", { d: `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`, fill: "none", "stroke-width": 2.4, "marker-end": `url(#${st._marker(e.role)})` }, eb);
      path.setAttribute("stroke", roleVar(st, e.role, "main"));
      let t = null;
      if (e.label) {
        const lg = svg("g", { transform: T((p1.x + p2.x) / 2, (p1.y + p2.y) / 2) }, eb), s = st._plain(e.label), lw = st.measureText(s, FONT.sm, 550) + 14;
        svg("rect", { x: -lw / 2, y: -13, width: lw, height: 26, rx: 7, fill: "var(--surface)", stroke: "var(--line-2)" }, lg);
        t = st._textEl(lg, s, { size: FONT.sm, weight: 550, fill: "var(--ink-2)" });
      }
      const c = child(st, comp, "graph-edge", eb, { x: 0, y: 0 }, { id: `${e.from}-${e.to}`, text: t, role: e.role });
      c._paints.push({ el: path, attr: "stroke", variant: "main" });
      c._flowEl = path;
      c._points = Array.from({ length: 25 }, (_, i) => {
        const g = comp._origin();
        return { x: comp._st8.x + g.x + p1.x + (p2.x - p1.x) * i / 24, y: comp._st8.y + g.y + p1.y + (p2.y - p1.y) * i / 24 };
      });
      edges.set(`${e.from}>${e.to}`, c);
    }
    for (const n of o.nodes) {
      st._checkRole(n.role);
      const { w, h } = boxes[n.id];
      const nb = svg("g");
      const r = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, "stroke-width": 2 }, nb);
      const t = st._textEl(nb, st._plain(n.label ?? n.id), { size: FONT.md, weight: 550, fill: n.role ? roleVar(st, n.role, "ink") : "var(--ink)" });
      const c = child(st, comp, "graph-node", nb, pos[n.id], { id: n.id, tags: n.tags, text: t, role: n.role });
      st._paint(c, r, n.role, "soft", "main");
      if (!n.role) {
        r.setAttribute("fill", "var(--surface)");
        r.setAttribute("stroke", "var(--ink-3)");
      }
      nodes.set(n.id, c);
    }
    return wrapComp(comp, {
      node(id) {
        const x = nodes.get(id);
        if (!x) throw new VatError(`graph.node('${id}'): unknown. Nodes: ${ids.join(", ")}.`);
        return x._api;
      },
      edge(a, b) {
        const x = edges.get(`${a}>${b}`);
        if (!x) throw new VatError(`graph.edge('${a}', '${b}'): no such edge.`);
        return x._api;
      },
      nodes: () => sel(st, [...nodes.values()]),
      edges: () => sel(st, [...edges.values()])
    });
  }
  function grid(st, spec = {}) {
    const o = st._common(spec, "grid");
    if (!(o.rows > 0 && o.cols > 0)) throw new VatError(`grid({ rows, cols }) needs positive sizes.`);
    const rect = st._rectFor(o.at, "center");
    const s = Math.min((rect.w - 20) / o.cols, (rect.h - 20) / o.rows, 84);
    const W = s * o.cols, H = s * o.rows;
    const body = svg("g");
    const comp = st._create("grid", body, o, { at0: { x: rect.x + (rect.w - W) / 2, y: rect.y + (rect.h - H) / 2 } });
    const cells = [];
    for (let r = 0; r < o.rows; r++) {
      cells[r] = [];
      for (let c = 0; c < o.cols; c++) {
        const v = o.values?.[r]?.[c];
        const b = svg("g");
        const rr = svg("rect", { x: -s / 2, y: -s / 2, width: s, height: s, "stroke-width": 1.5 }, b);
        let t = null;
        if (v !== void 0 && o.showValues !== false) t = st._textEl(b, st._valText(v), { size: clamp(s * 0.36, 12, FONT.md), weight: 500, fill: "var(--ink)", cls: "num" });
        const ch = child(st, comp, "grid-cell", b, { x: c * s + s / 2, y: r * s + s / 2 }, { text: t, id: o.id ? `${o.id}.r${r}c${c}` : void 0, tags: [`row-${r}`, `col-${c}`] });
        st._paint(ch, rr, o.role, "soft", null);
        if (!o.role) rr.setAttribute("fill", "var(--surface)");
        rr.setAttribute("stroke", "var(--line)");
        if (v && typeof v === "object" && v.id) st._valIndex.set(v.id, ch);
        cells[r][c] = ch;
      }
    }
    const cell = (r, c) => {
      const x = cells[r]?.[c];
      if (!x) throw new VatError(`grid.cell(${r}, ${c}): outside ${o.rows}×${o.cols}.`);
      return x;
    };
    return wrapComp(comp, {
      cell: (r, c) => cell(r, c)._api,
      cells: () => sel(st, cells.flat()),
      row: (r) => sel(st, cells[r] || []),
      col: (c) => sel(st, cells.map((row) => row[c]).filter(Boolean)),
      window(r, c, h, w, op = {}) {
        st._checkRole(op.role);
        const b = svg("g");
        const rr = svg("rect", { x: 0, y: 0, width: w * s, height: h * s, rx: 6, fill: "none", "stroke-width": 4 }, b);
        rr.setAttribute("stroke", roleVar(st, op.role || "accent", "main"));
        const win = child(st, comp, "grid-window", b, { x: c * s, y: r * s }, { ...op, hidden: rec.live ? true : op.hidden });
        win._paints.push({ el: rr, attr: "stroke", variant: "main" });
        win._rc = { r, c };
        if (rec.live && !op.hidden) win._setVis(true);
        return wrapComp(win, {
          slideTo(nr, nc, so) {
            cell(nr, nc);
            cell(nr + h - 1, nc + w - 1);
            win._rc = { r: nr, c: nc };
            win._moveLocal(nc * s, nr * s, so);
            return win._api;
          },
          cells() {
            const { r: r0, c: c0 } = win._rc;
            const out = [];
            for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) out.push(cell(r0 + i, c0 + j));
            return sel(st, out);
          }
        });
      }
    });
  }
  function numberLine(st, spec = {}) {
    const o = st._common(spec, "numberLine");
    const [a, b] = o.domain || [];
    if (!(b > a)) throw new VatError(`numberLine({ domain: [min, max] }) needs max > min.`);
    const rect = st._rectFor(o.at, "bottom");
    const W = rect.w - 80, y = rect.h / 2;
    const sx = (x) => 40 + (x - a) / (b - a) * W;
    const body = svg("g");
    svg("line", { x1: 30, x2: W + 50, y1: y, y2: y, class: "axis" }, body);
    for (const t of niceTicks(a, b, o.ticks ?? 10)) {
      svg("line", { x1: sx(t), x2: sx(t), y1: y - 7, y2: y + 7, class: "axis" }, body);
      const e = st._textEl(body, fmt(t, void 0, st._ctx.lang), { size: FONT.sm, fill: "var(--ink-3)", cls: "num" });
      e.setAttribute("x", sx(t));
      e.setAttribute("y", y + 26);
    }
    const comp = st._create("numberLine", body, o, { at0: { x: rect.x, y: rect.y } });
    return wrapComp(comp, {
      mark(x, op = {}) {
        st._checkRole(op.role);
        const g = svg("g");
        const c = svg("circle", { r: 10, stroke: "var(--surface)", "stroke-width": 2.5 }, g);
        c.setAttribute("fill", roleVar(st, op.role || "accent", "main"));
        let t = null;
        if (op.label) {
          t = st._textEl(g, st._plain(op.label), { size: FONT.sm, weight: 600, fill: roleVar(st, op.role, "ink") });
          t.setAttribute("y", -26);
        }
        const m = child(st, comp, "line-mark", g, { x: sx(x), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden });
        m._paints.push({ el: c, attr: "fill", variant: "main" });
        m._toX = (v) => sx(v);
        if (rec.live && !op.hidden) m._setVis(true);
        return m._api;
      },
      interval(x0, x1, op = {}) {
        const g = svg("g");
        const l = svg("line", { x1: 0, x2: sx(x1) - sx(x0), y1: 0, y2: 0, "stroke-width": 9, "stroke-linecap": "round", opacity: 0.7 }, g);
        l.setAttribute("stroke", roleVar(st, op.role || "accent", "main"));
        let t = null;
        if (op.label) {
          t = st._textEl(g, st._plain(op.label), { size: FONT.sm, weight: 600, fill: "var(--ink-2)" });
          t.setAttribute("x", (sx(x1) - sx(x0)) / 2);
          t.setAttribute("y", -22);
        }
        const m = child(st, comp, "line-interval", g, { x: sx(x0), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden });
        m._paints.push({ el: l, attr: "stroke", variant: "main" });
        if (rec.live && !op.hidden) m._setVis(true);
        return m._api;
      }
    });
  }
  function sequence(st, spec = {}) {
    const o = st._common(spec, "sequence");
    if (!Array.isArray(o.actors) || o.actors.length < 2) throw new VatError(`sequence({ actors: [{ id, label }, …] }) needs at least two actors.`);
    const rect = st._rectFor(o.at, "main");
    const n = o.actors.length;
    const ax = (i) => 110 + (rect.w - 220) * (n === 1 ? 0.5 : i / (n - 1));
    const body = svg("g");
    const comp = st._create("sequence", body, o, { at0: { x: rect.x, y: rect.y } });
    const actors = /* @__PURE__ */ new Map();
    o.actors.forEach((a, i) => {
      st._checkRole(a.role);
      svg("line", { x1: ax(i), x2: ax(i), y1: 60, y2: rect.h - 10, class: "lifeline" }, body);
      const g = svg("g");
      const str = st._plain(a.label);
      const w = Math.max(120, st.measureText(str, FONT.md, 650) + 36);
      const r = svg("rect", { x: -w / 2, y: -24, width: w, height: 48, rx: 12, "stroke-width": 2 }, g);
      const t = st._textEl(g, str, { size: FONT.md, weight: 650, fill: a.role ? roleVar(st, a.role, "ink") : "var(--ink)" });
      const c = child(st, comp, "seq-actor", g, { x: ax(i), y: 30 }, { id: a.id, text: t, role: a.role });
      st._paint(c, r, a.role, "soft", "main");
      actors.set(a.id, { c, x: ax(i) });
    });
    let row = 0;
    const msgs = [];
    const nextY = () => 110 + 72 * row++;
    const actor = (id) => {
      const a = actors.get(id);
      if (!a) throw new VatError(`sequence: unknown actor '${id}'. Actors: ${[...actors.keys()].join(", ")}.`);
      return a;
    };
    return wrapComp(comp, {
      actor: (id) => actor(id).c._api,
      messages: () => sel(st, msgs),
      message(from, to, label, op = {}) {
        st._checkRole(op.role);
        const A = actor(from), B = actor(to), y = nextY();
        const dir = B.x > A.x ? 1 : -1;
        const x1 = A.x + 6 * dir, x2 = B.x - 10 * dir;
        const g = svg("g");
        const path = svg("path", { d: `M${x1} 0 L${x2} 0`, fill: "none", "stroke-width": 3, "marker-end": `url(#${st._marker(op.role)})`, ...op.dashed ? { "stroke-dasharray": "8 6" } : {} }, g);
        path.setAttribute("stroke", roleVar(st, op.role, "main"));
        const str = st._plain(label);
        const lw = st.measureText(str, FONT.md, 650) + 22;
        const lg = svg("g", { transform: T((x1 + x2) / 2, -22) }, g);
        const mr = svg("rect", { x: -lw / 2, y: -16, width: lw, height: 32, rx: 8, fill: "var(--surface)", stroke: roleVar(st, op.role, "main"), "stroke-width": 1.5 }, lg);
        const t = st._textEl(lg, str, { size: FONT.md, weight: 650, fill: roleVar(st, op.role, "ink") });
        if (op.detail) {
          const d = st._textEl(g, st._plain(op.detail), { size: FONT.sm, fill: "var(--ink-2)" });
          d.setAttribute("x", (x1 + x2) / 2);
          d.setAttribute("y", 20);
        }
        const L = Math.abs(x2 - x1);
        const live = rec.live;
        const m = child(st, comp, "seq-message", g, { x: 0, y }, { ...op, text: t, hidden: true, tags: [...op.tags || [], `from-${from}`, `to-${to}`] });
        m._paints.push({ el: path, attr: "stroke", variant: "main" });
        m._flowEl = path;
        m._fit = chipFit(st, mr, FONT.md, 650, 22, 40);
        m._points = Array.from({ length: 25 }, (_, i) => {
          const gg = comp._origin();
          return { x: comp._st8.x + gg.x + x1 + (x2 - x1) * i / 24, y: comp._st8.y + gg.y + y };
        });
        msgs.push(m);
        if (live && !op.hidden) rec.par(() => {
          m._setVis(true, { speed: "fast" });
          if (!op.dashed) rec.tw(path, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": L } }, { attr: { "stroke-dasharray": `${L} ${L}`, "stroke-dashoffset": 0 } }, DUR.normal);
        });
        return m._api;
      },
      note(actorId, text, op = {}) {
        const A = actor(actorId), y = nextY();
        const g = svg("g");
        const str = st._plain(text);
        const lines = st._wrapLines(str, FONT.sm, 450, 260);
        const w = Math.max(...lines.map((l) => st.measureText(l, FONT.sm, 450))) + 24, h = lines.length * FONT.sm * 1.25 + 16;
        svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 8, fill: "var(--warn-soft)", stroke: "var(--line)" }, g);
        const t = st._textEl(g, lines.join("\n"), { size: FONT.sm, fill: "var(--ink)" });
        const isLast = [...actors.values()].pop() === A;
        const nn = child(st, comp, "seq-note", g, { x: A.x + (isLast ? -w / 2 - 14 : w / 2 + 14), y }, { ...op, text: t, hidden: rec.live ? true : op.hidden });
        if (rec.live && !op.hidden) nn._setVis(true);
        return nn._api;
      }
    });
  }
  function stateMachine(st, spec = {}) {
    const o = st._common(spec, "stateMachine");
    if (!Array.isArray(o.states) || !o.states.length) throw new VatError(`stateMachine({ states: [{ id, label }], transitions: [...], initial }) needs states.`);
    const ids = o.states.map((s) => s.id);
    if (!ids.includes(o.initial)) throw new VatError(`stateMachine: initial '${o.initial}' is not a state id (${ids.join(", ")}).`);
    const rect = st._rectFor(o.at, "center");
    const n = ids.length;
    const sizes = {};
    for (const s of o.states) sizes[s.id] = { w: Math.max(90, st.measureText(st._plain(s.label), FONT.sm + 1, 650) + 30), h: 46 };
    const need = Object.values(sizes).reduce((a, s) => a + s.w, 0) + (o.transitions || []).reduce((a, t) => a + (t.label ? st.measureText(st._plain(t.label), FONT.sm - 1, 600) + 24 : 40), 0);
    const vertical = rect.h > rect.w * 1.2 || need > rect.w * 0.95;
    const pos = {};
    const maxW = Math.max(...Object.values(sizes).map((s) => s.w));
    ids.forEach((id, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      pos[id] = vertical ? { x: Math.min(rect.w / 2, maxW / 2 + 20), y: 40 + (rect.h - 80) * t } : { x: 80 + (rect.w - 160) * t, y: rect.h / 2 };
    });
    const body = svg("g");
    const comp = st._create("stateMachine", body, o, { at0: { x: rect.x, y: rect.y } });
    const trans = /* @__PURE__ */ new Map();
    for (const t of o.transitions || []) {
      if (!pos[t.from] || !pos[t.to]) throw new VatError(`stateMachine: transition ${t.from} → ${t.to} uses an unknown state.`);
      const A = { ...sizes[t.from], cx: pos[t.from].x, cy: pos[t.from].y }, B = { ...sizes[t.to], cx: pos[t.to].x, cy: pos[t.to].y };
      const back = (o.transitions || []).some((u) => u.from === t.to && u.to === t.from);
      const p1 = edgePoint(A, { x: B.cx, y: B.cy }, 3), p2 = edgePoint(B, { x: A.cx, y: A.cy }, 8);
      const off = back ? (vertical ? 26 : -26) * (ids.indexOf(t.from) < ids.indexOf(t.to) ? 1 : -1) : 0;
      const mx = (p1.x + p2.x) / 2 + (vertical ? off : 0), my = (p1.y + p2.y) / 2 + (vertical ? 0 : off);
      const g = svg("g");
      const path = svg("path", { d: `M${p1.x} ${p1.y} Q${mx} ${my} ${p2.x} ${p2.y}`, fill: "none", "stroke-width": 2.2, stroke: "var(--ink-3)", "marker-end": `url(#${st._marker()})` }, g);
      let tx = null;
      if (t.label) {
        const lg = svg("g", { transform: vertical ? T(Math.max(mx, (p1.x + p2.x) / 2) + 16 + (off > 0 ? off : 0), my) : T(mx, my + (off ? Math.sign(off) * 14 : -16)) }, g);
        tx = st._textEl(lg, st._plain(t.label), { size: FONT.sm - 1, weight: 600, fill: "var(--ink-2)", anchor: vertical ? "start" : "middle" });
      }
      const c = child(st, comp, "sm-transition", g, { x: 0, y: 0 }, { id: `${t.from}->${t.to}`, text: tx });
      c._paints.push({ el: path, attr: "stroke", variant: "main" });
      c._flowEl = path;
      trans.set(`${t.from}>${t.to}`, c);
    }
    const states = /* @__PURE__ */ new Map();
    for (const s of o.states) {
      st._checkRole(s.role);
      const { w, h } = sizes[s.id];
      const g = svg("g");
      const r = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, "stroke-width": 2 }, g);
      const t = st._textEl(g, st._plain(s.label), { size: FONT.sm + 1, weight: 650, fill: s.role ? roleVar(st, s.role, "ink") : "var(--ink)" });
      const c = child(st, comp, "sm-state", g, pos[s.id], { id: s.id, text: t, role: s.role });
      st._paint(c, r, s.role, "soft", "main");
      if (!s.role) {
        r.setAttribute("fill", "var(--surface)");
        r.setAttribute("stroke", "var(--ink-3)");
      }
      states.set(s.id, c);
    }
    const mk = svg("g");
    const s0 = sizes[o.initial];
    svg("rect", { x: -s0.w / 2 - 7, y: -s0.h / 2 - 7, width: s0.w + 14, height: s0.h + 14, rx: (s0.h + 14) / 2, fill: "none", stroke: "var(--focus-ring)", "stroke-width": 3.5, class: "sm-marker" }, mk);
    const marker = child(st, comp, "sm-marker", mk, pos[o.initial], { id: o.id ? `${o.id}.current` : void 0 });
    let current = o.initial;
    return wrapComp(comp, {
      state(id) {
        const x = states.get(id);
        if (!x) throw new VatError(`stateMachine.state('${id}'): unknown. States: ${ids.join(", ")}.`);
        return x._api;
      },
      transition(a, b) {
        const x = trans.get(`${a}>${b}`);
        if (!x) throw new VatError(`stateMachine.transition('${a}', '${b}'): not declared.`);
        return x._api;
      },
      goTo(id, op) {
        if (!states.has(id)) throw new VatError(`stateMachine.goTo('${id}'): unknown state.`);
        const tr = trans.get(`${current}>${id}`);
        rec.par(() => {
          if (tr) tr.pulse({ speed: "fast" });
          marker._moveLocal(pos[id].x, pos[id].y, op);
          const sz = sizes[id], r = marker._body.querySelector("rect"), osz = sizes[current];
          rec.tw(r, { attr: { x: -osz.w / 2 - 7, width: osz.w + 14 } }, { attr: { x: -sz.w / 2 - 7, width: sz.w + 14 } }, DUR.normal);
        });
        current = id;
        return comp._api;
      }
    });
  }
  function codeView(st, spec = {}) {
    const o = st._common(spec, "codeView");
    if (typeof o.code !== "string") throw new VatError(`codeView({ code: '...', lang: 'python' }) needs code as a string.`);
    const rect = st._rectFor(o.at, "left");
    const lines = o.code.replace(/\t/g, "    ").split("\n");
    const lh = 34, fs = 19, mono = "var(--font-mono)";
    const W = Math.min(rect.w, Math.max(...lines.map((l) => st.measureText(l || " ", fs, 400, mono))) + 90), H = lines.length * lh + 24;
    const body = svg("g");
    svg("rect", { x: 0, y: 0, width: W, height: H, rx: 14, fill: "var(--surface-2)", stroke: "var(--line)" }, body);
    const comp = st._create("codeView", body, o, { at0: { x: rect.x + Math.max(0, (rect.w - W) / 2), y: rect.y + Math.max(0, (rect.h - H) / 2) } });
    const lineObjs = lines.map((ln, i) => {
      const g = svg("g");
      svg("rect", { x: -W / 2 + 8, y: -lh / 2 + 2, width: W - 16, height: lh - 4, rx: 6, fill: "transparent", class: "code-bg" }, g);
      const no = st._textEl(g, String(i + 1), { size: fs - 3, fill: "var(--ink-3)", anchor: "end", family: mono });
      no.setAttribute("x", -W / 2 + 40);
      const t = st._textEl(g, ln, { size: fs, fill: "var(--ink)", anchor: "start", family: mono });
      t.setAttribute("x", -W / 2 + 54);
      t.setAttribute("xml:space", "preserve");
      return child(st, comp, "code-line", g, { x: W / 2, y: 12 + lh * i + lh / 2 }, { id: o.id ? `${o.id}.L${i + 1}` : void 0, text: t, tags: [`line-${i + 1}`] });
    });
    const cur = svg("g");
    svg("path", { d: "M-8 -9 L6 0 L-8 9 z", fill: "var(--focus-ring)" }, cur);
    const cursor = child(st, comp, "code-cursor", cur, { x: 14, y: 12 + lh / 2 }, { hidden: true });
    let curLine = 0;
    const watches = /* @__PURE__ */ new Map();
    const lineOf = (n) => {
      const x = lineObjs[n - 1];
      if (!x) throw new VatError(`codeView: line ${n} does not exist (1..${lineObjs.length}).`);
      return x;
    };
    return wrapComp(comp, {
      line: (n) => lineOf(n)._api,
      lines: (a, b) => sel(st, lineObjs.slice(a - 1, b)),
      runTo(n, op) {
        const L = lineOf(n);
        rec.par(() => {
          if (!cursor._st8.vis) cursor._setVis(true, { speed: "fast" });
          cursor._moveLocal(14, L._st8.y, op);
          if (curLine) lineObjs[curLine - 1].unhighlight({ speed: "fast" });
          L.highlight({ speed: "fast" });
        });
        curLine = n;
        return comp._api;
      },
      watch(name, v) {
        const str = `${name} = ${st._valText(v)}`;
        if (watches.has(name)) {
          watches.get(name).setText(str);
          return comp._api;
        }
        const g = svg("g");
        const t = st._textEl(g, str, { size: fs, weight: 600, fill: "var(--ink)", anchor: "start", family: mono });
        const w = child(st, comp, "code-watch", g, { x: W + 30, y: 30 + watches.size * 38 }, { text: t, hidden: rec.live });
        w._curText = str;
        if (rec.live) w._setVis(true);
        watches.set(name, w);
        return comp._api;
      }
    });
  }
  function container(st, spec = {}) {
    const o = st._common(spec, "container");
    const rect = st._rectFor(o.at, "center");
    const body = svg("g");
    svg("rect", { x: 0, y: 0, width: rect.w, height: rect.h, rx: 18, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2, "stroke-dasharray": "2 0" }, body);
    if (o.title) {
      const t = st._textEl(body, st._plain(o.title), { size: FONT.sm + 1, weight: 650, fill: "var(--ink-2)", anchor: "start" });
      t.setAttribute("x", 18);
      t.setAttribute("y", 24);
    }
    const comp = st._create("container", body, o, { at0: { x: rect.x, y: rect.y }, layer: "bg" });
    const members = [];
    return wrapComp(comp, { add(...objs) {
      objs.flat().forEach((x) => members.push(st._objOf(x)));
      return comp._api;
    }, members: () => sel(st, members) });
  }
  var BUILTIN_COMPONENTS = { table, plot, neuralNet, graph, grid, numberLine, sequence, stateMachine, codeView, container };

  // engine/src/formula.js
  var SYM = {
    cdot: "·",
    times: "×",
    div: "÷",
    pm: "±",
    le: "≤",
    leq: "≤",
    ge: "≥",
    geq: "≥",
    neq: "≠",
    ne: "≠",
    approx: "≈",
    to: "→",
    rightarrow: "→",
    leftarrow: "←",
    infty: "∞",
    ldots: "…",
    cdots: "⋯",
    sum: "Σ",
    prod: "Π",
    partial: "∂",
    nabla: "∇",
    in: "∈",
    cdotp: "·",
    circ: "∘",
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ε",
    varepsilon: "ε",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    iota: "ι",
    kappa: "κ",
    lambda: "λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    pi: "π",
    rho: "ρ",
    sigma: "σ",
    tau: "τ",
    phi: "φ",
    varphi: "φ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    Gamma: "Γ",
    Delta: "Δ",
    Theta: "Θ",
    Lambda: "Λ",
    Pi: "Π",
    Sigma: "Σ",
    Phi: "Φ",
    Psi: "Ψ",
    Omega: "Ω",
    hat: "",
    bar: ""
  };
  var FUNCS = /* @__PURE__ */ new Set(["log", "ln", "exp", "sin", "cos", "tan", "max", "min", "argmax", "argmin", "mod", "lim", "sgn", "det"]);
  var BIN = /* @__PURE__ */ new Set(["+", "−", "=", "<", ">", "≤", "≥", "≠", "≈", "×", "÷", "·", "±", "→", "∈"]);
  function parseTex(src) {
    let i = 0;
    const s = String(src);
    const peek = () => s[i];
    const readBraceRaw = () => {
      while (s[i] === " ") i++;
      if (s[i] !== "{") throw new VatError(`Formula: expected '{' at position ${i} in "${s}".`);
      let depth = 0, out = "";
      for (; i < s.length; i++) {
        if (s[i] === "{") {
          if (depth++) out += "{";
          continue;
        }
        if (s[i] === "}") {
          if (--depth === 0) {
            i++;
            return out;
          }
          out += "}";
          continue;
        }
        out += s[i];
      }
      throw new VatError(`Formula: missing '}' in "${s}".`);
    };
    const parseArg = () => {
      while (s[i] === " ") i++;
      if (s[i] === "{") {
        i++;
        const r = parseRow("}");
        return r;
      }
      return parseRow(null, true);
    };
    function parseRow(end, single = false) {
      const items = [];
      while (i < s.length) {
        const c = s[i];
        if (end && c === end) {
          i++;
          break;
        }
        if (c === " ") {
          i++;
          continue;
        }
        if (c === "{") {
          i++;
          items.push(parseRow("}"));
        } else if (c === "^" || c === "_") {
          i++;
          const arg = parseArg();
          let prev = items.pop() || { t: "txt", s: "" };
          if (prev.t !== "script") prev = { t: "script", base: prev };
          prev[c === "^" ? "sup" : "sub"] = arg;
          items.push(prev);
        } else if (c === "\\") {
          i++;
          let name = "";
          if (/[A-Za-z]/.test(s[i])) while (/[A-Za-z]/.test(s[i])) name += s[i++];
          else name = s[i++];
          if (name === "slot") {
            const id = readBraceRaw().trim();
            const content = parseArg();
            items.push({ t: "slot", id, content });
          } else if (name === "frac" || name === "dfrac" || name === "tfrac") {
            const num = parseArg(), den = parseArg();
            items.push({ t: "frac", num, den });
          } else if (name === "sqrt") items.push({ t: "sqrt", arg: parseArg() });
          else if (name === "text" || name === "mathrm" || name === "textrm" || name === "operatorname" || name === "textbf" || name === "mathbf") items.push({ t: "txt", s: readBraceRaw(), up: true, bold: name.endsWith("bf") });
          else if (name === "left" || name === "right" || name === "big" || name === "Big") {
          } else if (name === "," || name === ":" || name === ";" || name === " ") items.push({ t: "space", w: 0.22 });
          else if (name === "quad") items.push({ t: "space", w: 1 });
          else if (name === "qquad") items.push({ t: "space", w: 2 });
          else if (name === "{" || name === "}" || name === "%" || name === "_" || name === "#") items.push({ t: "txt", s: name, up: true });
          else if (FUNCS.has(name)) items.push({ t: "txt", s: name, up: true, fn: true });
          else if (SYM[name] !== void 0) {
            const ch = SYM[name];
            if (name === "hat" || name === "bar") items.push(parseArg());
            else items.push({ t: "txt", s: ch, up: !/[a-zα-ω]/.test(ch) || /[Α-Ω]/.test(ch), op: BIN.has(ch), big: name === "sum" || name === "prod" });
          } else throw new VatError(`Formula: unsupported command \\${name} in "${s}".`);
        } else if (/[A-Za-z]/.test(c)) {
          items.push({ t: "txt", s: c });
          i++;
        } else if (/[0-9.,]/.test(c)) {
          let n = "";
          while (i < s.length && /[0-9.,]/.test(s[i])) n += s[i++];
          items.push({ t: "txt", s: n, up: true });
        } else {
          const ch = c === "-" ? "−" : c === "*" ? "·" : c;
          items.push({ t: "txt", s: ch, up: true, op: BIN.has(ch) });
          i++;
        }
        if (single) break;
      }
      return { t: "row", items };
    }
    const row = parseRow(null);
    return row;
  }
  var FormulaBar = class {
    constructor(stage, ctx) {
      this._st = stage;
      this._ctx = ctx;
      this._cur = null;
      this._n = 0;
      this._api = null;
    }
    _measure(str, size, italic, bold) {
      const st = this._st;
      return st.measureText(str, size, bold ? 650 : 400, "var(--font-math)") * (italic ? 1.06 : 1) + (italic ? size * 0.04 : 0);
    }
    _lay(node, size, parent) {
      const g = svg("g", {}, parent);
      switch (node.t) {
        case "txt": {
          const pad = node.op ? size * 0.22 : node.fn ? size * 0.06 : 0;
          const fs = node.big ? size * 1.3 : size;
          const t = svg("text", { x: pad, y: node.big ? size * 0.1 : 0, "font-size": fs, "font-style": node.up ? "normal" : "italic", "font-weight": node.bold ? 650 : 400, class: "fm-t" }, g);
          t.textContent = node.s;
          const w = this._measure(node.s, fs, !node.up, node.bold) + 2 * pad;
          return { g, w, a: fs * 0.72, d: fs * 0.24 };
        }
        case "space":
          return { g, w: size * node.w, a: 0, d: 0 };
        case "row": {
          let x = 0, a = size * 0.6, d = size * 0.2;
          for (const it of node.items) {
            const r = this._lay(it, size, g);
            r.g.setAttribute("transform", T(x, 0));
            x += r.w;
            a = Math.max(a, r.a);
            d = Math.max(d, r.d);
          }
          return { g, w: x, a, d };
        }
        case "script": {
          const b = this._lay(node.base, size, g);
          let w = b.w, a = b.a, d = b.d, ex = 0;
          if (node.sup) {
            const r = this._lay(node.sup, size * 0.68, g);
            r.g.setAttribute("transform", T(b.w + 1, -size * 0.42));
            ex = Math.max(ex, r.w);
            a = Math.max(a, size * 0.42 + r.a);
          }
          if (node.sub) {
            const r = this._lay(node.sub, size * 0.68, g);
            r.g.setAttribute("transform", T(b.w + 1, size * 0.24));
            ex = Math.max(ex, r.w);
            d = Math.max(d, size * 0.24 + r.d);
          }
          return { g, w: w + ex + 2, a, d };
        }
        case "frac": {
          const fs = size * 0.86;
          const n = this._lay(node.num, fs, g), dn = this._lay(node.den, fs, g);
          const w = Math.max(n.w, dn.w) + size * 0.3, axis = size * 0.3;
          n.g.setAttribute("transform", T((w - n.w) / 2, -axis - 5 - n.d));
          dn.g.setAttribute("transform", T((w - dn.w) / 2, -axis + 5 + dn.a));
          svg("line", { x1: 2, x2: w - 2, y1: -axis, y2: -axis, class: "fm-line" }, g);
          return { g, w: w + 4, a: axis + 5 + n.a + n.d, d: -axis + 5 + dn.a + dn.d };
        }
        case "sqrt": {
          const r = this._lay(node.arg, size, g);
          const sw = size * 0.55;
          r.g.setAttribute("transform", T(sw + 2, 0));
          svg("path", { d: `M0 ${-size * 0.25} L${sw * 0.3} ${size * 0.1} L${sw * 0.75} ${-r.a - 4} L${sw + r.w + 4} ${-r.a - 4}`, class: "fm-line", fill: "none" }, g);
          return { g, w: sw + r.w + 6, a: r.a + 6, d: r.d };
        }
        case "slot": {
          const bg = svg("rect", { class: "fm-slot-bg", rx: 8, opacity: 0 }, g);
          const sym = this._lay(node.content, size, g);
          const valText = this._expected(node.id);
          const vw = valText ? this._measure(valText, size * 0.95, false, true) : 0;
          const w = Math.max(sym.w, vw) + 10;
          sym.g.setAttribute("transform", T((w - sym.w) / 2, 0));
          const val = svg("text", { x: w / 2, y: 0, "text-anchor": "middle", "font-size": size * 0.95, "font-weight": 650, class: "fm-val", opacity: 0 }, g);
          const a = Math.max(sym.a, size * 0.72), d = Math.max(sym.d, size * 0.24);
          bg.setAttribute("x", 0);
          bg.setAttribute("y", -a - 4);
          bg.setAttribute("width", w);
          bg.setAttribute("height", a + d + 8);
          const ul = svg("line", { x1: 3, x2: w - 3, y1: d + 3, y2: d + 3, class: "fm-slot-ul" }, g);
          this._slots.set(node.id, { g, sym: sym.g, val, bg, ul, w, a, d, filled: null, hl: false });
          return { g, w, a, d };
        }
        default:
          throw new VatError(`Formula: internal node ${node.t}`);
      }
    }
    _expected(id) {
      const v = this._ctx.trace?.vals.get(id);
      return v ? v.fmt() : null;
    }
    show(tex, o = {}) {
      if (typeof tex !== "string") throw new VatError(`formula.show(tex) needs a TeX string, e.g. 'z = \\slot{x1}{x_1} \\cdot \\slot{w1}{w_1}'.`);
      const st = this._st;
      const layer = st._layer("formula", "hud");
      const g = svg("g", { class: "fm", style: "visibility:hidden;opacity:0" }, layer);
      this._slots = /* @__PURE__ */ new Map();
      const size = 38;
      const panel = svg("rect", { class: "fm-panel", rx: 16 }, g);
      const content = svg("g", {}, g);
      const tree = parseTex(tex);
      const factor = (n) => n && (n.t === "slot" || n.t === "txt" && !n.op && n.s.trim() && !"()[]".includes(n.s) || n.t === "script" && factor(n.base));
      const lint = (n) => {
        if (!n || typeof n !== "object") return;
        if (n.t === "row") n.items.forEach((a, i) => {
          const b = n.items[i + 1];
          if (factor(a) && factor(b) && (a.t === "slot" || b.t === "slot")) this._ctx.warnings.push(`formula "${tex}": put \\cdot between neighbouring factors (a filled slot next to another factor reads like one number).`);
        });
        for (const k2 of ["items", "base", "sup", "sub", "num", "den", "content", "arg"]) {
          const v = n[k2];
          if (Array.isArray(v)) v.forEach(lint);
          else if (v) lint(v);
        }
      };
      lint(tree);
      const r = this._lay(tree, size, content);
      let words = null, ww = 0;
      if (o.words) {
        words = svg("text", { class: "fm-words", "text-anchor": "middle", "font-size": 19 }, g);
        words.textContent = st._plain(o.words);
        ww = st.measureText(words.textContent, 19, 450);
      }
      const W = Math.max(r.w, ww) + 48;
      const maxW = ROOT.w - 80;
      const k = Math.min(1, maxW / W);
      const top = WORLD.h + 6, H = r.a + r.d + (words ? 34 : 0) + 22;
      const cx = ROOT.w / 2;
      content.setAttribute("transform", T(-r.w / 2, 11 + r.a));
      panel.setAttribute("x", -W / 2);
      panel.setAttribute("y", 0);
      panel.setAttribute("width", W);
      panel.setAttribute("height", H);
      if (words) {
        words.setAttribute("x", 0);
        words.setAttribute("y", 11 + r.a + r.d + 26);
      }
      const sc = k < 1 ? ` scale(${k})` : "";
      g.setAttribute("transform", `${T(cx, top + Math.max(0, (ROOT.h - WORLD.h - 12 - H * k) / 2))}${sc}`);
      const prev = this._cur;
      const cur = { g, slots: this._slots, k, ox: cx - r.w / 2 * k, oy: 0, content, base: 11 + r.a };
      cur.oy = top + Math.max(0, (ROOT.h - WORLD.h - 12 - H * k) / 2);
      this._cur = cur;
      rec.par(() => {
        if (prev) rec.tw(prev.g, { autoAlpha: 1 }, { autoAlpha: 0 }, DUR.fast);
        rec.tw(g, { autoAlpha: 0 }, { autoAlpha: 1 }, DUR.fast);
      });
    }
    slot(id) {
      if (!this._cur || !this._cur.slots.has(id)) throw new VatError(`formula.slot('${id}'): no such slot in the current formula. Show a formula containing \\slot{${id}}{…} first.` + (this._cur ? ` Current slots: ${[...this._cur.slots.keys()].join(", ") || "(none)"}.` : ""));
      return Object.freeze({ slotId: id });
    }
    _slot(id) {
      this.slot(id);
      return this._cur.slots.get(id);
    }
    _slotGeom(id) {
      const s = this._slot(id), c = this._cur;
      const m = s.g.getCTM(), mg = c.g.getCTM();
      let lx = 0, ly = 0;
      if (m && mg) {
        const inv = mg.inverse();
        const r = inv.multiply(m);
        lx = r.e;
        ly = r.f;
      }
      const k = c.k;
      const gx = ROOT.w / 2, gy = c.oy;
      return { center: { x: gx + (lx + s.w / 2) * k, y: gy + (ly - (s.a - s.d) / 2) * k } };
    }
    _fillNow(id, text) {
      const s = this._slot(id);
      const from = s.filled;
      s.filled = text;
      rec.par(() => {
        if (from === null) {
          rec.tw(s.sym, { opacity: 1 }, { opacity: 0 }, DUR.fast);
          rec.set(s.val, { textContent: "" }, { textContent: text });
          rec.tw(s.val, { opacity: 0 }, { opacity: 1 }, DUR.fast);
        } else {
          rec.seq(() => {
            rec.tw(s.val, { opacity: 1 }, { opacity: 0 }, DUR.fast / 2);
            rec.set(s.val, { textContent: from }, { textContent: text });
            rec.tw(s.val, { opacity: 0 }, { opacity: 1 }, DUR.fast / 2);
          });
        }
      });
    }
    fill(slotId, v) {
      this._fillNow(slotId, this._st._valText(v));
    }
    highlight(...ids) {
      const want = new Set(ids.flat());
      for (const id of want) this._slot(id);
      rec.par(() => {
        for (const [id, s] of this._cur.slots) {
          const on = want.has(id);
          if (on !== s.hl) {
            s.hl = on;
            rec.tw(s.bg, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }, DUR.fast);
          }
        }
      });
    }
    clear() {
      if (!this._cur) return;
      rec.tw(this._cur.g, { autoAlpha: 1 }, { autoAlpha: 0 }, DUR.fast);
      this._cur = null;
    }
  };

  // engine/src/trace.js
  var Val = class {
    constructor(id, value, sources, op, lang) {
      this.id = id;
      this.value = value;
      this.sources = Object.freeze(sources);
      this.op = op;
      this._lang = lang;
    }
    fmt(dp) {
      return fmt(this.value, dp, this._lang);
    }
    toString() {
      return this.fmt();
    }
    valueOf() {
      return this.value;
    }
  };
  var TraceEvent = class {
    constructor(id, index, payload) {
      this.id = id;
      this.index = index;
      this.payload = Object.freeze({ ...payload });
    }
  };
  function createTrace(lang = "en") {
    const vals = /* @__PURE__ */ new Map();
    const events = /* @__PURE__ */ new Map();
    const order = [];
    const reg = (id, v) => {
      if (typeof id !== "string" || !id) throw new VatError(`Trace ids must be non-empty strings (got ${JSON.stringify(id)}).`);
      if (vals.has(id) || events.has(id)) throw new VatError(`Trace id '${id}' is used twice. Every value/event needs its own id (e.g. '${id}1', '${id}2', or '${id}-' + i in a loop).`);
      if (!Number.isFinite(v.value)) throw new VatError(`Trace value '${id}' is ${v.value}. Check the inputs of this computation (division by zero? missing input?).`);
      vals.set(id, v);
      order.push(id);
      return v;
    };
    const need = (id, xs) => xs.forEach((x, i) => {
      if (!(x instanceof Val)) throw new VatError(`t.* for '${id}': argument ${i + 1} is ${JSON.stringify(x)}, expected a Val created by the trace builder (t.input/t.const/...).`);
    });
    const t = {
      input: (id, value) => reg(id, new Val(id, Number(value), [], "input", lang)),
      const: (id, value) => reg(id, new Val(id, Number(value), [], "const", lang)),
      add: (id, ...xs) => (need(id, xs), reg(id, new Val(id, xs.reduce((s, x) => s + x.value, 0), xs.map((x) => x.id), "add", lang))),
      sub: (id, a, b) => (need(id, [a, b]), reg(id, new Val(id, a.value - b.value, [a.id, b.id], "sub", lang))),
      mul: (id, ...xs) => (need(id, xs), reg(id, new Val(id, xs.reduce((s, x) => s * x.value, 1), xs.map((x) => x.id), "mul", lang))),
      div: (id, a, b) => {
        need(id, [a, b]);
        if (b.value === 0) throw new VatError(`t.div('${id}'): division by zero ('${b.id}' is 0). Handle this case explicitly in the model.`);
        return reg(id, new Val(id, a.value / b.value, [a.id, b.id], "div", lang));
      },
      pow: (id, base, e) => {
        need(id, [base]);
        const ev = e instanceof Val ? e.value : Number(e);
        return reg(id, new Val(id, Math.pow(base.value, ev), e instanceof Val ? [base.id, e.id] : [base.id], "pow", lang));
      },
      fn: (id, name, f, ...args) => {
        need(id, args);
        return reg(id, new Val(id, Number(f(...args.map((a) => a.value))), args.map((a) => a.id), name, lang));
      },
      dot: (id, xs, ws) => {
        need(id, [...xs, ...ws]);
        if (xs.length !== ws.length) throw new VatError(`t.dot('${id}'): ${xs.length} values vs ${ws.length} weights.`);
        return reg(id, new Val(id, xs.reduce((s, x, i) => s + x.value * ws[i].value, 0), [...xs, ...ws].map((v) => v.id), "dot", lang));
      },
      event(id, payload = {}) {
        if (vals.has(id) || events.has(id)) throw new VatError(`Trace id '${id}' is used twice. Every value/event needs its own id (e.g. '${id}1', '${id}2', or '${id}-' + i in a loop).`);
        const e = new TraceEvent(id, events.size, payload);
        events.set(id, e);
        order.push(id);
        return e;
      }
    };
    return { t: guard(t, "TraceBuilder (t)"), vals, events, order };
  }
  function traceLookup(trace, key) {
    if (trace.vals.has(key)) return trace.vals.get(key).value;
    if (trace.events.has(key)) return trace.events.get(key).payload;
    const dot = key.indexOf(".");
    if (dot > 0) {
      const ev = trace.events.get(key.slice(0, dot));
      if (ev) {
        let v = ev.payload;
        for (const part of key.slice(dot + 1).split(".")) v = v == null ? void 0 : v[part];
        return v instanceof Val ? v.value : v;
      }
    }
    return void 0;
  }
  function inputValues(def, overrides = {}) {
    const out = {};
    for (const [k, spec] of Object.entries(def.inputs || {})) out[k] = spec.default;
    return Object.assign(out, overrides);
  }
  function runModel(def, inputs, lang) {
    const tr = createTrace(lang);
    const data = def.model(Object.freeze({ ...inputs }), tr.t);
    return { data, trace: tr };
  }
  function runChecks(def, { lang = "en", fuzz = 0, seedBase = 1, rngFactory } = {}) {
    const results = [];
    const known = def.checks?.known || [];
    if (!known.length) results.push({ ok: false, message: "checks.known is empty: add at least one case from an external source (textbook, lecture notes, RFC…)." });
    for (const c of known) {
      let run;
      try {
        run = runModel(def, inputValues(def, c.inputs || {}), lang);
      } catch (e) {
        results.push({ ok: false, message: `known case "${c.source}": model threw: ${e.message}` });
        continue;
      }
      for (const [key, expected] of Object.entries(c.expect || {})) {
        const got = traceLookup(run.trace, key);
        const tol = c.tolerance ?? 1e-6;
        const ok = typeof expected === "number" ? typeof got === "number" && Math.abs(got - expected) <= Math.max(tol, Math.abs(expected) * 1e-12) : String(got) === String(expected);
        results.push({ ok, message: ok ? `known "${c.source}": ${key} = ${expected}` : `known "${c.source}": ${key} expected ${expected}, model gives ${got === void 0 ? "(no such trace id)" : got}` });
      }
    }
    const runInvariants = (inputs, label) => {
      if (!def.checks?.invariants) return;
      let run;
      try {
        run = runModel(def, inputs, lang);
      } catch (e) {
        results.push({ ok: false, message: `${label}: model threw: ${e.message}` });
        return;
      }
      const fails = [];
      try {
        def.checks.invariants(run.data, inputs, (m) => fails.push(m));
      } catch (e) {
        fails.push(`invariants threw: ${e.message}`);
      }
      fails.forEach((m) => results.push({ ok: false, message: `invariant failed (${label}, inputs ${JSON.stringify(inputs)}): ${m}` }));
    };
    runInvariants(inputValues(def), "default inputs");
    if (fuzz && def.inputs && rngFactory) {
      const r = rngFactory(seedBase);
      for (let i = 0; i < fuzz; i++) {
        const inp = {};
        for (const [k, s] of Object.entries(def.inputs)) inp[k] = r.float(s.min, s.max, s.step);
        runInvariants(inputValues(def, inp), `random #${i + 1}`);
      }
    }
    if (def.practice?.generate && rngFactory) {
      for (let i = 0; i < 10; i++) {
        let inp;
        try {
          inp = def.practice.generate(rngFactory(1e3 + i));
        } catch (e) {
          results.push({ ok: false, message: `practice.generate threw: ${e.message}` });
          break;
        }
        runInvariants(inputValues(def, inp), `practice #${i + 1}`);
        for (const task of def.practice.tasks || []) {
          let run;
          try {
            run = runModel(def, inputValues(def, inp), lang);
          } catch {
            break;
          }
          if (traceLookup(run.trace, task.answer) === void 0) {
            results.push({ ok: false, message: `practice task '${task.id}': answer '${task.answer}' is not a trace id` });
            break;
          }
        }
      }
    }
    return results;
  }

  // engine/src/markup.js
  var RE = /\[\[([\w-]+)(?:\|([^\]]+))?\]\]|\{\{([\w.-]+)(?::([\w]+))?\}\}|\*\*([^*]+)\*\*/g;
  function createMarkup(ctx) {
    const lang = () => ctx.lang;
    const term = (id, shown) => {
      const g = ctx.glossary[id];
      if (!g) throw new VatError(`[[${id}]]: '${id}' is not in the glossary. Add glossary.${id} = { term, short } or fix the id.`);
      return shown ?? g.term;
    };
    const value = (id, f) => {
      const v = ctx.trace?.vals.get(id);
      let n;
      if (v) n = v.value;
      else if (ctx.inputs && id in ctx.inputs) n = ctx.inputs[id];
      else if (ctx.trace?.events.has(id.split(".")[0])) {
        let p = ctx.trace.events.get(id.split(".")[0]).payload;
        for (const k of id.split(".").slice(1)) p = p?.[k];
        if (p === void 0) throw new VatError(`{{${id}}}: event field not found.`);
        n = p && typeof p === "object" && "value" in p ? p.value : p;
        if (typeof n !== "number") return String(n);
      } else throw new VatError(`{{${id}}}: no value with id '${id}' in the model trace or inputs.`);
      if (f === void 0) return fmt(n, void 0, lang());
      if (/^\d+$/.test(f)) return fmt(n, Number(f), lang());
      if (f === "int") return fmt(Math.round(n), 0, lang());
      if (f === "pct") {
        const s = fmt(n * 100, Math.abs(n * 100) % 1 ? 1 : 0, lang());
        return /^tr/i.test(lang()) ? `%${s}` : `${s}%`;
      }
      throw new VatError(`{{${id}:${f}}}: unknown format '${f}'. Use a number of decimals, 'int' or 'pct'.`);
    };
    return {
      plain(s) {
        return String(s).replace(RE, (m, tid, shown, vid, f, bold) => tid ? term(tid, shown) : vid ? value(vid, f) : this.plain(bold));
      },
      html(s) {
        let out = "", last = 0;
        const str = String(s);
        for (const m of str.matchAll(RE)) {
          out += escapeHtml(str.slice(last, m.index));
          const [, tid, shown, vid, f, bold] = m;
          if (tid) out += `<button type="button" class="term" data-term="${escapeHtml(tid)}">${escapeHtml(term(tid, shown))}</button>`;
          else if (vid) out += `<span class="val">${escapeHtml(value(vid, f))}</span>`;
          else out += `<b>${this.html(bold)}</b>`;
          last = m.index + m[0].length;
        }
        return out + escapeHtml(str.slice(last));
      },
      terms(s) {
        return [...String(s).matchAll(RE)].flatMap((m) => m[1] ? [m[1]] : m[5] ? this.terms(m[5]) : []);
      },
      check(s) {
        const out = this.plain(s);
        const left = out.match(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]|\*\*/);
        if (left) throw new VatError(`Markup not understood in "${String(s).slice(0, 80)}": "${left[0]}". Use [[termId]], [[termId|text]], {{valId}}, {{valId:2|int|pct}}, **bold** (no nesting of ** inside **).`);
        return true;
      }
    };
  }

  // engine/src/validate.js
  function validateDef(def) {
    const errs = [];
    if (!def || typeof def !== "object") throw new VatError(`lesson.js must end with export default defineLesson({ ... }).`);
    for (const k of ["meta", "glossary", "model", "checks", "scene", "script"]) if (def[k] === void 0) errs.push(`missing '${k}'`);
    if (def.meta) {
      for (const k of ["title", "lang", "goal"]) if (!def.meta[k]) errs.push(`missing meta.${k}`);
    }
    for (const k of ["model", "scene", "script"]) if (def[k] !== void 0 && typeof def[k] !== "function") errs.push(`'${k}' must be a function`);
    for (const [id, g] of Object.entries(def.glossary || {})) if (!g || !g.term || !g.short) errs.push(`glossary.${id} needs { term, short }`);
    for (const [id, s] of Object.entries(def.inputs || {})) {
      for (const k of ["default", "min", "max", "step"]) if (typeof s?.[k] !== "number") errs.push(`inputs.${id}.${k} must be a number`);
      if (s && s.min > s.max) errs.push(`inputs.${id}: min > max`);
      if (s && (s.default < s.min || s.default > s.max)) errs.push(`inputs.${id}: default is outside [min, max]`);
      if (s?.term && def.glossary && !def.glossary[s.term]) errs.push(`inputs.${id}.term '${s.term}' is not a glossary key`);
    }
    if (def.checks && !Array.isArray(def.checks.known)) errs.push(`checks.known must be an array`);
    if (def.practice) {
      if (typeof def.practice.generate !== "function") errs.push(`practice.generate must be a function (rand) => inputs`);
      if (!Array.isArray(def.practice.tasks) || !def.practice.tasks.length) errs.push(`practice.tasks must be a non-empty array`);
      else def.practice.tasks.forEach((t, i) => {
        if (!t.id || !t.prompt || !t.answer) errs.push(`practice.tasks[${i}] needs { id, prompt, answer }`);
      });
    }
    const allowed = /* @__PURE__ */ new Set(["meta", "glossary", "inputs", "model", "checks", "scene", "script", "practice"]);
    for (const k of Object.keys(def)) if (!allowed.has(k)) errs.push(`unknown top-level key '${k}'`);
    if (errs.length) throw new VatError(`defineLesson: ${errs.join("; ")}.`);
  }

  // engine/src/lesson.js
  var LEVEL_NAMES = { 1: "overview", 2: "normal", 3: "micro" };
  var Node = class {
    constructor(id, title, level, parent) {
      this.id = id;
      this.title = title;
      this.level = level;
      this.parent = parent;
      this.say = [];
      this.items = [];
      this.summary = null;
      this.kids = [];
    }
  };
  function compileLesson(def, root, { inputs: inputOverrides = {}, verbs: verbs2, components: components2 } = {}) {
    validateDef(def);
    const warnings = [];
    const lang = def.meta.lang;
    const inputs = inputValues(def, inputOverrides);
    const { data, trace } = runModel(def, inputs, lang);
    const ctx = { lang, glossary: def.glossary, trace, inputs, verbs: verbs2, components: components2, warnings };
    ctx.markup = createMarkup(ctx);
    const stage = new Stage(root, ctx);
    const formula = new FormulaBar(stage, ctx);
    const formulaApi = guard(formula, "s.formula");
    const dataApi = data && typeof data === "object" ? guard(data, "model output (data)") : data;
    rec.reset();
    rec.mode = "scene";
    let refs;
    try {
      refs = def.scene(stage._api, dataApi, Object.freeze({ ...inputs }));
    } finally {
      rec.mode = "idle";
    }
    const rootNode = new Node("__root", "", 0, null);
    const ids = /* @__PURE__ */ new Set();
    const memory = [];
    const termUse = [];
    const newNode = (id, title, level, parent) => {
      if (typeof id !== "string" || !id) throw new VatError(`Step ids must be non-empty strings.`);
      if (ids.has(id)) throw new VatError(`Step id '${id}' is used twice. Every chapter/step needs a unique id.`);
      ids.add(id);
      const n = new Node(id, title, level, parent);
      parent.kids.push(n);
      return n;
    };
    const builder = (node) => {
      const sb = {
        say(text) {
          if (typeof text !== "string") throw new VatError(`s.say(text) needs a string.`);
          ctx.markup.check(text);
          node.say.push(text);
          termUse.push({ node, terms: ctx.markup.terms(text) });
        },
        step(id, opts, build) {
          if (typeof opts === "function") {
            build = opts;
            opts = {};
          }
          if (typeof build !== "function") throw new VatError(`s.step('${id}', opts, s => { ... }) needs a build function.`);
          if (rec.cap !== node.items) throw new VatError(`s.step('${id}') cannot be called inside together() or summary().`);
          let level = opts?.level ?? 2;
          if (![1, 2, 3].includes(level)) throw new VatError(`step '${id}': level must be 1, 2 or 3.`);
          if (level < node.level) {
            warnings.push(`step '${id}' has level ${level} inside '${node.id}' (level ${node.level}); using ${node.level}.`);
            level = node.level;
          }
          const child2 = newNode(id, opts?.title, level, node);
          node.items.push({ k: "node", node: child2 });
          const prev = rec.cap;
          rec.cap = child2.items;
          try {
            build(builder(child2));
          } finally {
            rec.cap = prev;
            stage._follow = null;
          }
        },
        together(build) {
          rec.par(() => build());
        },
        pause(beats = 1) {
          rec.wait(0.45 * beats);
        },
        summary(build) {
          if (node.summary) throw new VatError(`step '${node.id}' already has a summary.`);
          node.summary = [];
          const prev = rec.cap;
          rec.cap = node.summary;
          try {
            build();
          } finally {
            rec.cap = prev;
          }
        },
        get formula() {
          return formulaApi;
        },
        fly(from, to, o) {
          stage._fly(from, to, o, formula);
        },
        add(anim) {
          if (!anim || typeof anim.duration !== "function") throw new VatError(`s.add(anim) needs a GSAP animation, e.g. s.add(vat.gsap.to(el, { ... })).`);
          anim.pause();
          rec.push({ k: "raw", anim, d: anim.duration() });
        }
      };
      return guard(sb, `step builder (s) of '${node.id}'`);
    };
    const lesson = guard({
      get stage() {
        return stage._api;
      },
      chapter(id, title, build) {
        if (typeof title !== "string") throw new VatError(`lesson.chapter(id, title, s => { ... }): title must be a string.`);
        if (typeof build !== "function") throw new VatError(`lesson.chapter('${id}', '${title}', s => { ... }) needs a build function.`);
        const n = newNode(id, title, 1, rootNode);
        n.chapter = true;
        rootNode.items.push({ k: "node", node: n });
        rec.cap = n.items;
        try {
          build(builder(n));
        } finally {
          rec.cap = null;
          stage._follow = null;
        }
      },
      memorize(item) {
        if (!item?.title) throw new VatError(`lesson.memorize({ title, formula?, words?, why? }) needs a title.`);
        if (item.words) ctx.markup.check(item.words);
        if (item.why) ctx.markup.check(item.why);
        memory.push(item);
      }
    }, "lesson");
    rec.mode = "script";
    try {
      def.script(lesson, refs, dataApi, Object.freeze({ ...inputs }));
    } finally {
      rec.mode = "idle";
      rec.cap = null;
    }
    if (!rootNode.kids.length) throw new VatError(`script() created no chapters. Use lesson.chapter(id, title, s => { ... }).`);
    const walk = (n, f) => {
      f(n);
      n.kids.forEach((k) => walk(k, f));
    };
    walk(rootNode, (n) => {
      if (n === rootNode) return;
      if (!n.say.length) throw new VatError(`step '${n.id}' has no narration. Every chapter/step can be a stop, so each needs s.say('…') written for its own level (${LEVEL_NAMES[n.level]}).`);
      let seenChild = false;
      for (const it of n.items) {
        if (it.k === "node") seenChild = true;
        else if (seenChild && it.k !== "ev") {
          warnings.push(`step '${n.id}': actions after child step(s) play as part of the previous stop. Put them in their own step.`);
          break;
        }
      }
    });
    const firstUse = /* @__PURE__ */ new Map();
    const order = [];
    walk(rootNode, (n) => order.push(n));
    for (const n of order) for (const t of termUse.filter((u) => u.node === n).flatMap((u) => u.terms)) if (!firstUse.has(t)) firstUse.set(t, n.id);
    for (const id of Object.keys(def.glossary)) if (!firstUse.has(id)) warnings.push(`glossary term '${id}' is never introduced with [[${id}]] in the narration.`);
    const concepts = Object.values(def.glossary).filter((g) => g.concept).length;
    if (concepts > 6) warnings.push(`${concepts} concept colours: more than 6 become hard to tell apart.`);
    for (const [id, g] of Object.entries(def.glossary)) if (g.memorize) memory.unshift({ title: g.term, formula: g.symbol, words: g.short, why: g.long });
    return { def, stage, formula, tree: rootNode, inputs, data, trace, ctx, warnings, memory, initialEvents: rec.initialEvents.slice() };
  }

  // engine/src/layout.js
  var GAP = 0.02;
  var FOLD = 0.7;
  function layoutLevel(compiled, level, onPause) {
    const gsap = window.gsap;
    const tl = gsap.timeline({ paused: true });
    const stops = [];
    const events = compiled.initialEvents.map((ev) => ({ t: -1, ev }));
    let t = 0;
    let cur = null;
    const hasStopBelow = (n) => n.kids.some((k) => k.level <= level || hasStopBelow(k));
    const placeItem = (it, t0, f) => {
      switch (it.k) {
        case "tw": {
          const d = it.d * f;
          tl.fromTo(it.el, { ...it.from }, { ...it.to, duration: d, ease: it.ease, immediateRender: false }, t0);
          return t0 + d;
        }
        case "raw": {
          const a = it.anim;
          a.paused(false);
          a.timeScale(f === 1 ? 1 : f === 0 ? 1e6 : 1 / f);
          tl.add(a, t0);
          return t0 + it.d * f;
        }
        case "ev":
          events.push({ t: t0, ev: it.ev });
          return t0;
        case "wait":
          return t0 + it.d * f;
        case "seq": {
          let tt = t0;
          for (const x of it.items) tt = placeItem(x, tt, f);
          return tt;
        }
        case "par": {
          let end = t0;
          for (const x of it.items) end = Math.max(end, placeItem(x, t0, f));
          return end;
        }
        default:
          throw new Error(`layout: unexpected item ${it.k} inside a group`);
      }
    };
    const visit = (n, folded, factor) => {
      const isStop = !folded && n.level <= level;
      if (isStop) {
        if (cur) {
          cur.end = t + 2e-3;
          t = cur.end + GAP;
        }
        cur = { node: n, id: n.id, start: t, end: t, say: n.say.join(" "), chapter: chapterOf(n), level: n.level };
        stops.push(cur);
      }
      const useSummary = isStop && n.summary && !hasStopBelow(n);
      const f = factor;
      for (const it of n.items) {
        if (it.k === "node") {
          if (useSummary) continue;
          const kidFolded = folded || it.node.level > level;
          visit(it.node, kidFolded, kidFolded ? Math.min(f, FOLD) : f);
        } else t = placeItem(it, t, f);
        if (cur) cur.end = Math.max(cur.end, t);
      }
      if (useSummary) {
        for (const it of n.summary) t = placeItem(it, t, 1);
        const instant = (m) => {
          for (const it of m.items) {
            if (it.k === "node") instant(it.node);
            else t = placeItem(it, t, 0);
          }
        };
        for (const it of n.items) if (it.k === "node") instant(it.node);
        cur.end = Math.max(cur.end, t);
      }
    };
    for (const it of compiled.tree.items) visit(it.node, false, 1);
    if (cur) cur.end = t + 2e-3;
    stops.forEach((s, i) => tl.addPause(s.end, onPause ? () => onPause(i) : void 0));
    tl.set({}, {}, (stops.at(-1)?.end ?? 0) + 0.01);
    events.sort((a, b) => a.t - b.t);
    return { level, tl, stops, events, duration: tl.duration() };
  }
  function chapterOf(n) {
    while (n.parent && n.parent.id !== "__root") n = n.parent;
    return n.id;
  }
  function logicalAt(events, t) {
    const exist = /* @__PURE__ */ new Map(), tags = /* @__PURE__ */ new Map(), fx = /* @__PURE__ */ new Map();
    for (const { t: et, ev } of events) {
      if (et > t + 1e-6) break;
      if (ev.type === "exist") exist.set(ev.obj, ev.on);
      else if (ev.type === "tag") {
        const s = tags.get(ev.obj) || /* @__PURE__ */ new Set();
        ev.on ? s.add(ev.tag) : s.delete(ev.tag);
        tags.set(ev.obj, s);
      } else if (ev.type === "fx") {
        const k = `${ev.obj}|${ev.fx}`;
        if (ev.on) fx.set(k, ev);
        else fx.delete(k);
      }
    }
    return { exist, tags, fx };
  }

  // engine/src/effects.js
  var AMP = { low: 1.6, mid: 3.2, high: 5.5 };
  var Effects = class {
    constructor(stage) {
      this._st = stage;
      this._events = [];
      this._running = /* @__PURE__ */ new Map();
    }
    setEvents(events) {
      this._events = events;
    }
    sync(t) {
      const want = logicalAt(this._events, t).fx;
      for (const [k, h] of this._running) if (!want.has(k)) {
        h.stop();
        this._running.delete(k);
      }
      for (const [k, ev] of want) if (!this._running.has(k)) {
        const o = this._st._objs.get(ev.obj);
        if (!o) continue;
        this._running.set(k, this._start(o, ev));
      }
    }
    stopAll() {
      for (const h of this._running.values()) h.stop();
      this._running.clear();
    }
    _start(o, ev) {
      const gsap = window.gsap;
      switch (ev.fx) {
        case "glow": {
          o._l.setAttribute("filter", "url(#vat-glow)");
          return { stop: () => o._l.removeAttribute("filter") };
        }
        case "jitter": {
          const a = AMP[ev.strength] ?? AMP.low;
          const r = rng(o.id.length * 97 + 13);
          const tw = gsap.to(o._j, { x: () => (r.next() * 2 - 1) * a, y: () => (r.next() * 2 - 1) * a, duration: 0.07, repeat: -1, repeatRefresh: true, ease: "none" });
          return { stop: () => {
            tw.kill();
            gsap.set(o._j, { x: 0, y: 0 });
          } };
        }
        case "breathe": {
          const tw = gsap.to(o._b, { scale: 1.05, transformOrigin: "50% 50%", duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" });
          return { stop: () => {
            tw.kill();
            gsap.set(o._b, { scale: 1 });
          } };
        }
        case "flow": {
          const el = o._flowEl || o._body.querySelector("path,line,polyline");
          if (!el) return { stop() {
          } };
          const prev = el.getAttribute("stroke-dasharray");
          el.setAttribute("stroke-dasharray", "10 8");
          const tw = gsap.fromTo(el, { attr: { "stroke-dashoffset": 0 } }, { attr: { "stroke-dashoffset": -36 }, duration: 0.8, repeat: -1, ease: "none" });
          return { stop: () => {
            tw.kill();
            if (prev === null) el.removeAttribute("stroke-dasharray");
            else el.setAttribute("stroke-dasharray", prev);
            el.removeAttribute("stroke-dashoffset");
          } };
        }
        default:
          return { stop() {
          } };
      }
    }
  };

  // engine/src/player.js
  var UI = {
    tr: { overview: "Özet", normal: "Normal", micro: "Mikro", speed: "Hız", next: "Devam", start: "Başla", back: "Geri", step: "Adım", terms: "Terimler", tinker: "Kurcala", memory: "Ezber", practice: "Alıştırma", theme: "Tema", reset: "Örnek değerlere dön", newQ: "Yeni soru", check: "Kontrol et", showSol: "Çözümü dersle göster", correct: "Doğru", wrong: "Değil, doğrusu", given: "Verilenler", done: "Ders bitti", checksFail: "Doğrulama hatası", restart: "Baştan", detail: "Detay", tinkerHint: "Değerleri değiştir: ders aynı yerden yeni sayılarla devam eder.", noPractice: "Bu derste alıştırma yok.", answer: "cevap" },
    en: { overview: "Overview", normal: "Normal", micro: "Micro", speed: "Speed", next: "Continue", start: "Start", back: "Back", step: "Step", terms: "Terms", tinker: "Tinker", memory: "Memorise", practice: "Practice", theme: "Theme", reset: "Back to example values", newQ: "New question", check: "Check", showSol: "Show the solution in the lesson", correct: "Correct", wrong: "Not quite, it is", given: "Given", done: "Lesson complete", checksFail: "Verification failed", restart: "Restart", detail: "Detail", tinkerHint: "Change values: the lesson continues from the same place with new numbers.", noPractice: "This lesson has no practice.", answer: "answer" }
  };
  var Player = class {
    constructor(def, app, registry) {
      this.def = def;
      this.reg = registry;
      this.ui = UI[(def.meta?.lang || "en").slice(0, 2)] || UI.en;
      this.level = 2;
      this.speed = 1;
      this.idx = 0;
      this.playing = false;
      this.inputs = {};
      this.errors = [];
      this.checks = [];
      this._layouts = /* @__PURE__ */ new Map();
      this._buildShell(app);
    }
    // ───────── shell ─────────
    _buildShell(app) {
      const u = this.ui, def = this.def;
      app.innerHTML = `
<div class="app">
  <header class="topbar">
    <div class="brand"></div>
    <div class="tools">
      <div class="seg" role="radiogroup" aria-label="${u.detail}">
        <button type="button" data-level="1">${u.overview}</button><button type="button" data-level="2">${u.normal}</button><button type="button" data-level="3">${u.micro}</button>
      </div>
      <label class="speed"><span>${u.speed}</span><input type="range" min="0.25" max="2.5" step="0.25" value="1"><output>1×</output></label>
      <span class="sep"></span>
      <div class="drawer-btns">
        <button type="button" class="tbtn" data-drawer="terms">${u.terms}</button>
        <button type="button" class="tbtn" data-drawer="tinker">${u.tinker}</button>
        <button type="button" class="tbtn" data-drawer="memory">${u.memory}</button>
        <button type="button" class="tbtn" data-drawer="practice">${u.practice}</button>
        <button type="button" class="tbtn theme" title="${u.theme}" aria-label="${u.theme}">◐</button>
      </div>
    </div>
  </header>
  <nav class="stages"></nav>
  <main class="main">
    <div class="scene-wrap"><div class="board"><svg id="vat-root" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg><div class="banner" hidden></div></div></div>
    <aside class="drawer" aria-hidden="true"><div class="drawer-in"><div class="drawer-head"><span class="drawer-title"></span><button type="button" class="x" aria-label="×">✕</button></div><div class="drawer-body"></div></div></aside>
  </main>
  <section class="dock"><div class="narrator">
    <div class="say"><p class="say-text"></p></div>
    <div class="nav"><span class="count"></span><button type="button" class="btn btn-ghost back" aria-label="${u.back}">◀</button><button type="button" class="btn btn-primary next">${u.next} ▶</button></div>
  </div></section>
</div>
<div class="bubble" role="tooltip"></div>
<div class="error-overlay" hidden></div>`;
      const $ = (s) => app.querySelector(s);
      this.$ = {
        brand: $(".brand"),
        seg: $(".seg"),
        speed: $(".speed input"),
        speedOut: $(".speed output"),
        stages: $(".stages"),
        root: $("#vat-root"),
        banner: $(".banner"),
        main: $(".main"),
        drawer: $(".drawer"),
        drawerTitle: $(".drawer-title"),
        drawerBody: $(".drawer-body"),
        say: $(".say-text"),
        count: $(".count"),
        back: $(".back"),
        next: $(".next"),
        bubble: app.querySelector(".bubble"),
        err: app.querySelector(".error-overlay")
      };
      this.$.brand.textContent = def.meta?.title || "Lab";
      document.title = def.meta?.title || "Lab";
      document.documentElement.lang = def.meta?.lang || "en";
      this.$.seg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-level]");
        if (b) this.setLevel(Number(b.dataset.level));
      });
      this.$.speed.addEventListener("input", () => this.setSpeed(Number(this.$.speed.value)));
      this.$.next.addEventListener("click", () => this.next());
      this.$.back.addEventListener("click", () => this.back());
      app.querySelector(".x").addEventListener("click", () => this.closeDrawer());
      app.querySelectorAll("[data-drawer]").forEach((b) => b.addEventListener("click", () => this.toggleDrawer(b.dataset.drawer)));
      app.querySelector(".theme").addEventListener("click", () => {
        const r = document.documentElement;
        r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
      });
      document.addEventListener("keydown", (e) => {
        if (e.target.closest("input,textarea,select")) return;
        if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
          e.preventDefault();
          this.next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.back();
        } else if (["1", "2", "3"].includes(e.key)) this.setLevel(Number(e.key));
      });
      const showBubble = (btn) => {
        const g = this.def.glossary[btn.dataset.term];
        if (!g) return;
        const b = this.$.bubble;
        b.innerHTML = `<b>${escapeHtml(g.term)}${g.symbol ? ` <span class="sym">${escapeHtml(texPlain(g.symbol))}</span>` : ""}</b>${escapeHtml(g.short)}`;
        const r = btn.getBoundingClientRect();
        b.classList.add("on");
        const bw = b.offsetWidth, bh = b.offsetHeight;
        b.style.left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)) + "px";
        b.style.top = Math.max(8, r.top - bh - 10) + "px";
      };
      app.addEventListener("mouseover", (e) => {
        const t = e.target.closest(".term");
        if (t) showBubble(t);
      });
      app.addEventListener("mouseout", (e) => {
        if (e.target.closest(".term")) this.$.bubble.classList.remove("on");
      });
      app.addEventListener("click", (e) => {
        const t = e.target.closest(".term");
        if (t) showBubble(t);
      });
      this._dragSetup();
    }
    // ───────── compile & layout ─────────
    build(inputOverrides = {}, keepStopId) {
      const t0 = performance.now();
      this._teardown();
      this.inputs = inputValues(this.def, inputOverrides);
      try {
        this.compiled = compileLesson(this.def, this.$.root, { inputs: this.inputs, verbs: this.reg.verbs, components: this.reg.components });
      } catch (e) {
        this._fatal(e);
        return false;
      }
      this.effects = new Effects(this.compiled.stage);
      this._layouts.clear();
      this._useLevel(this.level, keepStopId);
      this._renderStages();
      this.compileMs = performance.now() - t0;
      return true;
    }
    _teardown() {
      if (this.lay) {
        this.lay.tl.pause();
        this.lay.tl.seek(0);
        this.lay.tl.kill();
      }
      this.effects?.stopAll();
      this.lay = null;
      this.playing = false;
    }
    _layout(level) {
      return layoutLevel(this.compiled, level, (i) => this._onPause(i));
    }
    _useLevel(level, keepStopId) {
      let keep = keepStopId ?? this.lay?.stops[this.idx]?.id;
      if (this.lay) {
        this.lay.tl.pause();
        this.lay.tl.seek(0);
        this.lay.tl.kill();
        this.effects.stopAll();
      }
      this.level = level;
      this.lay = this._layout(level);
      this.lay.tl.timeScale(this.speed);
      this.effects.setEvents(this.lay.events);
      this.$.seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.level) === level)));
      let i = 0;
      if (keep) i = this._mapStop(keep);
      this.jump(i);
    }
    _mapStop(id) {
      const stops = this.lay.stops;
      let j = stops.findIndex((s) => s.id === id);
      if (j >= 0) return j;
      const find = (n2, nid) => {
        if (n2.id === nid) return n2;
        for (const k of n2.kids) {
          const r = find(k, nid);
          if (r) return r;
        }
        return null;
      };
      let n = find(this.compiled.tree, id);
      while (n && n.parent) {
        n = n.parent;
        j = stops.findIndex((s) => s.id === n.id);
        if (j >= 0) return j;
      }
      return 0;
    }
    // ───────── playback ─────────
    get stops() {
      return this.lay?.stops || [];
    }
    jump(i) {
      if (!this.lay) return;
      i = Math.max(0, Math.min(this.stops.length - 1, i));
      this.lay.tl.pause();
      this.lay.tl.seek(this.stops[i].end);
      this.playing = false;
      this.idx = i;
      this.effects.sync(this.lay.tl.time());
      this._showStop(i);
    }
    next() {
      if (!this.lay) return;
      if (this.playing) {
        this.jump(this.idx);
        return;
      }
      if (this.idx >= this.stops.length - 1) {
        this._showStop(this.idx, true);
        return;
      }
      const i = this.idx + 1;
      this.idx = i;
      this._showStop(i);
      this.playing = true;
      this.$.next.classList.add("playing");
      this.lay.tl.seek(this.stops[i - 1].end + 1e-3).play();
      this._tick();
    }
    back() {
      if (!this.lay || this.idx === 0) {
        if (this.lay) this.jump(0);
        return;
      }
      const i = this.idx - 1;
      this.lay.tl.pause();
      const from = this.lay.tl.time(), to = this.stops[i].end;
      this.playing = true;
      this.idx = i;
      this._showStop(i);
      window.gsap.to(this.lay.tl, { time: to, duration: Math.min(0.55, Math.max(0.2, (from - to) * 0.25)), ease: "power2.inOut", overwrite: true, onUpdate: () => this.effects.sync(this.lay.tl.time()), onComplete: () => {
        this.playing = false;
        this.effects.sync(to);
        this.$.next.classList.remove("playing");
      } });
    }
    _tick() {
      if (!this.playing || !this.lay) return;
      this.effects.sync(this.lay.tl.time());
      requestAnimationFrame(() => this._tick());
    }
    _onPause(i) {
      this.playing = false;
      this.$.next.classList.remove("playing");
      this.effects.sync(this.lay.tl.time());
      if (i !== this.idx) {
        this.idx = i;
        this._showStop(i);
      }
      this._panelsRender();
    }
    setSpeed(v) {
      this.speed = v;
      this.$.speedOut.textContent = `${v}×`;
      this.lay?.tl.timeScale(v);
    }
    setLevel(L) {
      if (L !== this.level && this.lay) this._useLevel(L);
    }
    // ───────── narrator / roadmap ─────────
    _showStop(i, end = false) {
      const s = this.stops[i];
      if (!s) return;
      let html;
      try {
        html = this.compiled.ctx.markup.html(s.say);
      } catch (e) {
        html = escapeHtml(s.say);
      }
      this.$.say.innerHTML = html;
      this.$.say.dataset.stop = s.id;
      this.$.count.textContent = `${this.ui.step} ${i + 1} / ${this.stops.length}`;
      this.$.back.disabled = i === 0;
      const last = i === this.stops.length - 1;
      this.$.next.textContent = last ? end ? `${this.ui.restart} ↺` : `${this.ui.done} ✓` : `${i === 0 ? this.ui.next : this.ui.next} ▶`;
      if (last && end) {
        this.jump(0);
        return;
      }
      const chIdx = this.compiled.tree.kids.findIndex((c) => c.id === s.chapter);
      this.$.stages.querySelectorAll(".st").forEach((b, k) => {
        b.classList.toggle("current", k === chIdx);
        b.classList.toggle("done", k < chIdx);
      });
      this._panelsRender();
    }
    _renderStages() {
      const u = this.$.stages;
      u.innerHTML = this.compiled.tree.kids.map((c, k) => `<button type="button" class="st" data-ch="${escapeHtml(c.id)}"><span class="dot"></span>${escapeHtml(c.title)}</button>`).join("");
      u.querySelectorAll(".st").forEach((b) => b.addEventListener("click", () => {
        const j = this.stops.findIndex((s) => s.chapter === b.dataset.ch);
        if (j >= 0) this.jump(j);
      }));
    }
    _panelsRender() {
      for (const p of this.compiled?.stage._panels || []) try {
        p.adapter.render(this.stops[this.idx]?.id, this.compiled.data);
      } catch (e) {
        console.error(e);
      }
    }
    // ───────── drawers ─────────
    toggleDrawer(name) {
      if (this._drawer === name) this.closeDrawer();
      else this.openDrawer(name);
    }
    closeDrawer() {
      this._drawer = null;
      this.$.main.classList.remove("open");
      this.$.drawer.setAttribute("aria-hidden", "true");
      document.querySelectorAll("[data-drawer]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
    openDrawer(name) {
      this._drawer = name;
      this.$.main.classList.add("open");
      this.$.drawer.setAttribute("aria-hidden", "false");
      document.querySelectorAll("[data-drawer]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.drawer === name)));
      const u = this.ui, body = this.$.drawerBody, def = this.def;
      this.$.drawerTitle.textContent = u[name];
      const mk = (s) => {
        try {
          return this.compiled.ctx.markup.html(s);
        } catch {
          return escapeHtml(s);
        }
      };
      if (name === "terms") {
        body.innerHTML = Object.entries(def.glossary).map(([k, g]) => `<div class="gl-item"><b>${escapeHtml(g.term)}${g.symbol ? ` <span class="sym">${escapeHtml(texPlain(g.symbol))}</span>` : ""}</b><span>${escapeHtml(g.short)}</span>${g.long ? `<p class="long">${escapeHtml(g.long)}</p>` : ""}</div>`).join("");
      } else if (name === "memory") {
        body.innerHTML = this.compiled.memory.map((m) => `<div class="fm-card"><b>${escapeHtml(m.title)}</b>${m.formula ? `<div class="sym">${escapeHtml(texPlain(m.formula))}</div>` : ""}${m.words ? `<div class="w">${mk(m.words)}</div>` : ""}${m.why ? `<div class="why">${mk(m.why)}</div>` : ""}</div>`).join("") || "—";
      } else if (name === "tinker") {
        const ins = Object.entries(def.inputs || {});
        body.innerHTML = ins.length ? `<p class="hint">${u.tinkerHint}</p>` + ins.map(([k, s]) => {
          const label = s.term && def.glossary[s.term] ? def.glossary[s.term].term : k;
          return `<div class="ctl"><label for="in-${k}">${escapeHtml(label)} <code>${escapeHtml(k)}</code></label><input id="in-${k}" type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${this.inputs[k]}" data-input="${k}"><output>${fmt(this.inputs[k], void 0, def.meta.lang)}</output></div>`;
        }).join("") + `<button type="button" class="btn btn-soft reset">${u.reset}</button>` : "—";
        let timer;
        body.querySelectorAll("[data-input]").forEach((inp) => inp.addEventListener("input", () => {
          inp.nextElementSibling.textContent = fmt(Number(inp.value), void 0, def.meta.lang);
          clearTimeout(timer);
          timer = setTimeout(() => this.setInputs({ ...this.inputs, [inp.dataset.input]: Number(inp.value) }), 160);
        }));
        body.querySelector(".reset")?.addEventListener("click", () => {
          this.setInputs({});
          this.openDrawer("tinker");
        });
      } else if (name === "practice") this._practice(body);
    }
    setInputs(inputs) {
      const keep = this.stops[this.idx]?.id;
      const prev = this.inputs;
      if (!this.build(inputs, keep)) {
        this.build(prev, keep);
      }
    }
    _practice(body) {
      const u = this.ui, def = this.def, P = def.practice;
      if (!P) {
        body.innerHTML = `<p>${u.noPractice}</p>`;
        return;
      }
      this._pseed = (this._pseed || 0) + 1;
      let inputs;
      try {
        inputs = inputValues(def, P.generate(rng(this._pseed * 7919)));
      } catch (e) {
        body.innerHTML = `<p class="bad">${escapeHtml(e.message)}</p>`;
        return;
      }
      const { trace } = runModel(def, inputs, def.meta.lang);
      const lang = def.meta.lang;
      const prompt = (t) => typeof t.prompt === "function" ? t.prompt(inputs) : String(t.prompt).replace(/\{\{([\w.-]+)\}\}/g, (m, id) => {
        const v = inputs[id] ?? traceLookup(trace, id);
        return v === void 0 ? m : fmt(v, void 0, lang);
      });
      body.innerHTML = `<h4>${u.given}</h4><table class="dt">${Object.keys(def.inputs || {}).map((k) => `<tr><td>${escapeHtml(def.inputs[k].term && def.glossary[def.inputs[k].term] ? def.glossary[def.inputs[k].term].term : k)} <code>${k}</code></td><td>${fmt(inputs[k], void 0, lang)}</td></tr>`).join("")}</table>` + P.tasks.map((t) => `<div class="task" data-task="${escapeHtml(t.id)}"><p>${escapeHtml(prompt(t))}</p><div class="row"><input class="ans" inputmode="decimal" aria-label="${u.answer}"><button type="button" class="btn btn-soft chk">${u.check}</button></div><p class="fb"></p></div>`).join("") + `<div class="row"><button type="button" class="btn btn-soft newq">${u.newQ}</button><button type="button" class="btn btn-soft sol">${u.showSol}</button></div>`;
      body.querySelectorAll(".task").forEach((el) => el.querySelector(".chk").addEventListener("click", () => {
        const t = P.tasks.find((x) => x.id === el.dataset.task);
        const want = traceLookup(trace, t.answer);
        const raw = el.querySelector(".ans").value.trim().replace(/\s/g, "").replace("−", "-").replace(",", ".");
        const got = Number(raw);
        const tol = t.tolerance ?? Math.max(1e-9, Math.abs(want) * 5e-3);
        const ok = raw !== "" && Number.isFinite(got) && Math.abs(got - want) <= tol;
        el.querySelector(".fb").innerHTML = ok ? `<span class="ok">✓ ${u.correct}</span>` : `<span class="bad">✗ ${u.wrong} ${fmt(want, void 0, lang)}</span>`;
      }));
      body.querySelector(".newq").addEventListener("click", () => this._practice(body));
      body.querySelector(".sol").addEventListener("click", () => {
        this.build(inputs);
        this.closeDrawer();
      });
    }
    // ───────── dragging plot points (tinkering) ─────────
    _dragSetup() {
      const root = this.$.root;
      let drag = null;
      root.addEventListener("pointerdown", (e) => {
        const el = e.target.closest("[data-drag]");
        if (!el) return;
        const info = JSON.parse(el.dataset.drag);
        const obj = this.compiled.stage._objs.get(el.dataset.id);
        const plot2 = this.compiled.stage._objs.get(info.plot);
        if (!obj || !plot2) return;
        drag = { el, info, obj, plot: plot2, start: { x: obj._st8.x, y: obj._st8.y } };
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      const toLocal = (e) => {
        const world = this.compiled.stage._worldSvg;
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(drag.plot._body.getScreenCTM().inverse());
        return pt;
      };
      root.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const p = toLocal(e);
        drag.el.setAttribute("transform", `translate(${p.x} ${p.y})`);
        drag.last = p;
      });
      root.addEventListener("pointerup", () => {
        if (!drag) return;
        const { info, obj, last } = drag;
        drag = null;
        if (!last) return;
        const g = obj._drag;
        const dx = info.x0 + (last.x - g.ml) / g.iw * (info.x1 - info.x0);
        const dy = info.y0 + (g.mt + g.ih - last.y) / g.ih * (info.y1 - info.y0);
        const next = { ...this.inputs };
        const snap = (k, v) => {
          const s = this.def.inputs?.[k];
          if (!s) return;
          next[k] = Math.min(s.max, Math.max(s.min, Math.round((v - s.min) / s.step) * s.step + s.min));
        };
        if (info.inputX) snap(info.inputX, dx);
        if (info.inputY) snap(info.inputY, dy);
        this.setInputs(next);
      });
    }
    // ───────── errors / checks ─────────
    _fatal(e) {
      this.errors.push({ message: e.message, stack: e.stack });
      const lineInfo = (e.stack || "").split("\n").find((l) => l.includes("lesson.js"))?.trim() || "";
      this.$.err.hidden = false;
      this.$.err.innerHTML = `<div class="err-card"><h2>Lesson error</h2><p>${escapeHtml(e.message)}</p>${lineInfo ? `<pre>${escapeHtml(lineInfo)}</pre>` : ""}</div>`;
      console.error("[VAT]", e.message, lineInfo);
    }
    runChecks() {
      try {
        this.checks = runChecks(this.def, { lang: this.def.meta.lang, rngFactory: rng });
      } catch (e) {
        this.checks = [{ ok: false, message: `checks threw: ${e.message}` }];
      }
      const bad = this.checks.filter((c) => !c.ok);
      if (bad.length) {
        this.$.banner.hidden = false;
        this.$.banner.textContent = `⚠ ${this.ui.checksFail}: ${bad[0].message}`;
        console.warn("[VAT] checks failed:", bad.map((b) => b.message).join(" | "));
      }
      return this.checks;
    }
  };
  function texPlain(tex) {
    try {
      const out = [];
      const walk = (n) => {
        if (!n) return;
        if (n.t === "txt") out.push(n.s);
        else if (n.t === "row") n.items.forEach(walk);
        else if (n.t === "script") {
          walk(n.base);
          if (n.sub) {
            out.push("_");
            walk(n.sub);
          }
          if (n.sup) {
            out.push("^");
            walk(n.sup);
          }
        } else if (n.t === "frac") {
          out.push("(");
          walk(n.num);
          out.push(")/(");
          walk(n.den);
          out.push(")");
        } else if (n.t === "slot") walk(n.content);
        else if (n.t === "sqrt") {
          out.push("√(");
          walk(n.arg);
          out.push(")");
        } else if (n.t === "space") out.push(" ");
      };
      walk(parseTex(tex));
      return out.join("");
    } catch {
      return tex;
    }
  }

  // engine/src/qa.js
  function qaApi(player) {
    const st = () => player.compiled.stage;
    const visible = (el) => {
      let o = 1;
      for (let e = el; e && e.nodeType === 1 && e.id !== "vat-root"; e = e.parentNode) {
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none") return 0;
        o *= Number(cs.opacity);
        const ao = e.getAttribute && e.getAttribute("opacity");
        if (ao !== null) o *= Number(ao);
      }
      return o;
    };
    const rootRect = () => player.$.root.getBoundingClientRect();
    const toRoot = (r) => {
      const R = rootRect(), k = 1600 / R.width;
      return { x: (r.left - R.left) * k, y: (r.top - R.top) * k, w: r.width * k, h: r.height * k };
    };
    const nums = (s) => (String(s || "").match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
    function snapshot() {
      const t = player.lay.tl.time();
      const L = logicalAt(player.lay.events, t);
      const objs = [];
      for (const o of st()._order) {
        const vis = visible(o._el);
        objs.push({
          id: o.id,
          vis: Math.round(vis * 100) / 100,
          pos: nums(o._el.getAttribute("transform")),
          s: nums(o._s.getAttribute("transform")),
          z: nums(o._z.getAttribute("transform")),
          dim: Number(getComputedStyle(o._l).opacity),
          hl: Number(getComputedStyle(o._hl).opacity),
          text: o._text ? o._text.textContent : null,
          exists: L.exist.get(o.id) ?? false,
          tags: [...L.tags.get(o.id) || o._tags && [] || []].sort()
        });
      }
      const fxs = [...L.fx.keys()].sort();
      const formula = [...document.querySelectorAll("#vat-hud .fm")].map((g) => ({ vis: Math.round(visible(g) * 100) / 100, vals: [...g.querySelectorAll(".fm-val")].map((v) => `${v.textContent}@${Math.round(visible(v) * 100) / 100}`) }));
      return { t, camera: st()._worldSvg.getAttribute("viewBox"), objs, fxs, formula };
    }
    function diff(a, b) {
      const out = [];
      if (nums(a.camera).some((v, i) => Math.abs(v - nums(b.camera)[i]) > 0.6)) out.push(`camera ${a.camera} vs ${b.camera}`);
      const bm = new Map(b.objs.map((o) => [o.id, o]));
      for (const x of a.objs) {
        const y = bm.get(x.id);
        if (!y) {
          out.push(`${x.id}: missing`);
          continue;
        }
        if (Math.abs(x.vis - y.vis) > 0.05) out.push(`${x.id}: visibility ${x.vis} vs ${y.vis}`);
        for (const k of ["pos", "s", "z"]) if (x[k].length !== y[k].length || x[k].some((v, i) => Math.abs(v - y[k][i]) > 0.6)) out.push(`${x.id}: ${k} ${x[k].join(",")} vs ${y[k].join(",")}`);
        if (Math.abs(x.dim - y.dim) > 0.05) out.push(`${x.id}: dim ${x.dim} vs ${y.dim}`);
        if (Math.abs(x.hl - y.hl) > 0.05) out.push(`${x.id}: highlight ${x.hl} vs ${y.hl}`);
        if (x.text !== y.text && x.vis > 0.05) out.push(`${x.id}: text "${x.text}" vs "${y.text}"`);
        if (x.exists !== y.exists) out.push(`${x.id}: exists ${x.exists} vs ${y.exists}`);
        if (x.tags.join() !== y.tags.join()) out.push(`${x.id}: tags [${x.tags}] vs [${y.tags}]`);
      }
      if (a.fxs.join() !== b.fxs.join()) out.push(`effects [${a.fxs}] vs [${b.fxs}]`);
      if (JSON.stringify(a.formula) !== JSON.stringify(b.formula)) out.push(`formula ${JSON.stringify(a.formula)} vs ${JSON.stringify(b.formula)}`);
      return out;
    }
    function verify(level) {
      player.setLevel(level);
      const tl = player.lay.tl, stops = player.lay.stops;
      tl.pause();
      const P = [];
      tl.seek(0);
      let si = 0;
      const dt = 1 / 30;
      for (let t = 0; si < stops.length; ) {
        const end = stops[si].end;
        if (t + dt >= end) {
          tl.seek(end);
          P.push(snapshot());
          si++;
          t = end + 1e-3;
          continue;
        }
        t += dt;
        tl.seek(t);
      }
      const order = stops.map((_, i) => i).sort((a, b) => a * 7919 % 13 - b * 7919 % 13);
      const J = [];
      for (const i of order) {
        tl.seek(stops[i].end);
        J[i] = snapshot();
      }
      const back = [];
      for (let i = stops.length - 1; i >= 0; i--) {
        tl.seek(stops[i].end);
        back[i] = snapshot();
      }
      const problems = [];
      stops.forEach((s, i) => {
        const d1 = diff(P[i], J[i]);
        if (d1.length) problems.push({ stop: s.id, kind: "play-vs-jump", details: d1.slice(0, 6) });
        const d2 = diff(J[i], back[i]);
        if (d2.length) problems.push({ stop: s.id, kind: "jump-vs-backward", details: d2.slice(0, 6) });
      });
      player.jump(0);
      return { level, stops: stops.length, duration: Math.round(player.lay.duration * 10) / 10, problems };
    }
    function layout(level = 2) {
      player.setLevel(level);
      const issues = [];
      const stops = player.lay.stops;
      for (let i = 0; i < stops.length; i++) {
        player.jump(i);
        const texts = [];
        for (const tEl of document.querySelectorAll("#vat-root text")) {
          if (!tEl.textContent.trim()) continue;
          const v = visible(tEl);
          if (v < 0.2) continue;
          const r = tEl.getBoundingClientRect();
          if (!r.width) continue;
          const owner = tEl.closest(".vo");
          texts.push({ el: tEl, r: toRoot(r), text: tEl.textContent.trim(), owner: owner?.dataset.id || (tEl.closest(".fm") ? "formula" : "?") });
          if (/NaN|Infinity|undefined|null|\[object/.test(tEl.textContent)) issues.push({ stop: stops[i].id, kind: "bad-value", text: tEl.textContent.trim(), owner: owner?.dataset.id });
          const fsPx = Number(getComputedStyle(tEl).fontSize.replace("px", "")) * (tEl.getScreenCTM()?.a || 1) * (1440 / innerWidth);
          if (fsPx < 10.5 && !tEl.closest('#vat-world .vo-z[style*="opacity: 0"]')) issues.push({ stop: stops[i].id, kind: "text-too-small", text: tEl.textContent.trim().slice(0, 40), px: Math.round(fsPx * 10) / 10, owner: owner?.dataset.id });
          const R = toRoot(r);
          const inWorld = !!tEl.closest("#vat-world");
          const B = { x: 0, y: 0, w: 1600, h: 900 };
          const zoomed = st()._worldSvg.getAttribute("viewBox") !== "0 0 1600 770";
          const fullyOut = R.x > B.x + B.w || R.x + R.w < B.x || R.y > B.y + B.h || R.y + R.h < B.y;
          const partly = !fullyOut && (R.x < B.x - 2 || R.y < B.y - 2 || R.x + R.w > B.x + B.w + 2 || R.y + R.h > B.y + B.h + 2);
          if (partly) issues.push({ stop: stops[i].id, kind: inWorld && zoomed ? "clipped-zoomed" : "clipped", text: tEl.textContent.trim().slice(0, 40), owner: owner?.dataset.id });
          if (fullyOut) continue;
        }
        for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
          const A = texts[a], B = texts[b];
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          if (A.owner === "formula" && B.owner === "formula" && A.el.closest(".fm") === B.el.closest(".fm")) continue;
          const ix = Math.max(0, Math.min(A.r.x + A.r.w, B.r.x + B.r.w) - Math.max(A.r.x, B.r.x));
          const iy = Math.max(0, Math.min(A.r.y + A.r.h, B.r.y + B.r.h) - Math.max(A.r.y, B.r.y));
          const inter = ix * iy, small = Math.min(A.r.w * A.r.h, B.r.w * B.r.h);
          if (small > 0 && inter / small > 0.2) issues.push({ stop: stops[i].id, kind: "text-overlap", a: `${A.owner}: ${A.text.slice(0, 30)}`, b: `${B.owner}: ${B.text.slice(0, 30)}`, overlap: Math.round(inter / small * 100) + "%" });
        }
      }
      player.jump(0);
      const seen = /* @__PURE__ */ new Map();
      for (const x of issues) {
        const k = JSON.stringify({ ...x, stop: void 0 });
        if (seen.has(k)) seen.get(k).stops.push(x.stop);
        else seen.set(k, { ...x, stops: [x.stop] });
      }
      return [...seen.values()].map((x) => {
        delete x.stop;
        return x;
      });
    }
    return {
      get ready() {
        return !!player.lay || player.errors.length > 0;
      },
      get errors() {
        return player.errors;
      },
      get warnings() {
        return player.compiled?.warnings || [];
      },
      get checks() {
        return player.checks;
      },
      info() {
        const out = { title: player.def.meta?.title, compileMs: Math.round(player.compileMs || 0), objects: player.compiled?.stage._order.length, levels: {} };
        for (const L of [1, 2, 3]) {
          player.setLevel(L);
          out.levels[L] = { stops: player.lay.stops.length, seconds: Math.round(player.lay.duration * 10) / 10 };
        }
        player.setLevel(2);
        player.jump(0);
        return out;
      },
      stops: () => player.lay.stops.map((s) => ({ id: s.id, chapter: s.chapter, level: s.level, say: s.say })),
      go(i, level) {
        if (level) player.setLevel(level);
        player.jump(i);
        return player.lay.stops[i]?.id;
      },
      play(i) {
        player.jump(Math.max(0, i - 1));
        player.next();
        return player.lay.stops[i]?.id;
      },
      snapshot,
      verify,
      layout
    };
  }

  // engine/src/index.js
  for (const [name, f] of Object.entries(BUILTIN_COMPONENTS)) Stage.prototype[name] = function(spec) {
    return f(this, spec);
  };
  var verbs = /* @__PURE__ */ new Map();
  var components = /* @__PURE__ */ new Map();
  var currentLang = "en";
  window.defineLesson = (def) => def;
  window.vat = {
    get gsap() {
      return window.gsap;
    },
    version: "0.1.0",
    fmt: (n, dp) => fmt(n, dp, currentLang),
    defineVerb(name, impl) {
      if (typeof impl !== "function") throw new VatError(`vat.defineVerb(name, (obj, opts) => { ... })`);
      verbs.set(name, impl);
    },
    defineComponent(name, build) {
      if (typeof build !== "function") throw new VatError(`vat.defineComponent(name, (stage, spec) => obj)`);
      components.set(name, build);
    },
    extendComponent(base, name, extend) {
      components.set(name, (stage, spec) => {
        const inst = BUILTIN_COMPONENTS[base] ? stage[base](spec) : stage.use(base, spec);
        return extend(inst, spec) || inst;
      });
    }
  };
  function boot() {
    const def = window.__VAT_LESSON__;
    const app = document.getElementById("app");
    if (!def) {
      app.textContent = "No lesson found (window.__VAT_LESSON__ is empty).";
      return;
    }
    currentLang = def.meta?.lang || "en";
    const player = new Player(def, app, { verbs, components });
    window.__vat = qaApi(player);
    player.runChecks();
    player.build();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
