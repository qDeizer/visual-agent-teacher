# Visual Agent Teacher: mimari plan (v0.1 taslak, ilk incelemeden sonra güncellendi)

> **v0.1:** Bağımsız bir ajanın incelemesi değerlendirildi. Kabul edilen, kısmen kabul edilen ve reddedilen noktalar gerekçeleriyle §12'de. İlgili bölümler yerinde güncellendi.

> **Durum:** Bu bir plan. Henüz kod yazılmadı ve hiçbir karar prototiple doğrulanmadı. Güven düzeyleri tahmindir.
> Belge, bağımsız bir incelemeci ajanın itiraz edebilmesi için her kararı gerekçesiyle veriyor.
>
> **Okuma sırası:** önce `ISTEKLER.md` (gereksinimler), sonra bu belge. `MIMARI.md` ve `ARASTIRMA.md` bu plandan önce
> yazılmış sohbet notları. `MIMARI.md` ile çelişen yerlerde bu plan daha güncel öneri; çelişkiler §3'te tek tek listeli.
> `MIMARI.md` inceleme sonrasında güncellenecek.
>
> **Güven ölçeği:** **Yüksek** = kararın doğru kalacağını ≥%75 düşünüyorum · **Orta** = %45–75 · **Düşük** = <%45, spike ile doğrulanmalı.

---

## 1. Hedef ve başarı ölçütü

**Hedef:** Ajan, kullanıcıdan bir konu (ve isteğe bağlı somut bir soru) alır ve sıfır bilgili bir öğrencinin içinde dolaşabileceği
bir öğrenme laboratuvarı üretir. Lab, gerçekten çalışan bir modele dayanır, adım adım ilerler ve etkileşimlidir.

**v1 "bitti" ölçütü:**
1. Sabit bir **kıyas konu seti** var (§8). Sonnet medium üretici bu setteki konularda motor koduna dokunmadan ders üretir. Dersler QA'dan temiz geçer ve inceleme rubriğinin bütün zorunlu maddelerini karşılar.
2. Kullanıcı en az birkaç konuda "öğrendim / işime yaradı" onayı verir.
3. Aynı konu iki ayrı yalıtılmış üreticide üretildiğinde görsel dil ve kontroller tutarlı çıkar.
4. **Zorunlu:** Her dersin matematiği ya da mantığı bağımsız doğrulamadan geçer (§4.2). Kendi içinde tutarlı olmak yetmez.
5. Kıyas setinin dışında kalan ve döngüde hiç kullanılmamış yeni konularda da (§7, "görülmemiş konular") aynı ölçütler tutar.

**Neden ölçülebilir ölçüt:** Önceki iki denemede ölçüt "tasarımcı puanı"ydı ve puan 4–6/10'da takıldı. Turlar arasında ilerleme olup olmadığı görülemedi.

---

## 2. Varsayımlar ve kullanıcıya açık sorular

| # | Varsayım | Neden | Yanlış çıkarsa etkisi |
|---|---|---|---|
| V1 | Çıktı tek dosyalık, internetsiz çalışan bir HTML | Taşınabilir ve paylaşılabilir; önceki denemeler de böyle yaptı | Düşük (yalnızca build adımı değişir) |
| V2 | Masaüstü öncelikli (≥1280×720); mobil v1 kapsamı dışında. **Kullanıcı onayladı:** kısa vadede yalnız web, mobil çok ileride. | Codex denemesi de aynı sonuca vardı; mobil, yerleşim işini ikiye katlıyor | — |
| V3 | Ders metni kullanıcının dilinde; skill, API ve ajan belgeleri İngilizce | LLM'ler İngilizce tanımlayıcılarla daha iyi kod yazıyor; kullanıcı daha önce skill'in İngilizce olmasını istedi | — |
| V4 | Ajan Node.js çalıştırabiliyor (Claude Code, Codex) | Build ve QA için gerekli | Yüksek: build yapılamayan ortamlar için ayrı bir yol gerekir |
| V5 | Sistemde Chromium tabanlı bir tarayıcı var (Edge/Chrome) | QA ek kurulum gerektirmeden çalışsın diye | Orta |
| V6 | Sesli anlatım v1 kapsamı dışında | Kullanıcı bu fikirden vazgeçti | — |

**Kullanıcıya sorular:**
- (a) Mobil gerekli mi?
- (b) Repo lisansı ne olacak?
- (c) Hedef kitle yalnız kullanıcı mı, başkaları da kullanacak mı? (Cila ve belge seviyesini belirler.)
- (d) Tur başına kullanım bütçesi ne?

---

## 3. Sohbette verilen kararların yeniden değerlendirmesi

Sohbet ilerlerken söylenen her şeyin doğru kalması gerekmiyor. Aynı şekilde, sırf sorgulandı diye değiştirilmesi de gerekmiyor. Her birini tek tek değerlendirdim:

| Sohbetteki karar | Sonuç | Gerekçe |
|---|---|---|
| Hazır motor ve fiil kütüphanesi | **Koru**, kalınlığı açık bırak | İki deneme ve dış araştırma aynı yönü gösteriyor. AI ham animasyon kodunu güvenilir yazamıyor. Ama özel bir API modelin eğitim verisinde yok, bu da yanlış kullanım riski getiriyor. İnce ve GSAP'a yakın bir API ile başlanmalı, gerekiyorsa A/B testiyle kalınlaştırılmalı (S5). |
| "İlk tercih WAAPI" | **Geri al** | Konumlama (seek), geri sarma, genel hız ayarı ve iç içe zaman çizelgesi ihtiyaçları GSAP'ı gerektiriyor. WAAPI'de grup zaman çizelgesi yok. |
| GSAP | **Koru** | Lisans kontrol edilmeli ve motor GSAP'ı bir adaptör arkasında tutmalı (§4.9). |
| Türkçe API adları (`sec`, `bol`, `tasi`, `soldur`) | **Değiştir** | İngilizce tanımlayıcılar kullanılmalı: modeller bunlara daha aşina, ayrıca ASCII belirsizliği var (`bol` hem "böl" hem "bol" olabilir). Yalnız ders metinleri kullanıcının dilinde kalır. |
| `await nesne.tasi()` (async fiiller) | **Değiştir** | Fiiller senkron olmalı ve zaman çizelgesine eklemeli (§4.3). async/await konumlamayı, geri sarmayı ve atlamayı zorlaştırıyor. |
| "Her adımın sonunda durum kaydı, Geri bu kayıttan" | **Değiştir** | Durum, zaman çizelgesindeki konumdan türetilmeli. Anlık görüntüler yalnız test için alınır. |
| "AI hiç koordinat vermez" | **Daralt** | Piksel koordinatı yasak. Bölgeler, göreli yerleşim ve alan koordinatları serbest (§4.5). Genel diyagram yerleşimi çözülmüş bir problem değil. |
| Alana özel bileşenler (`sinirAgi` vb.) önce | **Değiştir** | Önce genel primitifler yazılmalı. Alana özel bileşenler bunların ince sarmalayıcısı olmalı ve "üç kuralı"yla eklenmeli (§4.6). |
| Kalıcı nesne, seçim dili, etiket mirası, kopyalayarak bölünme | **Koru** | Doğru bulmaya devam ediyorum. |
| Efekt kanalları (iç içe gruplar) | **Koru** | Parlama efektine bir performans notu eklendi (§4.4). |
| 4 serbestlik seviyesi | **Koru, sıkılaştır** | Seviye 2'deki ham tween'ler zaman çizelgesine eklenmeli. Seviye 4 için bir adaptör sözleşmesi tanımlanmalı (§4.8). |
| Başlangıçta tek skill | **Koru** | — |
| "İlk ayrılacak dosya `formulas.md`" | **Zayıflat** | Formül işinin çoğu motorda bir bileşen; kuralları kısa. |
| Tek dosya HTML | **Koru ve ekle** | Yeni: ajan yalnız `lesson.js` yazar, build adımı birleştirir (§4.1). |
| QA'nın 7 maddesi | **Koru, genişlet** | Kaydırma sorunu artık yapı gereği oluşmuyor. Değişmez testleri ve kontak sayfaları eklendi (§5). |
| "Her yoldan aynı sonuç" testi | **Koru** | Derleme modelinin temel değişmezi bu. |
| Codex'in sabit ders sırası | **Koru (skill düzeyinde)** | Motora gömülmemeli; alanın gereğine göre değişebilmeli. |
| Codex'in hesap kaydı | **Yükselt** | Çekirdek ilke haline gelmeli: model ile görünümün ayrılması (§4.2). |

