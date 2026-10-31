# Hareket Referans Raporu: neden "slayt gösterisi" gibi duruyor, neyi değiştirmeliyiz

Tarih: 2026-10-31 · Kapsam: hareket tasarımı (motion design). Pedagoji ve doğruluk bu raporun konusu değil.

## Özet (TL;DR)

1. **Beğenilen iki örnek, aynı şeyi farklı araçlarla yapıyor: nesneyi dönüştürüyor.** vt-dev'de çubuklar ortalama
   seviyesine kendileri iniyor, sayılar yay çizerek uçup formüle "konuyor", değerler sayarak değişiyor. Open Design
   filminde küp telefondan çıkıp depoya gidiyor, kutu katlanıyor, minibüs yola çıkıyor, en sonda aynı küp kutudan çıkıyor.
   İkisinde de ekrandaki her şey **bir yerden gelip bir yere gidiyor**. Hiçbir şey sadece görünüp kaybolmuyor.
2. **Bizim motorun fiilleri durum değiştiriyor, nesneyi dönüştürmüyor.** run-01'de 100'den fazla
   `show/hide/dim/undim/highlight/unhighlight` çağrısı ve 17 `fly` var. `moveTo`, `along`, `scaleTo`, `setValue`,
   `split` çağrısı ise **sıfır**. Ajan elindeki en kolay fiili kullandı. O fiil de sadece opaklığı değiştiriyor
   (`core.js:157-162`, 0,35 s, `power1.inOut`).
3. **Asıl sorun bir tersine dönme.** Eski motor görselde **alçak seviyeli**ydi (circle/rect/line/path, ham koordinat)
   ama harekette **yüksek seviyeli**ydi: her adım sahnenin son halini tarif ediyordu, motor aynı id'li her şeyi kendisi
   tween'liyordu. Yeni motor bunun tersi. Görselde yüksek seviyeli (`neuralNet`, bölgeler) ama hareket emir kipinde: ajan
   her değişikliği tek tek çağırmak zorunda, bileşenin geometrisine de dokunamıyor. Öneri: **görseli serbest bırak,
   hareketi otomatikleştir.**
4. Bu sorunu büyüten başka varsayılanlar da var:
   - Her durakta tam duruş, anlatımın tamamı hareketten önce ekranda (`layout.js:57`, `player.js:199-204`).
   - Uçuşlar düz çizgide gidiyor ve konarken çapraz geçişle beliriyor (`stage.js:422`, `formula.js:230-237`).
   - Sayılar sayarak değil çapraz geçişle değişiyor (`core.js:267-284`).
   - Overshoot, stagger ve üst üste binen zamanlama yok.
   - Hareket tokenları, arayüz mikro etkileşimleri için yazılmış değerlerden alınmış (140–220 ms, `PLAN.md:278`).
   - SKILL.md'de tek bir hareket kuralı yok. Tek örnek ders de "tablo + vurgula + uçur" kalıbını öğretiyor.
