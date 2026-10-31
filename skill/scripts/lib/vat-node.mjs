/* Visual Agent Teacher — Node helpers for build.mjs; built from engine/src */

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
  if (n === null || n === void 0) return "\u2014";
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
  return s.replace(/^-/, "\u2212");
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
  if (!known.length) results.push({ ok: false, message: "checks.known is empty: add at least one case from an external source (textbook, lecture notes, RFC\u2026)." });
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
export {
  fmt,
  inputValues,
  rng,
  runChecks,
  runModel,
  traceLookup,
  validateDef
};
