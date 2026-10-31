// MLP ileri yayılım: 2 girdi -> 2 gizli nöron (sigmoid) -> 1 çıktı nöronu (sigmoid), tek örnek.

const sigmoid = z => 1 / (1 + Math.exp(-z))

export default defineLesson({
  meta: {
    title: 'Yapay sinir ağında ileri yayılım',
    lang: 'tr',
    goal: 'Küçük bir sinir ağında iki girdinin çıktıya nasıl dönüştüğünü adım adım hesaplayabilmek.',
  },

  glossary: {
    network: { term: 'sinir ağı', short: 'Birbirine bağlı küçük hesap birimlerinden (nöronlardan) oluşan, sayıları alıp sayı üreten bir hesap makinesi.' },
    neuron: { term: 'nöron', short: 'Sinir ağının en küçük hesap birimi: sayıları alır, tek bir sayı üretir.' },
    layer: { term: 'katman', short: 'Aynı aşamada çalışan nöronların oluşturduğu sütun. Ağ soldan sağa katman katman çalışır.' },
    input: { term: 'girdi', short: 'Ağa dışarıdan verilen sayı, örneğin bir ölçüm.', symbol: 'x' },
    hidden: { term: 'gizli katman', short: 'Girdi ile çıktı arasındaki katman. Dışarıdan görünmez, ara hesapları yapar.' },
    output: { term: 'çıktı', short: 'Ağın son katmanının ürettiği sayı; ağın cevabı.', symbol: 'y' },
    weight: {
      term: 'ağırlık',
      short: 'Bir bağlantının kuvveti. Girdi bu sayıyla çarpılır; büyükse o girdi daha çok etkili olur.',
      long: 'w_{11}: birinci girdiden birinci gizli nörona giden bağlantının ağırlığı. Ağırlıklar normalde öğrenilir; burada hazır verilmiştir.',
      symbol: 'w', concept: true, memorize: true,
    },
    bias: {
      term: 'sapma (bias)',
      short: 'Nörona eklenen sabit bir sayı. Girdiler sıfır olsa bile nöronun ne kadar "hevesli" olduğunu ayarlar.',
      symbol: 'b', concept: true, memorize: true,
    },
    wsum: {
      term: 'ağırlıklı toplam',
      short: 'Her girdinin kendi ağırlığıyla çarpılıp hepsinin ve sapmanın toplanmasıyla bulunan sayı.',
      symbol: 'z', concept: true, memorize: true,
    },
    activation: {
      term: 'aktivasyon fonksiyonu',
      short: 'Ağırlıklı toplamı alıp belli bir aralığa sıkıştıran fonksiyon. Nöronun nihai çıktısını bu belirler.',
      long: 'Bu derste sigmoid kullanılıyor: çok negatif sayıları 0\'a, çok pozitif sayıları 1\'e yaklaştırır, ortada yumuşak geçiş yapar.',
      symbol: 'a', concept: true, memorize: true,
    },
    sigmoid: {
      term: 'sigmoid',
      short: 'Her sayıyı 0 ile 1 arasına sıkıştıran fonksiyon: 1 / (1 + e^(−z)).',
      symbol: '\\sigma(z)', memorize: true,
    },
    prediction: { term: 'tahmin', short: 'Ağın çıktı nöronunun verdiği sayı; ağın bu girdilere verdiği cevap.', symbol: 'y', concept: true },
    forward: {
      term: 'ileri yayılım (forward propagation)',
      short: 'Girdilerin ağın içinden soldan sağa, katman katman geçip çıktıya dönüşmesi.',
      memorize: true,
    },
  },

  inputs: {
    x1: { default: 0.05, min: -1, max: 1, step: 0.05, term: 'input' },
    x2: { default: 0.10, min: -1, max: 1, step: 0.05, term: 'input' },
    w11: { default: 0.15, min: -1, max: 1, step: 0.05, term: 'weight' },
    w21: { default: 0.20, min: -1, max: 1, step: 0.05, term: 'weight' },
    w12: { default: 0.25, min: -1, max: 1, step: 0.05, term: 'weight' },
    w22: { default: 0.30, min: -1, max: 1, step: 0.05, term: 'weight' },
    b1: { default: 0.35, min: -1, max: 1, step: 0.05, term: 'bias' },
    b2: { default: 0.35, min: -1, max: 1, step: 0.05, term: 'bias' },
    v1: { default: 0.40, min: -1, max: 1, step: 0.05, term: 'weight' },
    v2: { default: 0.45, min: -1, max: 1, step: 0.05, term: 'weight' },
    bo: { default: 0.60, min: -1, max: 1, step: 0.05, term: 'bias' },
  },

  model(inp, t) {
    const x1 = t.input('x1', inp.x1), x2 = t.input('x2', inp.x2)
    const w11 = t.input('w11', inp.w11), w21 = t.input('w21', inp.w21)
    const w12 = t.input('w12', inp.w12), w22 = t.input('w22', inp.w22)
    const b1 = t.input('b1', inp.b1), b2 = t.input('b2', inp.b2)
    const v1 = t.input('v1', inp.v1), v2 = t.input('v2', inp.v2), bo = t.input('bo', inp.bo)

    // gizli nöron 1
    const p11 = t.mul('p11', x1, w11), p21 = t.mul('p21', x2, w21)
    const z1 = t.add('z1', p11, p21, b1)
    const a1 = t.fn('a1', 'sigmoid', sigmoid, z1)
    // gizli nöron 2
    const p12 = t.mul('p12', x1, w12), p22 = t.mul('p22', x2, w22)
    const z2 = t.add('z2', p12, p22, b2)
    const a2 = t.fn('a2', 'sigmoid', sigmoid, z2)
    // çıktı nöronu
    const q1 = t.mul('q1', a1, v1), q2 = t.mul('q2', a2, v2)
    const zo = t.add('zo', q1, q2, bo)
    const y = t.fn('y', 'sigmoid', sigmoid, zo)

    return { x1, x2, w11, w21, w12, w22, b1, b2, v1, v2, bo, p11, p21, z1, a1, p12, p22, z2, a2, q1, q2, zo, y }
  },

  checks: {
    known: [{
      // Mazur'daki w1..w4 = w11,w21,w12,w22; w5,w6 = v1,v2; sapmalar 0.35 ve 0.60. (o2 kolu bu derste yok.)
      source: 'Matt Mazur, "A Step by Step Backpropagation Example" (mattmazur.com, 17 Mart 2015), "The Forward Pass" bölümü',
      inputs: { x1: 0.05, x2: 0.10, w11: 0.15, w21: 0.20, w12: 0.25, w22: 0.30, b1: 0.35, b2: 0.35, v1: 0.40, v2: 0.45, bo: 0.60 },
      expect: { z1: 0.3775, a1: 0.593269992, z2: 0.3925, a2: 0.596884378, zo: 1.105905967, y: 0.75136507 },
      tolerance: 1e-6,
    }],
    invariants(d, inp, fail) {
      for (const k of ['a1', 'a2', 'y']) {
        if (d[k].value < 0 || d[k].value > 1) fail(k + ' sigmoid çıktısı 0 ile 1 arasında olmalı')
      }
      if (Math.abs(d.p11.value + d.p21.value + inp.b1 - d.z1.value) > 1e-9) fail('z1 = x1·w11 + x2·w21 + b1 olmalı')
      if ((d.zo.value > 0 && d.y.value < 0.5) || (d.zo.value < 0 && d.y.value > 0.5)) fail('zo ile y aynı yönde olmalı')
    },
  },

  scene(stage, d) {
    const net = stage.neuralNet({
      at: 'main',
      layers: [2, 2, 1],
      layerNames: ['Girdi', 'Gizli', 'Çıktı'],
      weights: 'on-focus',
      bias: true,
      hidden: true,
    })

    // Sigmoid eğrisi: her nöronun "aktivasyon" adımında gösterilir.
    const plot = stage.plot({
      at: 'inset',
      x: { label: 'ağırlıklı toplam z', domain: [-6, 6], term: 'wsum' },
      y: { label: 'aktivasyon a', domain: [0, 1], term: 'activation' },
      grid: true,
      hidden: true,
    })
    plot.curve(sigmoid, { role: 'activation' })
    const marker = plot.point({ x: d.z1.value, y: d.a1.value }, { role: 'activation', hidden: true })

    // Ara değer çipleri (z): ilgili düğümün altında, başta gizli.
    const zChip = {
      h1: stage.value(d.z1, { at: { near: net.node('h1'), side: 'bottom', gap: 'sm' }, role: 'wsum', hidden: true }),
      h2: stage.value(d.z2, { at: { near: net.node('h2'), side: 'bottom', gap: 'sm' }, role: 'wsum', hidden: true }),
      y1: stage.value(d.zo, { at: { near: net.node('y1'), side: 'bottom', gap: 'sm' }, role: 'wsum', hidden: true }),
    }

    const note = stage.label('Sayılar hep soldan sağa akar: Girdi → Gizli → Çıktı.', { at: { region: 'top', u: 0.5, v: 0.5 }, hidden: true })

    return { net, plot, marker, zChip, note }
  },

  script(lesson, refs, d) {
    const { net, plot, marker, zChip, note } = refs
    const stage = lesson.stage

    // Bir nöronun hesabını anlatan ortak yardımcı (h1, h2 ve çıktı için aynı kalıp).
    // cfg: id (düğüm id), ins=[{src: Obj, x: Val, w: Obj, wv: Val, p: Val}], bObj, b, z, a, name
    function neuronSteps(s, cfg) {
      const { id, ins, bObj, b, z, a, name } = cfg
      const node = net.node(id)
      const chip = zChip[id]

      s.step(id + '-wsum', { title: name + ': ağırlıklı toplam', level: 2 }, s => {
        s.say(name + ' önce girdilerini ağırlıklarıyla çarpıp sapmayı ekler: [[wsum]] {{' + z.id + '}}.')
        stage.camera.focus(node, { padding: 'md' })
        s.formula.show(
          '\\slot{z}{z} = \\slot{x1}{x_1}\\,\\slot{w1}{w_1} + \\slot{x2}{x_2}\\,\\slot{w2}{w_2} + \\slot{b}{b}',
          { words: 'birinci girdi çarpı ağırlığı, artı ikinci girdi çarpı ağırlığı, artı sapma' }
        )
        ins.forEach((it, i) => {
          const n = String(i + 1)
          s.step(id + '-mul' + n, { level: 3 }, s => {
            s.say('[[input]] {{' + it.x.id + '}}, kendi [[weight]] değeri {{' + it.wv.id + '}} ile çarpılır: {{' + it.p.id + '}}.')
            s.together(() => {
              it.src.highlight()
              it.w.highlight()
              s.fly(it.src, s.formula.slot('x' + n))
              s.fly(it.w, s.formula.slot('w' + n))
            })
            s.formula.highlight('x' + n, 'w' + n)
            it.src.unhighlight()
            it.w.unhighlight()
          })
        })
        s.step(id + '-bias', { level: 2 }, s => {
          s.say('Çarpımlar toplanır ve nöronun kendi [[bias]] değeri {{' + b.id + '}} eklenir. Sonuç: {{' + z.id + '}}.')
          s.fly(bObj, s.formula.slot('b'))
          s.formula.fill('z', z)
          chip.show()
          chip.pulse()
        })
        s.summary(() => { chip.show() })
      })

      s.step(id + '-act', { title: name + ': aktivasyon', level: 2 }, s => {
        s.say('Ağırlıklı toplam {{' + z.id + '}} sigmoid\'den geçer ve {{' + a.id + '}} olur. Bu sayı nöronun çıktısıdır.')
        s.step(id + '-act-why', { level: 3 }, s => {
          s.say('[[activation]] neden var? Toplam ne kadar büyük ya da küçük olursa olsun çıktı 0 ile 1 arasında kalsın diye. [[sigmoid]] eğrisinde {{' + z.id + '}} yatay eksende bulunur, eğri bunu {{' + a.id + '}} yapar.')
          plot.show()
          marker.show()
          marker.moveTo({ plot, x: z.value, y: a.value })
        })
        s.step(id + '-act-apply', { level: 2 }, s => {
          s.say('Sigmoid uygulanınca nöronun değeri {{' + a.id + '}} olur.')
          s.formula.show('\\slot{a}{a} = \\sigma(\\slot{zz}{z}) = \\frac{1}{1 + e^{-z}}', { words: 'aktivasyon, toplamın sigmoid\'i: bir bölü (bir artı e üzeri eksi toplam)' })
          s.fly(chip, s.formula.slot('zz'))
          s.formula.fill('a', a)
          net.nodeValue(id).setValue(a)
          node.pulse()
        })
        s.summary(() => { net.nodeValue(id).setValue(a) })
      })

      s.step(id + '-tidy', { level: 3 }, s => {
        s.say('Bu nöron tamam; sigmoid eğrisini ve formülü temizleyip sıradakine geçiyoruz.')
        plot.hide()
        marker.hide()
        s.formula.clear()
      })
    }

    // ───────── 1. Soru ─────────
    lesson.chapter('question', 'Soru', s => {
      s.say('İki sayı verildi: **{{x1}}** ve **{{x2}}**. Bir bilgisayar bunlardan 0 ile 1 arasında tek bir cevap üretebilir mi? Sinir ağı tam olarak bunu yapar.')
      note.show()
      s.step('q-forward', { level: 2 }, s => {
        s.say('Bu derste [[forward]] öğreneceksin: sayıların ağın içinden soldan sağa akarken ne olduğunu, her adımı hesaplayarak göreceksin.')
      })
    })

    // ───────── 2. Ne ve neden ─────────
    lesson.chapter('what', 'Sinir ağı nedir?', s => {
      s.say('Bir [[network]], birbirine bağlı küçük [[neuron]]lerden oluşur. Her nöron çok basit bir iş yapar; birlikte karmaşık kararlar verebilirler.')
      net.show()
      s.step('what-why', { level: 2 }, s => {
        s.say('Neden böyle? Cevabı elle yazmak yerine, ayarlanabilen sayılarla çalışan bir makine kurarız. Makinenin cevabı nasıl ürettiğini bilmek için önce ileri yayılımı görmek gerekir.')
      })
      s.step('what-layers', { level: 2 }, s => {
        s.say('Nöronlar [[layer]]lar halinde dizilir: solda [[input]]lar, ortada [[hidden]], sağda [[output]] katmanı.')
        net.layer(0).highlight()
        s.pause(1)
        net.layer(0).unhighlight()
        net.layer(1).highlight()
        s.pause(1)
        net.layer(1).unhighlight()
        net.layer(2).highlight()
        s.pause(1)
        net.layer(2).unhighlight()
      })
    })

    // ───────── 3. Parçalar ─────────
    lesson.chapter('parts', 'Parçalar', s => {
      s.say('Hesaba başlamadan önce ağın üzerindeki sayıları tanıyalım: girdiler, [[weight]]lar ve [[bias]]lar.')
      // neuralNet spec'i sayı almadığı için değerler setValue ile yerleştiriliyor.
      s.step('parts-inputs', { level: 2 }, s => {
        s.say('Girdiler: {{x1}} ve {{x2}}. Ağa verdiğimiz iki ölçüm.')
        s.together(() => {
          net.nodeValue('x1').setValue(d.x1)
          net.nodeValue('x2').setValue(d.x2)
        })
      })
      s.step('parts-weights', { level: 2 }, s => {
        s.say('Her bağlantının bir [[weight]] değeri var. Girdi bu sayıyla çarpılarak nörona gider; büyük ağırlık o girdinin etkisini artırır.')
        s.together(() => {
          net.weight('x1', 'h1').setValue(d.w11)
          net.weight('x2', 'h1').setValue(d.w21)
          net.weight('x1', 'h2').setValue(d.w12)
          net.weight('x2', 'h2').setValue(d.w22)
          net.weight('h1', 'y1').setValue(d.v1)
          net.weight('h2', 'y1').setValue(d.v2)
        })
        net.edges().highlight({ stagger: 'fast' })
        net.edges().unhighlight()
        s.step('parts-w-detail', { level: 3 }, s => {
          s.say('Örneğin {{w11}}, birinci girdiden birinci gizli nörona giden bağlantının ağırlığıdır.')
          net.weight('x1', 'h1').highlight({ style: 'ring' })
          net.weight('x1', 'h1').unhighlight()
        })
      })
      s.step('parts-bias', { level: 2 }, s => {
        s.say('Her nöronun ayrıca kendi [[bias]] değeri var: gizli nöronlar için {{b1}} ve {{b2}}, çıktı nöronu için {{bo}}. Girdiye bağlı olmayan sabit bir ekleme.')
        s.together(() => {
          net.bias('h1').setValue(d.b1)
          net.bias('h2').setValue(d.b2)
          net.bias('y1').setValue(d.bo)
        })
        net.bias('h1').pulse()
        net.bias('h2').pulse()
        net.bias('y1').pulse()
      })
      s.step('parts-rule', { level: 2 }, s => {
        s.say('Her nöron aynı iki işi yapar: önce [[wsum]], sonra [[activation]]. Önce gizli nöronları, sonra çıktıyı hesaplayacağız.')
      })
    })

    // ───────── 4. Gizli katman ─────────
    lesson.chapter('hidden', 'Gizli katman', s => {
      s.say('Girdiler önce gizli katmana gider. İki gizli nöron aynı girdileri kendi ağırlıklarıyla ayrı ayrı işler.')
      net.edges().flow(true)
      s.step('h1', { title: 'Gizli nöron 1', level: 1 }, s => {
        s.say('Birinci gizli nöron {{x1}} ve {{x2}} değerlerini {{w11}} ve {{w21}} ile işleyip {{a1}} üretir.')
        neuronSteps(s, {
          id: 'h1', name: 'Birinci nöron',
          ins: [
            { src: net.nodeValue('x1'), x: d.x1, w: net.weight('x1', 'h1'), wv: d.w11, p: d.p11 },
            { src: net.nodeValue('x2'), x: d.x2, w: net.weight('x2', 'h1'), wv: d.w21, p: d.p21 },
          ],
          bObj: net.bias('h1'), b: d.b1, z: d.z1, a: d.a1,
        })
      })
      s.step('h2', { title: 'Gizli nöron 2', level: 1 }, s => {
        s.say('İkinci gizli nöron aynı girdileri farklı ağırlıklarla ({{w12}}, {{w22}}) işler; bu yüzden farklı bir sayı, {{a2}}, çıkar.')
        neuronSteps(s, {
          id: 'h2', name: 'İkinci nöron',
          ins: [
            { src: net.nodeValue('x1'), x: d.x1, w: net.weight('x1', 'h2'), wv: d.w12, p: d.p12 },
            { src: net.nodeValue('x2'), x: d.x2, w: net.weight('x2', 'h2'), wv: d.w22, p: d.p22 },
          ],
          bObj: net.bias('h2'), b: d.b2, z: d.z2, a: d.a2,
        })
      })
      net.edges().flow(false)
      stage.camera.reset()
    })

    // ───────── 5. Çıktı ─────────
    lesson.chapter('output', 'Çıktı katmanı', s => {
      s.say('Gizli nöronların çıktıları, çıktı nöronunun girdileri olur. Aynı iki iş burada da tekrarlanır.')
      net.edges().flow(true)
      s.step('y1', { title: 'Çıktı nöronu', level: 1 }, s => {
        s.say('Çıktı nöronu {{a1}} ve {{a2}} değerlerini {{v1}} ve {{v2}} ile işleyip {{y}} üretir.')
        neuronSteps(s, {
          id: 'y1', name: 'Çıktı nöronu',
          ins: [
            { src: net.nodeValue('h1'), x: d.a1, w: net.weight('h1', 'y1'), wv: d.v1, p: d.q1 },
            { src: net.nodeValue('h2'), x: d.a2, w: net.weight('h2', 'y1'), wv: d.v2, p: d.q2 },
          ],
          bObj: net.bias('y1'), b: d.bo, z: d.zo, a: d.y,
        })
      })
      net.edges().flow(false)
      stage.camera.reset()
    })

    // ───────── 6. Sonuç ─────────
    lesson.chapter('result', 'Sonuç', s => {
      s.say('Ağın [[prediction]]ı {{y}}. Girdiler {{x1}} ve {{x2}} iken ağ bu cevabı verdi.')
      net.node('y1').recolor('prediction')
      net.node('y1').glow(true)
      s.step('result-trace', { level: 3 }, s => {
        s.say('Yolu geriye okursak: {{y}}, {{zo}} değerinden; o da {{a1}} ve {{a2}} değerlerinden; onlar da {{z1}} ve {{z2}} değerlerinden, onlar da girdilerden gelir.')
        net.layer(1).highlight()
        net.layer(1).unhighlight()
      })
      s.step('result-meaning', { level: 2 }, s => {
        s.say('Ağırlıklar elle seçildiği için bu cevap henüz anlamlı değil; ağırlıkları doğru cevaba yaklaştırmak öğrenmenin işidir ve ayrı bir dersin konusudur.')
        net.node('y1').glow(false)
      })
    })

    // ───────── 7. Kalıp ─────────
    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp: her katmanda aynı iki adım tekrarlanır, **çarp, topla, sapmayı ekle, sigmoid\'den geçir**. Bir katmanın çıktıları sonrakinin girdisi olur.')
      s.formula.show('a = \\sigma\\left(\\sum_i x_i\\, w_i + b\\right)', { words: 'girdiler çarpı ağırlıkları toplanır, sapma eklenir, sigmoid\'den geçirilir' })
      lesson.memorize({ title: 'Ağırlıklı toplam', formula: 'z = \\sum_i x_i w_i + b', words: 'girdi çarpı ağırlık, hepsini topla, sapmayı ekle', why: 'Nöronun her girdiye ne kadar önem verdiğini ifade eder.' })
      lesson.memorize({ title: 'Aktivasyon (sigmoid)', formula: 'a = \\frac{1}{1 + e^{-z}}', words: 'toplamı 0 ile 1 arasına sıkıştır', why: 'Çıktıyı sınırlı tutar; katmanların üst üste anlamlı çalışmasını sağlar.' })
      lesson.memorize({ title: 'İleri yayılım', words: 'her katmanda ağırlıklı toplam, sonra aktivasyon; çıktılar sonraki katmana girdi olur', why: 'Ağın tahminini üretmenin yolu.' })
    })
  },

  practice: {
    generate: r => ({
      x1: r.float(0, 1, 0.1), x2: r.float(0, 1, 0.1),
      w11: r.float(-1, 1, 0.1), w21: r.float(-1, 1, 0.1), w12: r.float(-1, 1, 0.1), w22: r.float(-1, 1, 0.1),
      b1: r.float(-0.5, 0.5, 0.1), b2: r.float(-0.5, 0.5, 0.1),
      v1: r.float(-1, 1, 0.1), v2: r.float(-1, 1, 0.1), bo: r.float(-0.5, 0.5, 0.1),
    }),
    tasks: [
      { id: 't-z1', prompt: 'Birinci gizli nöronun ağırlıklı toplamı z1 kaç? (x1·w11 + x2·w21 + b1)', answer: 'z1', tolerance: 0.01 },
      { id: 't-a1', prompt: 'Birinci gizli nöronun aktivasyonu a1 kaç? (sigmoid(z1))', answer: 'a1', tolerance: 0.01 },
      { id: 't-a2', prompt: 'İkinci gizli nöronun aktivasyonu a2 kaç?', answer: 'a2', tolerance: 0.01 },
      { id: 't-y', prompt: 'Ağın tahmini y kaç?', answer: 'y', tolerance: 0.01 },
    ],
  },
})
