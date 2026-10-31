# S0: Eski motorların kod incelemesi

**Karar:** Eski motorlar evriltilmeyecek. Yeni bir çekirdek yazılacak, aşağıdaki parçalar taşınacak. (PLAN §8'deki geçici karar bu incelemeyle kesinleşti.)

**Önemli bulgu:** İki motor aslında tek çekirdek. Codex denemesi (B), Claude denemesinin (A) motorundan yaklaşık 25 satırı değiştirilmiş bir çatal. Üzerine daha sıkı QA ve belgeler eklenmiş.

Satır numaraları A'nın `Desktop\visual-teacher\assets\lab-template.html` dosyasına göredir.

## 1. Çekirdek model (A ≈ B)

- **Adımlar:** `TOPIC.solve(input, settings, env)` düz bir adım dizisi döndürüyor: `{stage, say, scene, focus, formula, beats, show, expand}`. Sayılar bunun içinde hesaplanıyor. Ayrı bir model ya da hesap kaydı yok.
- **Sahne:** Her adım sahnenin tamamını bildiriyor. `Scene.apply` (549–572) bunları kimliğe göre eşliyor (React'teki gibi):
  - yeni kimlikler belirerek gelir,
  - kaybolan kimlikler solarak gider,
  - kalan kimlikler yeni değerlerine kayar.
  Yani nesneler bir kez oluşturulmuyor; adımlar ilerledikçe yaratılıp yok ediliyor.
- **Koreografi (beats):** Serbest yazılmış async fonksiyonlar. Yalnız ileri giderken canlı çalışıyor.
- **Geri ve atla:** Hedef adımın bildirilen sahnesine doğrudan tween'le geçiyor. Ters oynatma yok; koreografi atlanıyor.
- **Hız:** Tek bir global `Anim.speed` değeri. Tween oluşturulurken süreye bölünüyor, bu yüzden çalışan tween'lerin hızı değişmiyor.
- **Detay seviyesi:** `computeVisible` (753–766) adımları `show` alanına göre süzüyor.
- **Animasyon:** Özel bir rAF tween listesi (`Anim`, 340–370). WAAPI yok.
- **Kamera:** viewBox tween'i (`cameraTo` 573–578). `fitFor` (802–820) gerçek kutuyu ölçüp yinelemeli olarak sığdırıyor.
- **Yazı boyutu:** `_font` (406), `fs·min(1,√(1/upp))·upp` formülüyle en az 11 px. Bu, planımızdaki "damped" davranışın karşılığı.

## 2. Taşınacak parçalar

| Parça | Yer |
|---|---|
| Tasarım sistemi: açık/koyu tokenlar, 6 rol rengi (grafik/yazı/yumuşak varyantlar), boşluk/köşe/tip ölçekleri | 17–61 |
| Kaydırmasız 100dvh kabuk CSS'i, üst çubuk, aşama şeridi, dock HTML'i | 66–272 |
| Reduced-motion desteği | (CSS içinde) |
| `fmt`, `parseNum` (Türkçe ondalık virgülü), tohumlu `rng` | 320–330 |
| `resolveColor` (tema değişiminde CSS değişkenlerinin RGBA'ya çevrilmesi) | 373–386 |
| Formül çubuğu: yuvalar, negatif sayıların parantezlenmesi, `fit` | 623–682 |
| Sayı uçuşu geometrisi: eğri yol, kaynağın solması, yuvanın dolması | 685–711 |
| Kart otomatik boyutlama `_bg`, `measuredBox` + `fitFor`, `Narr.measure` | 461–468 vd. |
| Mini anlatım işaretlemesi `md` (`[[term]]`, `{{…}}`) | 606–615 |
| Terim balonu `Bubble` | 737–749 |
| Alıştırma modu: ipucu, teşhis, puan | 1009–1042 |
| Lint kuralları (A 1045–1080 + B 1063–1108): kelime/cümle bütçesi, tanımlanmadan kullanılan terim, formüle elle yazılmış sayı, odak hedefinin sahnede olmaması, tanımsız CSS token'ı | — |
| **QA altyapısı (`qa.mjs`)** | — |
| B'nin `domain-checks.md` içeriği ve "hesap olayı sözleşmesi" `{id, operation, sources, result, before, after}` | — |

**QA altyapısının ayrıntısı:**
- Ham CDP kullanıyor (Node 22'nin yerleşik WebSocket'i), headless Edge/Chrome. npm paketi yok.
- **`probeJs` kontrolleri:**
  - etiket–etiket çakışması
  - etiketi kesen çizgi
  - şekil kenarına binen etiket
  - kutu kenarına çok yakın yazı
  - 11 px'ten küçük yazı
  - sahne dışına taşma
  - formül altında kalma
  - animasyon ortasında takılı kalmış düğüm
  - yatay taşma ve sayfa yüksekliği
- **Etkileşim ve DOM testleri:**
  - gerçek fare, dokunma ve klavye testleri
  - tween'siz DOM değişikliklerini sayan MutationObserver
  - kare dizisi kaydı ve kontak sayfaları
- **B'nin ekledikleri:** sha256, sonlu olmayan sayı (NaN/Infinity) sondası, başlık kimliği kontrolü.

## 3. Neden evrilemezler

- **Zaman bir değer değil.** Koreografi `await`, `setTimeout` ve DOM oluşturma içeren emirli async kod. Kaydırılabilir bir zaman çizelgesine derlenemez.
- **Geri gitmek tersine oynatmak değil.** Hedef adımın bildirilen hali yeniden çiziliyor.
- **Durum adım başına sahne bildirimlerinde yaşıyor.** Olay günlüğü yok. Etiketler, soy ve varlık bilgisi örtük.
- **Efektler ayrı katmanlarda değil.** `tx/ty/rot/sc` tek bir transform'da birleşiyor. Kanal belirteçleri animasyonları birleştirmiyor, iptal ediyor.
- **Sayı uçuşları ekran koordinatlı HTML.** Kamera hareketlerini takip etmiyor.

**Hedefle uyuşan yanlar:** viewBox kamerası, "damped" yazı boyutu ve kabuk.

## 4. Akılda tutulacak hatalar

- **Ders alıştırmaya sızabiliyor:** `setMode` token'ı artırmıyor. Hâlâ çalışan ders koreografisi alıştırma sahnesinin üstüne yazabiliyor.
- **A'da olası kalıcı kilitlenme:** İptal edilen `Formula.ready` promise'i hiç çözülmüyor. Bunu bekleyen `fly` sonsuza kadar bekliyor. (Koddan çıkarım, yeniden üretilmedi.)
- **Yanıltıcı sayılar:** Sayıların sayarak artması, öğrencinin gerçek sanabileceği ara değerler gösteriyor. B bu yüzden kaldırdı. **Bizim `setValue` için ders:** sayarak geçiş varsayılan olmamalı.
- **Hız ve otomatik oynatma:** Hız değişimi çalışan tween'leri etkilemiyor. Otomatik oynatma zamanlayıcısı temizlenmiyor.
- **Ölü kontrol:** `n.tag` hiç atanmıyor (562).
- **Yanlış önbellek anahtarı:** `measuredBox` anahtarı metni içermiyor; aynı konumda farklı metinli kartlar bir kez ölçülüyor.
- **Layout thrashing:** `refreshFonts` her kamera karesinde bütün kartlar için `getBBox` çağırıyor.
- **Deterministik olmayan QA zamanlaması:** Kareler gerçek zamanlı alınıyor (~50–150 ms arayla). Bizim zaman çizelgemiz kesin zamanlara konumlanabileceği için bu sorun ortadan kalkar.
- **Yapıya bağlı çakışma kontrolleri:** Inline `style.opacity` ile `nodes`/`edges` katmanlarına dayanıyorlar. İç içe `<g>` yapısı için yeniden yazılmaları gerekecek.
