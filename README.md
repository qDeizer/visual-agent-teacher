# Visual Teacher Agent

Herhangi bir konuyu — makine öğrenmesi, bilgisayar ağları, fizik, istatistik, biyoloji, kodlama, sistem mimarisi — **etkileşimli, görsel ve adım adım ilerleyen bir öğrenme laboratuvarına** dönüştüren bir AI ajan skill'i ve onun çalıştığı ortam.

Amaç, bir konuyu öğrenirken düz metin okumak yerine o konunun **çalışan bir modelinin** içinde dolaşmak: sayıların formüllere nereden geldiğini görmek, her terimi anlamak, süreci kendi hızında ve kendi detay seviyesinde izlemek, sonra aynı problemi başka değerlerle kendin çözmek.

## Temel fikir

AI'a sıfırdan HTML ve animasyon kodu yazdırmak yerine ona **hazır bir sahne ve fiil kütüphanesi** veriyoruz. AI sadece *ne anlatılacağını* yazar; *nasıl çizileceği ve hareket edeceği* motorun işidir.

```js
const ag = sahne.sinirAgi({ katmanlar: [2, 3, 1] })
ag.girdi([0.5, 0.8])

await ag.dugumler().haric('h1').soldur()
await ag.dugum('h1').parlat()
await ag.ileriYayilim({ adimAdim: true })
```

```
Ders içeriği   → AI yazar      (konu, sıra, anlatım, veri)
Bileşenler     → bu repo       (sinirAgi, tablo, grafik, izgara, hucre, ...)
Temel nesne    → bu repo       (tasi, parlat, titre, bol, soldur, ...)
Hareket        → GSAP          (zamanlama, eğriler)
```

## Durum

🚧 **Tasarım aşaması.** Henüz çalışan kod yok; gereksinimler ve mimari kararlar yazıya dökülüyor.

## Belgeler

| Belge | İçerik |
|---|---|
| [docs/ISTEKLER.md](docs/ISTEKLER.md) | Kullanıcı istekleri ve kabul ölçütleri — projenin pusulası |
| [docs/MIMARI.md](docs/MIMARI.md) | Alınan mimari kararlar: katmanlar, nesne modeli, seçim dili, skill yapısı |
| [docs/ARASTIRMA.md](docs/ARASTIRMA.md) | Saha araştırması: önceki denemeler, hazır araçlar, ilham kaynakları |

## Planlanan yapı

```
skill/                     ← kurulacak Claude skill'i
├── SKILL.md
├── references/
├── assets/                ← lab şablonu + motor
└── scripts/               ← otomatik test (QA)
engine/                    ← motorun geliştirme kaynağı
playground/                ← deneme sayfaları (bakteri, nöral ağ, ...)
runs/                      ← üretim + inceleme döngüsü çıktıları
docs/
```
