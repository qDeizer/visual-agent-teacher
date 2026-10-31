// A complete, small VAT lesson. Copy its structure, not its topic.
export default defineLesson({
  meta: { title: 'Ağırlıklı ortalama', lang: 'tr', goal: 'Vize ve final notlarından ağırlıklı ortalamayı adım adım hesaplayabilmek.' },

  glossary: {
    grade: { term: 'not', short: 'Bir sınavdan aldığın puan (0–100 arası).', concept: true },
    weight: { term: 'ağırlık', short: 'Bir notun sonuca ne kadar katılacağını gösteren pay. Bütün ağırlıkların toplamı 1 (yani %100).', symbol: 'w', concept: true },
    product: { term: 'katkı', short: 'Bir notun kendi ağırlığıyla çarpımı: o notun ortalamaya getirdiği pay.', concept: true },
    wavg: { term: 'ağırlıklı ortalama', short: 'Her not kendi ağırlığıyla çarpılıp bu katkılar toplanınca çıkan sonuç.', symbol: '\\bar{x}', memorize: true },
  },

  inputs: {
    midterm: { default: 60, min: 0, max: 100, step: 5, term: 'grade' },
    final: { default: 80, min: 0, max: 100, step: 5, term: 'grade' },
  },

  model(inp, t) {
    const m = t.input('midterm', inp.midterm)
    const f = t.input('final', inp.final)
    const wm = t.const('wm', 0.4)
    const wf = t.const('wf', 0.6)
    const pm = t.mul('pm', m, wm)
    const pf = t.mul('pf', f, wf)
    const avg = t.add('avg', pm, pf)
    return { m, f, wm, wf, pm, pf, avg }
  },

  checks: {
    known: [{ source: 'Yönetmelik örneği: vize %40, final %60; 60 ve 80 → 72', inputs: { midterm: 60, final: 80 }, expect: { pm: 24, pf: 48, avg: 72 } }],
    invariants(d, inp, fail) {
      const lo = Math.min(inp.midterm, inp.final), hi = Math.max(inp.midterm, inp.final)
      if (d.avg.value < lo - 1e-9 || d.avg.value > hi + 1e-9) fail('ortalama iki notun arasında olmalı')
    },
  },

  scene(stage, d) {
    const table = stage.table({ at: 'left', columns: ['Sınav', 'Not', 'Ağırlık', 'Katkı'], rows: [['Vize', d.m, d.wm, '—'], ['Final', d.f, d.wf, '—']] })
    const result = stage.value(d.avg, { at: { region: 'right', u: 0.5, v: 0.5 }, role: 'product', size: 'xl', hidden: true })
    const caption = stage.label('[[wavg]]', { at: { near: result, side: 'top', gap: 'md' }, hidden: true })
    return { table, result, caption }
  },

  script(lesson, { table, result, caption }, d) {
    lesson.chapter('what', 'Ne?', s => {
      s.say('Bir dersin notu, sınavların düz ortalaması değildir. Her sınavın bir [[weight]] değeri vardır: o sınavdaki [[grade]] değerinin sonuca ne kadar katılacağını söyler.')
      table.col('Ağırlık').highlight({ stagger: 'fast' })
    })

    lesson.chapter('why', 'Neden?', s => {
      s.say('Final daha çok konuyu kapsadığı için daha ağır sayılır: burada vize %40, final %60. Ağırlıkların toplamı 1, yani %100.')
      table.col('Ağırlık').pulse()
    })

    lesson.chapter('compute', 'Hesap', s => {
      s.say('Her not kendi ağırlığıyla çarpılır; bu çarpıma [[product]] diyoruz. İki katkıyı toplayınca [[wavg]] çıkar: **{{avg}}**.')
      table.col('Ağırlık').unhighlight()
      s.formula.show('\\slot{avg}{\\bar{x}} = \\slot{midterm}{x_1} \\cdot \\slot{wm}{w_1} + \\slot{final}{x_2} \\cdot \\slot{wf}{w_2}', { words: 'ortalama = vize × vize ağırlığı + final × final ağırlığı' })

      s.step('mid', { title: 'Vize katkısı', level: 3 }, s => {
        s.say('Vize notu {{midterm}}, ağırlığı {{wm}}. Çarpınca vizenin [[product]] değeri **{{pm}}** olur.')
        table.row(1).dim()
        s.fly(table.cell(0, 'Not'), s.formula.slot('midterm'))
        s.fly(table.cell(0, 'Ağırlık'), s.formula.slot('wm'))
        s.fly(d.pm, table.cell(0, 'Katkı'))
      })

      s.step('fin', { title: 'Final katkısı', level: 3 }, s => {
        s.say('Final notu {{final}}, ağırlığı {{wf}}. Çarpınca finalin [[product]] değeri **{{pf}}** olur.')
        table.row(1).undim()
        table.row(0).dim()
        s.fly(table.cell(1, 'Not'), s.formula.slot('final'))
        s.fly(table.cell(1, 'Ağırlık'), s.formula.slot('wf'))
        s.fly(d.pf, table.cell(1, 'Katkı'))
      })

      s.step('sum', { title: 'Toplam', level: 2 }, s => {
        s.say('Katkıları topluyoruz: {{pm}} + {{pf}} = **{{avg}}**. Sonuç iki notun arasında, finale daha yakın; çünkü finalin ağırlığı daha büyük.')
        table.row(0).undim()
        table.col('Katkı').highlight()
        s.formula.fill('avg', d.avg)
        s.together(() => { result.show(); caption.show() })
        result.pulse()
      })
    })

    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp hep aynı: **her değeri ağırlığıyla çarp → katkıları topla**. Ağırlıkların toplamı 1 olduğu için ayrıca bölmeye gerek kalmadı.')
      table.col('Katkı').unhighlight()
      lesson.memorize({ title: 'Ağırlıklı ortalama', formula: '\\bar{x} = \\sum w_i \\cdot x_i', words: 'her not × ağırlığı, sonra hepsini topla', why: 'Ağırlıklar toplamı 1 ise sonuç notların arasında kalır.' })
    })
  },

  practice: {
    generate: r => ({ midterm: r.int(0, 20) * 5, final: r.int(0, 20) * 5 }),
    tasks: [
      { id: 'p1', prompt: 'Vize {{midterm}} ise vizenin katkısı kaç?', answer: 'pm', tolerance: 0.01 },
      { id: 'p2', prompt: 'Final {{final}} ile ağırlıklı ortalama kaç?', answer: 'avg', tolerance: 0.01 },
    ],
  },
})
