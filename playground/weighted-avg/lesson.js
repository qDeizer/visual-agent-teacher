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