5. **Öneri:**
   - **Koru:** zaman çizelgesine derleme, seek, geri ve detay seviyeleri; model/trace/checks; formül slotları; alıştırma; QA.
   - **Değiştir:**
     - Varsayılan giriş/çıkış ve uçuş hareketleri.
     - Sayı sayma.
     - Ham koordinat izni.
     - Bildirimsel "sahne durumu" modu (eski motorun diff'i).
     - Bileşenler kara kutu olmasın, kopyalanabilir tarif olsun.
     - Skill'e bir "hareket grameri" ve storyboard/vuruş (beat) yapısı.
     - Dönüştürme yapan yeni bir örnek ders.
     - QA'da hareket ölçümü.

Yöntem: Kodları satır satır okudum. Görsel kanıt olarak mevcut QA çıktılarını kullandım
(`playground/run-01/qa-sheets`, `qa-shots`, `vt-runs/tur-5b/qa`). Yeni kare render etmedim. Kod okuması ve mevcut
görseller tanı için yetti.

---

## 1. Referanslar: kullanılan hareket teknikleri

### 1.1 vt-dev/index.html ("grafikler hareket ediyor, çok tatlı")

**Önemli tespit:** `vt-dev/index.html`, `visual-teacher/assets/lab-template.html` ile **bayt bayt aynı** (`diff` boş).
Kullanıcının beğendiği şey, şablonun içindeki **demo konu** ("Ortalama · Görsel Lab", satır 1146-1278) ve onu oynatan
ENGINE v3. Yani beğeni hem motorun hem de demo sahnenin seçimlerine ait.

**Mimari (hareketi doğuran şey):** Her adım sahnenin *tamamını* tarif ediyor. Motor `id` ile diff alıyor:

```js
// vt-dev/index.html:549-572 (özet)
apply(spec, o = {}) {
  const ms = o.ms ?? 420 ...
  for (const [id, n] of this.nodes) if (!want.has(id)) ... this.exit(n)        // giden: söner
  this._enterDelay = exits ? 200 : 0;  // giden yer açsın, sonra yeni gelsin
  ... if (!n) this.enter(s, op, k++) else this.update(n, s, op, ms)             // kalan: TWEEN
  this.cameraTo(o.camera || this.defVb, ms === 0 ? 0 : 700);
}
```

Aynı id'yle kalan her nesnenin her sayısal özelliği, rengi, path şekli ve sayı metni otomatik tween'leniyor
(`update`, 517-548). Ajan "çubuk ortalamaya insin" demek için hiçbir hareket fiili çağırmıyor. Sadece bir sonraki
adımda çubuğu başka yükseklikte tarif ediyor:

```js
// 1214: aynı id'ler (bar0..2), yeni yükseklik = ortalama → çubuklar kendileri iner/çıkar
add({ stage: 'what', terms: ['mean'], say: '…Bak: çubuklar aynı boya geliyor.', scene: [axis, bars(mean), meanLine()], … });
// 1215: bir sonraki adımda bars() → çubuklar gerçek boylarına geri döner
```

| Teknik | Kod | Değerler |
|---|---|---|
| **Giriş** | `enter()` 495-511 | opaklık 0→1 **ve** ölçek 0,92→1, 360 ms, `Ease.out` (kübik). **Stagger** `min(k,6)·55 ms`. `draw:true` olan çizgiler kendini çizer (dashoffset, 560 ms, `inOut`). |
| **Çıkış** | `exit()` 513-516 | 240 ms, `Ease.in`. Yeni nesneler 200 ms gecikmeyle girer (558): önce yer açılır. |
| **Morph** | `update()` 529-535 | Aynı komut yapısındaki path'ler sayı sayı lerp edilir (`pathTpl`). Renkler RGBA lerp edilir. |
| **Sayaç** | `_applyText` 434-441 | Sayısal metin, ≥380 ms `Ease.out` ile **sayarak** değişir. String metin 280 ms'de söner ve yeniden belirir. |
| **Uçuş** | `fly()` 694-711 | Kuadratik Bézier **yay**: tepe = `min(120, |dx|·0,25+30)` px yukarı. 760 ms `inOut`. Çip uçarken %8 küçülür. Kaynak nesne uçuş boyunca %40'a söner, sonra geri gelir (705). |
| **Konma** | CSS 136-137 | `.fp.landed{animation:land .38s cubic-bezier(.2,.9,.3,1.3)}`: 0,86→1 **overshoot'lu** konma. |
| **Vurgu** | `pulse()` 582 | 560 ms, `sin(πp)` ile 1→1,14→1. |
| **Yol boyunca** | `along()` 581 | `fn(t)` her karede özellik döndürür. Top gerçekten eğri üzerinde yuvarlanır. |
| **Kamera** | `cameraTo()` 573-578 | viewBox 700 ms `inOut` tween. Zoom 2,2× ile sınırlı. |
| **Easing** | `Ease` 333-339 | `out` (kübik), `inOut`, `spring` (c1=1,1: hafif overshoot). |

**Sahne geçişleri ve süreklilik:** Sahne hiç temizlenmiyor. "Yol haritası" yazısı (`id:'map'`, 1218-1219) son adımda
**aynı id** ile kalıp kartına dönüşüyor (1246-1248): kart sıfırdan gelmiyor, yazı büyüyüp karta evriliyor. Toplam
kutusu, hesap adımında `after:true` ile koreografi bitince "doğuyor" (1222-1223).

**Anlatım–hareket eşzamanlılığı:**
- `‹…›` işaretli sonuç cümleleri vuruşlar oynarken gizli kalıyor, koreografi bitince beliriyor
  (CSS 156, `md()` 609, `render()` 886/898). Anlatıcı sonucu hareketten önce söylemiyor.
- Metin değişimi 150 ms'lik söner+3 px kayma ile oluyor (153-154, 717-726).
- Otomatik oynatmada süre kelime sayısından hesaplanıyor: `kelime·350 ms/hız + 400` (906).
- Konuşma sentezi isteğe bağlı (1006).

**Tipografi ve yoğunluk:**
- Anlatıcı 19 px (`--fs-l`). Sahne etiketleri 13, değerler 15, ana sonuçlar 20–24 px.
- Lint ≤ 2 cümle ve ≤ ~35 kelime dayatıyor (1051-1052). Ekranda tek formül var.

**İkincil hareket:** Döngü veya bekleme animasyonu yok. Eski skill bunları açıkça yasaklıyordu (SKILL.md:210).
"Canlılık" süsten değil, **dönüşümden** geliyor. Bu önemli bir ders: bizim motorda `breathe/jitter/glow/flow` var
ama yine de cansız görünüyor.

### 1.2 Open Design filmi (izometrik sipariş animasyonu, "çok tatlı")

`…/motion-source/film/index.html`: 18 s, 24 fps, 1920×1080. Tek bir GSAP ana zaman çizelgesi (`tl`, 476). Tüm
sahne ham SVG ile kendi yardımcılarıyla çizilmiş: `pr()` izometrik izdüşüm (132), `box()` üç yüzlü kutu (140-149),
`softShadow`, `worker`, `building`. **Hazır bileşen yok. Model GSAP'i ve SVG'yi doğrudan yazmış.**

| Teknik | Satır | Değer / not |
|---|---|---|
| Açılış | 482-485 | Siyah perde 0,75 s söner. Telefon 12 px aşağıdan 1,2 s `power2.out` ile yerine oturur. |
| **Basma (anticipation + overshoot)** | 498-499 | Buton 0,1 s `power1.in` ile 0,95'e iner, 0,2 s `back.out(3)` ile geri zıplar. |
| **Dalga (ripple)** | 500 | Halka 0,4→3,2 büyür, opaklık 0,7→0, 0,6 s. |
| **Pop-in** | 505, 520, 525, 528, 556 | `scale 0→1` ile `back.out(2.4)`, `back.out(2)`, `back.out(1.8)`, `back.out(2.2)`: 0,3–0,45 s. Hep overshoot. |
| **Yolculuk (iki bacak, ivme değişimi)** | 506-509 | Küp önce 0,55 s `power1.out` ile süzülür, sonra 0,7 s `power2.in` ile hızlanarak depoya dalar, 0,22 s'de küçülüp kaybolur. "Bir yere girdi" hissi böyle oluşuyor. |
| Yürüyüş | 514-516 | İşçi 0,95 s `sine.inOut` ile yürür, 0,18 s'lik küçük bir **oturma** (settle) hareketi yapar, sonra taşır. |
| **Malzeme hareketi** | 527-528 | Bant `scaleX 0,2→1`, soldan, 0,55 s. Etiket `back.out(2)` ile yapışır. |
| Ardışık kısa bacaklar | 529-533 | Kutu konveyörde 4 parça hâlinde ilerler, minibüse girerken küçülür. |
| **Follow-through** | 538-539 | Minibüs 3,5 s `power1.inOut` sürüşten sonra 0,25 s'de 6 px **geri sallanıp** durur (fren). |
| Kapı, kapak | 535-536, 554 | Kapı açılıp kapanır. Kapak `back.out(1.6)` ile −9° dönerek fırlar. |
| **Motif dönüşü** | 438-439, 556-557 | Başta "veri" olan cyan küp, en sonda paketten **aynı görsel motif** olarak çıkar ("veri açığa çıkar"). |
| **Kamera** | 484-489 | Tek dünya. `#camera` grubu 4 kez kayar (1,4–2,2 s, `power2.inOut`). Kesme yok: telefon → depo → yükleme → şehir → ev. |
| Ortam döngüsü | 563 | Bant çizgileri 10 s doğrusal `stroke-dashoffset`. Sahne "çalışıyor" hissi verir. |
| İlerleme çubuğu | 496 | 16 s doğrusal. İzleyiciye zamanı hissettirir. |
| Işık ve derinlik | 21-62, 160-162 | Radyal parıltılar, yumuşak gölgeler, üst/alt karartma (70-71). İki vurgu rengi var (amber, cyan); gerisi koyu çelik. |

**Ses:** 25 `<audio>` ipucu (76-101), hepsi bir eylemle **aynı karede**:
- Dokunma 1,05 s ↔ basma 1,05 s.
- Alma 5,05 s ↔ ürünün belirmesi 5,02 s.
- Gümleme 9,05 s ↔ paketin minibüse girmesi 9,1 s.
- Kapı zili 15,55 s ↔ kapının açılması 15,55 s.
- Altta 0,2 sesle bir "pad" tüm filmi taşıyor.

Sesler `tools/make-audio.mjs` ile **prosedürel sentezlenmiş** (sinüs/kare/gürültü + zarf). Harici dosya yok.

**Zamanlama yapısı:**
- Her aşamanın `a/b` penceresi ~2,2–2,6 s, aralarında 0,2 s boşluk var (444-451).
- Eylemler **üst üste biniyor**: küp 1,75'te çıkarken telefonun "alındı" paneli daha 1,34'te geliyor; işçi yürürken ışık yanıyor.
- Hiçbir an boş değil, ama aynı anda tek bir **ana** hareket var.

**Ekrandaki metin:**
- Altta tek altyazı bloğu var. Aşama numarası 12 px (amber, harf aralığı 3), başlık **34 px**, açıklama **17 px**.
  Her açıklama 6–8 kelime (457-465).
- Altyazı 0,45 s'de 12 px aşağıdan `power2.out` ile gelir, 0,22 s'de 6 px yukarı kayarak çıkar (493-494).
- Final başlığı **72 px** (473).
- Anlatım metni eylemle aynı anda değişiyor (`s.a` = o aşamanın ilk eylemi).

### 1.3 Eski skill ve vt-runs çıktıları

**SKILL.md (visual-teacher):**
- §2'de "Continuity — one continuous world; nothing jumps, pops or teleports" (58) **4. öncelik** olarak yazılmış.
- §7: "Build gradually" (163), "One machine for the whole lesson… never cleared" (164).
- §8 (186-210) bir koreografi grameri:
  - id'ler sabit kalır.
  - "Moving an object *is* explanation."
  - "A transformation transforms the object itself (same id)."
  - "Motion follows the physics of the idea" (`c.along`).
  - "Iterative processes leave a trail."
  - "spotlight → main motion → result settles."
  - "One moving thing at a time."
  - "Values that change keep their id so they count."
  - "Discrete contributions travel."
- §9 (223-231) bir sayının yolculuğunu tarif ediyor: kaynak parlar → uçar → birleşir → yerleşir. Ayrıca "anlatıcı sonucu
  animasyondan önce söylemez (‹ ›)" kuralı var.

**engine-api.md:** `beats: async c => {…}` ile adım içi koreografi
(`c.fly/reveal/focus/formula/patch/pulse/along/camera/wait`, 113-141). Dikkat: bu API **ince**. Ajan koordinatı ve
şekli kendisi seçiyor.

**Çıktılar (review.md'ler):**

- **tur-4a (gradyan inişi):** Hareket puanı 4/10.
  - Ana sorun: top eğri üzerinde değil, **düz kiriş** üzerinde kayıyor (`cx/cy` ayrı lerp).
  - Teğet uçarken bozuluyor. Sonuç, nedeninden ~2 s önce ekseni gösteriyor (review.md:26-39).
  - Hakem açıkça "exactly the 'abrupt / slideshow' defects the client rejected" diyor.
  - Korunacaklar listesi: tek makine, sabit id'ler, **sayan değerler**, sayı yolculukları (305-313).
- **tur-4b (regresyon hataları):** "Tweens are smooth and nothing pops. But the key transformations… happen as one
  simultaneous 420 ms lurch, or as crossfades in place" (20). Hepsi aynı anda olunca hareket okunmuyor. Önerilen
  çözüm: vuruşlara bölmek, sırayla saymak (74-91).
- **tur-3a / tur-3b:** "stage changes are hard cuts", "pattern card is a separate slide", "an unrelated centred card
  fades in. That is the 'slideshow jump'" (3b:125). Metin üstüne metin çapraz geçişi de var (4a §10).
- **tur-5b (MLP, run-01 ile aynı konu):**
  - Ajan ağı **kendisi çizmiş**: kenar kalınlığı = |w|, negatif ağırlık kesikli çizgi (`index.html:1281`).
  - Nöronlar I ve Out değerlerini taşıyan kartlar (1316-1321).
  - Köşede mini tanh grafiği var, sağda çıktı göstergesi (y=1 / "ağın cevabı ?") var.
  - Altta yol haritası şeridi var. Ağ `sc(opts)` ile **katman katman büyüyor** (`o.edges`, 1274-1284).
  - `qa/frames/sheet_desktop_step21.png`: 0,55 ve 0,6 çipleri sırayla formüle uçuyor, ürün çipi kenarın üzerinde doğuyor.

**Ders:** Eski motor da kusursuz değildi. Hareket kusurlarının çoğu **ajanın** koordinat ve vuruş seçimlerinden
geliyordu. Ama ajanın elinde *dönüştürme* yapacak araç vardı ve onu kullanıyordu. Hakemlerin "slayt" şikâyeti, aynı
anda olan değişimler, kesmeler ve metin üstüne metin çapraz geçişleri içindi.

### 1.4 İndirilen Claude skill'leri (artifact-design, dataviz)

- **artifact-design:** Hareket hakkında üç cümle var ama üçü de yerinde:
  - "Use motion deliberately: **one orchestrated moment beats scattered effects**."
  - "Make the page complete at rest… no content left at `opacity: 0` waiting."
  - "respect `prefers-reduced-motion`."
  - Bizim için anlamı: her durakta **tek bir orkestre an** olmalı; dağınık söndür/yak geçişleri değil.
- **dataviz:** Hareketten hiç söz etmiyor. Asıl değeri **yapısında**:
  - "procedure — do these in order", hesaplanabilir olanı hesapla ("run the validator, don't eyeball"),
    anti-pattern kataloğu, "render it and look at it".
  - Hareket grameri de aynı biçimde yazılmalı: sıralı bir prosedür, ölçülebilir kurallar (lint/QA) ve bir
    anti-pattern listesi. Bunu da kısa tutarız ve QA'ya bağlarız.
  - Statik kurallar da işimize yarıyor: "Text wears text tokens, never the series color", "recessive grid/axes",
    ölçeğe göre çizim.

### 1.5 Bizim çıktı: playground/run-01/lesson.js ve motor fiilleri

**Fiil sayımı** (`grep`):

| Fiil | Sayı |
|---|---|
| show | 23 |
| fly | 17 |
| highlight | 16 |
| unhighlight | 15 |
| undim | 13 |
| dim | 12 |
| hide | 9 |
| flow | 7 |
| glow | 4 |
| pause | 3 |
| pulse | 2 |
| **moveTo, along, scaleTo, setValue, split, clone, camera.\*** | **0** |

Örnek dersin (`skill/references/example-lesson.js`) dağılımı da aynı: fly 6, show 3, highlight/dim/undim/pulse 2'şer.
Hareket fiili hiç yok.

**Sahne:**
- Bütün ağ `scene()` içinde tam ve görünür kuruluyor (`lesson.js:172-189`). 1. adımdan itibaren ağın tamamı ekranda
  (`qa-sheets/sheet-1.png`). Büyüyecek, inşa edilecek bir şey kalmıyor.
- `neuralNet`'e `role` verilmediği için düğümler gri. Kenarlar eşit kalınlıkta ve gri (`qa-shots/stop-11`).
- Vurgu halkası, daireyi saran **kare çerçeve** (`core.js:133-136`). Sahne nesnesi gibi değil, arayüzde seçili öğe gibi görünüyor.

**Senaryo kalıbı (her adımda aynı):**

```js
// lesson.js:205-209 + 327-332
const focus = (ids) => { net.nodes().except(...keep).dim(); keep.forEach(n => n.undim().highlight()) }
net.nodes().except(net.node('h12')).dim(); net.node('h12').undim().highlight(); net.node('h11').unhighlight()
```

**Slayt kesmesi:**

```js
// lesson.js:244-245 ve 255-257: ağı gizle, grafiği göster; sonra tersi
net.hide(); tanhPlot.show(); tanhPoint.show()   // 'sikistir'
tanhPlot.hide(); tanhPoint.hide(); net.show()   // 'bias'
```

**Kalıp bölümü:** Katmanlar 0,45 s duraklamalarla sırayla vurgulanıyor (`lesson.js:481-490`). Bu bir hareket değil,
düz bir sunum efekti.

**Uçuşlar:**
- `{ speed: 'fast' }`: 0,35 × 1,15 ≈ 0,4 s, düz çizgi (`lesson.js:291-292`).
- Kaynağı olmayan değerler (`s.fly(d.a11, net.nodeValue('h11'))`, 322) hedefin **70 px üstünden** düşüyor
  (`stage.js:413`). Değer, onu hesaplayan formülden ya da düğümden gelmiyor.

**Anlatım:**
- Satırlar 3–4 cümle, ~35–45 kelime (214, 277).
- Sonucu baştan söylüyor: "Toplam **{{z11:3}}** olur" metni durak başlarken tümüyle ekranda, hareket sonra oynuyor.

---

## 2. Yan yana tanı: neden slayt gösterisi gibi

### 2.1 Karşılaştırma tablosu

| Boyut | vt-dev (beğenildi) | OD filmi (beğenildi) | Bizim motor / run-01 |
|---|---|---|---|
| Hareketi kim üretiyor | Motor: sahne durumları arası diff, otomatik | Yazar: elle GSAP | Ajan: her değişikliği fiil olarak çağırıyor |
| Giriş | opaklık + ölçek 0,92→1, 360 ms, stagger 55 ms, çizgiler çizilir | `scale 0→1` + `back.out(2–2.4)` | **sadece opaklık** 0→1, 350 ms `power1.inOut` (`core.js:161`) |
| Çıkış | 240 ms `in`, sonra yeni gelenler 200 ms gecikmeli | Küçülerek "içine girer" | opaklık 350 ms; giriş ve çıkış aynı anda, üst üste |
| Değer değişimi | **sayar** (≥380 ms) | — | metin söner ve yeniden belirir (`core.js:276-281`) |
| Uçuş | Bézier yay, 760 ms, kaynak söner, **overshoot'lu konma** | İki bacaklı yolculuk, ivme değişimi | **düz çizgi** `power2.inOut` (`stage.js:422`). Konma = çapraz geçiş (`formula.js:230-237`) |
| Yol boyunca | `along(fn)`, her kare | Çok bacaklı yol | `along()` parça parça **doğrusal** (`ease:'none'`, `core.js:247`) |
| Renk | lerp | — | **anında** (`rec.set`, d=0, `core.js:203`) |
| Overshoot / settle | spring, `land` | Her pop'ta `back.out`, frende sallanma | yok (sadece `split`'te `back.out(1.6)`) |
| Zamanlamada üst üste binme | stagger + vuruşlar | Sürekli üst üste binen eylemler | ya tümüyle sıralı (kayıt `seq`) ya tümüyle eşzamanlı (`together`). Stagger varsayılanı **0** (`core.js:376`) |
| Sahne inşası | Nesne, adı geçtiği anda doğar | Sahne kamera ile keşfedilir | Bileşen `scene()`'de tam ve görünür |
| Süreklilik | Kesme yok; kart, yol haritasından evrilir | Tek dünya, kamera kayar | `net.hide()/plot.show()` = kesme |
| Kamera | 700 ms, adım ve aşama kadrajı | 4 uzun pan | run-01'de hiç kullanılmamış |
| Duraklar | Vuruşlu duraklar + otomatik oynatma | Sürekli | Her durak sonunda `addPause` (`layout.js:57`). Çoğu durakta 1–2 geçiş var. |
| Anlatım senkronu | `‹sonuç›` vuruşlardan sonra belirir | Altyazı eylemle aynı karede | Metnin tamamı durak başında yazılı (`player.js:199-204`), sonucu önceden söyler |
| Metin yoğunluğu | ≤ 2 cümle, ≤ 35 kelime (lint) | 6–8 kelime altyazı, 34 / 17 px | 3–4 cümle, ~40 kelime, lint yok |
| Görsel dil | Rol renkleri, ölçekli çubuklar | İki vurgu rengi, ışık, gölge, derinlik | Gri ağ, eşit kenarlar, kare vurgu çerçevesi |
| Ses | isteğe bağlı TTS | 25 senkron ses ipucu | yok |

### 2.2 Somut nedenler (motor ve skill'deki sorumlusu)

1. **Görünürlük sadece opaklık.** `show/hide` = `autoAlpha` 0↔1, `dur('fast')` = 0,35 s, `power1.inOut`
   (`core.js:157-164`). Konum ya da ölçekten gelme yok, çizilme yok (oklar hariç, `stage.js:350`). Sonuç: nesneler
   "yerinde beliriyor". Slayt yazılımındaki "fade" geçişinin aynısı.
2. **Fiil sözlüğü durum odaklı.** `dim/undim/highlight/unhighlight` her biri 0,35 s opaklık tween'i
   (`core.js:165-185`). Ajan "odak" kavramını 4 fiille kuruyor ve her adımda bunu tekrarlıyor. Ekranda bir şey
   **olmuyor**, sadece parlaklık değişiyor. Eski motorda odak tek bir alandı (`focus: [...]`) ve hareket ayrı bir kanaldı.
3. **Hareketin maliyeti yüksek, söndür/yak bedava.** Bir nesneyi taşımak için `moveTo` + yerleşim nesnesi gerekiyor.
   Ham koordinat yasak (`stage.js:144`: "Raw {x, y} positions are not allowed"). Bileşen parçalarının geometrisi
   dışarıya açık değil: kenar kalınlığı, düğüm boyutu, katman aralığı `neuralNet` içinde sabit
   (`components.js:215-260`). Ajan doğal olarak `highlight()`'a yöneliyor.
4. **Bileşen sahnenin tamamını hazır veriyor.** `neuralNet` her şeyi `scene()` anında, görünür olarak kuruyor. "Build
   gradually" ilkesi (eski SKILL §7) motorun varsayılanıyla çelişiyor. Ajanın elinde ağı katman katman büyütecek basit
   bir yol yok (`hidden` + tek tek `show` var ama o da sadece söndür/yak).
5. **Sayılar saymıyor.** `setText` = %40 süre sönme, metin değişimi, %60 süre belirme (`core.js:276-281`). Uçuşla gelen
   değer de böyle konuyor (`stage.js:411`). eski motorun en "canlı" efektlerinden biri (sayaç) kaybolmuş.
6. **Uçuş "fırlatılmış" görünmüyor.** Düz çizgi, ~0,4–0,7 s, kaynak sönmüyor. Konarken sıçrama yok, slot çapraz
   geçişle doluyor. Kaynağı olmayan değer hedefin 70 px üstünden düşüyor (`stage.js:413`).
7. **Easing tekdüze, overshoot yok.** Varsayılan `power2.inOut` (`core.js:40`), görünürlükte `power1.inOut`. `back.out`
   sadece `split`'te var. Film her girişte `back.out(1.8–3)` kullanıyor; "tatlı" hissinin büyük kısmı buradan geliyor.
8. **Süre skalası arayüz için yazılmış.** `DUR = { fast: .35, normal: .6, slow: 1.0 }` (`core.js:14`). `PLAN.md:278`
   hareket tokenlarını "Open Design `animate` skill'inden… Arayüz tepkileri 140–220 ms. `ease-in` kullanılmaz" diye
   tanımlıyor. Bunlar **buton tepkisi** için doğru değerler. Anlatı hareketi için yanlışlar:
   - Yolculuk 0,7–1,2 s olmalı.
   - Kamera 1,2–2 s olmalı.
   - Bir şeyin "içine girmesi" için `ease-in` gerekli (film 507-508).
9. **Zamanlama ya hep sıra ya hep aynı an.** Kaydedici her fiili sıraya ekliyor. `together` her şeyi aynı ana
   koyuyor. GSAP'ın konum parametresi (`"<0.1"`, `"-=0.2"`) ve stagger varsayılanı yok. Film ve vt-dev'deki
   **çakışan kaskad** (biri bitmeden öbürü başlar) yazılamıyor. tur-4b'nin "420 ms lurch" şikâyeti de bizim
   `together` kullanımında aynen ortaya çıkar.
10. **Her durakta tam duruş, durak başına az olay.** `addPause(s.end)` her durağın sonunda (`layout.js:57`).
    run-01'de 18 durağın çoğunda 1–2 durum geçişi var (0,35 s). Kullanıcı tıklıyor, yarım saniye solma oluyor, sonra
    sahne donuyor. Slayt gösterisi duygusunun ritmi bu: **tıkla → değiş → bekle**.
11. **Anlatım hareketi önceden söylüyor.** `_showStop` durağın metnini tümüyle ve anında yazıyor
    (`player.js:199-204`). `‹›` geç belirme yok. Metin uzun (3–4 cümle) ve sonucu içeriyor. Göz metne gidiyor,
    hareket "ispat" olmaktan çıkıp süse dönüşüyor.
12. **Slayt kesmeleri teşvik ediliyor.** Bileşenler "kendi bölgelerini doldurur" ve iki bileşen iki bölge ister
    (`engine-guide.md:85-87`). `center` bölgesindeki grafik ağın üstüne düşünce ajan ağı gizleyip grafiği gösteriyor
    (`lesson.js:244`). Tam bir slayt değişimi.
13. **Vurgu dili arayüzden alınmış.** Kare seçim halkası (`core.js:136`) ve düz SVG blur glow sahneyi bir form ekranına
    benzetiyor. vt-dev'de odak, diğer her şeyin doygunluğunu ve opaklığını düşürüyordu (`.dimmed{filter:saturate(.35)}`,
    111). Film ise ışık (radyal parıltı) kullanıyor.