---

## 4. Önerilen mimari

### 4.0 Genel görünüm

```
lesson.js            ← AJANIN YAZDIĞI TEK DOSYA (İngilizce API, ders metinleri kullanıcı dilinde)
  meta · glossary · inputs · model(inputs) → trace · scene(stage, trace) · script(lesson, refs, trace)
        │
        ▼  scripts/build.mjs  (şema + determinizm lint'i → motor + ders → tek HTML)
lab.html
  ┌───────────────────────────── çalışma zamanı motoru (vat) ─────────────────────────────┐
  │ Zaman çizelgesi derleyici : adım ağacı → detay seviyesi başına ana GSAP çizelgesi    │
  │ Oynatıcı                  : ileri/geri, hız, detay, kaydırma çubuğu, klavye          │
  │ Nesne çekirdeği           : kalıcı nesneler, seçim, etiket/soy, efekt kanalları      │
  │ Yerleşim                  : bölgeler, göreli yerleşim, bileşen içi yerleşim,         │
  │                             kuvvet/ağaç, etiket yerleştirici, yasak bölgeler         │
  │ Bileşenler                : graph, grid, table, plot, sequence, codeView, ...        │
  │ Öğretim kabuğu            : anlatıcı, formül çubuğu, terim balonu, yol haritası,     │
  │                             ezber kartı, alıştırma                                   │
  │ Tasarım sistemi           : renk rolleri, tipografi, boşluk, hareket tokenları       │
  │ Geliştirici tanıları      : çalışma anı uyarıları, snapshot API'si                   │
  └──────────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼  scripts/qa.mjs  (sistem tarayıcısı, CDP, npm bağımlılığı yok)
rapor + anahtar kareler + kontak sayfaları
```

### 4.1 Ajan yalnız ders dosyasını yazar (Güven: Yüksek)

Önceki denemelerde ajan yaklaşık 100 KB'lık bir şablonla çalışıyordu: şablonu okuyor, kopyalıyor, içindeki boşluğu dolduruyordu. Bunun üç bedeli vardı: bağlam israfı, dikkatin dağılması ve motoru yanlışlıkla bozma riski.

Yeni düzende ajan yalnızca `lesson.js` yazar. Motoru ve CSS'i görmez. `build.mjs` hepsini birleştirip tek bir HTML dosyası üretir.

```js
export default defineLesson({
  meta:     { title: 'MLP ileri yayılım', lang: 'tr' },
  glossary: { weight: { term: 'ağırlık', symbol: 'w', short: '…' }, /* … */ },
  inputs:   { x1: { default: 0.5, range: [-1, 1], step: 0.1 }, /* … */ },  // alıştırma ve sandbox için alan
  model(inputs) { /* saf, deterministik */ return trace },
  scene(stage, trace) { /* bileşenler, nesneler */ return refs },
  script(lesson, refs, trace) { /* adım ağacı + anlatım + koreografi */ },
})
```

**Neden JSON değil, JS:** Büyüme döngüleri ve hesaplanan değerler için ifade gücü gerekiyor, ve LLM'ler JS'yi çok iyi yazıyor. Kontrol edilebilirliği şema doğrulaması ve lint sağlar.

### 4.2 Model ile görünümün ayrılması (Güven: Yüksek)

Kavramın nasıl çalıştığı saf bir fonksiyonda hesaplanır: `model(inputs) → trace`. Bu kaydın içeriği konuya göre değişir:
- **Sayısal konularda:** işlem kayıtları (kaynaklar → işlem → sonuç).
- **Sayısal olmayan konularda:** olay ya da durum dizisi (TCP durumları, mitoz evreleri, istek akışı).

Ekrandaki her sayı ve durum bu kayıttan gelir; elle yazılmaz.

**Kazanımlar:**
- **Sayıların yolculuğu:** "Bu sayı nereden geldi" görselleştirmesi, kayıttaki kaynak bağlantısından kendiliğinden çıkar.
- **Alıştırma ve sandbox:** Aynı ders, yeni girdilerle yeniden derlenerek elde edilir.
- **Doğruluk test edilebilir:** Model bilinen örnek değerlerle ve bağımsız bir kontrolle sınanır. QA, ekrandaki sayıların kayıtla eşleştiğini kontrol eder.
- **"Gerçekten çalışan simülasyon" isteğinin teknik karşılığı budur.**

**Bedeli:** Ajanın yazım yükü artar.

**Sınır: tutarlılık doğruluk demek değildir.** Model yanlış hesaplarsa ekran, anlatım ve formül aynı yanlış sonuçta kusursuzca birleşir. Model/kayıt ayrımı tutarlılığı sağlar, doğruluğu ayrıca doğrulamak gerekir. Her ders için zorunlu doğrulamalar:
- **Dış kaynaklı bilinen değer:** Ders kitabı ya da ders notundaki çözülmüş bir örnek modelle yeniden hesaplanır ve aynı sonuç çıkmalıdır.
- **Değişmezler:** Konunun kuralları kontrol edilir. Örnek: olasılıkların toplamı 1, enerjinin korunumu, matris boyutlarının uyumu, durum makinesinde geçersiz geçiş olmaması.
- **Mümkünse ikinci hesap:** Aynı sonuç farklı bir yöntemle de bulunur (analitik ve sayısal, ya da iki farklı formül).
- **Döngüde:** Director bağımsız kontrolü kendisi de yapar.

Kalan risk şu: modeli ve kontrolünü aynı ajan yazarsa aynı yanlış anlamayı iki yere birden taşıyabilir. Dış kaynaklı değer bu yüzden zorunlu (R12).

**Kanıt:** Codex denemesinin en güçlü fikri buydu. Claude denemesindeki sayı ve anlatım tutarsızlıklarının önemli bir kısmı bu ayrımın yokluğundan kaynaklanıyor.

**Sayısal hassasiyet:** Sınır durumları için (tam sıfır, 0.1 + 0.2 gibi kayan nokta hataları) `vat.num` yardımcıları gerekir: ölçekli tamsayı ya da küçük bir decimal kütüphanesi. Gösterim için yapılan yuvarlama hesaba asla geri beslenmez.

### 4.3 Çekirdek karar: ders bir GSAP zaman çizelgesine derlenir (Güven: Orta-Yüksek, ~%70)

**Karar (A):**
- `script` senkron çalışır. Her fiil çağrısı adımın zaman çizelgesine bir tween ekler. Varsayılan olarak tween'ler sırayla oynar; eşzamanlı oynatma için `s.parallel()` ya da GSAP'ın konum parametresi kullanılır.
- Ders yüklenirken bütün adım ağacı tek bir ana zaman çizelgesine derlenir ve her durağa bir etiket verilir.
- Ders boyunca var olacak bütün nesneler derleme sırasında oluşturulur (gerekirse gizli). Bölünmeden doğacak kopyalar da buna dahil. Böylece her değişiklik geri sarılabilir bir tween olur.

