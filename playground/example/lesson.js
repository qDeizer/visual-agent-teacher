// Example lesson: the arithmetic mean, taught by TRANSFORMING things (not by fading slides).
// Copy its structure and its motion habits, not its topic:
//  - objects are born when they are named (pop in), lines draw themselves, numbers count,
//  - values fly from where they live into the formula, results are born from the formula,
//  - the key idea is shown as a transformation (bars level out to the mean), the camera zooms for a detail.
const BASE = 610, X0 = 360, GAP = 200, PX = 40 // world units: baseline y, first bar x, bar spacing, px per hour
const barX = i => X0 + i * GAP

export default defineLesson({
  meta: { title: 'Ortalama: hepsi eşit paylaşsaydı', lang: 'tr', goal: 'Bir sayı listesinin aritmetik ortalamasını hesaplamak ve ne anlama geldiğini görmek.' },

  glossary: {
    value: { term: 'değer', short: 'Listedeki tek bir sayı (burada bir günde çalışılan saat).', concept: true },
    sum: { term: 'toplam', short: 'Bütün değerlerin art arda eklenmesiyle çıkan sayı.', symbol: '\\Sigma', concept: true },
    count: { term: 'adet', short: 'Listede kaç değer olduğu.', symbol: 'n' },
    mean: { term: 'ortalama', short: 'Toplamın adede bölümü: herkes eşit paylaşsaydı her birine düşecek miktar.', symbol: '\\bar{x}', concept: true, memorize: true },
  },

  inputs: {
    d1: { default: 4, min: 0, max: 10, step: 1, term: 'value' },
    d2: { default: 7, min: 0, max: 10, step: 1, term: 'value' },
    d3: { default: 3, min: 0, max: 10, step: 1, term: 'value' },
    d4: { default: 8, min: 0, max: 10, step: 1, term: 'value' },
    d5: { default: 8, min: 0, max: 10, step: 1, term: 'value' },
  },

  model(inp, t) {
    const vals = ['d1', 'd2', 'd3', 'd4', 'd5'].map(k => t.input(k, inp[k]))
    const sum = t.add('sum', ...vals)
    const n = t.const('n', vals.length)
    const mean = t.div('mean', sum, n)
    return { vals, sum, n, mean }
  },

  checks: {
    known: [{ source: 'Ders kitabı örneği: 4, 7, 3, 8, 8 → toplam 30, ortalama 6', inputs: { d1: 4, d2: 7, d3: 3, d4: 8, d5: 8 }, expect: { sum: 30, mean: 6 } }],
    invariants(d, inp, fail) {
      const xs = d.vals.map(v => v.value)
      if (d.mean.value < Math.min(...xs) - 1e-9 || d.mean.value > Math.max(...xs) + 1e-9) fail('ortalama en küçük ile en büyük değer arasında olmalı')
      if (Math.abs(xs.reduce((s, x) => s + (x - d.mean.value), 0)) > 1e-9) fail('sapmaların toplamı 0 olmalı')
    },
  },

  scene(stage, d) {
    // free visuals: plain shapes at world coordinates (no component needed)
    const axis = stage.shape(`<line x1="0" y1="0" x2="${GAP * 5}" y2="0" stroke="var(--ink-3)" stroke-width="3"/>`, { at: { x: X0 - GAP / 2 + (GAP * 5) / 2, y: BASE }, hidden: true })
    const bars = d.vals.map((v, i) => stage.shape('<rect x="-48" y="-1" width="96" height="1" rx="10"/>', { id: `bar${i + 1}`, kind: 'bar', role: 'value', at: { x: barX(i), y: BASE - 0.5 }, hidden: true }))
    const tags = d.vals.map((v, i) => stage.value(0, { id: `tag${i + 1}`, role: 'value', at: { x: barX(i), y: BASE - 34 }, hidden: true }))
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map((s, i) => stage.label(s, { at: { x: barX(i), y: BASE + 36 }, size: 'sm', hidden: true }))
    const meanLine = stage.shape(`<line x1="0" y1="0" x2="${GAP * 5}" y2="0" stroke-width="4" stroke-dasharray="14 10"/>`, { role: 'mean', at: { x: X0 - GAP / 2 + (GAP * 5) / 2, y: BASE - d.mean.value * PX }, hidden: true })
    const meanTag = stage.value(d.mean, { role: 'mean', size: 'lg', at: { x: X0 + GAP * 5 - 20, y: BASE - d.mean.value * PX - 40 }, hidden: true })
    const sumChip = stage.value(d.sum, { role: 'sum', size: 'lg', at: { region: 'top', u: 0.82, v: 0.45 }, hidden: true })
    return { axis, bars, tags, days, meanLine, meanTag, sumChip }
  },

  script(lesson, { axis, bars, tags, days, meanLine, meanTag, sumChip }, d) {
    const stage = lesson.stage
    const H = v => v * PX

    lesson.chapter('question', 'Soru', s => {
      s.say('Beş gün boyunca her gün kaç saat çalıştığını yazdık. Peki "genelde günde kaç saat çalışıyorum" sorusunun tek bir cevabı olabilir mi?')
      axis.show()
      stage.select('label').show({ stagger: 'fast' })
      // bars grow from the baseline one after another; their numbers count up while they grow
      bars.forEach((b, i) => s.together(() => {
        b.show({ speed: 'fast' })
        b.to({ y: -H(d.vals[i].value), height: H(d.vals[i].value) }, { ease: 'back.out(1.4)' })
        tags[i].show({ speed: 'fast' }).moveTo({ x: barX(i), y: BASE - H(d.vals[i].value) - 34 })
        tags[i].setValue(d.vals[i])
      }))
    })

    lesson.chapter('sum', 'Topla', s => {
      s.say('Önce bütün [[value]] sayılarını bir araya topluyoruz: bu sayıya [[sum]] denir. ‹Toplam {{sum}} saat.›')
      s.formula.show('\\slot{sum}{\\Sigma} = \\slot{d1}{x_1} + \\slot{d2}{x_2} + \\slot{d3}{x_3} + \\slot{d4}{x_4} + \\slot{d5}{x_5}', { words: 'toplam = bütün değerlerin art arda eklenmesi' })
      s.step('sum-fly', { title: 'Sayılar formüle', level: 3 }, s => {
        s.say('Her çubuğun sayısı formüldeki yerine uçuyor.')
        tags.forEach((tg, i) => s.fly(tg, s.formula.slot(`d${i + 1}`)))
      })
      s.step('sum-born', { title: 'Toplam doğar', level: 3 }, s => {
        s.say('Beş sayı birleşince [[sum]] ortaya çıkar: ‹{{sum}}›.')
        s.formula.fill('sum', d.sum)
        s.fly(d.sum, sumChip)
        sumChip.show().pulse()
      })
    })

    lesson.chapter('divide', 'Böl', s => {
      s.say('[[sum]] değerini [[count]] sayısına, yani 5 güne bölüyoruz. Çıkan sayı [[mean]]: ‹günde {{mean}} saat›.')
      s.formula.show('\\slot{mean}{\\bar{x}} = \\frac{\\slot{sum}{\\Sigma}}{\\slot{n}{n}}', { words: 'ortalama = toplam ÷ adet' })
      s.fly(sumChip, s.formula.slot('sum'))
      s.formula.fill('n', d.n)
      s.formula.fill('mean', d.mean)
      s.together(() => { meanLine.show(); meanTag.show() })
    })

    lesson.chapter('level', 'Eşitle', s => {
      s.say('Ortalama ne demek? Çok çalışılan günler fazlalarını az çalışılan günlere verseydi, bütün çubuklar ‹tam {{mean}} saat› yüksekliğinde eşitlenirdi.')
      // the key idea as a transformation: every bar levels out to the mean, its number counts to the mean
      bars.forEach((b, i) => s.together(() => {
        b.to({ y: -H(d.mean.value), height: H(d.mean.value) }, { ease: 'power3.inOut' })
        tags[i].moveTo({ x: barX(i), y: BASE - H(d.mean.value) - 34 })
        tags[i].setValue(d.mean)
      }))
      bars.forEach(b => b.recolor('mean'))
    })

    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp hep aynı: **önce topla, sonra adede böl**. Ortalama, değerlerin en küçüğü ile en büyüğü arasında bir yerde durur.')
      s.formula.show('\\bar{x} = \\frac{x_1 + x_2 + \\cdots + x_n}{n}', { words: 'ortalama = toplam ÷ adet' })
      lesson.memorize({ title: 'Aritmetik ortalama', formula: '\\bar{x} = \\frac{\\sum x_i}{n}', words: 'bütün değerleri topla, kaç tane olduğuna böl', why: 'Herkes eşit paylaşsaydı her birine düşecek miktar.' })
    })
  },

  practice: {
    generate: r => ({ d1: r.int(0, 10), d2: r.int(0, 10), d3: r.int(0, 10), d4: r.int(0, 10), d5: r.int(0, 10) }),
    tasks: [
      { id: 'p1', prompt: 'Günler: {{d1}}, {{d2}}, {{d3}}, {{d4}}, {{d5}} saat. Toplam kaç?', answer: 'sum', tolerance: 0.01 },
      { id: 'p2', prompt: 'Ortalama kaç saat?', answer: 'mean', tolerance: 0.01 },
    ],
  },
})