14. **Skill ve örnek, hareketi öğretmiyor.**
    - Yeni SKILL.md 50 satır ve "motion/move/anim" kelimesi geçmiyor.
    - `engine-guide.md` hareketten sadece fiil listesi olarak söz ediyor (§4).
    - Tek örnek ders (`example-lesson.js`) bir tablo, vurgu ve uçuş ile çözülüyor. Görsel metafor yok, dönüşüm yok.
    - Ajanlar örneği kopyalar. run-01'in fiil dağılımı örneğinkiyle neredeyse aynı.
15. **Tipografi ve yoğunluk.** run-01'de düğüm adları ~11 px görünüyor (gri `ink-3`, stop-11 ekran görüntüsü).
    Anlatıcı uzun. Film tek altyazı (34/17 px), vt-dev ≤ 35 kelime kullanıyor. Bizde kelime lint'i yok
    (`lesson.js` sadece ondalık uyarısı veriyor, 38-45).

**Kök neden tek cümlede:** Motor, *durum değişimini* ucuz, *nesne dönüşümünü* pahalı yapıyor. Skill de dönüşüm
istemediği için ajan en ucuz yolu seçiyor: söndür, yak, vurgula.

---

## 3. Mimari soru: yüksek seviyeli bileşen/fiil API'si yaratıcılığı düşürüyor mu?