**Bu tek kararın getirdikleri:**

| İhtiyaç | Nasıl karşılanıyor |
|---|---|
| Hız | `timeScale` |
| Duraklat / devam | GSAP'ın kendi özelliği |
| İleri | Oynayan adım varsa sonuna atla (`progress(1)`), yoksa sonrakini oynat |
| Geri | Önceki etikete geri oynat (ters animasyon) ya da atla. Görsel durum çizelgeden, mantıksal durum olay günlüğünden türetilir (aşağıda). |
| Kaydırma çubuğu | Ek iş gerektirmeden gelir |
| Detay seviyesi | Aynı adım ağacı farklı katlamayla ayrı çizelgelere derlenir; etiketler sayesinde seviye değişince aynı yerde kalınır |
| Alıştırma / sandbox | Yeni girdi → model → yeniden derle → aynı etikete konumlan |
| "Her yoldan aynı sonuç" | Yapı gereği büyük ölçüde sağlanıyor. Test yine kalır: `onComplete` yan etkileri, `from` tween'leri ve fonksiyon tabanlı değerler bunu bozabilir. |

**Sürekli efektler:** Titreme, nefes alma ve parlama nabzı sonsuz döngü olduğu için ana çizelgeye giremez. Derleyici her efektin hangi zaman aralığında açık olduğunu kaydeder. Bir efekt yöneticisi, oynatma konumuna göre hangi efektlerin açık olması gerektiğini hesaplar ve onları ayrı bir kanalda oynatır. Bu hesap hem ileri hem geri yönde çalışır.

