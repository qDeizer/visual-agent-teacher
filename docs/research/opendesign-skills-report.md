# Open Design skill taraması: Visual Agent Teacher için hareket (motion) ve tipografi bilgisi

Kaynak klasör: `C:\Users\deizer\AppData\Local\Programs\Open Design\resources\open-design\skills\`
Amaç: "slayt gösterisi gibi" duran çıktıyı, nesnelerin girdiği / dönüştüğü / aktığı canlı bir anlatıma çevirmek; tipografiyi ve ağır arayüzü düzeltmek.

Not: Alıntılar kısa ve birebirdir. Çince kaynaklardan yapılan alıntılar Türkçe çevirisiyle verildi, orijinal söz dizimi korunmadı. "(çıkarım)" yazan yerler skill'lerden doğrudan alıntı değil, bizim ürüne uyarlama önerimdir.

---

## 1. Kısa genel bakış

- Toplam klasör: **169**. Hepsinde `SKILL.md` var.
- **85 tanesi katalog stub'ı**: "This catalogue entry advertises the skill in OpenDesign…" cümlesiyle biten, içeriği bir GitHub linkinden ibaret kayıtlar. İçlerinde öğretilecek kural yok.
- **84 tanesi gerçek içerikli**. Bunlardan hareket/tipografi açısından değerli olanlar aşağıda sıralandı.

Gerçek içerikli 84'ün kabaca dağılımı:

| Küme | Skill'ler |
|---|---|
| Hareket / animasyon (en değerli) | `huashu-art-motion` (10 dosya, 430 KB referans), `motion-design`, `ui-animation` (24 dosya), `animate`, `emilkowalski-motion`, `emil-design-eng`, `review-animations`, `motion-lab` (160 vaka), 8 adet `gsap-*` |
| Video kare / şablon (tek dosya HTML) | `frame-*` (7), `video-hyperframes`, `8-bit-orbit-…`, `swiss-user-research-video-template`, `after-hours-…`, `field-notes-…`, `digits-fintech-…`, `editorial-burgundy-…`, `weread-year-in-review-…`, `swiss-creative-mode-template`, `vfx-text-cursor` |
| Medya hattı (video / sprite / AI üretim) | `oil-motion`, `chat-motion-overlay`, `hatch-pet`, `mockup-device-3d`, `web-clone`, `ecommerce-image-workflow`, `imagegen-frontend-*`, `image-to-code-skill` |
| Tasarım yönü / zevk / inceleme | `taste-skill`, `taste-skill-v1`, `gpt-tasteskill`, `soft-skill`, `minimalist-skill`, `brutalist-skill`, `redesign-skill`, `impeccable-design-polish`, `design-brief`, `reference-design-contract`, `brandkit`, `brand-extract`, `frontend-design`, `web-design-guidelines`, `stitch-skill`, `output-skill` |
| Slayt / belge / sosyal kart / rapor şablonları | `deck-*` (3), `ppt-keynote`, `html-ppt-retro-…`, `article-magazine`, `data-report`, `doc-kami-parchment`, `resume-modern`, `faq-page`, `card-*`, `social-*`, `poster-hero`, `release-notes-one-pager`, `research-decision-room`, `login-flow`, `writing-guidelines`, `library-curator` |
| Altyapı / diğer | `agent-browser`, `export-download-debugging`, `pr-feedback-quality-gate`, `od-next-media-inputs`, `pptx-html-fidelity-audit` |

**Katalog stub'ları (85, sadece liste):**
`ad-creative, ai-music-album, algorithmic-art, apple-hig, artifacts-builder, brainstorming, brand-guidelines, canvas-design, color-expert, competitive-ads-extractor, copywriting, creative-director, d3-visualization, design-consultation, design-md, design-review, doc, docx, domain-name-brainstormer, enhance-prompt, fal-3d, fal-generate, fal-image-edit, fal-kling-o3, fal-lip-sync, fal-realtime, fal-restore, fal-train, fal-tryon, fal-upscale, fal-video-edit, fal-vision, figma-code-connect-components, figma-create-design-system-rules, figma-create-new-file, figma-generate-design, figma-generate-library, figma-implement-design, figma-use, flutter-animating-apps, frontend-dev, frontend-skill, frontend-slides, full-page-screenshot, gif-sticker-maker, hand-drawn-diagrams, image-enhancer, imagegen, imagen, marketing-psychology, minimax-docx, minimax-pdf, nanobanana-ppt, paywall-upgrade-cro, pdf, pixelbin-media, plan-design-review, platform-design, pptx-generator, pptx, remotion, replicate, screenshot, screenshots-marketing, shadcn-ui, shader-dev, slack-gif-creator, slides, sora, speech, stitch-loop, swiftui-design, theme-factory, threejs, ui-skills, ui-ux-pro-max, venice-audio-music, venice-audio-speech, venice-image-edit, venice-image-generate, venice-video, video-downloader, web-artifacts-builder, wpds, youtube-clipper`

Bizim için dikkat çeken stub'lar (içlerinde bilgi yok ama "ne var" bilgisi): `d3-visualization` (D3 grafik örnekleri, upstream snow-d3), `hand-drawn-diagrams` (Excalidraw animasyonlu SVG), `algorithmic-art` (p5.js, seed'li rastgelelik), `threejs`, `shader-dev`, `remotion`. Gerekirse upstream repoları ayrıca incelenebilir.

---

## 2. Bizim hedefe en faydalı skill'ler (sıralı)

### 1) `huashu-art-motion` — en değerli kaynak
Yol: `skills\huashu-art-motion\SKILL.md` + `references\{explainer-grammars,craft-workflow,canvas-helpers,index}.md`

Ne öğretiyor: 9 "açıklayıcı animasyon dilbilgisi" (3Blue1Brown, Keynote UI, finans grafiği, Kurzgesagt, Vox, beyaz tahta, kinetic type...), önce çekim tablosu sonra kod iş akışı, saf-fonksiyon zaman kütüphanesi (`MO`) ve kamera kütüphanesi (`CAM`). Bizim konumuza en yakın olanlar: **t1_3b1b** (ML / matematik / algoritma), **t3_finance_chart** (veri), **y1_kurzgesagt** (ölçek / "içinde ne var"), **y3_whiteboard** (akıl yürütme zinciri), **y5_kinetic_type** (başlık / sonuç kartları).

**a) t1 (3b1b) dilbilgisi: "slayt gibi" sorununun doğrudan ilacı.**
- Tek cümle özet: "Siyah zeminde yalnızca *şu an anlatılan tek şeyi* göster; yumuşak biçim değiştirme (Transform) ile bir önceki kavramı doğrudan bir sonrakine çevir; renk = kavramın adı; neredeyse hiç kesme yok."
- Başlangıç kontrolü: "Her sahne için *kim kime dönüşüyor* yazılsın. Dönüşen nesneyi yazamıyorsan bu dilbilgisini kullanma." (kare → daire, bir eğri → başka bir eğri, piksel → nöron)
- "İlk karede nesne olsun": koordinat sistemi / ızgara / eğri önce gelir, başlık ve formül sonra; "0. saniyede önce bir başlık satırı Write etme."
- Ekranda eş zamanlı en fazla **2 madde**: "Üçüncüsü çıkmadan öncekiler ya şekle dönüşsün ya toplansın. Maddeleri tek tek Write edersen bu siyah zeminde bir PPT'dir."
- Renk tablosu önceden yazılır: bir renk yalnızca bir kavramı temsil eder, formüldeki sembol ile ekrandaki nesne aynı renkte, **tüm videoda anlamsal renk ≤ 4**. Örnek: sarı = aktivasyon/sinyal, mavi = pozitif ağırlık, kırmızı = negatif ağırlık.
- "wait sırasında hareketsiz": "Sabit hızlı yavaş zoom, nefes alma, süzülme ekleme; kamera sadece sıradaki nesneye bakmak için hareket eder, sonra durur." Hareket hissi *bir sonraki Transform'dan* gelir.
- Zamanlama değerleri:
  - Varsayılan ease `smooth = 6t⁵−15t⁴+10t³` ("her iki uçta hız ve ivme 0"). `linear` yalnızca Write, sabit hızlı dönme, ShowPassingFlash ilerlemesi için.
  - Varsayılan: bir animasyon `run_time = 1s`, ardından `wait = 1s`. En sık kullanılan süreler 2s > 3s > 1s > 4s. Bir "plan" (kavram) tipik olarak 8–20 s.
  - `LaggedStart`: varsayılan lag_ratio 0.05, pratikte en çok **0.1**; 100 piksel→nöron için 0.01 (toplam 1.1 s), 160 bağlantı için 0.006. Fonksiyon: `MO.lagged(i, n, p, r) = clamp(p*(1+(n-1)*r) - i*r)`.
  - Giriş/çıkış: FadeIn/FadeOut + **shift 24–40 px** ("aşağıdan yukarı" gelir, "yukarı kayarak" çıkar); yeni katman nöronları sağdan 24 px kayarak girer; değiştirilen şey küçülüp "⋮" noktasına katılır.
  - Sinyal akışı: ShowPassingFlash, bağlantının kopyasını sarıya boya, kalınlık x1.5, görünür aralık `[max(0,u−2), min(1,u)]`, u 0→3, giriş satırlarına göre 0.04 s gecikmeyle (yani bir çizgi boyunca "akan" ışık dilimi).
  - Dönüşüm (Transform): iki şekli aynı nokta sayısına yeniden örnekle, başlangıç noktalarını hizala (hepsi sol üstten, saat yönünde), nokta nokta doğrusal enterpolasyon + renk enterpolasyonu.
  - Yazı (Write): <15 alt nesne 1 s, fazlasıysa 2 s; her harf "önce kontur sonra dolgu" (lineDash ile kontur ilerler, son %60'ta dolgu girer, kontur kaybolur).
- Kamera: "Kamera hareketi bir olaydır: dur → bir sonraki nesneye it → dur." İki yol: smooth ile tek seferde (~1 s) ya da **hızlı it 0.28 s, %18–32 yakınlaş, dur**. Eski yöntem olan sabit hızlı yavaş zoom "yeni videolarda taklit edilmesin" diye açıkça işaretli.
- Dönüşüm geçişleri (4 tür): (1) **Transform ile devam (kesme yok)**: önceki sahnenin son karesi = sonrakinin ilk karesi (piksel piksel aynı); (2) zoom-through: bir nesneye logaritmik yaklaş ve nesnenin içi yeni sahne olur; (3) FadeOut(UP) + FadeIn(UP) konu değişiminde; (4) formülde aynı sembol eski yerinden yeni yerine kayar (TransformMatchingTex, 2 s).
- Ses/anlatım hizası: "bir cümle = bir animasyon"; cümlede fiil geçtiği anda animasyon başlar, cümle bitince ~1 s bekle. Başlık/soru eylemden *önce* yazılır ("önce sor sonra göster"). Sayı ekranda *ondan önce değil*, dolgu ile birlikte sayarak gelir.
- "Neden tuzağa düşülür" listesi:
  1. "Parlama (bloom) ve koyu-lacivert gradient eklemek. Asıl stil: saf siyah + yüksek doygun ince çizgi."
  2. "Hep linear / sıradan ease, animasyonlar hızlı ve çok."
  3. Renk kodlaması ortada değişir ya da çok renk olur.
- Sayısal değerler (1080p): sahne yüksekliği = 8 birim, **1 birim = 135 px**; varsayılan çizgi 4 px, ağ bağlantıları 2 px, ızgara ana çizgi 2 / ara çizgi 1 px ve α 0.25; nöron yarıçapı 17/22/32 px (0.15 birim ≈ 20 px), katman başına en fazla **16 nöron çiz, gerisi ⋮ + süslü parantez**; nöron dolgu opaklığı = aktivasyon değeri; bağlantı kalınlığı `0.6+3.2·|w|³` px, pozitif mavi / negatif kırmızı, alfa 0.7–0.85; sinyal çizgisi 3–4.5 px; başlık/formül Write fontu 58 / 64 px; başlık ve formül sabit ekran üst 1/8'inde (y≈110–150), kamera ile hareket etmez.
- Bağımsız denetçi bulgusu (çok öğretici): "denetçi ajan sadece bitmiş videoyu izledi ve **mantık hatası** buldu: çıkış nöronunun ağırlıkları piksel şablonu gibi çizilmişti ama çıkış katmanı gizli katmana bağlıydı." Yani görsel metafor *doğru nedensel modeli* korumalı. Sonuç sahnesinde de 0.6 s bekleme eklendi ("sayı son 0.1 saniyede sayılıyordu").

**b) t3 (finans/veri grafiği): grafik animasyonu kuralları.**
- Özet: "Önce koordinat sistemini kur, sonra veriyi *büyüt*, en sonda yalnızca **tek şeyi** işaretle; ana karakter tek renk, gerisi gri; sayılar dürüst (çubuklar 0'dan başlar, birim ve kaynak grafikte yazılı); animasyon yalnızca *nasıl görüneceğine* karar verir, *kaç olduğuna* değil."
- Sıralama (staging): düzen 0–0.5 s → ızgara soldan sağa çizgi çizgi (lag 0.12, easeOutQuint) → x etiketleri sırayla yukarı kayarak → veri → vurgu rengi → not. Her aşama ≈ 0.5–1.3 s. "Önce eksen sonra veri": gözlemci önce "cetveli" bilsin.
- Çubuk: 0 çizgisinden büyür, easeOutQuint, **lag 0.22** (toplam 1.3 s), değer etiketi çubuk tepesini izler ve sayar.
- Çizgi: **x'e (zamana) göre** ilerler, yay uzunluğuna göre değil, böylece dik kısım doğal olarak hızlı çizilir ("patlama" hissedilir); uçta 9 px nokta + fiyat etiketi; alan gradyanı α 0.14→0; 1.5–2 s.
- Not (annotation): çizgi ucu olay noktasından *geçtiği anda* tetiklenir; nokta yay ile açılır (spring d0.45 bounce0.25) + bir halka nabzı → 0.12 s sonra kılavuz çizgisi → 0.3 s sonra metin. **"Bir planda yalnızca bir şey işaretlenir."**
- Sayaç: easeOutExpo, 0.9–1.3 s, **tabular (eşit genişlik)** rakamlar yoksa titrer.
- Grafik türü değişimi (morph): bar → nokta → çizgi *önce konuma kay, sonra şekil değiştir*; "farklı metrikler arasında morph yapma (gelir çubuğu hisse çizgisine dönüşürse aynı birimmiş gibi görünür)"; eksen yeniden ölçeklenirken önce tik'ler, sonra veri değişir.
- Stil değerleri: yalnızca yatay ızgara (α 0.13, 1.5 px), **yalnızca sıfır çizgisi koyu ve 3 px**, tik değerleri sağda; eksen etiketi en küçük, kaynak en küçük ve en açık; ana çizgi 5 px, not kılavuzu 2 px.
- İçerik kuralları: başlık = çıkarım cümlesi ("**5 yılda gelir yaklaşık 9 katına çıktı**": "çıktı" ile "arttı" ayrımı!), tablodaki sayılardan çıkarım **hesaplanabilmeli** (107.9 ÷ 12.4 = 8.70), veri uydurmaysa her sahnede "örnek veri" etiketi.

**c) y1 Kurzgesagt: ölçek / "içinde ne var" anlatımı**
- Özet: "Soyut kavramı somut bir nesneye çiz, sonsuz ölçeklenebilir ışıklı bir dünyaya koy, kamera ölçekler arasında dolaşsın. Ortam katmanı (yıldız, parçacık) hafifçe hareket edebilir; ana nesne ve bilgi anlatım noktalarında değişir, yerleşince durur."
- Başlangıç kontrolü: "Her anlatım cümlesinde en az bir **durum değişikliği** (pop-up, biçim değişimi, içine dalma, uzaklaşma). İki cümle üst üste ekran değişmediyse bir olay ekle, süzülme veya yavaş zoomla doldurma." / "İçine dalmadan önce 0.3 s dur ve nesneyi parlat; ölçek geçişinde log enterpolasyonu (`CAM.zlerp`)."
- Easing (resmi Skillshare, 60 fps): normal hareket **50 kare (0.83 s)**; döngü hareketi `cubic-bezier(.333,0,.667,1)`; diğer hareketler `cubic-bezier(.75,0,.25,1)` ("başlangıç çok yumuşak, orta hızlı, bitiş çok yumuşak").
- Pop-up: kart 0.25 s'de %90'a, **20. karede %108'e aşar** (dedektör kartı %114), ~0.5 s'de %100; yerel uygulama: `backOut(q,1.1)` 0.5 s.
- Stagger: aynı türde öğeler **10–20 kare**, uzuvlar 3–4 kare, hareketler arası 20 kare bekleme; başlık harf harf 45 ms; 144 parçalık pikselde merkeze uzaklığa göre 35 ms/hücre; sinir ağı katman katman 0.32 s.
- Kamera: zamanın ~1/3'ünde zoom, ~%10 pan, ~%5 rotasyon; çıkarma (uzaklaşma) yaklaşmadan fazla. Ölçek geçişi ~1.4 s (önce hızlanma sonra yavaşlama; `expoOut` yasak: ilk karede ölçeğin yarısını atlar).
- Kaçınılacak: "mavi-mor gradient / derin mor yıldızlı zemin çok 'AI slop'." Koyu istersen düz mürekkep (`ink`) ya da lacivert düz zemin.

**d) y3 Beyaz tahta: akıl yürütme / adım adım çözüm**
- Özet: "Konuşmacı bir cümle söyler, el büyük bir tahtaya bir cümle yazar / şekil çizer; kamera argümanı takip ederek tahtada gezer, en sonda uzaklaşıp tüm argümanın tek bir harita olduğunu gösterir."
- Kural: "Çizgi tipi ilk vuruşta belirlenir: düz = olmuş, kesikli = plan, noktalı = bölümler arası kılavuz; tahtada şeyler yalnızca silinir ya da kalır, **yavaşça kaybolmaz**." 
- Yazma hızı: gövde metni ≈ **16 karakter/sn**, başlık ≈ 7.5 kar/sn, konuşma ≈ 13 kar/sn. Çizim: küçük ikon 0.5–1 s, portre ~2 s. "Kalem el ilerletir, çizgiyi el çeker": karmaşık çizimi kameranın önünde çizme; önceden hazırla ve kamera geçerken ortaya çıksın.
- Kamera: tek hareket ≈ **0.23 resim genişliği**, yeni ve eski blok **%75 örtüşür** (izleyici hep önceki bloğun kenarını görür); easeInOutSine, 1.2–2.4 s; uzak atlamada whip-pan 0.8 s + hareket bulanıklığı; final uzaklaşma 0.6 s.
- Tahta kompozisyonu: blok başına 3–6 görsel-metin grubu; "yazıların yarısından fazlası konuşmayla aynıysa: *az çiz çok yazdın*."
- Çizgi kalınlığı: ≈ **ekran yüksekliğinin %0.6–0.7'si** (1080p'de 6–7 px), başlık yazı yüksekliği ≈ %5.5.

**e) y5 Kinetic tipografi: başlık / sonuç kartı**
- Özet: "Yazı oyuncudur: her anahtar kelime bir vurgu ile çarpar, ana kelime tek bakışta okunacak kadar büyük, diğer yazılar 'yuvadan' yükselir; ekranda hep **tek odak**; yerleşen yazı hareket etmez."
- **Yazı ölçek merdiveni (demo)**: ana kelime 340 px : yardımcı cümle 96 px : etiket 40 px ≈ **3.4 : 1 : 0.4**. Ana kelime ≤ 4 harf, yardımcı ≤ 14 harf, aynı anda tek giriş, kenar boşluğu ≥ **130 px**.
- Giriş türleri:
  | Eleman | Yöntem | Eğri / süre |
  |---|---|---|
  | Ana kelime | **çarp**: 1.7x → 1, ilk 0.06 s opaklık | düşük sönümlü yay `1−e^(−10t)·cos(2π·2.2t)`, ~%8 aşım, ≈0.35 s |
  | Yardımcı / etiket | **yuvadan yüksel**: baseline altındaki maskeden +1.2 yazı yüksekliği → 0 | `expoOut`, 0.30–0.35 s |
  | Sayı / ikon / balon | **pop**: 0→1 ölçek | `backOut` s=2.6–3.0, 0.30–0.42 s |
  | Kart | **kay**: +260–700 px, 3.4° dönüşle | `expoOut`, 0.40 s |
  | Vurgu çizgisi | soldan sağa fırçala | `expoOut`, 0.30 s |
  | Tik işareti | yay uzunluğuna göre çiz + kutu 1→1.25→1 | 0.22 s |
- **Çıkış girişten hızlı ve ivmeli**: `expoIn`, **0.18 s**, öğeler arası 0.03 s, 0.6x'e küçül + 60 px düş + saydamlaş. "Çıkış girişten hızlıdır: izleyicinin dikkati çıkış başlamadan gitmiştir."
- "Aynı sayfa tipi arka arkaya en fazla 3 kez" (aksi halde slayt olur); "yazı yerleştikten sonra oynamaz; hareket vuruş, sayfa değişimi, kanıt nesnesi girişinden gelir."
- Bölüm başına bir tam ekran zemin rengi (renk = bölüm numarası), vurgu rengi tek; 64 px aralıklı nokta ızgara (%6–10 opaklık).

**f) Çekim tablosu şablonu (storyboard) — ajanı yönlendirmek için**
`references\craft-workflow.md` → "镜头表模板：先镜头表，再动手" (çekim tablosu: önce tablo sonra kod):

```
| Zaman | Ekrandaki nesne (İSİM) | Ne yapıyor (FİİL) | Kamera | Ekran yazısı | Nasıl yapılacak |
```
- "Nesne" sütununa yasak: başlık, madde, metin, liste, etiket, altyazı, kart, arka plan, ikon, boş sahne. "Ne yapıyor" sütununa yasak: **görünür, gösterilir, belirir, solarak girer, madde madde girer**. İzin verilen kamera: **dur / hızlı it / yatay kay / çarp / kes** ("sabit hızlı yavaş zoom yasak").
- 5 kural: (1) açılış 3 sn somut küçük bir sahne, başlık değil; (2) tek örnek + tek stil baştan sona; (3) **bir plan 2–6 s** (nadiren 8); (4) metin-ağırlıklı planlar **≤ %30**; (5) iki ardışık plan aynı kompozisyonu kullanmaz.
- "Çekim tablosu yazılabilirse video bir sayfa giderek uzayan PPT'ye dönüşmez; bir satır yazılamıyorsa o plan düşünülmemiştir, kod yazma." Ardından `storyboard_lint.py` kırmızı ışıkta kod yazmayı yasaklar (kural enforcement örneği).

**g) Kod kütüphanesi (aynen alınabilir)**
`references\canvas-helpers.md`'te `MO` (zaman), `CAM` (kamera), `DG` (diyagram), `CH` (grafik), `TY` (tipografi) modülleri. Hepsi "zaman → değer" saf fonksiyon, saat okumaz, **deterministik** (seek / geri sarma uyumlu). Önemli parçalar:

```js
MO.seg = (t, a, b) => clamp((t - a) / (b - a));
MO.smooth = t => { t = clamp(t); return t*t*t*(10 - 15*t + 6*t*t); };
MO.lagged = (i, n, p, r = 0.05) => clamp(p * (1 + (n - 1) * r) - i * r);
MO.expoOut = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);   // "fast-out slow-stop"
MO.backOut = (p, s = 1.70158) => { const q = p - 1; return 1 + (s+1)*q*q*q + s*q*q; };
MO.k75 = MO.bezier(0.75, 0, 0.25, 1);          // Kurzgesagt "diğer hareketler"
MO.easyEase = MO.bezier(0.333, 0, 0.667, 1);   // döngü hareketi
MO.longTail = MO.bezier(0.33, 0, 0.2, 1);      // "çizgiyi takip et / açığa çıkar"
MO.appleOut = MO.bezier(0.25, 0.1, 0.25, 1);   // CSS ease
MO.emphasized = MO.bezier(0.2, 0, 0, 1);       // Material 3 emphasized
// SwiftUI parametreli yay: stiffness=(2π/d)², damping=4π(1-bounce)/d  =>  ζ = 1-bounce
MO.spring(t, { duration: 0.5, bounce: 0 })     // .smooth / .snappy(0.15) / .bouncy(0.3)
// frekans/sönüm parametreli: freq 3/decay 6 ≈ %37 aşım (çarpan büyük yazı);
// 2.5/9 ≈ %16 (normal pop); 2.2/10 ≈ %8 (ana kelime oturur)
MO.springHz(t, freq, decay)
MO.PULSE = { punch: 0.28, pan: 0.30, slam: 0.17 };   // kamera "nabız" ritmi
CAM.zlerp = (z0, z1, e) => z0 * Math.pow(z1 / z0, e); // log zoom: algılanan hız sabit
CAM.track(base, events, t)  // olaylardan kamera hesapla: punch/pan/to/slam/shake/cut, deterministik
```
Seçim özeti (dosyadan): "Açıklama (3b1b/beyaz tahta) için smooth/sineInOut: iki uç da durur; lansman için appleOut/yay; kinetic yazı için expoOut + yay; kolaj için sineInOut ya da longTail, kağıt 12 fps adım; Kurzgesagt hareketler k75, döngü easyEase."
Ek: `MO.step(t, 12)` ile "bir karede iki" adımlı hareket (çizgi film hissi).

**h) Süreç dersleri (craft-workflow)**
- Sanat tarihi hızlı geçiş mekanizması (5 katman): sabit iskelet (aynı pencere/masa/kedi yerinde), her bölüm "yaşayan bir resim" (durmadan 2–4 küçük döngü), geçiş = bir sonraki bölümün imza dili, **beat grid hızlanma** (6→4→3→2→1 sekizlik nota), sürekli anlatı çapası (yıl sayacı). "Üretken" açıklamada bunun karşılığı: **sabit iskelet + değişen tek şey + sürekli çapa (adım sayacı)** (çıkarım).
- "Geçiş süresi *görünen kısım* üzerinden belirlenir: inOut eğrisinde uçlar neredeyse görünmez, karmaşık imza geçişi 0.34 s'de sadece 0.2 s okunur ve normal silme sanılır; 0.48–0.5 s ver."
- "Rastgele tohumla çiz, aynı t için iki kez render aynı piksel olmalı; yoksa titrer." "Tüm ekranın fırça darbesini 8 fps'te yeniden tohumlamak titreşimdir canlılık değil; konum sabit, yön alanı zamanla sürekli değişsin."
- "Kamera darbesi hem yeni hem eski katmanda olmalı (yoksa ses önde görüntü geride kalır)."

---

### 2) `motion-design` — hareket tasarımı iş akışı (kısa, çok değerli)
Yol: `skills\motion-design\SKILL.md`

Ne öğretiyor: "bir fikir, kompozisyon / dönüşüm / ritim ile" anlatılsın. Beat map, dikkat koreografisi, görsel gramer, güvenilir kod yazımı, **kusur → karar** tablosu.

- Beat map (orijinal): `time → viewer takeaway → focal object → transformation → copy/audio → exit`. "Zaman bütçesi girişleri, okuma beklemelerini ve çıkışları içerir. Plakaları bağlayan **tekrar eden bir nesne, şekil, çizgi ya da tipografik motif** seç."
- Mekanizma örneği: "dağınık kelimeler yörüngede → bir kelime diğerlerini çeker → yörünge bir zamanlayıcıya dönüşür → zamanlayıcı biter ve logoya dönüşür. Her hareket anlamı değiştirir; dört ilgisiz başlık kartı mekanizmayı kaybettirirdi."
- Dikkat koreografisi, **3 katman**: (1) birincil eylem fikri taşır; (2) ikincil: ağırlık/neden-sonuç (arkadan gelen etiket, yerleşen gölge, bağlı nesnenin tepkisi); (3) ortam hareketi *sadece sahne gerektiriyorsa*. "Sessiz sahneler ve okuma beklemeleri gerçekten durağan olabilir."
- Süre başlangıç aralıkları (film sezgisi, UI değil):

  | İş | Aralık | Şekil |
  |---|---|---|
  | Küçük vurgu / noktalama | 120–220 ms | kararlı snap, sonra oturma |
  | Ana öğe gelişi | **350–650 ms** | hızlı yol, kontrollü iniş |
  | Anlamlı şekil dönüşümü | **600–1200 ms** | okunur kurulum ve çözülme |
  | Büyük açığa çıkış / kamera | 900–1800 ms | kesintisiz yörünge, net hedef |

  "Gelişte ease-out, motive edilmiş çıkışta ease-in, kamerada yumuşak hızlanma/yavaşlama. Sabit hız: konveyör, saat, tarama. Oyunsal materyal aşabilir (overshoot); hassas aletler varsayılan olarak zıplamasın."
- "Hızlı eylemlere hazırlık ve toparlanma ver; *teleport* değil, okunur neden olsun." "Fiziksel hareket için yaylar (arc) üzerinde konum değiştir; hassasiyet / yön / mekanik için düz yol."
- "Geçişte hız ve yönü koru; nesne kimliğinde, ölçekte ya da ışıkta kazara sıçrama olmasın. **Morph yalnızca topoloji destekliyorsa**; tasarlanmış bir match-cut okunmayan mesh bozulmasından iyidir."
- "Eylem ve dinlenmeyi sırala. En güçlü dönüşümü merkezi fikre sakla; sürekli maksimum yoğunluk her şeyi eşit hissettirir."
- **Açıklayıcı / veri** gramerinden: "Nedensel modeli koruyan mekânsal metafor seç. *Dönüştürmeden önce nesneyi göster*; ilişkiler değişirken etiketleri koru. Ölçek önemliyse eksenleri değerlerden önce göster. Anlatım varsa vuruşları tahmin edilen zaman damgalarına değil gerçek ses zamanına hizala. Zayıf açıklamayı örtmek için ilgisiz süs ekleme."
- **Kusur → karar** tablosu (aynen kullanılabilir):

  | Kusur | Daha iyi karar |
  |---|---|
  | Slayt gösterisi gibi | **Bir nesneyi anlamlı bir dönüşümden geçir** |
  | Her şey yarışıyor | Lider eylemi seç, desteği azalt veya geciktir |
  | Ağırlık hissi yok | Yol süresi, ivme, hazırlık ve oturmayı ayarla |
  | Yazı okunmuyor | Metni kısalt (izinliyse), bekleme ve kontrastı artır |
  | Jenerik görünüyor | Tipografi, kompozisyon, konuya özgü motif |
  | Meşgul ama az şey söylüyor | Süs hareketini kaldır, nedensel eylemi göster |

- Tek temsilci kare önce: "Hareketi genişletmeden önce kompozisyonda **tek güçlü temsilci kare** çöz. Zayıf bir hareketsiz kareyi parçacık, kamera sarsıntısı, efekt kurtarmaz."
- Yazı, grafik bir nesnedir: "ölçek, hizalama, satır kırma, negatif boşluk ve yazı karakteri ile kompoze et. Gerçek dili kapsayan fontlar seç, çekimden önce font hazır olsun."
- Güvenilir kod: tek küçük konfigürasyonda süre, çerçeve boyutu, palet, **yazı ölçeği, easing ve sahne zamanları**; her sahnenin elemanları ve hareketi gruplu; **içerik/veri çizimden ayrı**; "her istenen zaman damgasında sahne kararlı kalsın."
- Seek edilebilirlik: "Deterministik hareket ileri/geri aramaya dayanmalı: `Date.now` tabanlı sahne durumu yok, tohumsuz rastgelelik yok, sadece sıfırdan oynatınca çalışan simülasyon yok, master timeline ile yarışan bağımsız CSS animasyonu yok. Konumlar ve açığa çıkışlar zamanın fonksiyonu ya da aranabilir timeline parçaları olsun. **Görünür içeriği timeline callback'lerine (onUpdate, onComplete) bağlama.**" (Bizim "geri adım" butonu için kritik.)
- Bütçe: sadece 3 temsilci kareyi incele (açılış, anahtar açıklama, bitiş); *en fazla bir* hedefli onarım; "estetik için sayısal puan uydurma".
- GSAP kodu: SVG pop-in'de önce paylaşılan origin:

```js
function popShape(tl, node, cx, cy, at, duration = 0.45) {
  const svgOrigin = cx + ' ' + cy;
  tl.fromTo(node, { scale: 0, svgOrigin }, { scale: 1, svgOrigin, duration, ease: 'back.out(2)' }, at);
}
```
  (Not: `animate` skill "scale(0) yasak" der; burada SVG şekli için back.out(2) kullanıyor; UI ve film bağlamı farklı. Bizim için: büyük nesnelerde 0.9'dan başla, küçük "pop" vurgularında back.out serbest — çıkarım.)

---

### 3) `ui-animation` — özellikle `references\svg-animation.md`, `choreography.md`, `debugging-symptoms.md`, `contextual-animations.md`
Yol: `skills\ui-animation\SKILL.md` ve `references\*`

- **SVG animasyon temelleri** (bizim canvas tamamen SVG olacağı için kritik):
  - "SVG'de `transform-origin` varsayılanı viewBox (0,0)'dır; `center` elemanın değil viewBox'ın merkezidir." Çözüm: `transform-box: fill-box; transform-origin: center;` ya da piksel origin.
  - Çizgi çizme: `stroke-dasharray` = yol uzunluğu, `stroke-dashoffset` ile gizle, 0'a animasyonla. `pathLength="100"` ile normalize et. Yuvarlak çizgi uçları için boşluğu dash'ten biraz büyük tut (`1px 1.1px`) yoksa uç görünür. `stroke-dasharray: 1px 1.1px; animation: draw 0.6s cubic-bezier(0.22,1,0.36,1) forwards;`
  - Degenerate şekiller (r=0, genişlik 0) hiç çizilmez; `overflow: visible` ver ki aşım kırpılmasın.
  - Path morph: yalnızca aynı nokta yapısında; farklıysa `flubber`.
  - **Ortam canlılığı**: "neredeyse algılanmaz döngüler, **eşzamanlanmayan süreler** (organik görünür, mekanik değil): float translateY 0→1.5px / 3 s, rotate 0→2° / 4 s." İlk döngüye ~2 s gecikme ve `repeatDelay`; ekran dışında döngüleri duraklat (IntersectionObserver).
- **Koreografi** (`choreography.md`): kalıplar tablosu:
  - **Blur-before-move**: öğe/arka plan konumdan birkaç kare *önce* bulanıklaşır/kararır ("bağlamı önce kurar").
  - **Over-stretch then settle**: bir eksen 1.0'ı aşıp geri döner ("yumuşak ve fiziksel").
  - Staggered children: hiyerarşi kurar, göz lideri izler.
  - **Asymmetric open/close**: "açılış yavaş + yaylı, kapanış hızlı + düz; açılış eğrisini ters çevirip kapanışta *kullanma*."
  - Özellikler arası **öncü/artçı** gecikme: "Gecikmeler (blur öncü, hareket 100 ms geride, scale aşar) tek bir easing'den daha çok his taşır." Örnek tablo: opacity f0–f6, blur f0–f8, translate f3–f14 (blur'u ~100 ms geriden izler), scaleY f3 başlar, f11'de 1.06 tepe.
- **"Robotik / cansız" hissi için teşhis** (`debugging-symptoms.md`):
  - "Sabit hızlı (`linear`) hareket: fiziksel hiçbir şey sabit hızda hareket etmez." `linear` yalnızca marquee, spinner, zamanı görselleştiren bekleme, scroll-scrub.
  - "**Tek tip stagger** (aynı gecikme ve mesafe): önem sırasına göre gecikme ve mesafeyi değiştir; metronom etkisi mekanik hisseder."
  - "Eğri çok zayıf: eğriyi dikleştir; düz hissediliyorsa genelde süre değil eğri sorundur."
  - "Ucuz hissediyor": `scale(0)` ya da çıplak fade yerine `scale(0.9-0.96)` + opaklık; "çapraz geçişte iki ayrı durum üst üste görünüyorsa geçiş sırasında `filter: blur(2px)` ekle: göz iki nesne yerine dönüşen *tek nesne* görür"; alt animasyonlar farklı saat ailelerinde ise ("tek yavaş alt animasyon bütünü bozar"); çıkış girişin yönünde ve ~%20 daha hızlı, basit.
  - Teşhis döngüsü: **10–25% hızda oynat**, bir değişkeni değiştir, easing önce süre sonra, "yalnızca yavaş çekimde onaylanan animasyon onaylanmış sayılmaz; tam hızda ve ertesi gün taze gözle bak."
- **Bağlamsal giriş** (`contextual-animations.md`): "Hero metni için bölümleri (ya da kelimeleri) ayrı stagger'la. **opacity + translateY + blur birlikte**: tek özellik düz/mekanik/ucuz görünür."

  ```css
  @keyframes enter { from { transform: translateY(8px); filter: blur(5px); opacity: 0; } }
  .animate-enter { animation: enter 800ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
  /* bölüm düzeyi 100 ms, kelime düzeyi 80 ms */
  ```
  İkon değişimi: opacity + scale 0.8 + blur 4px birlikte, `spring duration 0.2 bounce 0`, `AnimatePresence mode="wait"`.
- Karar çerçevesi (`SKILL.md` + `decision-framework.md`): "Süreklilik, ışınlanmaya karşı: iki durumda da görünen elemanlar yerinde geçiş yapar; yeni örnek soluklaştırmak yerine olduğu yerden genişlet. **Kalıcı bir elemanı çoğaltma ya da ortak bileşenler arasında sert kesme yapma**; sert kesmeler uzamsal bağlamı kaybettirir." / "Yönlü hareket konumla eşleşir (ileri soldan sağa, geri sağdan sola)." / "**Hareket algılanan hızı artırır**: pürüzsüz geçişler aynı yükleme süresinde bile kesmeden hızlı hisseder." / "**Yenilik bütçesi**: ~%90 beklenen hareket (ya da hiç), %10 yeni; art arda yüksek yenilikli vuruşlar yığma." / "**Tek seferlik**: ilk açılış stagger'ları her ziyarette yeniden oynamasın."
- Eğri adları (aynen kopyalanabilir): Enter `cubic-bezier(0.22,1,0.36,1)`, Move `(0.25,1,0.5,1)`, Drawer `(0.32,0.72,0,1)`, Expo out `(0.19,1,0.22,1)`, Press `(0.25,0.46,0.45,0.94)`, On-screen move `(0.645,0.045,0.355,1)`.
- Performans: "Yalnızca transform + opacity; `filter` blur ≤ 20 px; `will-change` sadece animasyon sırasında; `contain: layout style paint` ve `[data-animate]` hedeflemesi; **çoklu animasyonlu SVG sahnelerinde yalnızca animasyonlu öğelere** `will-change: transform, opacity, stroke-dashoffset`."
- Ters mühendislik betikleri (ffmpeg + OpenCV ile referans kayıttan eğri çıkarma) bizim için gerekli değil.

---

### 4) `animate` (Emil Kowalski, uygulama) + `references\RECIPES.md`
Yol: `skills\animate\SKILL.md`

- Sert kurallar: "**Yaklaşık değer yok**: her eğri, süre ve yay yapılandırması tablodan gelir; tanıdık göründüğü için `cubic-bezier(0.4,0,0.2,1)` uydurma."
- Eğriler:
  ```css
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* güçlü ease-out */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* ekran içi hareket */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  ```
- Seçim: "Giriş/çıkış → ease-out. Ekranda hareket/morph → ease-in-out. Hover/renk → ease. Sabit hareket → linear. **UI'da asla ease-in**: yavaş başlar, kullanıcının izlediği anı geciktirir." "Yerleşik CSS easing'leri çok zayıf."
- Özellikler: "**Yalnızca transform ve opacity.** Asla `scale(0)`: `scale(0.9–0.97)` + opacity 0'dan başla. Hiçbir şey gerçek dünyada yoktan belirmez." "`transition: all` yasak." "`transform` kısaltmaları (Motion'da x/y/scale) yük altında kare düşürür; tam `transform` string'i kullan."
- Yay: `{ type: "spring", duration: 0.5, bounce: 0.2 }` (Apple tarzı) ya da `{ mass:1, stiffness:100, damping:10 }`; "bounce 0.1–0.3 arası; çoğu UI'da bounce'tan kaçın."
- Kesinti: "Hızlı tetiklenen her şey için **transition, keyframe değil**: transition mevcut değerden yeniden hedeflenir, keyframe sıfırdan başlar." "Yaylar jestlerde hız taşır." "Giriş yolu ne ise çıkış aynı yoldan."
- Stagger: "**Her şey aynı anda girerse** → 30–80 ms stagger." Tariflerde: öğe başına 50 ms, `translateY(8px)`, 300 ms.
- Reduced motion: "daha az ve daha yumuşak animasyon, sıfır değil; anlamaya yardım eden geçişleri tut, hareketi ve konum değişimini kaldır."
- Kapı mantığı (bizim ajan için *çok yararlı* karar şablonu): önce *"Bu animasyon olmalı mı?"* (sıklık), sonra *"Amaç ne?"* (Geri bildirim / Mekânsal süreklilik / Durum göstergesi / Sarsıcı değişimi önleme / **Açıklama** / Keyif), "Adlandıramıyorsan yapma." "Okunan/üzerinde işlem yapılan veri stil için hareket etmesin." İlgili çıktı: "Kodu yaz. Sonra en fazla birkaç satır: kapı sonucu, bileşenler (araç, özellik, eğri, süre), hissedilecek kontrol."
- RECIPES: buton basma `scale(0.97)` 160 ms; popover `scale(0.95)` + opacity 200 ms, `transform-origin` tetikleyiciden; tooltip 125 ms `scale(0.97)`, ikinci tooltip anında; toast `translateY(100%)` 400 ms ease; **clip-path ile açığa çıkarma** (`inset(0 100% 0 0)` → `inset(0)`, "progress easing yapmaz: linear"); **sekme göstergesi için klon + clip-path** (iki renk geçişini zamanlamak yerine tek eleman açığa çıkarılır); scroll reveal `clip-path` 600 ms ease-in-out. Süre tablosu: buton 100–160, tooltip 125–200, dropdown 150–250, modal/drawer 200–500, "marketing/açıklayıcı daha uzun olabilir."
- ÖNEMLİ UYARI: Bu skill UI mikro etkileşimleri için (<300 ms). Açıklayıcı lab hareketleri için `motion-design` ve `huashu` tablolarındaki 350–1200 ms aralığı kullanılmalı.

---

### 5) `review-animations` + `emil-design-eng` — inceleme ölçütleri ve inceleme formatı
Yol: `skills\review-animations\SKILL.md`, `skills\emil-design-eng\SKILL.md`

- "On değişmez standart" (kısaltılmış): Haklı hareket; sıklığa uygun; duyarlı easing; <300 ms UI; menşe ve fiziksel doğruluk; kesintiye dayanıklılık; yalnızca GPU özellikleri; erişilebilirlik; **asimetrik giriş/çıkış** ("kasıtlı eylemler yavaş, sistem tepkileri snap"); **uyum** (oyunsal bileşen zıplayabilir, panel keskin kalır).
- Düzeltme hiyerarşisi (önce silmek!): 1) Animasyonu sil → 2) küçült → 3) easing'i düzelt → 4) menşe/fizik → 5) kesintiye dayanıklı yap → 6) GPU'ya taşı → 7) asimetrik zamanlama → 8) cila (blur ile çapraz geçiş, stagger, `@starting-style`, yay) → 9) a11y ve uyum.
- Çıktı biçimi: **`| Before | After | Why |` tablosu** + etki seviyesine göre sıralı hüküm + **Block / Approve** kararı. Ajana bir "kendi çıktısını eleştir" kalıbı olarak kopyalanabilir.
- "Emin değilsen en güçlü hamle genellikle animasyonu silmektir."
- "Hareket algılanan hızı etkiler: hızlı dönen spinner yüklemeyi daha hızlı hissettirir."
- Tipografi kuralı (ince detay): `font-variant-numeric: tabular-nums`, başlıklarda `text-wrap: balance`.

---

### 6) GSAP skill'leri: `gsap-timeline`, `gsap-core`, `gsap-plugins`, `gsap-performance` (+ `gsap-utils`, `gsap-react`, `gsap-scrolltrigger`, `gsap-frameworks`)
Yol: `skills\gsap-*\SKILL.md`

- **Zaman çizelgesi (timeline) kalıbı**, bizim "adım" mimarimiz için doğrudan yapı taşı:

  ```js
  const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
  tl.addLabel("step2", "+=0.3");
  tl.to(".a", { x: 100 }, "step2")
    .to(".b", { opacity: 0 }, "<")        // a ile aynı anda başlar
    .to(".c", { scale: 2 }, "<0.2");      // a'dan 0.2 s sonra
  tl.tweenFromTo("intro", "outro");       // etiketler arası oynat
  ```
  Konum parametresi: mutlak `1`, göreli `"+=0.5"` / `"-=0.2"` (**örtüşme**), etiket `"label+=0.3"`, `"<"` (öncekiyle aynı başlangıç), `">"` (öncekinin bitişi), `"<0.2"`. "`delay` zinciri yerine timeline kullan." "Timeline `duration`'ı çocuklarından belirlenir." İç içe timeline: `master.add(child, 0)`. Kontrol: `play/pause/reverse/progress(0.5)/time(2)/tweenTo`.
- `gsap-core`: `stagger: 0.1` ya da `{ amount: 0.3, from: "center" }`, `{ each: 0.1, from: "random" }` (merkezden ya da kenarlardan dalga); `autoAlpha` (opaklık 0 iken `visibility:hidden`); `xPercent/yPercent`; `svgOrigin`; `rotation: "-170_short"` (en kısa yol); `immediateRender: false` (aynı özelliği iki `from()` ile animasyonlarken); `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`, `"none"`; `CustomEase.create("hop","M0,0 C…")`; `gsap.matchMedia()` ile `prefers-reduced-motion`.
- `gsap-plugins`: **Tüm GSAP eklentileri artık ücretsiz** (Webflow satın aldı; lisans anahtarı yok). Bizim için ilgi çekenler:
  - **Flip**: `const state = Flip.getState(".item"); /* DOM'u değiştir */ Flip.from(state, { duration: 0.5, ease: "power2.inOut" });` — "bir adımda öğenin yerini/biçimini değiştir, nesne kimliğini koru" için *ana mekanizma*; `absolute`, `nested`, `scale: true`.
  - **DrawSVG**: `gsap.fromTo("#path", { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1 })` — vektör çizgi çizdirme, **stroke şart**, dolguyu etkilemez.
  - **MorphSVG**: farklı nokta sayısında bile şekil dönüşümü; `shapeIndex: "log"` ile bir kez ayarı oku, `type: "rotational"`, `smooth`, `curveMode`; çember/dikdörtgeni önce `convertToPath`.
  - **MotionPath**: nesneyi SVG yolu boyunca akıt (veri akışı / paket).
  - **SplitText**: `SplitText.create(".h", { type: "words,chars", mask: "lines", autoSplit: true, onSplit(self){ return gsap.from(self.lines,{y:100,opacity:0,stagger:0.05}) } })` — font hazır olmadan bölme (`document.fonts.ready`), `aria` otomatik.
  - **CustomEase / CustomBounce / CustomWiggle**, **ScrambleText**, **Observer**, **Draggable + Inertia** (kullanıcı sürükleme: "doğrudan manipülasyon sırasında eleman işaretçiye kilitli, easing yok; bırakınca yay").
- `gsap-performance`: transform + opacity; `stagger` birçok ayrı tween yerine; `gsap.quickTo()` sık güncellenen değerler (fare takibi, **sürüklenen parametre**); ekran dışı animasyonları öldür.
- ScrollTrigger/React skill'leri: bizim tek sayfalık lab için gereksiz ya da ağır.
- Not: Hiçbir skill GSAP'ı paketlemiyor; `motion-design` OD kendi `./gsap.min.js` 3.14.2 yerel dosyasını kullandığını söylüyor, yani **yerel dosya ile gömme** yaklaşımı (CDN yok) modele uygun bir örnek.

---

### 7) `frame-data-chart-nyt` — grafik animasyonu + editoryal tipografi
Yol: `skills\frame-data-chart-nyt\SKILL.md`

- Düzen (1920×1080): üst kicker (11 px büyük harf, letter-spacing 0.14em, vurgu rengi) → **büyük başlık 5.6vw** (Cheltenham/Playfair/Source Serif; çıkarım cümlesi, grafiğin tarifi değil) → **grafik alanı canvas'ın %55–65'i** → alt kaynak (10 px mono, opacity 0.6).
- Giriş zinciri: başlık 0 s → kicker 200 ms → çizgi `stroke-dashoffset` **1.2 s ease-out, 400 ms'de** → veri etiketleri **100 ms aralıkla** sırayla. `prefers-reduced-motion` ile kapanabilir.
- "Chart.js / D3 kullanma (CDN hariç); el yazması SVG öneririz, 80 satırı geçmesin"; tek ink rengi + tek vurgu; Y ekseni yalnızca hairline + 3–4 tik, etiketler eksenin dışında; **tüm ekranı kaplayan ızgara, gölge, 3D çubuk, emoji yasak.**
- "Metin sonucu verilmişse makul koordinatları tahmin et ama **'şematik' diye etiketle**" (dürüstlük kuralı).

---

### 8) `frame-flowchart-sticky` — düğüm + bağlantı diyagramı
Yol: `skills\frame-flowchart-sticky\SKILL.md` (+ `example.html`)

- Düğümler: 240×180 px yapışkan not, ±2° rotasyon, `drop-shadow(0 6px 14px rgba(0,0,0,0.12))`, başlık 16–20 px, açıklama 12 px (web-kare ölçeği; bkz. bölüm 4 uyarısı).
- Bağlantı: Bezier `<path>`, stroke width 2.5, `stroke-linecap: round`, `marker-end` ok, kesikli `8 6` = koşullu dal. "En az 5, en çok 12 düğüm" (yoğunluk sınırı!). "Düğümler ortada hizalı olmasın ama bağlantılar net ve kesişmesin." Yasak: koyu tam ekran, neon, kurumsal dashboard. Tek dosya, inline SVG ikon.
- Etkileşim: hover'da gölge yükselir + `scale(1.05)`.

---

### 9) `deck-open-slide-canvas` — canvas'a göre tip ölçeği
Yol: `skills\deck-open-slide-canvas\SKILL.md`

- Sabit **1920×1080** canvas, `transform: scale(...)` ile pencereye sığdır, **overflow yasak**.
- **Tip ölçeği (px, 1080p)**: `2xs:18 · xs:22 · sm:28 · md:36 · lg:48 · xl:64 · 2xl:88 · 3xl:120 · 4xl:160 · 5xl:220`. Kenar boşluğu 96 / 128 / 160 üç seviyeden biri.
- "Her sayfada **tek görsel ağırlık merkezi** (bir cümle, bir sayı ya da bir görsel); iki eşit metin bloğu yok; eşit ağırlıklı ise 3 sütun ızgara."
- Tek vurgu rengi; sans+serif karıştırma; mono yalnızca veri/zaman damgası için.

---

### 10) `deck-swiss-international` ve `swiss-user-research-video-template` — aşırı tipografik kontrast
Yol: `skills\deck-swiss-international\SKILL.md`, `skills\swiss-user-research-video-template\{SKILL.md,assets\template.html,references\checklist.md}`

- Swiss deck: "Font büyüklüğü *aşırı* kontrast: kapak **9.6vw**, gövde 14–16 px, etiket 11 px büyük harf letter-spacing 0.08em." 16 sütunluk ızgara, yalnızca dik açı, 1 px hairline, gölge/gradyan/blur yok. "Sayılar kullanıcı girdisinden gelmeli; çubuk yüksekliği = gerçek veri oranı."
- Swiss araştırma şablonu (gerçek CSS): `h1 88px / lh 1.02`, `h2 58px / lh 1.05`, lead 24 px, gövde 20–29 px, `.meta` 11 px büyük harf `.24em`, yüzde `tabular-nums`; geçişler `opacity .45s ease, transform .45s ease`, panel `transform .6s ease`, hover `.2s`/`.3s`; ok tuşu + alt sayfa noktaları navigasyonu; "İnce satır çizme ve panel yükselme geçişleri; döngüsel gösterişli efekt yok; geçişlerde tutarlı süre ve easing" (kontrol listesi P2).

---

### 11) `taste-skill` (+ `taste-skill-v1`, `gpt-tasteskill`, `soft-skill`, `minimalist-skill`)
Yol: `skills\taste-skill\SKILL.md` (89 KB)

- **Üç kadran (dial) sistemi** — ajanı yönlendirme kalıbı olarak harika: `DESIGN_VARIANCE` (1 simetri–10 kaos), `MOTION_INTENSITY` (1 durağan–10 sinematik), `VISUAL_DENSITY` (1 galeri–10 kokpit); varsayılan 8/6/4; ipucu→kadran tablosu ("minimalist / calm / editorial" → 5-6 / 3-4 / 2-3 vb.); her kadran seviyesi için ayrı kural bandı (1–3 durağan, 4–7 akışkan CSS `cubic-bezier(0.16,1,0.3,1)`, 8–10 gelişmiş koreografi).
- "**Hareket gerekçeli olmalı (zorunlu)**: Geçerli yanıtlar: hiyerarşi, hikâye anlatımı (sıralı açığa çıkış), geri bildirim, durum geçişi. Geçersiz: 'güzel göründü'. Gerekçeyi tek cümlede söyleyemiyorsan animasyonu at." / "**Motion claimed, motion shown**: MOTION_INTENSITY > 4 ise sayfa gerçekten hareket etmeli."
- "Kinetik yazı: `leading` italik inen harfler için `leading-[1.1]` altında kesilir." "Vurgu için aynı fontun italik/bold'unu kullan, rastgele serif kelime enjekte etme." "Maks. 1 vurgu rengi, doygunluk <%80." Yasaklı varsayılanlar: mor gradient, ortada hero + 3 eşit kart, her yerde sonsuz mikro animasyon.
- Etkileşimler: "Bir `scroll` dinleyici yasak; `useScroll`, ScrollTrigger, IntersectionObserver ya da CSS scroll-driven kullan." "Sürekli değerler için `useState` yok."
- Not: Bu skill pazarlama sayfaları için; yalnızca *kadran* fikri, *gerekçe* kuralı ve *yasak varsayılanlar* listesi taşınabilir.

---

### 12) `emilkowalski-motion` — kısa mikro cila iş akışı
Yol: `skills\emilkowalski-motion\SKILL.md`

- "Mevcut HTML'i incele, **yalnızca durumu / hiyerarşiyi netleştiren en küçük hareket anları** seç. Tek bir hareket dili: ilgisiz easing/süre/fizik karıştırma." "Stagger yalnızca küçük gruplarda; uzun stagger arayüzü yavaş hissettirir." "Süresiz dekoratif döngü, ancak durum/ilerlemeyi anlatıyorsa." 140–220 ms kontroller. `prefers-reduced-motion` yedeği zorunlu.

---

### 13) `web-design-guidelines` (Vercel)
Yol: `skills\web-design-guidelines\references\guidelines.md`
- Animasyon: reduced-motion; "**animasyonlar kesintiye dayanıklı: kullanıcı girişine animasyon ortasında yanıt ver**". Tipografi: `tabular-nums` rakam sütunlarında; başlıklarda `text-wrap: balance` / `text-pretty`; kritik fontlarda `preload` + `font-display: swap`.

---

### 14) `impeccable-design-polish` + `reference-design-contract` + `creative-director` (stub)
- `impeccable-design-polish`: sonradan cila geçişi modları (Audit / Critique / Polish / Animate / Harden / Live), "AI izlerini sil" listesi: sebepsiz mor-mavi parlama, jenerik 3 kart, her yerde büyük yuvarlak kartlar, boş pazarlama sıfatları, tutarsız aralık ve tip ölçeği, **kavramayı desteklemeyen süs efektleri**.
- `reference-design-contract`: "belirsiz zevki" **DESIGN.md** (9 bölüm: görsel tema, renk, tipografi, boşluk, yerleşim, bileşenler, **hareket**, ses, anti-kalıplar) + uygulama devir notuna çevirme. Bizim için: her konu için tek bir "tasarım sözleşmesi" üretip tüm sahnelerin bundan okuması (çıkarım).
- `creative-director`: stub, ama OD orkestrasyon notu: "iyi görünüm"ün tanımı (kitle, ton, referanslar, bilgi yoğunluğu, tipografi, palet, **hareket tonu**, anti-kalıplar) önce yazılsın.

---

### 15) `motion-lab` — 160 vakalık HTML/CSS/JS kitaplığı
Yol: `skills\motion-lab\SKILL.md`, `references\{index,basic,text,interaction,advanced}.md`
- Her vakada parametre tanımı + çalışan kod (indirme yok). Vaka kimlikleri: `text-typewriter`, `hover-flip-card`, `scroll-reveal`, `particle-fountain`, `canvas-starfield`, `flow-field`, `particle-galaxy`, `click-ripple-material`. Kural: "Sergilemek için efekt yığma; kullanıcının durumuna uyan vakayı seç; global seçicileri bileşen kapsamına al; çoklu örnekler durum paylaşmasın; rAF/zamanlayıcı temizle." Yönlü: parçacık/akış alanı gibi "veri akışı" metaforları için **kod taslağı kaynağı** olabilir, ama çoğu vitrin niteliğinde.

---

### Diğer değerlendirilenler (kısa)
- `video-hyperframes`: her kare bir plan/kavram, kare altında gizli işaret `<!-- frame:N duration:3000 transition:fade -->`, hook → argüman → sonuç yapısı, "her karede tek cümle, text-9xl". Fikir (kare başına meta veri) kullanılabilir; "Her 3 s'de sonraki kareye otomatik geç" slayt hissi veren tam olarak kaçınmak istediğimiz kalıp.
- `frame-glitch-title`, `frame-light-leak-cinema`, `frame-liquid-bg-hero`, `frame-logo-outro`, `vfx-text-cursor`: dekoratif (RGB kayması, film greni, akışkan arka plan, harf harf yazma 80 ms/karakter, logo parça parça giriş 80 ms stagger, 1.2 s toplam). Öğrenme açısından düşük değer; "logo parçaları ±100 px kayıp scale 1.4→1.0, 80 ms stagger" gibi ufak değerler dışında.
- `data-report`, `research-decision-room`: kanıt/etiket disiplini (sayı uydurma yok, "not provided"). Dürüstlük kuralı olarak yararlı.
- `d3-visualization`, `hand-drawn-diagrams`, `algorithmic-art`: stub, yalnızca varlık bilgisi.

---

## 3. Skill'ler arası damıtılmış hareket ilkeleri: "canlı" ve "slayt gösterisi" farkı

Slayt hissinin kök nedeni: **adım = bir önceki içeriği sil, yenisini solarak getir.** Canlı hissin kök nedeni: **aynı nesne adımdan adıma yaşar, biçim değiştirir, yer değiştirir; yeni şey eskinin içinden/yanından büyür.** Uygulanabilir kontrol listesi:

**A. Anlatı / yapı**
1. Her adım için "**kim kime dönüşüyor?**" cümlesini yaz (t1). Yazamıyorsan adım bir slayt olur.
2. Beat map: `zaman → izleyicinin çıkaracağı sonuç → odak nesne → dönüşüm → metin → çıkış` (motion-design). Tüm adımları bağlayan **tek bir motif nesnesi** seç (örn. KNN'de sorgu noktası, matris çarpımında satır vektörü).
3. İlk karede **nesne** olsun; başlık ve formül sonra gelsin. Soruyu eylemden *önce*, sonucu eylemden *sonra* göster.
4. Anlatımdaki her cümle/adımda **en az bir durum değişikliği** (belirme, biçim değişimi, içine dalma, yer değişimi) olsun; iki adım arka arkaya görsel olarak aynıysa olay ekle (y1).
5. "Her hareketin tanımlanabilir bir amacı olmalı" (3b1b SSS); kapı: "bunu tek cümleyle gerekçelendirebiliyor muyum?" Gerekçesiz hareket sil.
6. Ekrandaki anahtar nokta **≤ 2**; üçüncüsü gelmeden öncekiler şekle dönüşsün ya da toplansın.
7. Aynı yerleşim/giriş dizisi art arda **≤ 3** kez; sonra değiştir (t2, y2, y3, y5 hepsinde ortak kural).

**B. Süreklilik ve dönüşüm**
8. **Nesne kalıcılığı**: iki durumda da görünen eleman yerinde geçiş yapsın; yeni bir kopyayı solarak getirme, kalıcı elemanı çoğaltma ya da sert kesme (ui-animation). Araç: GSAP Flip (konum/boyut), MorphSVG (biçim), `Flip.from(state)`.
9. **Başlangıç noktaları hizalı morph**: aynı nokta sayısı, aynı başlangıç, saat yönü; farklı topolojide morph yerine tasarlanmış match-cut/dönüşüm (motion-design).
10. **Hızı ve yönü devret**: bir hareket biterken sonrakinin yönü/hızı onunla süreklilik taşısın; sahne ışığında/ölçeğinde kazara sıçrama yok.
11. Sahne geçişi: **önceki sahnenin son karesi = sonrakinin ilk karesi** (t1: piksel bazında aynı). Yeni sahne için "sil ve gel" yok, "dönüştür ve devam" var.
12. Ölçek değişiminde log enterpolasyonu (`z0 * (z1/z0)^e`), bir nesneye *dalmadan önce* ≥0.3 s dur ve parlat.
13. Çizgi/akım: bağlantılar `stroke-dashoffset` ile çizilsin; sinyal `ShowPassingFlash` ile akıtılsın (ışık dilimi çizgi boyunca kayar). Veri nesnesi MotionPath ile yol boyunca gitsin.

**C. Zamanlama ve easing**
14. Easing aileleri:
    - Giriş: güçlü ease-out (`0.23,1,0.32,1` / `0.22,1,0.36,1` / `expoOut`).
    - Ekran içi hareket/morph: ease-in-out (`0.77,0,0.175,1`) ya da `smooth` quintic.
    - Çıkış: **girişten ~%20–40 hızlı**, ivmeli, aynı yoldan (y5: 0.18 s, ui-animation: ~%20 daha hızlı).
    - `linear` yalnızca sabit hız anlamlıysa (saat, progress, scrub).
15. Süre aralıkları (film ölçeği): vurgu 120–220 ms; ana giriş **350–650 ms**; anlamlı dönüşüm **600–1200 ms**; kamera/büyük açığa çıkış 900–1800 ms (motion-design). Tipik adım: bir animasyon 1–2 s + 0.5–1 s dinlenme (3b1b: run 1 s, wait 1 s).
16. **Stagger**: dalga ya da merkeze uzaklık; ilk giriş için bölümler 100 ms, kelimeler 80 ms; liste 30–50 ms (UI) ya da 0.1 lag oranı (3b1b); 10–20 kare (≈0.17–0.33 s @60) Kurzgesagt. **Tek tip metronom stagger yapma**: önem sırasına göre gecikme/mesafeyi değiştir.
17. **Öncü/artçı katmanlar**: blur/opaklık önce, hareket ~100 ms sonra, ölçek aşıp geri gelsin (over-stretch). `opacity + translateY(8–40px) + blur(4–5px)` birlikte (tek özellik düz görünür).
18. Örtüşme: bir şey çıkarken sonraki girmeye başlasın; "sil, bekle, getir" yok. GSAP: `"<"`, `"-=0.2"`.
19. **Bekleme gerçektir**: yerleşen nesne durur, hareketsiz kalır (3b1b, y1, y3, y5 hepsi). "Sabit hızlı yavaş zoom, nefes alma, süzülme ile doldurma." Ortam hareketi yalnızca ortam katmanında (yıldız, parçacık) ve sahne gerektiriyorsa; çok hafif, **eşzamanlanmayan süreli** döngüler (3 s ve 4 s gibi).
20. Eylem ve dinlenme dönüşümlü; en güçlü dönüşüm merkezi fikir için. Sayı, grafikte **tam söylendiği anda** yerleşir; dinlenme sonrası 0.5–1 s bekleme.

**D. Fizik ve his**
21. Hazırlık + toparlanma: hızlı eyleme küçük bir hazırlık (anticipation) ve oturma ver; teleport yok.
22. Küçük "pop" vurgularda yay/`back.out`: ana kelime ~%8, normal pop ~%16 aşım; kesin araçlarda (hassas diyagram) varsayılan olarak zıplama yok.
23. `scale(0)` yok: büyük nesneler 0.9–0.97'den + opacity; yalnızca küçük işaretçi pop'ları 0'dan.
24. Çapraz geçişte iki durum görünüyorsa `blur(2px)` köprüsü.
25. Kesinti: kullanıcı adım atlarsa/geri alırsa animasyon **mevcut durumdan yeniden hedeflensin** (transition/timeline `tweenTo`), baştan başlamasın.

**E. Teknik**
26. Yalnızca `transform` + `opacity` (+ `clip-path` açığa çıkarmalarda, `stroke-dashoffset` çizgilerde); layout özellikleri yok; `transition: all` yok.
27. Sahne = zamanın **saf fonksiyonu** (seek edilebilir): tohumlu rastgelelik, `Date.now` yok, görünür içerik callback'e bağlı değil. Bu "adım geri" ve "ilerleme çubuğu sürükle" için şart (motion-design).
28. SVG: `transform-box: fill-box; transform-origin: center` (veya `svgOrigin` ile ortak merkez), `overflow: visible`, ilişkili şekiller (disk + gölge) ortak `<g>`'de.
29. Font hazır olmadan ölçme/bölme yapma (`document.fonts.ready`).
30. `prefers-reduced-motion`: "daha az ve daha yumuşak, sıfır değil"; anlamı taşıyan geçişleri koru, konum hareketini kaldır.

**F. Hata ayıklama**
31. 10–25% hızda oynat; bir değişken değiştir (önce eğri, sonra süre); tam hızda ve taze gözle yeniden bak.

---

## 4. Açıklayıcı canvas için tipografi ve yerleşim ilkeleri

**Referans boyut:** Skill'lerdeki değerler hep 1920×1080 canvas'a göre; bizim tek-HTML tasarımda bunları **canvas yüksekliğinin yüzdesi** (ya da `cqh`/`cqw`) olarak kodlamak, ekran boyutundan bağımsızlık sağlar (çıkarım). Aşağıdaki % değerleri 1080 yüksekliğe bölünerek hesaplandı.

**Boyut ölçeği (kaynaklardan):**

| Rol | Kaynak değer (1080p) | ≈ Yükseklik % |
|---|---|---|
| Açıklayıcı başlık / formül (3b1b) | 58 / 64 px | 5.4–5.9 |
| Sahne başlığı beyaz tahta | yazı yüksekliği ≈ %5.5 | 5.5 |
| NYT başlık | 5.6vw ≈ 107 px | 9.9 |
| Open-slide ölçeği | 18 · 22 · 28 · 36 · 48 · 64 · 88 · 120 · 160 · 220 | 1.7 → 20 |
| Swiss kapak (aşırı) | 9.6vw ≈ 184 px | 17 |
| Kinetic (demo) ana kelime : yardımcı : etiket | 340 : 96 : 40 px | 3.4 : 1 : 0.4 |
| Swiss gövde / etiket | 14–16 / 11 px (sayfa ölçeği, video değil) | — |

Önemli uyarı: 11–12 px etiket / 10 px kaynak notu değerleri **web sayfası ölçeği** (çok `frame-*` şablonu böyle); video/canvas ölçeğinde (sunum mesafesi) etiketin altına inmemek gerekir. Open-slide ölçeğinde en küçük 18 px (1.7%) ve 22 px (2%); "gövde" 28–36 px (2.6–3.3%) tutulması makul (çıkarım). Etiket/eksen/kaynak notları 18–22 px (en küçük).

**Hiyerarşi kuralları:**
- Sayfa başına **tek görsel ağırlık merkezi** (open-slide); "iki eşit metin bloğu koyma" (3 sütun eşit ızgara hariç).
- Sert boyut kontrastı: ana : yardımcı ≈ 3.4 : 1 (y5); Swiss 9.6vw vs 14–16 px. Orta boy her şey = hiyerarşi yok.
- Başlık = **çıkarım cümlesi** (NYT/finans): grafiğin tarifi değil sonucu.
- Başlık/formül sabit **ekranın üst 1/8'inde** (y≈110–150 px), kamera ile hareket etmez (t1).
- Kenar boşluğu 96 / 128 / 160 px (open-slide), kinetic için ≥130 px.
- Başlıklarda `text-wrap: balance`; sayılarda `tabular-nums` (sayaçlar titremesin); italik inen harfler için satır yüksekliği ≥1.1; harf aralığı: büyük başlıkta sıkı (−0.02…−0.03em), küçük büyük-harf etiketlerde +0.08…0.18em (t2, swiss, frame-*).
- Font: matematik için serif (Computer Modern / CMU Serif); geri kalanı tek sans ailesi; sans+serif karıştırma yok; vurgu için aynı fontun italik/bold'u. `taste-skill`: Inter yerine Geist/Outfit/Satoshi önerisi (kendi tercih, zorunlu değil).

**Metin yoğunluğu:**
- Ekranda anlık **≤ 2 madde** (t1); orta düzey: bir plan başına ekran yazısı **≤ 8 karakter** (storyboard şablonu), ana kelime ≤ 4 harf, yardımcı ≤ 14–16 harf (y5/t2), Çince için "bir ekranda bir başlık satırı + bir not satırı".
- Metin ağırlıklı planlar toplamın **≤ %30**'u; tek tek maddeler Write edilerek liste olursa "siyah zeminde PPT".
- Ses yoksa okuma süresi zamanlamaya dahil edilir: "açığa çıkış süresi okuma süresi değildir" (motion-design).
- Kanıt/okuma çakışması: "Okunacak yazı en üst katmanda ve en son çizilir" (y2); "yan yana duran iki kartın yazısı yanlış bir cümleye birleşmesin" (y2).

**Yerleşim / yoğunluk:**
- Sahne iskeleti sabit (aynı konumlar), değişen tek şey; göz çapa bulur (sanat tarihi mekanizması).
- Grafik alanı canvas'ın **%55–65'i**; ekran görüntüsü varsa genişlik ≥ %80 (t2); üç kartı ortalı sıralama = "AI şablonu" (motion-design: "başlığı ortada üç karta bağlama").
- Çizgi kalınlığı: ekran yüksekliğinin ≈ %0.37 (4 px ağ çizgisi), %0.6–0.7 (el çizimi tahta çizgileri, 6–7 px); ağ bağlantıları 2 px, ızgara ince çizgi 1 px α0.25.
- **Yoğunluk sınırı**: katman başına ≤16 nöron, kalanı `⋮` + süslü parantez (t1); akış diyagramı 5–12 düğüm (flowchart-sticky); tahtada 3–6 grup (y3); grafikte 1 not.
- Renk: tek vurgu rengi (açık/koyu zeminde), **anlamsal renk ≤ 4**, bir renk = bir kavram (t1); "ana karakter renkli, kalanlar gri `#C6D2D8`" (t3); koyu zemin için düz mürekkep/lacivert, mor-mavi gradyan ve parlama yok.
- İlk çözülecek şey **tek temsilci kare** (motion-design).

---

## 5. LLM ajanını animasyonda serbest bırakma: istem kalıpları, yönetmen yapıları

1. **Beat map / çekim tablosu önce, kod sonra.** `time → takeaway → focal object → transformation → copy/audio → exit` (motion-design) ve nesne-İSİM / eylem-FİİL sütunlu tablo (huashu). "Satır yazılamıyorsa plan düşünülmemiştir; kod yazma." Yasak sözcük listeleri (nesne için başlık/madde/kart/arka plan; eylem için "belirir/gösterilir/solarak girer") ajanı slayt dilinden uzaklaştırıyor.
2. **Kapı soruları** (animate / emil): önce "Animasyon olmalı mı? (sıklık)", sonra "Amaç adı?" (Geri bildirim / Mekânsal süreklilik / Durum / Sarsıntı önleme / **Açıklama** / Keyif); adlandıramıyorsa yapma. Sonuç raporu: kapı sonucu + bileşenler + hissedilecek kontrol.
3. **"Yaklaşık değer yok"**: eğri/süre/yay yalnızca tablodan (animate). Ajan hallüsinasyonla "tanıdık" bezier uydurmaz.
4. **Kontrol listesi "başlangıç kontrolü"** her dilbilgisinin başında (t1: "kim kime dönüşüyor?"; t3: "tek şey nedir?"; y1: "görsel metafor nedir?"; y5: "sayı say"). Yazı, ajanın tasarım *öncesi* kendine sorması gereken sorular.
5. **Tek temsilci kare önce** (motion-design / huashu "一帧先行"): zayıf kareyi efekt kurtarmaz.
6. **Kadran sistemi** (taste-skill): `DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY` 1–10; ipucu→kadran tablosu; her bant için kural. "Motion claimed, motion shown."
7. **Tek tasarım sözleşmesi** (reference-design-contract → DESIGN.md): palet, tip ölçeği, easing ve süre token'ları, hareket kuralları, anti-kalıplar; tüm sahneler bundan okur. motion-design de "süre, çerçeve, palet, **tip ölçeği, easing ve sahne zamanlarını tek küçük konfigürasyonda tut**" diyor.
8. **Varsayım belirt, seçenek menüsü sunma**: "Üç stil seçeneği sunma, onay turu isteme; anlamlı varsayımı kısaca belirt." (motion-design) ve "Hareket seçeneklerini menü olarak sunma; karar ver, tek satır gerekçe, kodu yaz." (animate).
9. **Bağımsız denetçi ajan + sınırlı düzeltme**: huashu'da denetçi yalnızca bitmiş videoya bakıp mantık hatası yakaladı; motion-design tersine "en fazla 3 temsilci kare, en fazla bir hedefli onarım, estetik için sayısal puan yok, ayrı kabul ajanı yok" diyor (OD'nin kendi kısıtı). Bizim için ikisinin birleşimi: açıklama doğruluğunu (nedensel model, formül/sayı tutarlılığı) kontrol eden bir inceleme + sınırlı onarım döngüsü (çıkarım).
10. **İnceleme çıktı formatı sabit**: `| Before | After | Why |` + Block/Approve (review-animations). Ajanın kendi sahnelerini eleştirmesi için şablon.
11. **Gözlem ile spesifikasyon ayrımı**: "Neyin gözlendiğini, neyin yalnızca belirtildiğini ayır; ölçüm uydurma." "Çalıştırılabilir dosya, hareket başarısının kanıtı değildir." (motion-design, huashu).
12. **Sembolik "slop" listeleri**: mor-mavi gradient, parlama, ortada başlık + 3 kart, cam kartlar, sonsuz döngü (taste-skill, impeccable, motion-design, y1). Ajan varsayılanlarını (LLM varsayılanları) açıkça adlandırıp yasaklamak.
13. **Lint / otomatik kapı**: `storyboard_lint.py` kırmızı ışıkta kod yok; `qa.py` (hareket %, donmuş kare %, sıçrama sayısı, determinizm). Bizim runtime için: sahnelerin seek-determinizmini ve "bir adımda en çok N nesne / ≤2 madde / ≤8 karakter" gibi sınırları otomatik doğrulayan küçük bir lint (çıkarım).
14. **Anlatı-eylem hizası**: "bir cümle = bir animasyon; fiil geldiğinde başla; 1 s bekle" (t1), "sayı söylendiği anda yerleşir" (t3, t2). Bizim adım metni için: adım açıklama cümlesinin fiili = animasyonun eylemi.
15. **Çalışma kısıtları ve kenar durumları**: Open Design hostu, plan sırasında "sıradan dil ile planla; yazım sırasında kodla" der; planlama-yalnızca isteklerinde artefakt üretme.