### 3.1 "Evet, düşürüyor" tarafı

- **Görsel metafor sabitleniyor.**
  - Aynı konu (MLP ileri yayılım), iki farklı API.
  - tur-5b'de (alçak seviyeli primitifler) ajan şunları icat etti: kenar kalınlığı = |w|, negatif = kesikli,
    I/Out kartları, mini tanh grafiği, çıktı göstergesi, katman katman büyüyen ağ, yol haritası şeridi.
  - run-01'de (`neuralNet`) aynı ajan gri, eşit kalınlıkta, önceden kurulmuş bir ağ üretti.
  - Bileşen "nasıl görüneceği" sorusunu ajanın elinden alıyor. Ajan da tasarımı bırakıp **operatör** oluyor.
- **Fiil adları düşünce biçimini belirliyor.** `highlight/dim` gibi durum adları "bu adımda neye bakılsın?" sorusunu
  getiriyor. `pour/stack/grow/travel` gibi olay adları ya da "son durumu tarif et" modeli ise "bu adımda ne
  **olsun**?" sorusunu getiriyor. Pedagojik hareket ikinci sorudan doğuyor.
- **Eğitim verisi etkisi.** Film, modelin iyi bildiği GSAP ve SVG ile yazıldı. Sonuç zengin: `back.out`, ripple,
  izometri, ses. Özel bir API'de model bu birikimi kullanamıyor. `PLAN.md` R1 riski de bunu söylüyor.