**Mantıksal durum (v0.1'de eklendi):** Bir nesnenin konumu ya da rengi görsel durumdur. Ama hangi etiketleri taşıdığı, hangi kuşaktan geldiği, var olup olmadığı, hangi grupta bulunduğu ve hangi efektlerinin açık olduğu **mantıksal durumdur**. Geri gidildiğinde ya da bir yere atlandığında ikisi birlikte doğru noktaya dönmelidir. Bunun için:
- Derleyici her mantıksal değişikliği zaman damgasıyla bir **olay günlüğüne** yazar. Belirli bir andaki mantıksal durum, o ana kadarki olayların sırayla uygulanmasıyla bulunur. Sürekli efekt aralıkları da bu günlüğün bir parçasıdır.
- Hesaplamayı hızlandırmak için derleme sırasında her durakta mantıksal durumun bir anlık görüntüsü alınır. Bunlar, çalışma anında elle tutulan bir "durum kaydı" değil, derlemenin bir ürünüdür.
- **Kural:** Tween geri çağrılarında (`onComplete`, `call`) mantıksal durum değiştirilmez. GSAP'ın `seek` fonksiyonu varsayılan olarak aradaki geri çağrıları çalıştırmaz (`suppressEvents = true`), bu yüzden geri çağrılara bağlı bir durum atlamalarda kaybolur. Arayüz panelleri de geri çağrılarla değil, oynatma konumundan türetilerek güncellenir.
- **Test:** İzleyerek varılan bir durakta mantıksal durum, atlanarak varılandakiyle aynı olmalı. Yalnız ekranın aynı görünmesi yetmez (§5).

v0'daki "durum kaydına gerek yok" ifadesi fazla kesindi. Görsel taraf için geçerli, mantıksal taraf için değil.

**Değerlendirilen alternatifler:**
- **(B) Önceki şablonların yolu:** Her adım için bitiş durumu bildirilir, oraya varış async `beats` koreografisiyle yapılır; geri/atla bitiş durumunu kısa bir tween'le uygular. Daha kolay başlar. Ama durum iki kez yazılır (bildirim + koreografi) ve ikisi birbirinden ayrışabilir. Önceki turlarda görülen "sıfırlamadan sonra eski formül kalıyor" ve "sonuç erken görünüyor" hataları tam bu sınıftan. async yapı ayrıca konumlamayı ve geri sarmayı çok zorlaştırıyor.
- **(C) Sanal durum deposu + DOM uzlaştırma (React benzeri):** En esnek ama en pahalı yol.

**Gerekçe:** Motion Canvas ve Manim'de aynı türden deterministik bir zaman modeli çalışıyor.

**Riskler:**
- Ajanın senkron, ardışık modeli doğru kullanması.
- Derleme sırasında ölçüm yapılması gerekmesi (yazı genişliği vb.); fontların yüklenmesi beklenmeli.
- **Pencere yeniden boyutlanınca piksel hedefler bozulur.** Çözüm: sahne sabit bir viewBox kullanır; yeniden boyutlanmada (gecikmeli olarak) yeniden derlenir ve aynı konuma gidilir.

**Spike S1** ile doğrulanacak.

**Determinizm kuralları:**
- Ders kodunda `Math.random`, `Date`, `setTimeout` ve `fetch` yasak (lint ile kontrol).
- Rastgelelik gerekiyorsa tohumlu `vat.random` kullanılır.
- QA dersi iki kez derleyip anlık görüntüleri karşılaştırır.

### 4.4 Nesne modeli

| Karar | Güven |
|---|---|
| **Kalıcı nesne:** Bir kez oluşturulur. Kimliği, etiketleri, soyu ve kuşağı vardır. | Yüksek |
| **Özel şekil:** Ajan kendi SVG'sini tanımlayabilir. `class` verdiği parçalara `obj.part('nucleus')` ile erişir. | Yüksek |
| **Efekt kanalları:** İç içe gruplar: konum › ölçek › sarsıntı › görünüm (opacity/filter) › şekil. Aynı kanalda son gelen kazanır (GSAP `overwrite`). Mantıksal çelişkiler (örn. solmuş nesneye parlat) için açık bir kural tablosu tutulur. | Yüksek |
| **Bölünme:** Morph yerine kopyalama ve ayrışma. Asıl nesne birinci yavru olarak yaşar, etiketler yavrulara miras kalır. | Yüksek |
| **Seçim dili:** `stage.select('cell')`, `.tagged('cancer')`, `.except(x)`, `.generation(3)`, `.descendantsOf(x)`, `.where(fn)`, `.first()`, `.sample(n)`. Fiil seçimin tamamına uygulanır, `{ stagger }` ile sırayla. D3/jQuery kalıbında. | Yüksek |
| **Performans:** Animasyonlu SVG filtreleri pahalı. Parlama, önceden bulanıklaştırılmış bir kopyanın opaklığı değiştirilerek yapılır. Yalnız transform ve opacity canlandırılır. | Orta |

"Nesne yeniden yaratılmaz" ilkesi kullanıcının gördüğü ve ajanın yazdığı düzeyde geçerli. Derleyici iç yapıda sahneyi baştan kurabilir (örneğin alıştırmada yeni girdilerle), ama kullanıcı bunu fark etmez.

### 4.5 Yerleşim: piksel yok, ama koordinat da tamamen yasak değil (Güven: Orta, en riskli teknik alan)

Revizyon: "AI hiç koordinat vermez" gerçekçi bir hedef değil. Genel diyagram yerleşimi hâlâ açık bir araştırma problemi (Penrose, Bluefish). Doğru ayrım şu: **ekran pikseli yasak; alan koordinatları ve bölgeler serbest.**

Yerleşim katmanları:
1. **Sahne bölgeleri:** Adlandırılmış ızgara bölgeleri (`main`, `left`, `right`, `inset-tr` …). Bileşenler bunlara yerleştirilir.
2. **Göreli yerleşim:** `place(a).rightOf(b, 'md')`, `alignWith`, `between`.
3. **Bileşen içi yerleşim:** Katmanlı graf, ızgara, tablo ve ağaç kendilerini yerleştirir.
4. **Alan koordinatları:** Grafik içinde `plot.point({ x: 2.3, y: 1.1 })`. Bunlar anlamlı, matematiksel değerler; serbest.
5. **Kuvvet tabanlı yerleşim:** Koloni büyümesi ve organik ağlar için d3-force'un çarpışma kuvveti kullanılır. Böylece üst üste binme baştan oluşmaz.
6. **Etiket yerleştirici:** Birkaç aday konum denenir ve çarpışma kontrol edilir. Yer yoksa etiket bir çizgiyle dışarı alınır.
7. **Yasak bölgeler:** Anlatıcı, formül çubuğu ve kontroller.

**Spike S3** ile doğrulanacak.

### 4.6 Bileşenler: önce genel primitifler (Güven: Orta-Yüksek)

v1 için önerilen genel set:

| Primitif | Kapsadığı örnekler |
|---|---|
| `graph` (düğüm–kenar; katmanlı, ağaç ya da kuvvet yerleşimi) | Sinir ağı, karar ağacı, ağ topolojisi, mimari diyagram |
| `grid` (hücre matrisi + kayan pencere) | CNN, matris çarpımı, görüntü |
| `table` | Veri setleri, karışıklık matrisi |
| `plot` (eksen, nokta, eğri, bölge, ısı haritası) | kNN, regresyon, gradyan inişi, fonksiyonlar |
| `numberLine` / `bars` | Olasılık, metrikler |
| `sequence` (aktörler arası mesajlar, zaman ekseni) | TCP el sıkışma, protokoller |
| `stateMachine` | Durum geçişleri |
| `codeView` (satır vurgusu, değişken izleme, çağrı yığını) | Algoritmalar |
| `container` (iç içe kutular) | Hücre organelleri, katmanlı mimari, OSI |

**Ajana sunulan arayüz yüksek seviyeli olmalı (v0.1'de netleşti).** İç yapının genel olması ile ajanın kullandığı arayüzün yüksek seviyeli olması birbirine engel değil. Ajan her sinir ağı dersinde katmanları, ağırlık etiketlerini ve sinyal akışını genel `graph` parçalarından yeniden kuruyorsa yükü azaltılmamış demektir. Bu yüzden iki tür bileşen var:
- **Yakın vadede kesin gereken alanlar:** Kullanıcının vize konuları ve kıyas seti. Bunlar için yüksek seviyeli bileşenler (`neuralNet`, `knnPlot`, `confusionMatrix`, `lossCurve` gibi) baştan yapılır. Önceki iki denemede bu ihtiyaçlar zaten tekrar tekrar ortaya çıktı; kanıt mevcut.
- **Bilinmeyen alanlar:** Ajan genel primitiflerle başlar. Aynı ihtiyacın tekrarlaması, yüksek seviyeli bir bileşen eklemek için **sinyaldir**, kesin bir yasa değil. Bir ihtiyaç tek seferde bile çok pahalıysa eklenebilir.

Kapsam şişmesi riski (R4) burada gerçek. Yüksek seviyeli bileşen ancak kanıt ya da yakın vadeli kullanım varsa eklenir.

**v1'de hepsi yapılmaz:** Faz 1'de 4–5 tanesi yapılır (§8).

### 4.7 Öğretim kabuğu ve tasarım sistemi

- **Uygulama kabuğu (Yüksek):** Tam ekran ve sayfa kaydırması yok; paneller kendi içinde kayar. Böylece "Devam'a basınca sayfanın başına atma" sorunu yapı gereği oluşamaz.
- **Ekran bileşenleri:** Sahne (ölçeklenen SVG), anlatıcı paneli, formül çubuğu, yol haritası şeridi, terim balonları, ezber kartları, kontroller (ileri/geri, hız, detay, kaydırma çubuğu, klavye kısayolları) ve alıştırma paneli.
- **Adım ağacı (Orta-Yüksek):** Bölüm → adım → mikro adım. Bu tek yapı üç işi birden görür:
  - **Detay seviyesi:** Mikro adımlar üst adımın içine katlanır.
  - **Yol haritası:** Ağacın üst seviyesi sürecin örüntüsünü (pipeline) gösterir.
  - **Gezinme.**
  Ajan en ince seviyeyi yazar, ama kaba seviyeler yalnız katlamayla türetilmez (v0.1). Detay seviyesi değişince anlatımın dili de değişir: on mikro adımlık bir çarpma ile tek adımlık özet farklı cümleler ister. Bu yüzden:
  - Herhangi bir seviyede durak olabilen her düğümün o seviye için kendi kısa anlatımı vardır. Üst düğümün anlatımı bir özettir, alt adımların birleşimi değildir. QA bunu kontrol eder.
  - İsteğe bağlı olarak üst düğüm kendi özet animasyonunu tanımlayabilir (`s.summary(…)`). Tanımlamazsa alt adımların animasyonu sıkıştırılarak oynatılır.
  - Amaç, detay ayarının öğrenme derinliğini değiştirmesi. Yalnız tıklama sayısını değiştirmesi yetmez.
- **Anlatım:** `s.say('Her [[input]] kendi [[weight]] ile çarpılır: {{p1}}')`. `[[…]]` sözlükten terim balonu, `{{…}}` kayıttan sayı getirir.
- **Sorgulama ile kurcalama ayrıdır (v0.1'de düzeltildi).** v0'da bu iki şeyi karıştırmıştım:
  - **Sorgulama yasak:** Ders durup öğrenciden tahmin ya da cevap istemez. İlerlemek hiçbir zaman öğrencinin bir şey girmesine bağlı olmaz. Kullanıcının şikâyet ettiği şey buydu ("Tahminin kayıtlı…").
  - **Kurcalama serbest ve teşvik edilir:** Ders sırasında ağırlığı değiştirmek, noktayı sürüklemek ya da bir hücreyi seçmek isteğe bağlı olarak her an mümkündür. "Devam" her zaman çalışır. Kurcalama yeni girdilerle yeniden derleme yapar, konum korunur, anlatımdaki sayılar kayıttan güncellenir. Bir "örnek değerlere dön" düğmesi bulunur.
  - Cevap alanları yalnız alıştırma bölümündedir.
- **Formül:** Yapılandırılmış formülün her parçası adreslenebilir: sayı uçuşu, vurgulama, "kelimelerle" görünümü ve sembol–terim bağlantısı. Uygulama seçenekleri §4.9'da.
- **Ezber:** `lesson.memorize({…})` çağrıları dersin sonunda bir özet/ezber kartında toplanır (sınav kullanımı için).
- **Alıştırma:**
  - Modelin geçerli alanından tohumlu yeni girdiler üretilir. Dejenere durumlar ya dışarıda bırakılır ya da bilinçli olarak seçilir.
  - Öğrenci ara değerleri kendisi girer; cevaplar kayda karşı toleransla kontrol edilir.
  - "Çözümü göster" dersi bu yeni girdilerle yeniden oynatır.
- **Tasarım sistemi:**
  - **Renk:** Kavram = renk (en fazla ~5 anlam rengi ve nötrler, renk körlüğüne uygun).
  - **Ölçüler:** Tipografi ölçeği ve boşluk sistemi.
  - **Hareket tokenları:** Open Design `animate` skill'inden alınır. Arayüz tepkileri 140–220 ms. `ease-in` kullanılmaz. Yalnız transform ve opacity canlandırılır.
  - **Tema:** Açık/koyu tema tokenlarla yapılır, kontrast testleri ikisinde de çalışır.
  - **Önce elle cila:** Bu kısım döngüden **önce** insan gözüyle cilalanır (bkz. §7, H1).

### 4.8 Serbestlik seviyeleri (Güven: ilke Yüksek, seviye 4 sözleşmesi Orta)

1. **Fiiller:** Varsayılan çalışma şekli.
2. **Ham GSAP:** Tween `s.add(tween)` ile adım çizelgesine eklenir. Hız, geri ve atla bu tween'lerde de çalışır.
3. **Dış öğeyi sahiplenme:** `stage.adopt(el, { tags })`. Örneğin D3 ile çizilen bir öğe fiillere ve seçim diline katılır.
4. **İzole panel:** `stage.panel(adapter)` ile Canvas, Three.js ya da tamamen özel kod. Adaptör `mount`, `render(stepId | t)` ve `destroy` fonksiyonlarını sağlar. `render` sağlanmazsa o bölümde geri/atla kapanır ve QA bunu raporlar.

**Genişleme:** `vat.defineVerb`, `vat.defineComponent`, `vat.defineEffect`. Döngüde işe yarayan tanımlar kütüphaneye alınır.

### 4.9 Teknoloji seçimleri

| Konu | Seçim | Alternatif | Güven | Not |
|---|---|---|---|---|
| Hareket | **GSAP**, dosyaya gömülü | anime.js v4 (MIT), WAAPI | Yüksek | Zaman çizelgesi, seek, reverse, timeScale, MotionPath ve Flip hazır; LLM'ler GSAP'ı iyi biliyor. **Lisans:** Ücretsiz ama OSI onaylı değil. Webflow'un görsel oluşturucu araçlarıyla rekabet eden ürünlere kısıt getiriyor. Eğitim lab'ı üreten bir araç bu kapsama girmiyor gibi görünüyor, ama lisans metni okunmalı. Motor GSAP'ı bir adaptör arkasında tutar. |
| Çizim | **SVG** | Canvas (yalnız ağır simülasyonlar, panel olarak) | Yüksek | SVG öğeleri DOM'da adreslenebilir ve `getBBox` ile test edilebilir |
| Ölçek ve yerleşim yardımcıları | **d3 alt modülleri** (scale, shape, hierarchy, force), dahili | Kendi yazdıklarımız | Orta-Yüksek | ISC lisanslı. Ajan seviye 3'te D3'ü doğrudan da kullanabilir; LLM'ler D3'ü çok iyi biliyor. |
| Formül | **Temml → yerel MathML** (`\class` / `\id` ile adreslenebilir) | KaTeX (`\htmlClass`; fontları ağır), kendi formül ağacımız | Düşük-Orta | Spike S2. Boyut ve render kalitesi ölçülecek. |
| Motor kaynağı | TS/JS modüller, esbuild ile tek IIFE dosyası | — | Yüksek | Ajana API referansı olarak `engine-api.d.ts` verilir; kesin ve kısa |
| Font | Sistem fontları | Gömülü web fontu | Orta | İnternetsiz çalışma ve dosya boyutu |
| QA tarayıcısı | Sistemdeki Edge/Chrome, CDP üzerinden, npm bağımlılığı yok | Playwright | Orta | Önceki `qa.mjs` dosyaları bu yolu kullanıyor |

**Dosya boyutu:** Tahmini 300–500 KB tek HTML. İsteğe bağlı modüller (tam d3, Canvas yardımcıları) yalnız ders onları kullanıyorsa build tarafından eklenir.

### 4.10 Depo ve skill yerleşimi

```
engine/       motor kaynakları + birim testleri
playground/   sabit deneme sahneleri (her fiil/efekt ikilisi, her bileşen) → görsel regresyon
skill/        dağıtılan skill (~/.claude/skills/ altına kopyalanır)
  SKILL.md
  references/  engine-api.md, engine-api.d.ts, pedagogy.md, (gerekirse) formulas.md
  assets/      engine.js (derlenmiş), shell.html
  scripts/     build.mjs, qa.mjs
benchmarks/   kıyas konu brifleri + beklenen değerler
docs/
runs/         (git dışında) döngü çıktıları. Yalıtılmış üretici görmesin diye depo dışında tutulur.
```

---

### 4.11 Bu bir framework (v0.2)

Kontrol motorda: ajan `defineLesson({ model, scene, script })` yazar; bunların ne zaman ve kaç kez çağrılacağına (açılışta derleme, geri, alıştırmada yeniden derleme) motor karar verir. Oynatma, kabuk ve testler de motorda. Bu bilinçli bir seçim: önceki denemelerdeki hataların çoğu akışı ajanın yönetmesinden çıkıyordu.

`script` içindeki fiiller ve bileşenler ise kütüphane gibi davranır: ajan bunları istediği sırada ve sayıda çağırır, kaçış kapıları da buradan açılır. Kısa tanım: **ajanlar için küçük bir öğretim framework'ü.** Oyun motoruna benzer: motor döngüyü yönetir, geliştirici sahneyi ve kuralları yazar.

### 4.12 Kamera (v0.2)

- **Objeler büyütülüp küçültülmez.** Her şey sabit dünya koordinatlarında yaşar. Kamera, dünyanın neresine ve ne kadar yakından baktığımızı belirleyen ayrı bir nesnedir (tek bir dünya grubunun dönüşümü ya da `viewBox`). "Obje büyüdü" bir olaydır; "ona yaklaştık" bir bakış açısıdır. Öğretimde bu ayrım korunur.
- **Kamera hareketleri zaman çizelgesine derlenir.** Geri, atla, hız ve kaydırma çubuğu kamerada da çalışır.
- **Fiiller:** `camera.focus(obj)`, `camera.frame(selection)`, `camera.follow(obj)`, `camera.reset()`. Ajan zoom oranı hesaplamaz.
- **Kameradan etkilenmeyenler:** Anlatıcı, formül çubuğu ve kontroller ayrı bir üst katmanda durur.
- **Boyut davranışları:**

  | Davranış | Yakınlaşınca | Varsayılan olduğu yer |
  |---|---|---|
  | `world` | Tamamen büyür | Şekiller, eğriler |
  | `screen` | Ekranda hep aynı boyutta kalır | Küçük etiketler, değer kutucukları |
  | `damped` | Yakınlaşmanın bir kısmı kadar büyür | Yazılar, başlıklar, sonuçlar |

  Yazılar ekranda bir alt ve üst sınırın dışına çıkamaz. Çizgiler kalınlaşmaz (`vector-effect: non-scaling-stroke`).
- **Anlamsal zoom:** Her etiket hangi yakınlıktan itibaren görüneceğini taşır. Uzaktan bakınca katmanlar, yakından bakınca ağırlıklar görünür. Böylece uzaklaşınca etiketler çakışmaz.
- **Büyüteç:** Ekran içinde ekran. Genel görünüm korunurken bir köşede yakın plan gösterilir.
- **Öğrenci kamerası (kurcalama):** Fare tekerleğiyle yakınlaşma ve "kameraya dön" düğmesi.
- **Konfor:** Kamera hızı ve hareket sıklığı motor tarafından sınırlanır.
- **Test:** Çakışma testi kameranın o anki haliyle yapılır. "Her yoldan aynı sonuç" testi kamera konumunu da kapsar.

### 4.13 Ajanın hazır kodu uyarlaması (v0.2)

Hafiften ağıra dört yol:
1. **Ayar:** `neuralNet({ showWeights: 'on-focus' })`.
2. **Parça değiştirme:** Örneğin `renderNode: (node, g) => …` ile yalnız düğüm çizimini değiştirmek.
3. **Üzerine kurma:** `vat.extendComponent('neuralNet', 'dropoutNet', …)` ile sarıp yeni fiil eklemek.
4. **Kopyalayıp değiştirme:** Bileşen kaynakları skill'de `references/components/` altında durur. Ajan birini ders dosyasına kopyalayıp değiştirebilir; asıl bileşen etkilenmez. shadcn/ui'ın "al, kopyala, değiştir" modeline benzer.

**Dokunulmaz çekirdek:** Derleyici, oynatıcı, mantıksal durum günlüğü, kamera/katman sistemi ve arayüz kabuğu. Geri tuşu, değişmezler ve testler bunlara dayanır. Çekirdeğin kaynağı ajana verilmez, yalnız API tanımı verilir. Çekirdeği çalışma anında değiştirmeye kalkan kod (`vat.core.… = …` gibi) build lint'inde hata verir.

**Tasarım şartı:** Bütün yerleşik bileşenler, ajanın da kullandığı **aynı açık API ile** yazılır. Gizli kısayol kullanılmaz. Böylece kopyalanan her bileşen çalışır ve açık API'nin ilk kullanıcısı biz oluruz.

**Döngüdeki karşılığı:** İşe yarayan uyarlamaları director fark eder, test eder ve kütüphaneye alır.

## 5. Hata önleme ve test

**Yapı gereği büyük ölçüde azaltılanlar.** Tamamen önlendikleri iddia edilmiyor; v0'da bu tablo fazla iddialıydı. Örneğin ham tween'ler `s.add` dışında kalırsa yine öksüz kalabilir; efekt kanalları özellik çakışmasını önler ama anlam çakışmasını önlemez.

| Önlem | Neyi önlüyor |
|---|---|
| Uygulama kabuğu | Sayfa kaydırma sıçraması |
| Zaman çizelgesi derleme | Öksüz ve yarım kalan animasyonlar; tutarsız geri/atla |
| Efekt kanalları | Efektlerin birbirini bozması |
| Yerleşim, etiket yerleştirici, yasak bölgeler | Çakışmaların çoğu |
| Model ve kayıt | Sayıların birbiriyle ve anlatımla tutarsız olması (doğruluk ayrıca doğrulanır, §4.2) |

**Çalışma anı uyarıları (geliştirici modu):**
- Çakışma ve taşma
- Bilinmeyen fiil ("`bol` diye bir fiil yok, `split` mi demek istediniz?")
- Aynı kanalda çelişen efektler
- Tanımsız terim ya da hiç kullanılmayan sözlük kaydı

**QA (tarayıcı arka planda):**
- **Statik kontroller:** Şema, determinizm lint'i ve sözlük kapsamı. Her formül sembolü ve her `[[terim]]` tanımlı olmalı ve ilk kullanımdan önce tanıtılmış olmalı. Dışarıya istek atılmamalı. İlerlemeyi engelleyen zorunlu bir girdi olmamalı. Durak olabilen her düğümün kendi seviyesinde anlatımı olmalı. Doğrulama kontrolleri (§4.2) mevcut olmalı ve geçmeli.
- **Durak başına anlık görüntü (JSON):** Kutular, metin, opaklık ve etiketler kaydedilir. Bunun üzerinden çakışma, taşma, kontrast, en küçük font boyutu ve NaN kontrolleri yapılır.
- **Değişmezler:**
  - Bir adıma izleyerek varmak ile doğrudan atlamak aynı ekranı **ve aynı mantıksal durumu** vermeli: etiketler, soy, kuşak, grup üyelikleri ve açık efektler aynı olmalı.
  - Aynı ders iki kez derlendiğinde aynı sonuç çıkmalı.
  - Rastgele ileri-geri gezinme hata üretmemeli.
  - Hız ve detay ayarlarının uç değerleri denenmeli.
  - Alıştırmaya rastgele girdiler verilmeli (fuzz); hata çıkmamalı ve sayılar kayıtla tutarlı olmalı.
- **Geçiş örnekleme:** Ardışık kareler arasında ani sıçrama olup olmadığı kontrol edilir.
- **İnceleme çıktıları:** Durak başına bir anahtar kare, sorunlu olarak işaretlenen kareler ve her geçiş için 6 kareyi tek görselde toplayan bir kontak sayfası. Amaç, inceleme ajanının yüzlerce görüntü yerine az sayıda görsele bakması. Önceki turlarda tek bir incelemede 275 ekran görüntüsü alınmıştı.

**Otomatik test edilmeyenler:** Güzellik, anlaşılırlık ve pedagojik kalite. Bunları rubrikli inceleme ve kullanıcı değerlendirir.

---

## 6. Skill içeriği ve ajan iş akışı

**SKILL.md kısa tutulur** (bütçe yaklaşık 250 satır; önceki denemede 28 KB'a çıkmıştı). Bir hata motorda, bileşende ya da QA'da çözülebiliyorsa skill'e kural olarak yazılmaz.

**Ajanın iş akışı:**
1. **Konuyu anla.** Belirsizlik varsa tek bir soru sorar, yoksa sormadan devam eder.
2. **Ders planı (henüz kod yok):**
   - Ne ve neden
   - Önce tanıtılacak terimler
   - Süreç aşamaları (yol haritası)
   - Çalışılmış örneğin girdileri
   - Alıştırma tasarımı
   - Kullanılacak bileşenler
3. **Model:** `model` yazılır ve bilinen değerlerle kendi kendine kontrol edilir.
4. **Sahne ve senaryo:** `scene` ve `script` yazılır.
5. **Build ve QA:** `build` → `qa` → düzelt döngüsü, QA temiz çıkana kadar.
6. **Teslim:** HTML dosyasının yolu verilir.

**Pedagojik omurga (`references/pedagogy.md`):** Mayer'in çoklu ortam ilkeleri kullanıcı isteklerinin neredeyse birebir karşılığı:

| İlke | Kullanıcı isteğindeki karşılığı |
|---|---|
| Segmentleme | Kullanıcının kendi hızında ilerlediği mikro adımlar |
| Ön eğitim | Süreçten önce terimlerin tanıtılması |
| İşaretleme | Vurgulama, kavram = renk |
| Mekânsal ve zamansal yakınlık | Etiket nesnenin yanında; anlatım animasyonla eşzamanlı |
| Tutarlılık | Süs ve gereksiz dekor yok |

Bunlara ek olarak "çalışılmış örnek → tamamlama alıştırması" düzeni.

**Varsayılan ders yayı** (Codex denemesinden): Soru → Ne → Neden → Parçalar → Süreç → Sonuç → Kalıp → Alıştırma. Bu yay motora gömülmez, skill'de öneri olarak durur; alanın gereğine göre değişebilir.

---

## 7. Geliştirme süreci

**Önceki iki döngünün neden yakınsamadığına dair hipotezler:**
- **H1:** Görsel kalitenin tavanını motor ve bileşenler belirliyordu. Skill'e kural eklemek bu tavanı yükseltmedi.
- **H2:** Kurallar birikti (SKILL.md 28 KB). Üretici boğuldu ve yeni hatalar ortaya çıktı.
- **H3:** Her turda farklı bir konu denendiği için sinyal gürültülüydü; puanlar birbiriyle karşılaştırılamadı.
- **H4:** Puanlama belirsizdi (1–10).
- **H5:** Kullanım limitleri doldu (çok sayıda ekran görüntüsü, uzun incelemeler).

**Bu hipotezlere göre süreç:**
- **Döngünün başlangıcı:** Döngü, motor ve bileşenler playground'da insan incelemesinden geçtikten **sonra** başlar.
- **Sabit kıyas seti:** Alanları karışık yaklaşık 8 konu. Ağırlık kullanıcının vize konularında (örneğin %60), geri kalanı genelliği sınamak için:
  - MLP, kNN, gradyan inişi, karışıklık matrisi
  - TCP el sıkışma, mitoz, eğik atış, yığın/özyineleme ya da bir mimari diyagram
- **Görülmemiş konular (v0.1'de eklendi):** Her turda kıyas setinin dışından, daha önce hiç denenmemiş bir konu eklenir. Bu konular skill'i ayarlamak için kullanılmaz, yalnız genelliği ölçmek içindir (eğitim/test ayrımı). Aynı sekiz konuda iyileşmek "her konuya uygulanabilir" iddiasını tek başına doğrulamaz.
- **Rubrik:** Her boyut için geçti/kaldı ve kanıt. Boyutlar: yerleşim, tipografi, hareket, renk, anlatım, terimler, matematik, pedagojik ilkeler, etkileşim. Open Design'ın `review-animations` ve `impeccable-design-polish` listelerinden beslenir.
- **Bulgunun sahibi:** Her bulgu bir yere atanır: konu, skill kuralı, motor, bileşen ya da QA. Düzeltme önceliği: **motor > bileşen > QA > kural**.
- **Yalıtım:**
  - Üretici temiz bir çalışma klasöründe (git worktree) çalışır ve yalnız skill ile konu brifini görür. Eski çıktılar depo dışında tutulur.
  - **Dürüst not:** Bu yalıtım talimata dayanıyor. Ajan mutlak yolla eski dosyalara erişebilir; teknik olarak tam zorlanamaz.
- **Sürüm dondurma:** Skill sürümleri hash ile kaydedilir. QA raporu, test edilen HTML dosyasının hash'ini de yazar.
- **Bütçe:** Tur başına bir üst sınır konur. İnceleme ajanına ekran görüntüsü yığını yerine kontak sayfaları verilir.
- **Roller:** Director (ana ajan), üretici (Sonnet medium), tasarım incelemecisi (görsel) ve kullanıcı.

---

## 8. Fazlar ve çıkış kriterleri

**Faz 0: Spike'lar (belirsizliği azaltmak için)**

| Spike | Ne denenecek | Çıkış kriteri |
|---|---|---|
| S0 *(v0.1)* | Eski iki motorun kod düzeyinde incelemesi. Çekirdekleri derleme modeline, mantıksal durum günlüğüne ve kalıcı nesnelere evrilebilir mi; hangi parçaları doğrudan alınabilir? | "Evril" ya da "yeni çekirdek" kararı gerekçeli olarak verilir |
| S1 | Zaman çizelgesi derleme: kalıcı nesne, bölünme, efekt kanalları, seek/reverse/hız, detay katlama | 5 rastgele senaryoda izleyerek varmak = atlayarak varmak |
| S2 | Formül: Temml/MathML ile KaTeX karşılaştırması (parça adresleme, sayı uçuşu, görünüm, boyut) | Seçim gerekçeli olarak yapılır |
| S3 | Yerleşim: bölgeler, katmanlı graf, d3-force ile koloni, etiket yerleştirici | Çakışmasız ve okunur sahneler |
| S4 | QA iskeleti: CDP, anlık görüntü, çakışma kontrolü, kontak sayfası | Bir deneme sahnesinde rapor üretilir |
| S5a *(v0.1: öne alındı)* | **API kağıt testi:** Henüz motor yazılmadan yalnız `engine-api.d.ts` ve örnekler hazırlanır. Sonnet medium'a bunlarla 2 ders yazdırılır. Ölçülenler: uydurulan ya da yanlış kullanılan API sayısı, ifade edilemeyen ihtiyaçlar, okunabilirlik | Çok ucuz bir test. API tasarımı, motor kodu yazılmadan önce düzeltilir |
| S5b *(v0.1: öne alındı, S1'den hemen sonra)* | **Mini A/B:** S1 prototipi + ince DSL ile ham GSAP + aynı kabuk ve rehberin karşılaştırması. 1–2 konu, Sonnet medium. Ölçülenler: hata, rubrik, token | DSL kalınlığına karar verilir. **Dikkat:** Erken bir DSL kaba ve belgesi az olur, GSAP'ı ise model zaten biliyor; test DSL'in aleyhine yanlı. DSL ancak açıkça kötü çıkarsa yön değiştirilir |

**Faz 1:** Motor çekirdeği, tasarım sistemi, 4–5 genel bileşen ve playground. Çıkış: playground rubrikten geçer, kullanıcı görsel dili onaylar, QA değişmezleri yeşil.

**Faz 2:** Skill, build, QA kuralları ve `engine-api.d.ts`. Çıkış: Sonnet medium, 2 kıyas konusunda motoru değiştirmeye gerek kalmadan temiz bir ders üretir.

**Kilometre taşı: dış model testi (kullanıcı talebi).** Kullanıcı sistemi kendisi, Claude dışı bir modelle test edecek: Claude Code CLI ya da Claude Desktop'ı 3P modunda DeepSeek Flash v4.1 gibi bir modelle çalıştıracak. Bu noktaya gelindiğinde kullanıcıya **açıkça haber verilecek**. Hazır sayılmanın koşulları:
- Skill klasörü kurulabiliyor.
- Ajan yalnız skill'i okuyarak bir konuda `lesson.js` yazabiliyor.
- `build` ve `qa` tek komutla çalışıyor, hata mesajları ajanın düzeltebileceği kadar açık.
- Ders tarayıcıda açılıp oynatılabiliyor.

Yani Faz 2'nin çıkışı.

**Faz 3:** Kıyas seti üzerinde director döngüsü. Çıkış: §1'deki ölçütler.

**Faz 4:** "Üç kuralı"yla bileşen genişlemesi ve alana özel referanslar.

**Önceki şablonlarla ilişki (v0.1: geçici karar, S0 + S1 sonrasında kesinleşir).** Önceki bulgular "tekrarlanan işleri ortaklaştırmak gerekli" sonucunu güçlü biçimde destekliyor. "Yeni ve genel bir motor yazmak en iyi yol" sonucu ise hâlâ bir hipotez. Şu anki eğilimim (Güven: Orta, ~%60) yeni bir çekirdek yazmak ve önceki denemelerden şu parçaları taşımak:
- Tasarım tokenları ve görsel parçalar
- QA teknikleri (CDP, kare örnekleme, çakışma tespiti)
- Codex'in olay sözleşmesi ve alan kontrolleri
- Kıyas konuları ve inceleme brifleri

Taşınmayacaklar: async `beats` yapısı, adım başına tam sahne bildirimi ve piksel koordinatları.

**Karşı argüman:** Claude şablonu 5 turda pişti ve çalışan görselleri var. Sıfırdan yazmak bu birikimi kaybettirebilir.

**Sınırlama:** Önceki şablonların kodunu satır satır incelemedim. Bu değerlendirme onların `engine-api.md` belgelerine ve araştırma özetlerine dayanıyor.

---

## 9. Riskler

| # | Risk | Olasılık | Azaltma |
|---|---|---|---|
| R1 | Ajan, eğitim verisinde olmayan API'yi yanlış kullanır | Başta Yüksek | Küçük API; İngilizce, GSAP/D3'e benzer adlandırma; `d.ts`; örnekler; "şunu mu demek istediniz" hataları; build lint'i |
| R2 | Görsel kalite yine vasat kalır | Orta | Bileşenleri döngüden önce elle cilalamak; hareket ve tasarım kurallarını tasarım sistemine gömmek |
| R3 | Bileşenlerin kapsamadığı alanlar çıkar | İlk ML dışı konularda Yüksek | Kaçış kapısı + üç kuralı |
| R4 | Kapsam şişer, motor bitmeyen bir framework'e dönüşür | Yüksek | Faz kapıları, sabit v1 fiil listesi, kapsam dışı listesi |
| R5 | Etkileşim yeniden derleme gerektirir (sürükleme, pencere boyutu) ve bu yavaş kalır | Orta | Kısma (throttle); bir kontrol noktasından derleme; gerekirse bileşen düzeyinde reaktif güncelleme API'si |
| R6 | Matematik ya da sınır durumu hataları | Orta | Model ve kayıt, bağımsız kontrol, fuzz testi, kesin sayı yardımcıları |
| R7 | Kullanım limitleri döngüyü durdurur | Yüksek (iki denemede de oldu) | Tur bütçesi, kontak sayfaları, kısa turlar |
| R8 | GSAP lisansı ya da ileride değişmesi | Düşük | Adaptör katmanı |
| R9 | Kurallar yeniden birikir | Yüksek | Satır bütçesi; kuralları koda ve QA'ya taşımak |
| R10 | Determinizm bozulur | Orta | Lint + çift derleme testi |
| R11 | Formül render kalitesi (MathML'in tarayıcılar arası farkı) | Orta | KaTeX'i yedek tutmak |
| R12 | Model doğru görünür ama yanlıştır (aynı ajanın yazdığı model ve kontrol aynı yanlış anlamayı paylaşır) | Orta | Dış kaynaklı bilinen değer zorunlu; director bağımsız kontrolü; değişmezler |
| R13 | Kurcalama sırasında yeniden derleme anlatımın akışını bozar (girdi değişir, anlatım başka bir senaryoya kayar) | Orta | Konumun korunması, "örnek değerlere dön" düğmesi, girdi alanının sınırlanması |

---

## 10. v1 kapsamı dışında kalanlar

- Mobil
- Sesli anlatım
- 3B
- Şekil morph'u
- Genel fizik motoru
- Sunucu ve bulut
- Kullanıcı hesabı ve ilerleme senkronu

İleride düşünülebilir: localStorage ile basit ilerleme kaydı.

---

## 11. İncelemeci ajan için açık sorular

1. **Derleme modeli:** Zaman çizelgesine derleme (A) mı, bitiş durumu + koreografi (B) mi? A'nın ajanın yazım rahatlığına maliyeti ne olur?
2. **DSL kalınlığı:** İnce (GSAP'a yakın) mı, kalın (yüksek seviye fiiller) mı? S5'teki A/B testi bu kararı vermek için yeterli bir yöntem mi?
3. **Model/görünüm ayrımı:** Sayısal olmayan alanlarda (biyoloji, sistem mimarisi) zorlama mı kalıyor?
4. **Primitif seti:** §4.6'daki genel set doğru mu? Eksik ya da fazla olan var mı?
5. **Formül:** MathML yolu yeterince olgun mu, yoksa doğrudan KaTeX mi seçilmeli?
6. **Önceki şablonlar:** Biri evrilmeli mi, yoksa yeni çekirdek mi yazılmalı?
7. **Build adımı:** "Tek dosya + build" varsayımı, skill'in kullanılacağı ajan ortamları için doğru mu?
8. **Atlanan şeyler:** Bu planın gözden kaçırdığı bir kullanıcı isteği ya da önceki denemelerden çıkmış bir ders var mı?

---

## 12. İnceleme 1: değerlendirme (v0.1)

Bağımsız bir ajanın belge düzeyindeki incelemesi. Her itiraz, sırf yazıldığı için kabul edilmedi; sırf plan öyle dediği için de reddedilmedi.

| # | İtiraz | Karar | Gerekçe ve değişiklik |
|---|---|---|---|
| 1 | AI'ın yalnız `lesson.js` yazması yerinde | — | Değişiklik yok. |
| 2 | Model/kayıt tutarlılık sağlar, doğruluk değil; "yanlış sayıyı önler" ifadesi fazla güçlü | **Kabul** | Haklı. §5'teki ifade düzeltildi. Bağımsız doğrulama §1'de zorunlu ölçüt oldu ve §4.2'de somutlaştırıldı. R12 eklendi. |
| 3 | Mantıksal durum (etiket, soy, grup) zaman çizelgesine emanet edilemez; `seek` geri çağrıları çalıştırmaz; "durum kaydına gerek yok" fazla kesin | **Kabul (çözüm farklı)** | `seek` ile ilgili tespit doğru. Derleme modeli korunuyor, ama mantıksal durum zaman damgalı bir olay günlüğünden türetiliyor ve geri çağrılarda mantıksal değişiklik yasak (§4.3). Aynı mantıksal duruma dönme testi eklendi (§5). İki ayrı kaynak oluşmuyor: ikisi de aynı derlemenin ürünü. B seçeneğindeki ayrışma sorunu bu yüzden geri gelmiyor. |
| 4a | API'nin faydasını sınayan deney fazla geç | **Kabul** | S5, S5a (API kağıt testi, motor yazılmadan) ve S5b (S1'den hemen sonra mini A/B) olarak ikiye ayrılıp öne alındı. Erken testin DSL aleyhine yanlı olduğu da yazıldı. |
| 4b | İç yapı genel, ajan arayüzü yüksek seviyeli olabilir; "üç kuralı" yasa olmamalı | **Kabul** | Vize ve kıyas alanları için yüksek seviyeli bileşenler baştan yapılır, çünkü kanıt zaten önceki denemelerde var. Bilinmeyen alanlarda tekrar bir sinyal, yasa değil (§4.6). **Not:** İncelemenin kendi ana riski olan kapsam büyümesiyle bu öneri arasında bir gerilim var; bileşen eklemek ancak kanıtla yapılır. |
| 5 | "Kurcalama serbest" isteği ile "derste girdi alanı yasak" QA kuralı çelişiyor | **Kabul (benim hatam)** | Sorgulama ile kurcalamayı karıştırmıştım. Kullanıcının şikâyeti sorgulamaya yönelikti. Kurcalama derste serbest ve isteğe bağlı; ilerleme hiçbir girdiye bağlı değil (§4.7). `ISTEKLER.md` §8/7 de düzeltildi. R13 eklendi. |
| 6 | Detay seviyesi yalnız katlamayla çözülürse anlam kaybolur; üst adımların kendi anlatımı olmalı | **Kabul** | Durak olabilen her düğüm kendi seviyesinde anlatıma sahip; isteğe bağlı özet animasyon var; QA kontrol ediyor (§4.7). |
| 7 | Önceki bulgular sıfırdan motoru kanıtlamıyor; yeniden yazma kararı geçici olmalı | **Kabul** | Karar geçici hale getirildi. S0 (eski motorların kod incelemesi) eklendi; karar S0 ve S1'den sonra kesinleşecek. Güven %65'ten %60'a indi. **Not:** "Evril" yolu da eski motorun çekirdeğini (async koreografi) değiştirmeyi gerektirir. Evrilme büyük ihtimalle görsel parçaları ve bileşenleri koruyup çekirdeği değiştirmek anlamına gelecek, yani iki seçenek düşündüğümüzden yakın olabilir. |
| 8 | Kıyas seti dışında yeni konular da denenmeli | **Kabul** | Her turda bir görülmemiş konu eklendi; ayar için değil ölçüm için (§7). |

**İncelemenin dışında kendi bulduğum bir düzeltme:** §5'teki "yapı gereği önlenenler" tablosu genel olarak fazla iddialıydı. "Büyük ölçüde azaltılanlar" olarak yumuşatıldı.

**Reddedilen itiraz yok.** Yalnız 3, 4b ve 7. maddelerde incelemenin önerdiği yön ile benim uyguladığım çözüm farklı. Bunların gerekçeleri tabloda.