---

## 6. Bize uymayacak olanlar (kısa)

- **Ücretli / harici API'ler**: `fal-*` (11 stub), `venice-*`, `sora`, `imagegen`, `imagen`, `nanobanana-ppt`, `replicate`, `pixelbin-media`, `speech`, `ai-music-album`; `huashu` karakter kareleri (AI üretimli kareler, ses klonlama), `oil-motion` (AI video/keyframe üretimi + ffmpeg + Python bağımlılıkları), `ecommerce-image-workflow`, `imagegen-frontend-*`.
- **Video-yalnızca iş akışları**: `motion-design`'ın HyperFrames/MP4 render bölümü (`od media scaffold/generate`), `data-composition-id` sözleşmesi ve ses (`<audio data-start…>`) kuralları; `chat-motion-overlay` (Remotion, MOV/WebM saydam), `hatch-pet`, `8-bit-orbit…` şablonunun harici MP4 vitrin URL'si (`repo-assets.open-design.ai`), `youtube-clipper`, `video-downloader`, `gif-sticker-maker`, `slack-gif-creator`, `remotion`.
- **CDN bağımlılığı**: Çoğu `deck-*` ve şablon "Tailwind CDN" kullanıyor; `huashu` CMU yazı tipi jsDelivr'den; `frame-liquid-bg-hero` WebGL için jsDelivr `regl`. Bizim hedef tek HTML + dış bağımlılık yok (gerekirse GSAP gömülü). `motion-design` GSAP'ı yerel dosya olarak gömme yaklaşımı örnek.
- **Python/Canvas motoru**: huashu'nun `render.py`, `qa.py`, `font_subset.py`, canvas sahne motoru (Canvas tabanlı; biz SVG/HTML tercih ediyoruz). Fikirler (MO/CAM fonksiyonları, deterministik zaman) alınır; motor alınmaz.
- **Scroll tabanlı hareket**: `gsap-scrolltrigger`, scroll-reveal, parallax, sticky-stack: bizim adım/ilerleme tabanlı lab için değil (belki uzun bir "makale modu" için).
- **Jenerik pazarlama ve ürün UI hareketleri**: `taste-skill` hero/bento/marquee kuralları, `stitch-skill`, `login-flow`, `mockup-device-3d`, `web-clone`; sadece ilkeler alınır.
- **"Klavye ile tetiklenen eylem animasyon almaz" kuralı** (animate/emil) ile **bizim adım-ileri tuşu** arasında gerilim: Adımlar içeriğin kendisi; ama tekrar eden tuşa basmada **kesintiye dayanıklı** olmalı: ikinci basış mevcut adımı hızla bitirsin (`tl.progress(1)` ya da `timeScale` artırma) ve sonrakine geçsin (çıkarım, GSAP timeline ile uyumlu).
- **Slayt/PPTX/DOCX üretimi** (`pptx-*`, `docx`, `minimax-*`): hedef dışı.
- **Pazarlama / marka / metin** (`copywriting`, `marketing-psychology`, `paywall-upgrade-cro`, `brand-*`, `domain-name-brainstormer`): hedef dışı.