- **Kara kutu, ince ayarı engelliyor.** Bileşenin içindeki zamanlama (çizilme 1 s, etiket 0,35 s) ajandan gizli.
  Ajan "ağırlık çipi kenar boyunca kaysın" diyemiyor.

### 3.2 "Hayır, gerekli" tarafı

- **Serbestlik kusur da getiriyor.** Eski çalışmalarda hareket kusurlarının çoğu ajan kaynaklıydı:
  - Kiriş üzerinde kayan top, sonucu erken gösteren eksen noktası, yön değiştiren etiketler (tur-4a #1).
  - Sessizce başarısız olan uçuşlar (tur-3b).
  - Çakışan etiketler (hepsinde).
  - Film de bir kerelik, geri/ileri/detay seviyesi/yeniden hesaplama/alıştırma gerektirmeyen bir çıktı. Serbestliğin
    bedeli orada görünmüyor.
- **Beğenilen vt-dev de yüksek seviyeli bir motordu.** Ama yüksek seviye **harekette**ydi: diff, sayaç, yay uçuşu,
  `after/reveal`, kamera kadrajı. Görsel tarafta alçak seviyeliydi: circle/rect/line/path/text, ham koordinat. Demek
  ki "API yaratıcılığı öldürür" genellemesi yanlış. **Hangi katmanın** soyutlandığı önemli.
- **Etkileşim gereksinimleri:** seek, geri sarma, detay seviyeleri, girdi değişince yeniden kurma, QA. Bunlar ince
  ama sağlam bir çalışma zamanı ister. Ham "rAF + async" (eski `beats`) geri/atla tutarlılığında sorun çıkarmıştı.
  Yeni zaman çizelgesi derleyicisi bunu çözüyor ve korunmalı.

### 3.3 Öneri: "ince çalışma zamanı + serbest görsel + hareket grameri"

| Katman | Kim sahibi | Öneri |
|---|---|---|
| Oynatıcı, duraklar, detay seviyeleri, seek/geri, hız, anlatıcı, formül çubuğu, sözlük, alıştırma, model/trace/checks, QA | **Motor (koru)** | Olduğu gibi kalsın. Sadece §4'teki varsayılanlar değişsin. |
| **Hareket fiziği** (giriş/çıkış stilleri, yay uçuşu, sayaç, morph, settle/overshoot, kaskad zamanlama) | **Motor (yeniden yaz)** | Ajan her seferinde yazmasın; varsayılan olarak doğru çıksın. Eski motordaki gibi "değişen her şey kendiliğinden tween'lenir". |
| **Görsel tasarım** (şekiller, metafor, kodlama, yerleşim) | **Ajan (serbest bırak)** | Ham dünya koordinatı, `stage.shape(svg)` ve SVG primitifleri birinci sınıf olsun. Bölgeler sadece kolaylık. |
| Alana özel görseller (`neuralNet`, `plot`, `table` …) | **Tarif (recipe)** | Kara kutu değil, kopyalanabilir kaynak (`PLAN.md:355` zaten öneriyor). Parametreler görsel kodlamayı açığa çıkarsın: `edgeWidth: w => …`, `build: 'layer-by-layer'`. |
| Koreografi | **Ajan + gramer** | Skill'de kısa bir hareket grameri, plan aşamasında storyboard/vuruş tablosu, QA'da hareket ölçümü. |
| Kaçış kapısı | **Ajan** | `s.add(gsap.timeline())` "acil durum" değil, **meşru yol** olarak anlatılsın. GSAP'ı model zaten biliyor. Seek ve geri bu tween'lerde de çalışıyor (`layout.js:23`). |

**İki yazım modu birlikte:**
1. **Bildirimsel durum** (eski motorun diff'i): `s.state({ bar0: { h: …, y: … }, meanLine: { draw: true } })` ya da
   nesne başına `obj.to({ attrs }, { ease, dur })`. Aynı id'deki değişiklik kendiliğinden morph edilir. "Çubuklar
   ortalamaya iner" tek satır olur.
2. **Olay fiilleri** (filmdeki gibi): `travel(path)`, `pop()`, `pour(into)`, `stack()`, `grow()`, `count()`. Bunlar
   ön tanımlı hareket kalıpları ve hepsi zaman çizelgesine derleniyor.

Durum fiilleri (`dim/highlight`) tek bir `s.focus([...])` alanına indirilsin. Böylece fiil listesinde baskın olmazlar.

**Neyi tutup neyi bırakacağız:**
- **Tut:** `rec` → GSAP derlemesi; `layoutLevel`; `logicalAt`; efekt senkronu; `Val`/trace; `fly`'ın slot hedefleme
  mantığı; formül TeX + slot; QA altyapısı; `split/clone` (bunlar olay fiili ve iyiler).
- **Değiştir:** görünürlük varsayılanları, `setText/setValue`, `_fly` yolu ve konma, `recolor` (anında → tween),
  `along` (doğrusal → easing ve eğri), `DUR` skalası, `addPause` sonrası anlatım, ham koordinat yasağı, vurgu halkası.
- **Dönüştür:** `neuralNet/plot/table` → tarif. Varsayılanları "tasarımlı" olsun: rol rengi, |w| kalınlığı, katman
  katman inşa.

---

## 4. Önceliklendirilmiş değişiklik listesi

Sıralama "algılanan hareket kalitesine etki / maliyet" ölçütüne göre yapıldı.

### P0: hemen (en büyük etki)

1. **Giriş/çıkış varsayılanları** (`core.js` `_setVis`, `stage.js` `_create`):
   - Giriş: opaklık 0→1 + ölçek 0,85→1 (`back.out(1.6)`) + 8 px aşağıdan, 0,45 s.
   - Çizgi, path ve oklar her zaman çizilerek gelsin (0,6–0,8 s, `power2.inOut`).
   - Çıkış: 0,25 s `power2.in`, hafif küçülme (→0,92).
   - Aynı yerde biri girip biri çıkıyorsa giriş, çıkışın %80'i bitince başlasın (vt-dev 558, tur-4a #10).
   - Seçim (`Sel`) üzerinde varsayılan stagger 0,05–0,06 s, en fazla 0,4 s toplam.
2. **Sayan değerler:** `setValue` sayısal `Val` alınca sayı tween'lesin (0,6 s `power2.out`, `fmt` ile her karede). Bunu
   hem `value` hem `net-value` hem tablo hücreleri için yap. Uçuşla gelen değer de hedefte sayarak otursun.
   String metinler sönme ve belirme yerine **kayarak** değişsin (çıkan yukarı, gelen aşağıdan, 0,3 s).
3. **Uçuşu yeniden yaz** (`stage.js:391-425`, `formula.js:224-237`):
   - Yol: kuadratik yay, tepe = `min(120, 0,25·|dx|+30)`. Süre: 0,7–0,9 s, `power2.inOut`.
   - Kaynak uçuş boyunca %40'a sönsün.
   - Kalkışta küçük bir anticipation (1→1,08→1, 0,12 s).
   - Konuşta squash ve overshoot (`back.out(3)`, 0,3 s). Slot dolarken vt-dev'deki `land` hareketi oynasın.
   - Kaynağı olmayan değer, onu üreten nesneden doğsun (formül sonucu → formül slotu; düğüm → düğüm), "70 px yukarıdan"
     değil. Kaynak yoksa build uyarısı versin.
4. **Kaskad zamanlama:** `s.together` dışında GSAP konum parametresi gibi bir `at` seçeneği eklensin
   (`{ at: '<+0.15' }`, `{ at: '-=0.2' }`). `s.cascade(items, 0.12)` yardımcısı da olsun. Varsayılan sıralı akışta bir
   sonraki eylem, öncekinin son %25'iyle çakışabilsin (`overlap: 0.25`). Hem "hepsi aynı anda" hem "kuru sıra" ortadan kalkar.
5. **Anlatım senkronu:**
   - `‹sonuç›` geç belirme işaretini geri getir. İşaretli kısım durağın hareketi bitince 0,35 s'de belirsin
     (vt-dev 156/609 portu).
   - Uzun durak için `s.say()` vuruşlara bölünebilsin: `s.cue('…')` metnin sonraki parçasını o vuruş anında açar.
   - Lint: ≤ 2 cümle, ≤ 35 kelime. Uyarı: "sonuç değeri ‹› dışında ve durakta onu üreten bir hareket var".
6. **Skill'e "hareket grameri"** (SKILL.md'ye ~25 satır ve `references/motion-grammar.md`). dataviz tarzında, sıralı ve kontrol edilebilir:
   1. Her durakta **tek bir orkestre an** olsun (artifact-design). Ana hareket bir tane; diğerleri onu takip etsin.
   2. **Dönüştür, değiştirme:** aynı nicelik aynı nesnedir. Taşı, büyüt, birleştir, ayır. Söndürüp başka yerde yakma.
   3. **Her sayı bir yerden gelir:** kaynak parlar → uçar → konar → sonuç doğar → yerleşir.
   4. **Sahne inşa edilir:** nesne, adı söylendiği vuruşta doğar. `scene()` ile her şeyi görünür kurma.
   5. **Kesme yok:** iki görsel gerekiyorsa kamera kaydır ya da birini küçültüp kenara taşı. `hide()` + `show()` ile sahne değiştirme.
   6. Ritim: hazırlık (0,2–0,3 s) → ana hareket (0,6–1,2 s) → oturma ve sonuç (0,3–0,5 s) → nefes (0,4 s).
   7. **Anti-pattern listesi:** sadece söndür/yak durak; aynı anda 3'ten fazla hareket; metin üstüne metin; sonucun
      nedenden önce görünmesi; düz çizgide giden "fırlatılmış" nesne; ekranda kalan boş kutu.
7. **Yeni örnek ders:** `example-lesson.js` yerine bir **dönüşüm dersi** gelsin. vt-dev "Ortalama" demosunun yeni API'ye
   portu uygun olur: çubuklar ortalamaya iner, toplam kutusu doğar, sayılar uçar ve sayar, yol haritası kalıp kartına
   evrilir. Örnekte en az 4 farklı dönüşüm fiili ve bir kamera hareketi olsun. Ajanın örneği kopyalayacağı kabul
   edilmeli. Örnek, görmek istediğimiz hareketi göstermeli.

### P1: kısa vade

8. **Ham koordinat ve serbest geometri:** `{ x, y }` dünya birimiyle yerleşime izin verilsin (`stage.js:144` yasağı
   kalksın; bölgeler kolaylık olarak kalsın). Genel bir `obj.to({ attr, ... }, o)` fiili gelsin: herhangi bir SVG
   özelliğini (r, width, d, stroke-width) tween'lesin, path'lerde vt-dev'deki gibi aynı yapıdaki morph yapılsın.
9. **Bileşenleri tarife çevir:**
   - `neuralNet` kaynağı `references/components/` altında kopyalanabilir olsun.
   - Varsayılanlar: rol rengi, `edgeWidth ∝ |w|`, negatif kesikli çizgi, `build: 'layer'` (katman katman, çizilerek
     giriş, 0,06 s stagger).
   - Değer düğümü hesaplanınca sayarak dolsun. Odak, kare halka yerine düğüm içi dolgu ile ışıma olsun.
   - Skill şunu söylesin: "Bileşen bir başlangıç noktası; konunun görsel kodlaması (kalınlık, boyut, renk) neyi
     gerektiriyorsa değiştir."
10. **Hareket tokenları** (`PLAN.md:278` revize; arayüz değerleri sadece kabukta kalsın):

    | Token | Süre | Easing |
    |---|---|---|
    | vurgu/odak | 0,25 s | `power2.out` |
    | giriş (pop) | 0,45 s | `back.out(1.6)` |
    | çizilme | 0,7 s | `power2.inOut` |
    | yolculuk | 0,8–1,2 s | `power2.inOut` / `sine.inOut` |
    | içine girme | 0,5 s | `power2.in` |
    | oturma (settle) | 0,25 s | `power2.out`, %3–6 geri sallanma |
    | kamera | 1,4 s | `power2.inOut` |
    | sayaç | 0,6 s | `power2.out` |

11. **`along` ve `recolor` düzeltmeleri:** `along` toplam süreye tek bir easing uygulasın (yol uzunluğuyla
    parametrelenmiş). Yay ya da Bézier yardımcısı gelsin: `arc(from, to, lift)`. `recolor` renk tween'i olsun (0,4 s).
12. **Kamera kullanımı:** `camera.focus` için kılavuz kuralları yazılsın. Bir ayrıntıya yakınlaşmak ya da iki görsel
    arasında kaymak `hide/show` kesmesinin yerine geçsin. Aşama değişiminde kadraj yumuşakça kaysın (tur-4a #3 aynı şeyi istiyor).
13. **Storyboard / vuruş planı:** Plan adımında her durak için tek satırlık tablo zorunlu olsun:
    `durak | ana hareket (fiil + nesne) | doğan sonuç | anlatım ‹›`. Build, durakta hiç dönüşüm fiili yoksa uyarsın
    (aşağıdaki QA maddesine bkz.).

### P2: ikincil hareket ve cila

14. **İkincil hareket kalıpları** (opt-in, motor tarafında hazır):
    - Kalkış öncesi anticipation.
    - Duruşta follow-through (filmdeki minibüs: 0,25 s'de 6 px geri).
    - Sonuç doğarken ripple halkası (film 500).
    - Etkin kenarlarda akış (`flow`, sadece o vuruş boyunca).
    - Aktif hesaplamada hafif "çalışıyor" titreşimi.

    Kural: süs için değil, **neden-sonuç** için kullanılsın. Ortam döngüsü en fazla bir tane olsun, düşük kontrastta.
15. **Durak ritmi:** "Normal" detayda bir durak 2–6 s hareket içersin. Tek bir `dim/highlight` içeren durakları build
    birleştirmeyi önersin. Otomatik oynatma modu kelime sayısına göre beklesin (vt-dev 906).
16. **Görsel dil:** Odak, saturasyon ve opaklık düşürme ile yapılsın (vt-dev 111, tur-4a #15). Rol rengi varsayılan
    olarak açık olsun. Sahne etiketleri ≥ 14 px, değerler 16–18 px, ana sonuç 28–36 px (filmdeki 34/17 oranı referans).
17. **Ses (isteğe bağlı, varsayılan kapalı):** Uçuş konuşu, sonuç doğuşu ve aşama geçişi için 3–4 prosedürel ses
    (`make-audio.mjs` yaklaşımı, WebAudio ile anlık sentez). Zaman çizelgesine olay olarak bağlansın.
    `prefers-reduced-motion` ve ses tercihine uysun.

### P3: ölçüm (hareket kalitesini QA'ya bağlamak)

18. **QA hareket metrikleri** (dataviz'in "hesaplanabilir olanı hesapla" ilkesi):
    - Her durak için tween'leri sınıflandır: sadece opaklık / dönüşüm (transform, geometri, sayı).
    - Durakların %X'inden fazlasında dönüşüm yoksa **uyar** ("slayt gösterisi riski").
    - Kaynaksız uçuş, aynı bölgede eşzamanlı sönme ve belirme (metin üstüne metin), nedenden önce görünen sonuç
      (`after`-benzeri bağımlılık) ve durağın hareket süresi < 0,8 s için de uyarı ver.
    - Kontakt sayfaları **1× hızda, hareket bitene kadar** çekilsin. tur-4a #19'daki "0,5×, 24 kare sınırı ana olayı
      kaçırıyor" hatası tekrarlanmasın.
19. **Görsel regresyon playground'u:** Her giriş, uçuş ve morph stili için tek sahnelik demo; kullanıcı onayı ile
    "referans his" kaydedilsin. vt-dev demosu ve film karelerinin yanına konulsun.

---

### Ek: dosya referansları

| Dosya | Ne için |
|---|---|
| `C:\Users\deizer\Desktop\vt-dev\index.html` | = `visual-teacher\assets\lab-template.html` (motor 277-1143, demo 1146-1278) |
| `…\b8c9f038-…\motion-source\film\index.html` | ses 76-101, zaman çizelgesi 476-563; `tools\make-audio.mjs` |
| `C:\Users\deizer\Desktop\visual-teacher\SKILL.md` | §7-§9 |
| `C:\Users\deizer\Desktop\visual-teacher\references\engine-api.md` | §3 |
| `C:\Users\deizer\Desktop\vt-runs\tur-4a\review\review.md`, `tur-4b\review\review.md`, `tur-3a\…`, `tur-3b\…` | hakem incelemeleri |
| `C:\Users\deizer\Desktop\vt-runs\tur-5b\index.html` | 1262-1321 |
| `engine\src\core.js` | |
| `engine\src\stage.js` | |
| `engine\src\layout.js` | |
| `engine\src\formula.js` | |
| `engine\src\effects.js` | |
| `engine\src\player.js` | |
| `engine\src\components.js` | 205-294 |
| `playground\run-01\lesson.js` | |
| `playground\run-01\qa-sheets\sheet-1.png` | |
| `playground\run-01\qa-shots\stop-11-h21-toplam.png` | |
| `skill\SKILL.md` | |
| `skill\references\engine-guide.md` | |
| `skill\references\example-lesson.js` | |
| `docs\PLAN.md` | :57, :64, :244-248, :278, :355 |
