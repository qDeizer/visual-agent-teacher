# Saha araştırması

## 1. Önceki denemeler

Bu projeden önce aynı hedefle iki paralel deneme yapıldı. İkisi de kullanım limitine takılıp yarım kaldı; onaylı bir final paket çıkmadı. Ama ikisi de bağımsız olarak aynı sonuca vardı: **sadece kural yazan bir skill yetmiyor, hazır bir motor gerekiyor.**

### Deneme A — Claude director döngüsü (v1 → v5, yarım v6)

- **Yaklaşım:** Hazır HTML şablonu (animasyon motoru, tasarım sistemi, anlatıcı, formül satırı, alıştırma ekranı); AI yalnız konu içeriğini doldurur. Kurallar `SKILL.md`'de, tarayıcıyı süren bir QA betiği ekran görüntüleriyle kontrol eder.
- **Denenen konular:** MLP ileri yayılım, Perceptron, k-NN, MAE, gradyan inişi, k-fold çapraz doğrulama, MLP tanh.
- **Çözülenler:** gereksiz sorular, "ne/neden" eksikliği, terim açıklamaları, dev Devam düğmesi, ani geçişler, sayfanın en üste zıplaması.
- **Açık kalanlar:** tasarım puanı 4–6/10'u geçmedi; hareket fikri göstermiyor (gradyan inişinde top eğri üzerinde yuvarlanmıyor, kayıyor); "canlı çalışan simülasyon" hissi eksik; AI hâlâ koordinat hesabıyla uğraşıyor.

### Deneme B — Codex director döngüsü (v5 → v13)

- **Yaklaşım:** Daha katı. Model motora dokunmaz; her hesap adımını kaynağı, işlemi ve sonucuyla bir **hesap kaydına** yazar; animasyon bu kayıttan üretilir. Ders sabit sırayla ilerler: Soru → Ne → Neden → Parçalar → Harita → Yöntem → Karar → Sonuç → Kalıp → Alıştırma.
- **Denenen konular:** Perceptron, karışıklık matrisi — her tur reddedildi; hatalar çoğunlukla matematik doğruluğu ve sınır durumlarında.
- **Alınacak süreç fikirleri:**
  - Üretici yalıtımı (yalnız skill + konu)
  - Sürümleri dondurma ve parmak iziyle kaydetme; test edilen dosyanın test sırasında değişmediğini doğrulama
  - Üç ayrı denetim: otomatik test + tasarımcı incelemesi + director'ın matematiği bağımsız hesapla kontrolü
  - "Otomatik test geçti" tek başına onay sayılmaz
  - Her bulgunun sorumlusu belirlenir (konu / skill / motor / test aracı)
  - Sınır durumlarını tarama (tüm izinli girdi kombinasyonlarını bağımsız hesapla karşılaştırma)

## 2. Open Design skill'leri

Open Design uygulamasıyla gelen 169 skill tarandı. İşe yarayanlar:

| Skill | Alınacak şey |
|---|---|
| huashu-art-motion | 9 anlatım tarzı; özellikle 3Blue1Brown tarzı: kavram bir sonrakine dönüşür, her kavramın rengi vardır, ekranda en fazla 2 madde |
| animate | Hazır geçiş eğrileri (`cubic-bezier(0.23,1,0.32,1)`), süre tablosu (100–300 ms), "bu hareket etmeli mi?" kapısı, `ease-in` yasağı |
| review-animations | 10 maddelik hareket inceleme listesi |
| ui-animation | Sıralı giriş (stagger), adım geçişleri, SVG çizgi çizdirme tarifleri |
| emil-design-eng | "Görünmez detaylar" felsefesi, Önce/Sonra/Neden inceleme formatı |
| gsap-timeline / gsap-performance | Zaman çizelgesi mantığı; yalnız transform ve opacity canlandırma |
| impeccable-design-polish | "Yapay zekâ izleri" listesi (amaçsız degrade, dev kartlar, tutarsız boşluk) |
| minimalist-ui | Sakin palet, soluk vurgular, neredeyse görünmez gölgeler |
| web-design-guidelines | Erişilebilirlik, odak, kontrast kontrol listesi |
| frame-flowchart-sticky / frame-data-chart-nyt | Akış şeması bağlantıları, grafiklerin sırayla belirmesi |

**Ortak fikirler:** kavram = renk (formüldeki sembol ile görseldeki nesne aynı renk), kesme değil dönüşüm, her hareketin gerekçesi olsun, tek hareket dili, bitirmeden önce inceleme kapısı.

**Uymayanlar:** ücretli servisler (fal, sora, replicate, imagen...), CDN'den kütüphane yükleyenler (tek dosya kuralını bozar), "ajans estetiği" isteyen skill'ler (sakin bir öğretim ortamıyla çelişir). d3, threejs, remotion, color-expert, hand-drawn-diagrams yalnızca boş katalog kaydı.

## 3. Hazır araçlar ve ilham kaynakları

Birebir "AI için etkileşimli öğretim lab'ı" yapan olgun bir sistem bulunamadı. Parçalar için ilham:

| Kaynak | Ne alınır |
|---|---|
| **Manim** (3Blue1Brown) | Fiil sözlüğü: Create, Transform, FadeOut, Indicate, Arrow; formül parçalarını eşleyerek dönüştürme |
| **[Lantern](https://github.com/ivarvong/lantern)** | Manim çekirdeğinin tarayıcıda çalışan bağımlılıksız JS sürümü; `this.step(name)` ile adımlara bölünmüş sahne; Mermaid'den otomatik yerleşim. Henüz olgun değil. |
| **Motion Canvas** | Esnek kutu düzeniyle koordinatsız yerleşim |
| **Penrose** | "Şu şunun içinde, şu şuna bağlı" diye anlatılan diyagramın otomatik yerleşimi |
| **[Diagramatics](https://github.com/ray-pH/diagramatics)** | Matematik/fizik için etkileşimli diyagramlar |
| **Mermaid / dagre / ELK** | Akış şeması ve ağ yerleşim algoritmaları |
| **Mafs / JSXGraph** | Etkileşimli koordinat düzlemi |
| **GSAP** | Hareket katmanı |

### AI + animasyon projelerinden ders

[Manimator](https://github.com/nabin2004/Manimator), ManimCat, Math-To-Manim (Claude Code skill'i olarak paketlenmiş) ve [PhysicsSolutionAgent](https://arxiv.org/pdf/2601.13453) gibi projelerin ortak akışı: planla → kodla → çalıştır → hatayı düzelt. Ortak bulgu: **AI ham animasyon kodunu güvenilir yazmakta zorlanıyor.** Bu, AI'a küçük hazır fiiller verme kararımızı destekliyor.