---

## Ek: Hızlı başvuru, "bu skill'i ne için oku"

| İhtiyaç | Oku |
|---|---|
| Adım adım dönüşüm dilbilgisi (ML, matematik, algoritma) | `huashu-art-motion\references\explainer-grammars.md` → `t1_3b1b` |
| Grafik / veri animasyonu | `explainer-grammars.md` → `t3_finance_chart`, `frame-data-chart-nyt` |
| Ölçekler arası dalış / "içinde ne var" | `explainer-grammars.md` → `y1_kurzgesagt` |
| Argüman zinciri / el çizimi | `explainer-grammars.md` → `y3_whiteboard` |
| Başlık / sonuç kartı tipografisi | `explainer-grammars.md` → `y5_kinetic_type`, `deck-open-slide-canvas` |
| Beat map, hareket gramerinin genel prensipleri | `motion-design\SKILL.md` |
| Çekim tablosu şablonu | `huashu-art-motion\references\craft-workflow.md` → "镜头表模板" |
| `MO`/`CAM` saf fonksiyonlar | `huashu-art-motion\references\canvas-helpers.md` → `motion.js`, `camera.js` |
| SVG animasyon tuzakları | `ui-animation\references\svg-animation.md` |
| "Cansız hissediyor" teşhisi | `ui-animation\references\debugging-symptoms.md` |
| Koreografi (öncü/artçı, over-stretch) | `ui-animation\references\choreography.md` |
| Easing/süre tabloları ve yasaklar | `animate\SKILL.md`, `ui-animation\SKILL.md` |
| GSAP timeline / Flip / DrawSVG / MorphSVG / SplitText | `gsap-timeline`, `gsap-core`, `gsap-plugins` |
| Kendi çıktısını inceleme şablonu | `review-animations\SKILL.md` |
