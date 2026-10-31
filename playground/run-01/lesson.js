// Ders: MLP'de ileri yayılım (tanh) — Ders 7 slaytındaki çözümlü örnek.
// Sayıların hepsi modelden gelir; slayt değerleri checks.known ile doğrulanır.
export default defineLesson({
  meta: {
    title: "MLP'de ileri yayılım — tanh ile adım adım",
    lang: 'tr',
    goal: "Verilen girdiler ve ağırlıklarla çok katmanlı bir ağın çıktısını ve hatasını katman katman hesaplayabilmek.",
  },

  glossary: {
    mlp: {
      term: 'çok katmanlı ağ (MLP)',
      short: 'Nöronların üst üste dizilmiş katmanlardan oluştuğu yapay sinir ağı. Girdi katmanı, gizli katmanlar ve çıktı katmanı vardır.',
    },
    forward: {
      term: 'ileri yayılım',
      short: 'Girdilerden başlayıp katman katman ilerleyerek çıktıyı hesaplama. Hesap hep ileri yönde akar; hiçbir adım geriye dönmez.',
      memorize: true,
    },
    neuron: {
      term: 'nöron',
      short: 'Ağın en küçük hesap birimi. Girdilerini ağırlıklarla çarpıp toplar, sonucu bir aktivasyon fonksiyonundan geçirir.',
      concept: true,
    },
    layer: {
      term: 'katman',
      short: 'Aynı seviyede duran nöronların sırası. Bir katmanın çıktıları bir sonraki katmanın girdisi olur.',
    },
    input: {
      term: 'girdi',
      short: 'Ağa dışarıdan verilen sayı. Bu örnekte üç girdi var: x₀ = −1 (bias), x₁ = 0,6 ve x₂ = 0,9.',
      symbol: 'x_i',
    },
    weight: {
      term: 'ağırlık',
      short: 'Bir girdinin sonuca ne kadar katılacağını belirleyen sayı. Eğitim boyunca değişen şey bu sayılardır.',
      symbol: 'w',
      concept: true,
    },
    bias: {
      term: 'bias',
      short: 'Değeri her zaman −1 olan ek girdi. Her nörona, kendi bias ağırlığıyla çarpılıp eklenir; nöronun eşiğini kaydırır.',
      symbol: 'b',
    },
    wsum: {
      term: 'ağırlıklı toplam',
      short: 'Girdilerin ağırlıklarıyla çarpımlarının toplamı. Nöronun aktivasyondan önceki ham sayısıdır.',
      symbol: 'I',
      concept: true,
      memorize: true,
    },
    activation: {
      term: 'aktivasyon fonksiyonu',
      short: 'Ağırlıklı toplamı sınırlı bir aralığa sıkıştıran fonksiyon. Aktivasyon olmasa ağ sadece düz bir çarpma-toplam olurdu.',
      symbol: 'f',
      concept: true,
    },
    tanh: {
      term: 'tanh',
      short: 'Her sayıyı −1 ile 1 arasına sıkıştıran aktivasyon fonksiyonu: f(u) = (e^u − e^−u) / (e^u + e^−u). Sıfırda 0 verir, uçlarda ±1’e yaklaşır.',
      symbol: 'f(u) = (e^u − e^−u) / (e^u + e^−u)',
      memorize: true,
    },
    output: {
      term: 'çıktı',
      short: 'Ağın son katmanındaki nöronun ürettiği sayı. Bu örnekte tek çıktı var: Out₃.',
      concept: true,
    },
    target: {
      term: 'gerçek çıktı',
      short: 'Verinin doğru cevabı (hedef). Bu örnekte y = 1; ağ bundan ne kadar uzaksa o kadar hatalıdır.',
      symbol: 'y',
    },
    loss: {
      term: 'hata',
      short: 'Ağın çıktısı ile gerçek çıktı arasındaki farkın karesinin yarısı: E = ½(y − çıktı)². Eğitim bu sayıyı küçültmeye çalışır.',
      symbol: 'E = ½(y − Out)²',
      concept: true,
      memorize: true,
    },
  },

  inputs: {
    x0: { default: -1, min: -2, max: 2, step: 0.5, term: 'input' },
    x1: { default: 0.6, min: -1, max: 1, step: 0.1, term: 'input' },
    x2: { default: 0.9, min: -1, max: 1, step: 0.1, term: 'input' },
    y: { default: 1, min: -1, max: 1, step: 0.5, term: 'target' },
  },

  model(inp, t) {
    const x0 = t.input('x0', inp.x0)
    const x1 = t.input('x1', inp.x1)
    const x2 = t.input('x2', inp.x2)
    const y = t.input('y', inp.y)

    const wA0 = t.const('wA0', 0.4), wA1 = t.const('wA1', 0.55), wA2 = t.const('wA2', 0.7)
    const wB0 = t.const('wB0', 0.2), wB1 = t.const('wB1', 0.8), wB2 = t.const('wB2', 0.6)
    const wC0 = t.const('wC0', -0.1), wC1 = t.const('wC1', 0.2), wC2 = t.const('wC2', 0.6)
    const wD0 = t.const('wD0', 0.4), wD1 = t.const('wD1', 0.35), wD2 = t.const('wD2', 0.3)
    const wE0 = t.const('wE0', -0.8), wE1 = t.const('wE1', 0.7), wE2 = t.const('wE2', 0.9)
    const wF0 = t.const('wF0', 0.35), wF1 = t.const('wF1', 0.5), wF2 = t.const('wF2', 0.4), wF3 = t.const('wF3', 0.3)

    const pA0 = t.mul('pA0', wA0, x0), pA1 = t.mul('pA1', wA1, x1), pA2 = t.mul('pA2', wA2, x2)
    const pB0 = t.mul('pB0', wB0, x0), pB1 = t.mul('pB1', wB1, x1), pB2 = t.mul('pB2', wB2, x2)
    const z11 = t.add('z11', pA0, pA1, pA2)
    const z12 = t.add('z12', pB0, pB1, pB2)
    const a11 = t.fn('a11', 'tanh', Math.tanh, z11)
    const a12 = t.fn('a12', 'tanh', Math.tanh, z12)

    const pC0 = t.mul('pC0', wC0, x0), pC1 = t.mul('pC1', wC1, a11), pC2 = t.mul('pC2', wC2, a12)
    const pD0 = t.mul('pD0', wD0, x0), pD1 = t.mul('pD1', wD1, a11), pD2 = t.mul('pD2', wD2, a12)
    const pE0 = t.mul('pE0', wE0, x0), pE1 = t.mul('pE1', wE1, a11), pE2 = t.mul('pE2', wE2, a12)
    const z21 = t.add('z21', pC0, pC1, pC2)
    const z22 = t.add('z22', pD0, pD1, pD2)
    const z23 = t.add('z23', pE0, pE1, pE2)
    const a21 = t.fn('a21', 'tanh', Math.tanh, z21)
    const a22 = t.fn('a22', 'tanh', Math.tanh, z22)
    const a23 = t.fn('a23', 'tanh', Math.tanh, z23)

    const pF0 = t.mul('pF0', wF0, x0), pF1 = t.mul('pF1', wF1, a21), pF2 = t.mul('pF2', wF2, a22), pF3 = t.mul('pF3', wF3, a23)
    const z31 = t.add('z31', pF0, pF1, pF2, pF3)
    const a31 = t.fn('a31', 'tanh', Math.tanh, z31)

    const half = t.const('half', 0.5)
    const diff = t.sub('diff', y, a31)
    const sq = t.mul('sq', diff, diff)
    const err = t.mul('err', half, sq)

    return {
      x0, x1, x2, y,
      wA0, wA1, wA2, wB0, wB1, wB2, wC0, wC1, wC2, wD0, wD1, wD2, wE0, wE1, wE2, wF0, wF1, wF2, wF3,
      pA0, pA1, pA2, pB0, pB1, pB2, pC0, pC1, pC2, pD0, pD1, pD2, pE0, pE1, pE2, pF0, pF1, pF2, pF3,
      z11, z12, z21, z22, z23, z31,
      a11, a12, a21, a22, a23, a31,
      diff, sq, err,
    }
  },

  checks: {
    known: [
      {
        source: 'Ders 7 — MLP ileri yayılım çözümlü slayt örneği',
        inputs: { x0: -1, x1: 0.6, x2: 0.9, y: 1 },
        expect: {
          z11: 0.56, a11: 0.507977,
          z12: 0.82, a12: 0.675069,
          z21: 0.606637, a21: 0.541755,
          z22: -0.019687, a22: -0.019684,
          z23: 1.763147, a23: 0.942853,
          z31: 0.195860, a31: 0.193394,
          err: 0.325307,
        },
        tolerance: 1e-5,
      },
    ],
    invariants(d, inp, fail) {
      for (const k of ['a11', 'a12', 'a21', 'a22', 'a23', 'a31']) {
        const v = d[k].value
        if (!(v > -1 && v < 1)) fail(`${k} tanh çıktısı (−1,1) arasında olmalı, bulundu ${v}`)
      }
      if (d.err.value < 0) fail('hata asla negatif olamaz')
      const want = 0.5 * (inp.y - d.a31.value) ** 2
      if (Math.abs(d.err.value - want) > 1e-9) fail('hata, ½(y − çıktı)² formülüne uymalı')
      if (Math.abs(d.z31.value - (d.pF0.value + d.pF1.value + d.pF2.value + d.pF3.value)) > 1e-9) fail('çıktı nöronunun ağırlıklı toplamı katkıların toplamı olmalı')
      const tanhSum = (d.z11.value - (d.pA0.value + d.pA1.value + d.pA2.value))
      if (Math.abs(tanhSum) > 1e-9) fail('h₁₁ ağırlıklı toplamı katkıların toplamı olmalı')
      if (Math.abs(d.a31.value - Math.tanh(d.z31.value)) > 1e-12) fail('çıktı, ağırlıklı toplamın tanh’ı olmalı')
      if (Math.abs(inp.y - d.a31.value) < 1e-12 && Math.abs(d.err.value) > 1e-15) fail('çıktı hedefe eşitse hata 0 olmalı')
    },
  },

  scene(stage, d) {
    const net = stage.neuralNet({
      at: 'main',
      layers: [2, 2, 3, 1],
      ids: [['x1', 'x2'], ['h11', 'h12'], ['h21', 'h22', 'h23'], ['o1']],
      layerNames: ['Girdi', '1. gizli katman', '2. gizli katman', 'Çıktı'],
      weights: 'on-focus',
      values: {
        inputs: { x1: d.x1, x2: d.x2 },
        weights: {
          'x1>h11': d.wA1, 'x2>h11': d.wA2, 'x1>h12': d.wB1, 'x2>h12': d.wB2,
          'h11>h21': d.wC1, 'h12>h21': d.wC2, 'h11>h22': d.wD1, 'h12>h22': d.wD2,
          'h11>h23': d.wE1, 'h12>h23': d.wE2,
          'h21>o1': d.wF1, 'h22>o1': d.wF2, 'h23>o1': d.wF3,
        },
        biases: { h11: d.pA0, h12: d.pB0, h21: d.pC0, h22: d.pD0, h23: d.pE0, o1: d.pF0 },
      },
    })

    const tanhPlot = stage.plot({
      at: { region: 'center' },
      x: { label: 'u: ağırlıklı toplam', domain: [-3, 3] },
      y: { label: 'tanh(u): aktivasyon çıktısı', domain: [-1, 1] },
      hidden: true,
    })
    const tanhCurve = tanhPlot.curve((u) => Math.tanh(u), { role: 'activation' })
    const tanhPoint = tanhPlot.point({ x: d.z11.value, y: d.a11.value }, { role: 'activation', label: 'h₁₁ örneği', hidden: true })

    return { net, tanhPlot, tanhCurve, tanhPoint }
  },

  script(lesson, refs, d) {
    const { net, tanhPlot, tanhPoint } = refs
    const focus = (ids) => {
      const keep = ids.map((id) => net.node(id))
      net.nodes().except(...keep).dim()
      keep.forEach((n) => n.undim().highlight())
    }
    const showW = (pairs) => pairs.forEach(([a, b]) => net.weight(a, b).show())

    // ── 1 ─────────────────────────────────────────────────────────────
    lesson.chapter('soru', 'Soru', (s) => {
      s.say('Elimizde ağırlıkları belli, yani eğitilmiş bir [[mlp|çok katmanlı ağ]] var. Sorusu şu: girdileri verince ağ hangi sayıyı üretir ve gerçek cevaptan ne kadar uzaktır? Cevap tek yönlü bir hesaptan çıkar: [[forward|ileri yayılım]].')
      net.layer(1).dim()
      net.layer(2).dim()
      net.layer(3).dim()
      net.layer(0).undim().highlight()
    })

    // ── 2 ─────────────────────────────────────────────────────────────
    lesson.chapter('parcalar', 'Parçalar', (s) => {
      s.say('Ağ, [[neuron|nöron]] denilen küçük hesap birimlerinden oluşur; nöronlar [[layer|katman]] denilen sıralara dizilir. Her nöron aynı iki işi yapar: tartıp toplar, sonra sıkıştırır.')
      net.nodes().unhighlight()

      s.step('carp', { title: 'Çarpım', level: 3 }, (s) => {
        s.say('Bir [[input|girdi]] ile bir [[weight|ağırlık]] çarpılır. Ağırlık büyükse o girdi toplamda daha çok söz sahibi olur: x₁ ile w₁ çarpımı bir katkıdır.')
        focus(['h11'])
        net.weight('x1', 'h11').show().highlight()
        net.edge('x1', 'h11').flow(true)
      })

      s.step('topla', { title: 'Topla', level: 2 }, (s) => {
        s.say('Bütün katkılar toplanır. Bu toplama [[wsum|ağırlıklı toplam]] denir ve I ile gösterilir. Nöronun aktivasyondan önceki ham sayısı budur.')
        net.edge('x1', 'h11').flow(false)
        s.formula.show('\\slot{z11}{I} = \\slot{wA0}{w_0} \\cdot \\slot{x0}{x_0} + \\slot{wA1}{w_1} \\cdot \\slot{x1}{x_1} + \\slot{wA2}{w_2} \\cdot \\slot{x2}{x_2}', {
          words: 'ağırlıklı toplam = her ağırlık × kendi girdisi, sonra hepsini topla',
        })
        net.weight('x1', 'h11').unhighlight()
      })

      s.step('sikistir', { title: 'Sıkıştır', level: 2 }, (s) => {
        s.say('Toplam, bir [[activation|aktivasyon fonksiyonundan]] geçer. Bu derste kullanılan [[tanh]], her sayıyı −1 ile 1 arasına sıkıştırır. Büyük toplamlar 1’e, küçükler −1’e yaklaşır.')
        net.hide()
        tanhPlot.show()
        tanhPoint.show()
        // Slayttaki kesirli tanh formülü; formül çubuğunda tek satır kalsın diye bölme "/" ile yazıldı.
        s.formula.show('\\text{tanh}(u) = \\left(e^{u} - e^{-u}\\right) / \\left(e^{u} + e^{-u}\\right)', {
          words: 'tanh(u): u sayısını (−1, 1) aralığına sıkıştırır',
        })
      })

      s.step('bias', { title: 'Bias', level: 2 }, (s) => {
        s.say('Her nöronun bir de [[bias]] girdisi vardır: değeri hep −1’dir. Kendi bias ağırlığıyla çarpılıp toplama eklenir. Şekildeki küçük “b” rozeti bu sabit katkıyı gösterir: h₁₁ için 0.4 · (−1) = {{pA0:3}}.')
        tanhPlot.hide()
        tanhPoint.hide()
        net.show()
        net.nodes().unhighlight()
        net.node('h11').undim().highlight()
        net.bias('h11').show().highlight()
        s.formula.show('\\slot{pA0}{b} = \\slot{wA0}{w_0} \\cdot \\slot{x0}{x_0}', {
          words: 'bias katkısı = bias ağırlığı × (−1); bias girdisi hep −1',
        })
        net.bias('h11').glow(true)
      })
    })

    // ── 3 ─────────────────────────────────────────────────────────────
    lesson.chapter('layer1', '1. gizli katman', (s) => {
      s.say('Girdi katmanından 1. gizli katmana geçiyoruz. İki nöron, iki girdiyi ve bias girdisini kendi ağırlıklarıyla tartıyor. Önce h₁₁: {{pA0:3}} + {{pA1:3}} + {{pA2:3}} = **{{z11:3}}**.')
      net.bias('h11').unhighlight().glow(false)
      net.layer(0).unhighlight()
      focus(['h11'])
      showW([['x1', 'h11'], ['x2', 'h11']])

      s.step('h11-toplam', { title: 'h₁₁ ağırlıklı toplam', level: 2 }, (s) => {
        s.say('h₁₁’in [[wsum|ağırlıklı toplamı]] üç katkıdan oluşur: bias katkısı 0.4·(−1), x₁ katkısı 0.55·0.6, x₂ katkısı 0.7·0.9. Toplam **{{z11:3}}** olur. Slaytta sonuçlar 6 ondalıkla yazılmış; burada 3 ondalık gösteriyoruz.')
        s.formula.show('\\slot{z11}{I_{11}} = \\slot{wA0}{0.4} \\cdot \\slot{x0}{x_0} + \\slot{wA1}{w_1} \\cdot \\slot{x1}{x_1} + \\slot{wA2}{w_2} \\cdot \\slot{x2}{x_2}', {
          words: 'I₁₁ = 0.4 × (−1) + 0.55 × 0.6 + 0.7 × 0.9',
        })

        s.step('h11-t1', { level: 3 }, (s) => {
          s.say('Birinci katkı bias’tan: 0.4 · (−1) = {{pA0:3}}. Bias girdisi hep −1 olduğu için katkı, bias ağırlığının ters işaretlisidir.')
          net.edge('x1', 'h11').dim()
          net.edge('x2', 'h11').dim()
          s.formula.fill('x0', d.x0)
        })

        s.step('h11-t2', { level: 3 }, (s) => {
          s.say('İkinci katkı x₁’den: ağırlık {{wA1:3}}, girdi {{x1:3}}; çarpım {{pA1:3}}.')
          s.fly(net.weight('x1', 'h11'), s.formula.slot('wA1'), { speed: 'fast' })
          s.fly(net.nodeValue('x1'), s.formula.slot('x1'), { speed: 'fast' })
          net.edge('x1', 'h11').undim().flow(true)
        })

        s.step('h11-t3', { level: 3 }, (s) => {
          s.say('Üçüncü katkı x₂’den: ağırlık {{wA2:3}}, girdi {{x2:3}}; çarpım {{pA2:3}}. Üç katkıyı toplayınca {{z11:3}} çıkar.')
          net.edge('x1', 'h11').flow(false)
          net.edge('x2', 'h11').undim().flow(true)
          s.fly(net.weight('x2', 'h11'), s.formula.slot('wA2'), { speed: 'fast' })
          s.fly(net.nodeValue('x2'), s.formula.slot('x2'), { speed: 'fast' })
          s.formula.fill('z11', d.z11)
        })

        s.step('h11-t4', { level: 3 }, (s) => {
          s.say('Bias ağırlığı {{wA0:3}} ile −1 çarpılır; sonuç {{pA0:3}}. Toplamın ilk terimi budur.')
          net.edge('x2', 'h11').flow(false)
          s.formula.fill('wA0', d.wA0)
          net.bias('h11').pulse()
        })
      })

      s.step('h11-tanh', { title: 'h₁₁ aktivasyonu', level: 2 }, (s) => {
        s.say('Ağırlıklı toplam {{z11:3}}, [[tanh]]’tan geçirilir: sonuç **{{a11:3}}**. Nöronun içinde görünen sayı bu artık: aktivasyon çıktısı.')
        net.edge('x1', 'h11').unhighlight()
        net.edge('x2', 'h11').unhighlight()
        net.edge('x1', 'h11').flow(false)
        s.formula.show('\\slot{a11}{\\text{Out}_{11}} = \\text{tanh}\\left(\\slot{z11}{I_{11}}\\right)', {
          words: 'Out₁₁ = tanh(I₁₁)',
        })
        s.formula.fill('z11', d.z11)
        s.fly(d.a11, net.nodeValue('h11'))
        s.formula.fill('a11', d.a11)
        net.node('h11').highlight()
      })

      s.step('h12', { title: 'h₁₂ aynı hesap', level: 2 }, (s) => {
        s.say('İkinci nöron h₁₂ için aynı üç işlem, farklı ağırlıklarla: 0.2·(−1) + 0.8·0.6 + 0.6·0.9 = {{z12:3}}; tanh’tan sonra **{{a12:3}}**. Her nöronun kendi ağırlık seti vardır.')
        net.nodes().except(net.node('h12')).dim()
        net.node('h12').undim().highlight()
        net.node('h11').unhighlight()
        showW([['x1', 'h12'], ['x2', 'h12']])
        s.formula.show('\\slot{a12}{\\text{Out}_{12}} = \\text{tanh}\\left(\\slot{z12}{I_{12}}\\right)', {
          words: 'Out₁₂ = tanh(I₁₂)',
        })
        net.bias('h12').show()
        s.formula.fill('z12', d.z12)
        s.fly(d.a12, net.nodeValue('h12'))
        s.formula.fill('a12', d.a12)
      })

      s.step('l1-son', { title: '1. katman bitti', level: 3 }, (s) => {
        s.say('1. gizli katmanın çıktısı iki sayıdır: {{a11:3}} ve {{a12:3}}. Bunlar artık 2. gizli katmanın girdileridir. Girdi katmanındaki x₁ ve x₂’ye bir daha ihtiyaç kalmaz.')
        net.weights().hide()
        net.node('h12').unhighlight()
        net.layer(1).highlight()
        focus(['h11', 'h12'])
      })
    })

    // ── 4 ─────────────────────────────────────────────────────────────
    lesson.chapter('layer2', '2. gizli katman', (s) => {
      s.say('Şimdi 2. gizli katman. Üç nöron var; her biri iki gizli çıktıyı ve bias girdisini tartıyor. Aynı kalıp, sadece girdiler değişti: artık girdiler {{a11:3}} ve {{a12:3}}.')
      net.layer(3).dim()
      net.layer(0).dim()
      focus(['h21', 'h22', 'h23'])

      s.step('h21-toplam', { title: 'h₂₁ ağırlıklı toplam', level: 2 }, (s) => {
        s.say('h₂₁’in [[wsum|ağırlıklı toplamı]]: −0.1·(−1) + 0.2·{{a11:3}} + 0.6·{{a12:3}} = **{{z21:3}}**. Bias katkısı bu kez pozitif.')
        net.node('h21').highlight()
        showW([['h11', 'h21'], ['h12', 'h21']])
        s.formula.show('\\slot{z21}{I_{21}} = \\slot{wC0}{-0.1} \\cdot \\slot{x0}{x_0} + \\slot{wC1}{w_1} \\cdot \\slot{a11}{\\text{Out}_{11}} + \\slot{wC2}{w_2} \\cdot \\slot{a12}{\\text{Out}_{12}}', {
          words: 'I₂₁ = −0.1 × (−1) + 0.2 × Out₁₁ + 0.6 × Out₁₂',
        })

        s.step('h21-fly', { level: 3 }, (s) => {
          s.say('Girdiler, 1. katmanın çıktılarıdır: {{a11:3}} ve {{a12:3}}. Ağırlıklarla çarpılıp toplanırlar.')
          s.fly(net.weight('h11', 'h21'), s.formula.slot('wC1'), { speed: 'fast' })
          s.fly(net.weight('h12', 'h21'), s.formula.slot('wC2'), { speed: 'fast' })
          s.fly(net.nodeValue('h11'), s.formula.slot('a11'), { speed: 'fast' })
          s.fly(net.nodeValue('h12'), s.formula.slot('a12'), { speed: 'fast' })
          s.formula.fill('z21', d.z21)
        })
      })

      s.step('h21-tanh', { title: 'h₂₁ aktivasyonu', level: 2 }, (s) => {
        s.say('Toplam {{z21:3}} tanh’tan geçince **{{a21:3}}** olur. Bu değer 2. gizli katmanın ilk çıktısıdır.')
        s.formula.show('\\slot{a21}{\\text{Out}_{21}} = \\text{tanh}\\left(\\slot{z21}{I_{21}}\\right)', { words: 'Out₂₁ = tanh(I₂₁)' })
        s.formula.fill('z21', d.z21)
        s.fly(d.a21, net.nodeValue('h21'))
        s.formula.fill('a21', d.a21)
      })

      s.step('h22', { title: 'h₂₂', level: 3 }, (s) => {
        s.say('h₂₂ aynı formülle: 0.4·(−1) + 0.35·{{a11:3}} + 0.3·{{a12:3}} = {{z22:3}}; tanh’tan sonra **{{a22:3}}**. Toplam yine 0’a çok yakın, çıktı da 0’a yakın.')
        net.weights().hide()
        net.nodes().except(net.node('h22')).dim()
        net.node('h22').undim().highlight()
        showW([['h11', 'h22'], ['h12', 'h22']])
        s.formula.show('\\slot{a22}{\\text{Out}_{22}} = \\text{tanh}\\left(\\slot{z22}{I_{22}}\\right)', { words: 'Out₂₂ = tanh(I₂₂)' })
        s.formula.fill('z22', d.z22)
        s.fly(d.a22, net.nodeValue('h22'))
        s.formula.fill('a22', d.a22)
      })

      s.step('h23', { title: 'h₂₃', level: 3 }, (s) => {
        s.say('h₂₃: −0.8·(−1) + 0.7·{{a11:3}} + 0.9·{{a12:3}} = {{z23:3}}; tanh’tan sonra **{{a23:3}}**. Bu nöronun çıktısı 1’e en yakın olanı.')
        net.node('h22').unhighlight()
        net.weights().hide()
        net.nodes().except(net.node('h23')).dim()
        net.node('h23').undim().highlight()
        showW([['h11', 'h23'], ['h12', 'h23']])
        s.formula.show('\\slot{a23}{\\text{Out}_{23}} = \\text{tanh}\\left(\\slot{z23}{I_{23}}\\right)', { words: 'Out₂₃ = tanh(I₂₃)' })
        s.formula.fill('z23', d.z23)
        s.fly(d.a23, net.nodeValue('h23'))
        s.formula.fill('a23', d.a23)
      })
    })

    // ── 5 ─────────────────────────────────────────────────────────────
    lesson.chapter('layer3', 'Çıktı katmanı', (s) => {
      s.say('Son adım: çıktı nöronu. Üç gizli çıktıyı ve bias girdisini tartıp [[output|çıktıyı]] üretiyor. Ağın cevabı tek sayı olacak.')
      net.weights().hide()
      net.nodes().except(net.node('o1')).dim()
      net.node('o1').undim().highlight()
      net.bias('o1').show()

      s.step('o1-toplam', { title: 'Çıktı ağırlıklı toplam', level: 2 }, (s) => {
        s.say('Çıktı nöronunun [[wsum|ağırlıklı toplamı]]: 0.35·(−1) + 0.5·{{a21:3}} + 0.4·{{a22:3}} + 0.3·{{a23:3}} = **{{z31:3}}**. Dört terim var, çünkü üç gizli nöron ve bias.')
        showW([['h21', 'o1'], ['h22', 'o1'], ['h23', 'o1']])
        s.formula.show('\\slot{z31}{I_3} = \\slot{wF0}{0.35} \\cdot \\slot{x0}{x_0} + \\slot{wF1}{w_1} \\cdot \\slot{a21}{\\text{Out}_{21}} + \\slot{wF2}{w_2} \\cdot \\slot{a22}{\\text{Out}_{22}} + \\slot{wF3}{w_3} \\cdot \\slot{a23}{\\text{Out}_{23}}', {
          words: 'I₃ = 0.35 × (−1) + 0.5 × Out₂₁ + 0.4 × Out₂₂ + 0.3 × Out₂₃',
        })

        s.step('o1-fly', { level: 3 }, (s) => {
          s.say('Üç ağırlık ve üç gizli çıktı yerine konur: 0.5·{{a21:3}} + 0.4·{{a22:3}} + 0.3·{{a23:3}}. Bias katkısı {{pF0:3}} bunlara eklenir.')
          s.fly(net.weight('h21', 'o1'), s.formula.slot('wF1'), { speed: 'fast' })
          s.fly(net.weight('h22', 'o1'), s.formula.slot('wF2'), { speed: 'fast' })
          s.fly(net.weight('h23', 'o1'), s.formula.slot('wF3'), { speed: 'fast' })
          s.formula.fill('z31', d.z31)
        })
      })

      s.step('o1-tanh', { title: 'Ağın cevabı', level: 2 }, (s) => {
        s.say('Toplam {{z31:3}} tanh’tan geçer ve ağın çıktısı **{{a31:3}}** olur. Yani ağ, bu girdiler için neredeyse 0.2 diyor.')
        net.weights().hide()
        s.formula.show('\\slot{a31}{\\text{Out}_3} = \\text{tanh}\\left(\\slot{z31}{I_3}\\right)', { words: 'Out₃ = tanh(I₃)' })
        s.formula.fill('z31', d.z31)
        s.fly(d.a31, net.nodeValue('o1'))
        s.formula.fill('a31', d.a31)
        net.node('o1').glow(true)
      })
    })

    // ── 6 ─────────────────────────────────────────────────────────────
    lesson.chapter('hata', 'Hata', (s) => {
      s.say('Ağın cevabı {{a31:3}}, [[target|gerçek çıktı]] ise {{y}}. Aradaki farktan [[loss|hata]] hesaplanır. Eğitim, ağırlıkları tam bu sayıyı küçültecek yönde değiştirir.')
      net.node('o1').glow(false)
      net.nodes().unhighlight()
      net.nodes().undim()
      net.edges().undim()

      s.step('fark', { title: 'Fark', level: 3 }, (s) => {
        s.say('Önce fark: gerçek çıktı eksi ağın çıktısı = {{y:3}} − {{a31:3}} = {{diff:3}}. Fark büyükse ağın tahmini kötüdür.')
        s.formula.show('\\slot{diff}{y - \\text{Out}_3} = \\slot{y}{y} - \\slot{a31}{\\text{Out}_3}', { words: 'fark = gerçek çıktı − ağın çıktısı' })
        s.formula.fill('diff', d.diff)
      })

      s.step('hata-hesap', { title: 'Hatanın kendisi', level: 2 }, (s) => {
        s.say('Farkın karesi alınır (işaret önemsiz olsun diye), yarısı alınır: ½ · ({{diff:3}})² = ½ · {{sq:3}} = **{{err:3}}**. Slayttaki değer 0,325307.')
        s.formula.show('\\slot{err}{E} = \\frac{1}{2}\\left(\\slot{y}{y} - \\slot{a31}{\\text{Out}_3}\\right)^{2}', {
          words: 'hata = ½ × (gerçek çıktı − ağın çıktısı)²',
        })
        s.formula.fill('y', d.y)
        s.formula.fill('a31', d.a31)
        s.formula.fill('err', d.err)
        net.node('o1').pulse()
      })
    })

    // ── 7 ─────────────────────────────────────────────────────────────
    lesson.chapter('kalip', 'Kalıp', (s) => {
      s.say('Bütün ders tek bir kalıp: her nöronda **çarp → topla → tanh**, katman katman tekrar. Girdi katmanından çıktı katmanına kadar aynı üç iş; değişen sadece ağırlıklar ve girdiler.')
      net.nodes().undim()
      net.nodes().unhighlight()
      net.weights().hide()
      net.edges().undim()
      s.formula.show('\\slot{aO}{\\text{Out}} = \\text{tanh}(\\sum_{i} (\\slot{wI}{w_{i}} \\cdot \\slot{xI}{x_{i}}))', {
        words: 'her nöronda: ağırlıklı toplam (Σ ağırlık × girdi), sonra tanh',
      })
      net.layer(0).highlight()
      s.pause(1)
      net.layer(0).unhighlight()
      net.layer(1).highlight()
      s.pause(1)
      net.layer(1).unhighlight()
      net.layer(2).highlight()
      s.pause(1)
      net.layer(2).unhighlight()
      net.layer(3).highlight()
      lesson.memorize({ title: 'İleri yayılım', formula: 'I = Σ wᵢ·xᵢ (+ b);  Out = tanh(I)', words: 'Her nöronda: ağırlıklı toplam, sonra tanh. Katman katman tekrar et.', why: 'Çıktı tek yönde hesaplanır; hata ancak çıktı hesaplandıktan sonra bulunabilir.' })
      lesson.memorize({ title: 'Hata', formula: 'E = ½ (y − Out)²', words: 'Gerçek çıktı ile ağın çıktısı arasındaki farkın karesinin yarısı.', why: 'Eğitim bu sayıyı küçültmek için ağırlıkları günceller.' })
    })
  },

  practice: {
    generate: (r) => ({ x0: -1, x1: r.int(-10, 10) / 10, x2: r.int(-10, 10) / 10, y: r.pick([0, 1]) }),
    tasks: [
      { id: 'p1', prompt: 'x₁ = {{x1}} ve x₂ = {{x2}} iken h₁₁’in ağırlıklı toplamı (I₁₁) kaç?', answer: 'z11', tolerance: 0.002 },
      { id: 'p2', prompt: 'h₁₁’in aktivasyon çıktısı (tanh) kaç?', answer: 'a11', tolerance: 0.002 },
      { id: 'p3', prompt: 'Ağın çıktısı Out₃ kaç?', answer: 'a31', tolerance: 0.002 },
      { id: 'p4', prompt: 'Hata E kaç?', answer: 'err', tolerance: 0.002 },
    ],
  },
})
