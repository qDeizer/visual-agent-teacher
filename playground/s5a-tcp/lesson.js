export default defineLesson({
  meta: {
    title: 'TCP üçlü el sıkışma',
    lang: 'tr',
    goal: 'Bir TCP bağlantısının SYN, SYN-ACK, ACK ile nasıl açıldığını, iki tarafın durumlarını ve sıra/onay numaralarının nasıl seçilip artırıldığını anlatabilmek.',
  },

  glossary: {
    client: { term: 'istemci', short: 'Bağlantıyı başlatan taraf; örneğin web sayfası isteyen tarayıcın.', concept: true },
    server: { term: 'sunucu', short: 'Bağlantı isteklerini dinleyen ve cevap veren taraf; örneğin bir web sitesinin bilgisayarı.', concept: true },
    seq: { term: 'sıra numarası (SEQ)', short: 'Bir tarafın gönderdiği baytları numaralandırmak için kullandığı sayaç. Her taraf kendi sayacını tutar.', symbol: 'SEQ', concept: true, memorize: true },
    ack: { term: 'onay numarası (ACK)', short: 'Karşı tarafa "şu numaraya kadar aldım, şimdi bundan sonrasını bekliyorum" demenin yolu. Hep karşıdan gelen SEQ numarasına göre kurulur.', symbol: 'ACK', concept: true, memorize: true },
    state: { term: 'bağlantı durumu', short: 'Bir tarafın bağlantının hangi aşamasında olduğunu hatırlamak için tuttuğu etiket (CLOSED, LISTEN, ...).', concept: true },
    network: { term: 'ağ', short: 'Bilgisayarların birbirine mesaj gönderebildiği yapı; internet bunun en büyüğüdür.' },
    packet: { term: 'paket', short: 'Ağda gönderilen küçük bir veri parçası. TCP mesajlarının her biri bir pakettir.' },
    tcp: { term: 'TCP', short: 'İki bilgisayarın veriyi eksiksiz ve sırasıyla alışverişi etmesini sağlayan kurallar bütünü (protokol).', memorize: true },
    protocol: { term: 'protokol', short: 'İki tarafın hangi mesajı hangi sırayla göndereceğini belirleyen ortak kurallar.' },
    connection: { term: 'bağlantı', short: 'İki taraf arasında kurulmuş, her iki tarafın da hazır olduğunu bildiği ortak durum.' },
    flag: { term: 'bayrak (flag)', short: 'Paketin başlığındaki küçük bir işaret; paketin ne amaçla gönderildiğini söyler.' },
    syn: { term: 'SYN', short: 'Eşzamanlama (synchronize) bayrağı: "Bağlantı kurmak istiyorum, işte benim başlangıç numaram."', memorize: true },
    synack: { term: 'SYN-ACK', short: 'Hem SYN hem ACK bayrağı açık paket: "İsteğini aldım, ben de bağlanmaya hazırım, işte benim numaram."', memorize: true },
    ackflag: { term: 'ACK bayrağı', short: 'Paketteki onay numarasının geçerli olduğunu gösteren bayrak.' },
    isn: { term: 'başlangıç sıra numarası (ISN)', short: 'Bir tarafın bağlantı başında seçtiği ilk SEQ değeri. Gerçekte rastgele seçilir, böylece eski ve yeni bağlantıların paketleri karışmaz.', symbol: 'ISN', memorize: true },
    closed: { term: 'CLOSED', short: 'Hiç bağlantı yok.' },
    listen: { term: 'LISTEN', short: 'Sunucu bir bağlantı isteği bekliyor.' },
    synsent: { term: 'SYN_SENT', short: 'İstemci SYN gönderdi, cevap bekliyor.' },
    synrcvd: { term: 'SYN_RECEIVED', short: 'Sunucu SYN aldı, SYN-ACK gönderdi, istemcinin son onayını bekliyor.' },
    established: { term: 'ESTABLISHED', short: 'Bağlantı kuruldu; iki taraf da veri alışverişine hazır.', memorize: true },
  },

  inputs: {
    clientIsn: { default: 100, min: 0, max: 1000, step: 1, term: 'isn' },
    serverIsn: { default: 300, min: 0, max: 1000, step: 1, term: 'isn' },
  },

  model(inp, t) {
    const clientIsn = t.input('clientIsn', inp.clientIsn)
    const serverIsn = t.input('serverIsn', inp.serverIsn)
    const one = t.const('one', 1)
    // Mesaj 1: SYN, SEQ = istemci ISN
    const ackOfSyn = t.add('ackOfSyn', clientIsn, one)       // mesaj 2'deki ACK
    const ackOfSynAck = t.add('ackOfSynAck', serverIsn, one) // mesaj 3'teki ACK
    const ackSeq = t.add('ackSeq', clientIsn, one)           // mesaj 3'teki SEQ (SYN 1 numara harcadı)
    const e1 = t.event('msg1', { from: 'client', to: 'server', flags: 'SYN', seq: clientIsn.value, clientState: 'SYN_SENT', serverState: 'LISTEN' })
    const e2 = t.event('msg2', { from: 'server', to: 'client', flags: 'SYN,ACK', seq: serverIsn.value, ack: ackOfSyn.value, clientState: 'SYN_SENT', serverState: 'SYN_RECEIVED' })
    const e3 = t.event('msg3', { from: 'client', to: 'server', flags: 'ACK', seq: ackSeq.value, ack: ackOfSynAck.value, clientState: 'ESTABLISHED', serverState: 'ESTABLISHED' })
    return { clientIsn, serverIsn, one, ackOfSyn, ackOfSynAck, ackSeq, e1, e2, e3 }
  },

  checks: {
    known: [
      {
        source: 'RFC 9293 (TCP), Bölüm 3.5, Şekil 6 "Basic 3-Way Handshake for Connection Synchronization": SEQ=100 SYN; SEQ=300 ACK=101 SYN,ACK; SEQ=101 ACK=301 ACK',
        inputs: { clientIsn: 100, serverIsn: 300 },
        expect: { ackOfSyn: 101, ackOfSynAck: 301, ackSeq: 101 },
        tolerance: 0,
      },
    ],
    invariants(d, inp, fail) {
      if (d.ackOfSyn.value !== inp.clientIsn + 1) fail('SYN-ACK içindeki ACK, istemci ISN + 1 olmalı')
      if (d.ackOfSynAck.value !== inp.serverIsn + 1) fail('Son ACK, sunucu ISN + 1 olmalı')
      if (d.ackSeq.value !== d.ackOfSyn.value) fail('Üçüncü mesajın SEQ değeri, istemci ISN + 1 olmalı')
      if (d.e1.index >= d.e2.index || d.e2.index >= d.e3.index) fail('mesajlar sırayla gelmeli')
      if (d.e3.payload.clientState !== 'ESTABLISHED' || d.e3.payload.serverState !== 'ESTABLISHED') fail('sonunda iki taraf da ESTABLISHED olmalı')
    },
  },

  scene(stage, d) {
    const seq = stage.sequence({
      at: 'main',
      actors: [
        { id: 'client', label: 'İstemci', role: 'client' },
        { id: 'server', label: 'Sunucu', role: 'server' },
      ],
    })
    // Etiketler model değerlerinden üretilir; sayı sabit yazılmaz.
    const m1 = seq.message('client', 'server', 'SYN  SEQ=' + vat.fmt(d.clientIsn.value, 0), { detail: 'Bağlantı isteği' })
    const m2 = seq.message('server', 'client', 'SYN-ACK  SEQ=' + vat.fmt(d.serverIsn.value, 0) + '  ACK=' + vat.fmt(d.ackOfSyn.value, 0), { detail: 'İstek alındı, ben de hazırım' })
    const m3 = seq.message('client', 'server', 'ACK  SEQ=' + vat.fmt(d.ackSeq.value, 0) + '  ACK=' + vat.fmt(d.ackOfSynAck.value, 0), { detail: 'Senin cevabını da aldım' })

    const clientSm = stage.stateMachine({
      at: 'left', role: 'client',
      states: [
        { id: 'CLOSED', label: 'CLOSED', role: 'state' },
        { id: 'SYN_SENT', label: 'SYN_SENT', role: 'state' },
        { id: 'ESTABLISHED', label: 'ESTABLISHED', role: 'state' },
      ],
      transitions: [
        { from: 'CLOSED', to: 'SYN_SENT', label: 'SYN gönder' },
        { from: 'SYN_SENT', to: 'ESTABLISHED', label: 'SYN-ACK al, ACK gönder' },
      ],
      initial: 'CLOSED',
    })
    const serverSm = stage.stateMachine({
      at: 'right', role: 'server',
      states: [
        { id: 'CLOSED', label: 'CLOSED', role: 'state' },
        { id: 'LISTEN', label: 'LISTEN', role: 'state' },
        { id: 'SYN_RECEIVED', label: 'SYN_RECEIVED', role: 'state' },
        { id: 'ESTABLISHED', label: 'ESTABLISHED', role: 'state' },
      ],
      transitions: [
        { from: 'CLOSED', to: 'LISTEN', label: 'dinlemeye başla' },
        { from: 'LISTEN', to: 'SYN_RECEIVED', label: 'SYN al, SYN-ACK gönder' },
        { from: 'SYN_RECEIVED', to: 'ESTABLISHED', label: 'ACK al' },
      ],
      initial: 'CLOSED',
    })

    // Sayaç çipleri: ISN değerlerinin yaşadığı yer
    const cIsnChip = stage.value(d.clientIsn, { at: { near: seq.actor('client'), side: 'bottom', gap: 'sm' }, role: 'seq', hidden: true })
    const sIsnChip = stage.value(d.serverIsn, { at: { near: seq.actor('server'), side: 'bottom', gap: 'sm' }, role: 'seq', hidden: true })
    const cNote = stage.label('İstemcinin ISN değeri', { at: { near: cIsnChip, side: 'top', gap: 'xs' }, role: 'isn', hidden: true })
    const sNote = stage.label('Sunucunun ISN değeri', { at: { near: sIsnChip, side: 'top', gap: 'xs' }, role: 'isn', hidden: true })

    const ackChip1 = stage.value(d.ackOfSyn, { at: { near: m2, side: 'bottom', gap: 'sm' }, role: 'ack', hidden: true })
    const ackChip2 = stage.value(d.ackOfSynAck, { at: { near: m3, side: 'bottom', gap: 'sm' }, role: 'ack', hidden: true })
    const done = stage.label('Bağlantı kuruldu: iki taraf da ESTABLISHED', { at: { region: 'bottom', u: 0.5, v: 0.5 }, role: 'state', hidden: true })

    return { seq, m1, m2, m3, clientSm, serverSm, cIsnChip, sIsnChip, cNote, sNote, ackChip1, ackChip2, done }
  },

  script(lesson, r, d) {
    const { seq, m1, m2, m3, clientSm, serverSm, cIsnChip, sIsnChip, cNote, sNote, ackChip1, ackChip2, done } = r

    lesson.chapter('question', 'Soru', s => {
      s.say('Tarayıcın bir web sitesine bağlanmadan önce karşıdaki bilgisayarın gerçekten orada ve hazır olduğundan nasıl emin olur? Bu dersin konusu tam olarak bu.')
      s.step('why-agree', { level: 1, title: 'Neden anlaşmak gerek?' }, s => {
        s.say('Bir [[network]] üzerinde mesajlar kaybolabilir. Konuşmaya başlamadan önce iki tarafın da "ben hazırım, seni de duyabiliyorum" demesi gerekir.')
        seq.highlight({ style: 'ring' })
      })
    })

    lesson.chapter('what', 'Ne ve neden?', s => {
      s.say('[[tcp]], iki bilgisayarın veriyi eksiksiz ve sırasıyla alışverişi etmesini sağlayan bir [[protocol]]dür. Bunun için önce bir [[connection]] kurulur. Bağlantıyı başlatana [[client]], bekleyene [[server]] denir.')
      seq.actor('client').highlight()
      seq.actor('server').highlight()
      s.step('why-three', { level: 2, title: 'Neden üç mesaj?' }, s => {
        s.say('Her taraf iki şeyi kanıtlamalı: "gönderebiliyorum" ve "alabiliyorum". İki mesajla bu iki taraf için de kanıtlanamaz; üç mesaj tam yeter.')
        seq.actor('client').unhighlight()
        seq.actor('server').unhighlight()
      })
    })

    lesson.chapter('parts', 'Parçalar', s => {
      s.say('Üç mesajı izlemeden önce üç parçayı tanıyalım: bayraklar, numaralar ve durumlar.')
      s.step('flags', { level: 2, title: 'Bayraklar' }, s => {
        s.say('Her [[packet]]in başlığında küçük işaretler vardır; bunlara [[flag]] denir. Bu derste ikisi önemli: [[syn]] ("bağlanmak istiyorum") ve [[ackflag]] ("aldım").')
      })
      s.step('isn', { level: 2, title: 'Başlangıç numarası' }, s => {
        s.say('Her taraf kendi [[isn]] değerini seçer. İstemcininki {{clientIsn}}, sunucununki {{serverIsn}}. Bunlar iki ayrı sayaçtır; birbirinden bağımsızdır.')
        s.together(() => {
          cIsnChip.show().pulse(); cNote.show()
          sIsnChip.show().pulse(); sNote.show()
        })
        s.step('isn-real', { level: 3 }, s => {
          s.say('Gerçek sistemlerde [[isn]] rastgele seçilir. Bu derste okunması kolay olsun diye küçük sayılar kullanıyoruz; değerleri yukarıdan değiştirebilirsin.')
        })
      })
      s.step('states', { level: 2, title: 'Durumlar' }, s => {
        s.say('Her taraf bağlantının hangi aşamada olduğunu bir [[state]] ile hatırlar. Başta ikisi de [[closed]] durumundadır.')
        s.together(() => { clientSm.show(); serverSm.show() })
        s.step('listen', { level: 3 }, s => {
          s.say('Sunucu önce dinlemeye başlar: [[listen]] durumuna geçer. İstemci ise henüz bir şey yapmadı.')
          serverSm.goTo('LISTEN')
        })
      })
    })

    lesson.chapter('handshake', 'El sıkışma', s => {
      s.say('Şimdi üç mesajı sırayla izleyelim.')

      s.step('syn', { level: 1, title: '1. SYN' }, s => {
        s.say('İstemci SYN gönderir: "Bağlanmak istiyorum, benim numaram {{clientIsn}}." Gönderince [[synsent]] durumuna geçer.')
        s.step('syn-send', { level: 2 }, s => {
          s.say('İstemci [[syn]] bayrağını açar ve [[seq]] alanına kendi [[isn]] değerini, {{clientIsn}}, yazar.')
          s.fly(cIsnChip, m1)
          m1.show()
        })
        s.step('syn-state', { level: 2 }, s => {
          s.say('İstemci cevap bekliyor, bu yüzden [[synsent]] durumuna geçer. Sunucu hâlâ [[listen]] durumunda.')
          clientSm.goTo('SYN_SENT')
        })
      })

      s.step('synack', { level: 1, title: '2. SYN-ACK' }, s => {
        s.say('Sunucu hem kabul eder hem kendi numarasını bildirir: [[synack]], SEQ={{serverIsn}}, ACK={{ackOfSyn}}.')
        s.step('synack-send', { level: 2 }, s => {
          s.say('Sunucu aynı pakette iki iş yapar: kendi [[syn]] bayrağını açıp numarasını ({{serverIsn}}) bildirir ve [[ackflag]] ile istemciyi onaylar.')
          s.fly(sIsnChip, m2)
          m2.show()
          serverSm.goTo('SYN_RECEIVED')
        })
        s.step('synack-ack', { level: 3 }, s => {
          s.say('Neden ACK={{ackOfSyn}}? Sunucu "{{clientIsn}} numaralı SYN aldım, sıradaki numarayı, {{ackOfSyn}}, bekliyorum" der. SYN bayrağı bile bir numara harcar.')
          s.formula.show('\\slot{ack}{ACK} = \\slot{isn}{SEQ_{\\text{karşı}}} + \\slot{one}{1}', { words: 'onay numarası, karşıdan gelen sıra numarasının bir fazlasıdır' })
          s.fly(cIsnChip, s.formula.slot('isn'))
          s.fly(d.one, s.formula.slot('one'))
          s.formula.fill('ack', d.ackOfSyn)
          ackChip1.show().pulse()
        })
      })

      s.step('ack', { level: 1, title: '3. ACK' }, s => {
        s.say('İstemci son onayı verir: ACK={{ackOfSynAck}}. İki taraf da [[established]] olur.')
        s.step('ack-send', { level: 2 }, s => {
          s.say('İstemci sunucunun numarasını onaylar: ACK={{ackOfSynAck}}. Kendi SEQ değeri, SYN bir numara harcadığı için, {{ackSeq}} olur.')
          m3.show()
          s.formula.clear()
        })
        s.step('ack-calc', { level: 3 }, s => {
          s.say('Aynı kural: sunucunun SEQ değeri {{serverIsn}}, onay numarası ona bir eklenerek {{ackOfSynAck}} bulunur.')
          s.formula.show('\\slot{ack}{ACK} = \\slot{isn}{SEQ_{\\text{karşı}}} + \\slot{one}{1}', { words: 'onay numarası, karşıdan gelen sıra numarasının bir fazlasıdır' })
          s.fly(sIsnChip, s.formula.slot('isn'))
          s.fly(d.one, s.formula.slot('one'))
          s.formula.fill('ack', d.ackOfSynAck)
          ackChip2.show().pulse()
        })
        s.step('ack-established', { level: 2 }, s => {
          s.say('İstemci ACK gönderince, sunucu da alınca ikisi de [[established]] durumuna geçer.')
          s.together(() => {
            clientSm.goTo('ESTABLISHED')
            serverSm.goTo('ESTABLISHED')
          })
        })
      })
    })

    lesson.chapter('result', 'Sonuç', s => {
      s.say('Bağlantı kuruldu: iki taraf da birbirinin numarasını biliyor ve veri göndermeye hazır.')
      done.show().pulse()
      seq.messages().highlight({ stagger: 'fast' })
      s.step('result-numbers', { level: 2 }, s => {
        s.say('İstemcinin ilk veri baytı {{ackSeq}}, sunucununki {{ackOfSynAck}} numarasıyla başlayacak; çünkü iki SYN de birer numara harcadı.')
        seq.messages().unhighlight()
      })
    })

    lesson.chapter('pattern', 'Kalıp', s => {
      s.say('Kalıp: **SYN → SYN-ACK → ACK**. Her mesajda onay numarası = karşıdan gelen SEQ + 1.')
      s.step('pattern-states', { level: 2 }, s => {
        s.say('Durumlar da kalıbı izler: istemci CLOSED, SYN_SENT, ESTABLISHED; sunucu LISTEN, SYN_RECEIVED, ESTABLISHED.')
      })
    })

    lesson.memorize({ title: 'Üçlü el sıkışma', words: 'SYN, SYN-ACK, ACK; sonunda iki taraf da ESTABLISHED', why: 'Her iki taraf da hem gönderebildiğini hem alabildiğini kanıtlar.' })
    lesson.memorize({ title: 'Onay numarası', formula: 'ACK = SEQ_{karşı} + 1', words: 'onay numarası, karşıdan gelen sıra numarasının bir fazlasıdır (SYN bir numara harcar)', why: 'Sıradaki beklenen numarayı bildirir.' })
  },

  practice: {
    generate: r => ({ clientIsn: r.int(0, 1000), serverIsn: r.int(0, 1000) }),
    tasks: [
      { id: 't1', prompt: 'SYN-ACK mesajındaki ACK değeri kaç?', answer: 'ackOfSyn', tolerance: 0 },
      { id: 't2', prompt: 'İstemcinin son ACK mesajındaki SEQ değeri kaç?', answer: 'ackSeq', tolerance: 0 },
      { id: 't3', prompt: 'İstemcinin son ACK mesajındaki ACK değeri kaç?', answer: 'ackOfSynAck', tolerance: 0 },
    ],
  },
})
