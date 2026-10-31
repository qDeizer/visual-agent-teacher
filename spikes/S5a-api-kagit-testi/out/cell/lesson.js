// Hücre bölünmesi ve kanser: kontrollü ve kontrolsüz çoğalma
// Sahne: tek bir doku bölgesi ('main'), sağda büyüme grafiği ('right'), solda kontrol noktaları tablosu ('left').
// Görsel doku küçük ölçeklidir (en çok 32 + 16 hücre); gerçek ölçek (2^30) yalnızca sayı olarak gösterilir.

// Özel hücre şekli: zar + çekirdek + DNA kıvrımı. Renk yazılmadı; renk 'role' ile gelir.
const CELL_SVG =
  '<ellipse class="membrane" rx="48" ry="40"/>' +
  '<circle class="nucleus" cx="0" cy="0" r="17"/>' +
  '<path class="dna" fill="none" d="M-10 -6 q5 -7 10 0 t10 0 M-10 6 q5 -7 10 0 t10 0"/>'

export default defineLesson({
  meta: {
    title: 'Hücre bölünmesi ve kanser',
    lang: 'tr',
    goal: 'Bir hücrenin nasıl bölündüğünü, normal dokunun neden durduğunu ve tek bir mutasyonlu hücrenin soyunun neden sınırsız çoğalıp tümör oluşturduğunu anlatabilmek.',
  },

  glossary: {
    cell: { term: 'hücre', short: 'Canlıların en küçük yapı taşı. Vücudun her parçası hücrelerden oluşur.', concept: true, memorize: true },
    nucleus: { term: 'çekirdek', short: 'Hücrenin yönetim merkezi; talimat kitabını (DNA) içinde saklar.' },
    dna: { term: 'DNA', short: 'Hücrenin talimat kitabı: hücreye ne yapacağını ve nasıl bölüneceğini yazar.', long: 'Her bölünmeden önce bu kitabın eksiksiz bir kopyası çıkarılır.' },
    tissue: { term: 'doku', short: 'Aynı işi yapan, yan yana duran hücre topluluğu (ör. deri).' },
    division: { term: 'bölünme turu', short: 'Tüm hücrelerin birer kez ikiye bölünmesi. Bir turda hücre sayısı iki katına çıkar.' },
    mitosis: { term: 'mitoz', short: 'Bir hücrenin DNA\'sını kopyalayıp birbirinin aynısı iki yeni hücreye bölünmesi.', memorize: true },
    exponential: { term: 'üstel artış', short: 'Her adımda sayının aynı oranda (burada 2 katına) çarpılması; başta yavaş, sonra çok hızlı büyür.', symbol: '2^n', memorize: true },
    checkpoint: {
      term: 'kontrol noktası',
      short: 'Hücrenin bölünmeden önce "DNA sağlam mı, yer var mı, büyüme emri geldi mi?" diye baktığı frenler. Cevap kötüyse hücre durur.',
      concept: true,
      memorize: true,
    },
    contactInhibition: { term: 'temas engeli', short: 'Normal hücrenin komşularına değince bölünmeyi bırakması.' },
    mutation: { term: 'mutasyon', short: 'DNA\'daki kalıcı bir yazım hatası. Hücre bölününce hata da kopyalanır.', concept: true, memorize: true },
    lineage: { term: 'soy', short: 'Bir hücrenin tüm torunları: çocukları, onların çocukları...' },
    tumour: { term: 'tümör', short: 'Kontrolsüz bölünen hücrelerin oluşturduğu yığın.', concept: true },
    cancer: { term: 'kanser', short: 'Durdurma sinyallerini yok sayan mutasyonlu hücrelerin kontrolsüz çoğalması.', memorize: true },
  },

  inputs: {
    tissueRounds: { default: 4, min: 2, max: 5, step: 1, term: 'tissue' },
    tumourRounds: { default: 3, min: 1, max: 4, step: 1, term: 'tumour' },
    doublings: { default: 30, min: 0, max: 40, step: 1, term: 'exponential' },
  },

  model(inp, t) {
    const one = t.const('one', 1)
    const two = t.const('two', 2)
    const hundred = t.const('hundred', 100)

    const tissueRounds = t.input('tissueRounds', inp.tissueRounds)
    const tumourRounds = t.input('tumourRounds', inp.tumourRounds)
    const doublings = t.input('doublings', inp.doublings)

    // Mitoz evreleri (sayısal olmayan süreç)
    t.event('phase', { order: 1, name: 'DNA kopyalanır' })
    t.event('phase', { order: 2, name: 'Kopyalar iki uca ayrılır' })
    t.event('phase', { order: 3, name: 'Hücre ikiye ayrılır' })

    // Doku kapasitesi: 1 hücreden başlayan normal soy, doku dolunca durur.
    const cap = t.pow('cap', two, tissueRounds)
    const n = {}
    for (let k = 0; k <= inp.tissueRounds; k++) n[k] = t.pow('n' + k, two, k)

    // Mutasyonlu soy, görsel ölçek
    const tv = {}
    for (let k = 0; k <= inp.tumourRounds; k++) tv[k] = t.pow('tv' + k, two, k)
    const tumourVis = t.pow('tumourVis', two, tumourRounds)
    const normalLeft = t.sub('normalLeft', cap, one) // mutasyon geçiren hücre normal sayılmaz
    const total = t.add('total', normalLeft, tumourVis)
    const share = t.div('share', tumourVis, total)
    const tumourPct = t.mul('tumourPct', share, hundred)

    // Gerçek ölçek
    const tumourReal = t.pow('tumourReal', two, doublings)
    const normalReal = t.fn('normalReal', 'min', (a, b) => Math.min(a, b), cap, tumourReal)
    const ratio = t.div('ratio', tumourReal, normalReal)

    return { one, two, cap, n, tv, tumourVis, normalLeft, total, share, tumourPct, tumourReal, normalReal, ratio, tissueRounds, tumourRounds, doublings }
  },

  checks: {
    known: [
      {
        source: 'Weinberg, The Biology of Cancer: ~1 cm³ tümör ≈ 10^9 hücre ≈ 30 ikiye bölünme (2^30 = 1 073 741 824)',
        inputs: { doublings: 30 },
        expect: { tumourReal: 1073741824 },
        tolerance: 0.5,
      },
      {
        source: 'Campbell Biology, mitoz: 1 hücre → 2 → 4 → 8 (n turda 2^n)',
        inputs: { doublings: 3, tissueRounds: 4 },
        expect: { tumourReal: 8, cap: 16, normalReal: 8 },
      },
    ],
    invariants(d, inp, fail) {
      if (d.normalReal.value > d.cap.value) fail('normal doku kapasiteyi aşamaz')
      if (d.tumourReal.value < d.normalReal.value) fail('serbest soy, sınırlı soydan az olamaz')
      if (d.share.value <= 0 || d.share.value > 1) fail('mutasyonlu pay 0 ile 1 arasında olmalı')
      if (d.n[inp.tissueRounds].value !== d.cap.value) fail('son tur hücre sayısı kapasiteye eşit olmalı')
      if (d.tumourVis.value < 1) fail('mutasyonlu hücre sayısı en az 1')
    },
  },

  scene(stage, d, inp) {
    const c0 = stage.shape(CELL_SVG, { id: 'c0', kind: 'cell', role: 'cell', tags: ['normal'], at: { region: 'main', u: 0.5, v: 0.5 }, size: 60 })

    const totalCounter = stage.counter('Toplam hücre', () => stage.select('cell').count, { at: { region: 'bottom', u: 0.2 }, role: 'cell', hidden: true })
    const normalCounter = stage.counter('Normal hücre', () => stage.select('cell').where(o => !o.tags.includes('cancer')).count, { at: { region: 'bottom', u: 0.5 }, role: 'cell', hidden: true })
    const cancerCounter = stage.counter('Mutasyonlu hücre', () => stage.select('.cancer').count, { at: { region: 'bottom', u: 0.8 }, role: 'mutation', hidden: true })

    const stopBox = stage.box('DURDUR sinyali', { id: 'stop', role: 'checkpoint', hidden: true, at: { region: 'top', u: 0.5 } })
    const stopArrow = stage.arrow(stopBox, c0, { id: 'stop-arrow', role: 'checkpoint', label: 'Dur!', hidden: true })
    const ignoredLabel = stage.label('Sinyal **yok sayılıyor**', { role: 'mutation', hidden: true, at: { near: stopArrow, side: 'right', gap: 'sm' } })

    const checkTable = stage.table({
      at: 'left',
      hidden: true,
      columns: ['Kontrol noktası', 'Soru', 'Cevap kötüyse'],
      rows: [
        ['DNA kontrolü', 'DNA hasarlı mı?', 'Dur, önce onar'],
        ['Yer kontrolü', 'Komşularla temas var mı?', 'Dur, yer yok'],
        ['Büyüme emri', 'Büyü sinyali geldi mi?', 'Dur, emir yok'],
      ],
    })

    const plot = stage.plot({
      id: 'growth',
      at: 'right',
      hidden: true,
      x: { label: 'Bölünme turu', domain: [0, 8], term: 'division' },
      y: { label: 'Hücre sayısı', domain: [0, 256], term: 'cell' },
    })
    // Not: eğri fonksiyonları modelin Val'lerinden değil, d.cap.value'dan beslenir (model dışı saf fonksiyon).
    const freeCurve = plot.curve(x => Math.pow(2, x), { id: 'free-curve', role: 'cell', hidden: true, domain: [0, 8] })
    const limitedCurve = plot.curve(x => Math.min(Math.pow(2, x), d.cap.value), { id: 'limited-curve', role: 'cell', hidden: true, domain: [0, 8] })
    const capPoint = plot.point({ x: inp.tissueRounds, y: d.cap.value }, { label: 'Doku doldu', role: 'checkpoint', hidden: true, draggable: { inputX: 'tissueRounds' } })

    const nChip = stage.value(d.doublings, { id: 'n-chip', at: { region: 'top', u: 0.3 }, role: 'mutation', hidden: true })
    const bigChip = stage.value(d.tumourReal, { id: 'big-chip', at: { region: 'top', u: 0.7 }, role: 'tumour', hidden: true })

    return { c0, totalCounter, normalCounter, cancerCounter, stopBox, stopArrow, ignoredLabel, checkTable, plot, freeCurve, limitedCurve, capPoint, nChip, bigChip }
  },

  script(lesson, refs, d, inp) {
    const stage = lesson.stage
    const { c0, totalCounter, normalCounter, cancerCounter, stopBox, stopArrow, ignoredLabel, checkTable, plot, freeCurve, limitedCurve, capPoint, nChip, bigChip } = refs
    const cells = () => stage.select('cell')
    const growAll = () => cells().split({ dir: 'free', stagger: 'fast' })
    const growTumour = () => stage.select('.cancer').split({ dir: 'free', stagger: 'fast' })

    // ───────── 1. Soru
    lesson.chapter('question', 'Soru', s => {
      s.say('Vücudun trilyonlarca [[cell]] taşır ve hücreler sürekli bölünerek yenilenir. Peki bir hücre ne zaman bölünür, ne zaman durur? Ve durmayı unutursa ne olur? Bu dersin sorusu bu.')
      c0.pulse()
    })

    // ───────── 2. Hücre nedir
    lesson.chapter('what', 'Hücre nedir?', s => {
      s.say('Ekrandaki şey tek bir [[cell]]. Neden önemli? Çünkü büyümek, yara iyileşmesi ve yenilenme hücrelerin sayısını artırmakla olur. Önce parçalarına bakalım.')
      s.step('membrane', { title: 'Zar', level: 3 }, s => {
        s.say('Dıştaki çizgi hücrenin zarı: hücreyi çevresinden ayırır.')
        c0.part('membrane').highlight()
      })
      s.step('nucleus', { title: 'Çekirdek', level: 2 }, s => {
        c0.part('membrane').unhighlight()
        s.say('İçteki yuvarlak [[nucleus]]: hücrenin yönetim merkezi.')
        c0.part('nucleus').highlight({ style: 'fill' })
      })
      s.step('dna', { title: 'DNA', level: 2 }, s => {
        s.say('Çekirdeğin içindeki kıvrımlı çizgi [[dna]]: hücrenin talimat kitabı. Hücreye ne yapacağını yazar. Bölünmeden önce bu kitabın kopyası çıkarılır.')
        c0.part('dna').pulse()
        c0.part('nucleus').unhighlight()
      })
    })

    // ───────── 3. Bölünme (mitoz)
    lesson.chapter('mitosis', 'Bir hücre nasıl bölünür?', s => {
      s.say('Bir hücre çoğalmak için [[mitosis]] yapar: DNA\'sını kopyalar ve birbirinin aynısı iki hücreye ayrılır. Böylece her yeni hücre eksiksiz bir talimat kitabı alır.')
      s.step('copy', { title: 'DNA kopyalanır', level: 2 }, s => {
        s.say('1) Hücre önce [[dna]]\'yı kopyalar. Kopya yoksa yeni hücrenin talimatı olmazdı.')
        stage.camera.focus(c0)
        c0.part('dna').glow(true)
      })
      s.step('pull', { title: 'Kopyalar ayrılır', level: 3 }, s => {
        s.say('2) İki DNA kopyası hücrenin iki ucuna çekilir. Çekirdek bu sırada titrer.')
        c0.part('nucleus').jitter(true, 'low')
        s.pause()
        c0.part('nucleus').jitter(false)
      })
      s.step('cut', { title: 'Hücre ikiye ayrılır', level: 2 }, s => {
        s.say('3) Hücre ortadan ikiye ayrılır: iki yeni hücre, aynı DNA. Birine "ana", diğerine "yeni" diyelim; ikisi eşittir.')
        c0.part('dna').glow(false)
        const [a, b] = c0.split({ dir: 'horizontal' })
        s.together(() => { a.pulse(); b.pulse() })
        stage.camera.reset()
      })
    })

    // ───────── 4. Tekrar tekrar bölünme: üstel artış
    lesson.chapter('growth', 'Tekrar tekrar bölünme', s => {
      s.say('Yeni hücreler de bölünür. Hücrelerin hepsi birer kez bölününce bir [[division]] biter ve sayı ikiye katlanır: [[exponential]].')
      s.step('grow', { title: 'Doku büyür', level: 2 }, s => {
        s.say('Her turda sayı 2 katına çıkar: 1, 2, 4, 8... Böylece bir [[tissue]] oluşur. {{tissueRounds}} turda {{cap}} hücreye ulaşıyoruz.')
        totalCounter.show()
        // Ebeveyn katlanınca (düşük detay) tüm turlar sırayla oynatılır.
        s.summary(() => {
          for (let k = 2; k <= inp.tissueRounds; k++) growAll()
        })
        for (let k = 2; k <= inp.tissueRounds; k++) {
          s.step('round-' + k, { title: 'Tur ' + k, level: 3 }, s => {
            s.say('Tur ' + k + ': her hücre bölünür, sayı {{n' + k + '}} olur.')
            growAll()
          })
        }
      })
      s.step('curve', { title: 'Büyüme eğrisi', level: 2 }, s => {
        s.say('Sayıyı turlara karşı çizersek eğri başta yavaş, sonra dikleşerek yükselir. Bu şekle [[exponential]] denir.')
        plot.show()
        freeCurve.show()
        freeCurve.pulse()
      })
    })

    // ───────── 5. Normal hücre durmayı bilir
    lesson.chapter('stop', 'Normal hücre durmayı bilir', s => {
      s.say('Eğri sonsuza kadar yükselseydi vücut taşardı. Normal hücreler durmayı bilir: doku dolunca bölünmeyi bırakırlar.')
      s.step('full', { title: 'Doku doldu', level: 2 }, s => {
        s.say('Doku {{cap}} hücreye ulaştı ve doldu. Burada hücreler bölünmeyi bırakır; toplam sayı sabit kalır.')
        stage.camera.frame(cells())
        capPoint.show()
        limitedCurve.show()
        cells().tag('resting')
      })
      s.step('contact', { title: 'Temas engeli', level: 3 }, s => {
        s.say('İlk fren [[contactInhibition]]: bir hücre her yönden komşusuna değiyorsa "yer yok" der ve bölünmez.')
        cells().sample(3).highlight({ style: 'ring' })
        s.pause()
        cells().unhighlight()
      })
      s.step('checkpoint', { title: 'Kontrol noktaları', level: 2 }, s => {
        s.say('İkinci fren [[checkpoint]]ler. Hücre bölünmeden önce üç soru sorar; herhangi birinin cevabı kötüyse sinyal gelir: **dur**.')
        checkTable.show()
        stopBox.show()
        stopArrow.show()
        stopArrow.flow(true)
        cells().dim()
        cells().breathe(true)
      })
      s.step('cp-dna', { title: 'DNA kontrolü', level: 3 }, s => {
        s.say('DNA kontrolü: kopyada hata varsa hücre önce onarır, onaramazsa bölünmez.')
        checkTable.row(0).highlight()
      })
      s.step('cp-space', { title: 'Yer kontrolü', level: 3 }, s => {
        s.say('Yer kontrolü: komşularla temas varsa dur. Bu, temas engelinin hücre içindeki karşılığı.')
        checkTable.row(0).unhighlight()
        checkTable.row(1).highlight()
      })
      s.step('cp-signal', { title: 'Büyüme emri', level: 3 }, s => {
        s.say('Büyüme emri: dışarıdan "büyü" sinyali gelmezse hücre kendiliğinden bölünmez.')
        checkTable.row(1).unhighlight()
        checkTable.row(2).highlight()
      })
    })

    // ───────── 6. Bir hücre bozulur
    let zoom = null
    lesson.chapter('mutation', 'Bir hücre bozulur', s => {
      s.say('Şimdi tek bir hücrenin [[dna]]\'sında hata olsun. Bu hata fren sistemini bozarsa, yalnızca bu hücre durmayı bırakır.')
      s.step('mutate', { title: 'Mutasyon', level: 2 }, s => {
        s.say('Kopyalama sırasında nadiren yazım hatası olur: [[mutation]]. Bu hücrenin hatası, durdurma sinyalini algılayan kısmı bozdu.')
        checkTable.hide()
        stage.camera.focus(c0)
        zoom = stage.camera.magnify(c0, { corner: 'tr' })
        c0.untag('resting')
        c0.undim()
        c0.tag('cancer')
        c0.recolor('mutation')
        c0.pulse()
        cancerCounter.show()
        normalCounter.show()
      })
      s.step('ignore', { title: 'Sinyali yok sayar', level: 2 }, s => {
        s.say('Durdur sinyali hâlâ geliyor ama bu hücre onu **yok sayıyor**. Komşuları ise sinyale uymaya devam ediyor.')
        stopArrow.flow(false)
        stopArrow.dim()
        ignoredLabel.show()
        c0.glow(true)
        c0.breathe(false)
      })
      s.step('inherit', { title: 'Mutasyon miras kalır', level: 2 }, s => {
        s.say('Mutasyonlu hücre bölününce hata da kopyalanır; iki yavru da mutasyonlu. Yani etiket miras kalır: [[lineage]] boyunca herkes aynı hatayı taşır. Komşular etkilenmez.')
        const [a, b] = c0.split({ dir: 'free' })
        s.together(() => { a.pulse(); b.pulse() })
        zoom.hide()
        stage.camera.focus(stage.select('.cancer'))
      })
    })

    // ───────── 7. Tümör oluşur
    lesson.chapter('tumour', 'Soy çoğalır, tümör oluşur', s => {
      s.say('Normal komşular dururken yalnızca mutasyonlu [[lineage]] bölünmeyi sürdürür. Tur tur sayısı iki katına çıkar ve [[tumour]] oluşur.')
      s.step('rounds', { title: 'Mutasyonlu soy bölünür', level: 2 }, s => {
        s.say('{{tumourRounds}} tur sonra mutasyonlu hücre sayısı {{tumourVis}}. Normal hücreler hâlâ {{normalLeft}}: yerlerinde duruyorlar.')
        s.summary(() => {
          for (let k = 2; k <= inp.tumourRounds; k++) growTumour()
        })
        for (let k = 2; k <= inp.tumourRounds; k++) {
          s.step('t-round-' + k, { title: 'Mutasyonlu tur ' + k, level: 3 }, s => {
            s.say('Tur ' + k + ': yalnızca mutasyonlu hücreler bölünür, sayı {{tv' + k + '}} olur.')
            growTumour()
          })
        }
      })
      s.step('mass', { title: 'Tümör', level: 2 }, s => {
        s.say('Toplam {{total}} hücrenin {{tumourVis}} tanesi mutasyonlu; yani dokunun yüzde {{tumourPct}} kadarı. Bu yığın bir [[tumour]]. Hepsi tek bir hücrenin torunu.')
        stage.select('.cancer').glow(true)
        stage.camera.frame(stage.select('cell'))
      })
    })

    // ───────── 8. Karşılaştırma
    lesson.chapter('compare', 'Normal ve mutasyonlu soy', s => {
      s.say('Aynı tek hücreden başlayan iki soyu yan yana koyalım: biri frenlere uyuyor, biri uymuyor.')
      s.step('curves', { title: 'İki eğri', level: 2 }, s => {
        s.say('Normal soy {{cap}} hücrede düz çizgiye döner. Mutasyonlu soy ise yükselmeye devam eder. Fark, tek bir bozuk fren.')
        stage.camera.reset()
        plot.show()
        freeCurve.recolor('mutation')
        freeCurve.pulse()
        limitedCurve.show()
        limitedCurve.pulse()
        capPoint.show()
      })
    })

    // ───────── 9. Gerçek ölçek
    lesson.chapter('scale', 'Gerçek ölçekte', s => {
      s.say('Ekranda küçük sayılarla çalıştık. Gerçek bir dokuda tur sayısı çok daha fazla olabilir ve üstel artış inanılmaz büyür.')
      s.step('formula', { title: 'Formül', level: 2 }, s => {
        s.say('{{doublings}} turda başlangıçtaki 1 hücre {{tumourReal}} hücreye çıkar. Bu kabaca 1 cm³ tümörün hücre sayısıdır (yaklaşık bir milyar). Gerçekte hücrelerin bir kısmı ölür, o yüzden tümörler bu kadar hızlı büyümez; amaç ölçeği görmek.')
        cells().dim()
        plot.hide()
        nChip.show()
        bigChip.show()
        s.formula.show('\\slot{N}{N} = 2^{\\slot{n}{n}}', { words: 'hücre sayısı, 2\'nin tur sayısı kadar kuvvetine eşittir; yani her turda 2 ile çarpılır' })
        s.fly(nChip, s.formula.slot('n'))
        s.formula.fill('N', d.tumourReal)
        s.formula.highlight('N')
      })
      s.step('ratio', { title: 'Normal ile fark', level: 2 }, s => {
        s.say('Normal soy ise {{cap}} hücrede kalır. Aynı sürede mutasyonlu soy normalin {{ratio}} katına ulaşır.')
        bigChip.pulse()
      })
    })

    // ───────── 10. Kalıp
    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp: **bölün → frenlere bak → dur** ya da fren bozuksa **bölün → bölün → bölün**. [[cancer]], durdurma sinyalini yok sayan tek bir hücrenin üstel artışla çoğalan soyudur.')
      lesson.memorize({ title: 'Üstel artış', formula: 'N = 2^n', words: 'Her turda hücre sayısı 2 ile çarpılır.', why: 'Kontrolsüz soy kısa sürede çok büyür.' })
      lesson.memorize({ title: 'Kontrol noktası', words: 'Bölünmeden önce DNA, yer ve büyüme emri kontrol edilir; cevap kötüyse hücre durur.', why: 'Normal dokuyu sabit boyutta tutar.' })
      lesson.memorize({ title: 'Kanser', words: 'Frenleri bozan mutasyon, bölünürken kopyalanır ve tüm soya geçer.', why: 'Tek hücre yeterlidir; torunlar hatayı miras alır.' })
    })
  },

  practice: {
    generate: r => ({ doublings: r.int(5, 25), tissueRounds: r.int(3, 5) }),
    tasks: [
      { id: 'p1', prompt: 'Mutasyonlu bir hücre {{doublings}} tur boyunca hiç durmadan bölünürse kaç hücre olur?', answer: 'tumourReal', tolerance: 0.5 },
      { id: 'p2', prompt: 'Normal doku {{tissueRounds}} turda dolup duruyor. Dolduğunda kaç hücre vardır?', answer: 'cap', tolerance: 0.01 },
    ],
  },
})
