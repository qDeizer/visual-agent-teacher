# Mimari kararlar

Bu belge şimdiye kadar alınan kararları ve gerekçelerini tutar. Kod yazıldıkça ayrıntılanır.

## 1. Katmanlar

```
┌──────────────────────────────────────────────┐
│ Ders içeriği     AI yazar, her derste yeni   │  ne anlatılacak, hangi sırayla, hangi veriyle
├──────────────────────────────────────────────┤
│ Bileşenler       bu repo, bir kez yazılır    │  sinirAgi, tablo, grafik, izgara, hucre, akis...
├──────────────────────────────────────────────┤
│ Temel nesne      bu repo, bir kez yazılır    │  kalıcı nesne + fiiller + efektler + seçim
├──────────────────────────────────────────────┤
│ Öğretim çekirdeği bu repo                    │  adımlar, detay/hız, geri alma, alıştırma, terimler
├──────────────────────────────────────────────┤
│ Hareket           GSAP (dosyaya gömülü)      │  zamanlama, geçiş eğrileri, SVG animasyonu
└──────────────────────────────────────────────┘
```

**Gerekçe:** AI'ın ham animasyon kodu yazması hem dikkatini konudan uzaklaştırıyor hem de her derste farklı hatalar üretiyor. Hareket katmanı çözülmüş bir problem (GSAP); öğretim katmanını ise hiçbir hazır araç sağlamıyor — bu yüzden onu biz yazıyoruz.

**GSAP neden:** Sektör standardı, ücretsiz, AI'lar çok iyi biliyor, uzun zaman çizelgeleri ve eğri üzerinde hareket hazır. Tek dosya kuralını bozmamak için dosyanın içine gömülür. AI GSAP'ı doğrudan çağırmaz; bizim fiillerimizi çağırır.

## 2. Kalıcı nesne modeli

- Bir nesne **bir kez** oluşturulur, ders boyunca yaşar; sadece durumu değişir.
- Fiil bittiğinde nesne olduğu yerde kalır; sonraki fiil oradan devralır.
- AI kendi SVG şeklini tanımlayabilir; `class` verdiği parçalara ayrıca erişebilir.

```js
const bakteri = sahne.ekle('bakteri', { sekil: BAKTERI_SVG, renk: 'canli', yer: 'orta' })
await bakteri.tasi('sag-ust')
await bakteri.parlat()
await bakteri.parca('cekirdek').vurgula()
```

### Fiiller (ilk liste)

| Grup | Fiiller |
|---|---|
| Hareket | `tasi`, `along` (eğri boyunca), `kaydir`, `buyut`, `geriDon` |
| Görünürlük | `goster`, `gizle`, `soldur`, `canlandir` |
| Dikkat | `vurgula`, `nabiz`, `cercevele`, kamera |
| Çizim | `ok`, `bagla`, `ciz` (kendini çizen çizgi), `etiket` |
| Sayı | `say` (artarak/azalarak gelir), formül yuvasını doldur, `ucur` (sayıyı formüle uçur) |
| Yaşam | `bol`, `etiketle` |

### Durum efektleri

Açılınca kapatılana kadar sürer; nesne başka fiil çalıştırırken de devam eder.

| Efekt | Örnek |
|---|---|
| `parlat()` | aktif nöron, seçili hücre |
| `titre()` | kararsız değer, ısınan parçacık |
| `nefes()` | canlı hücre, bekleyen düğüm |
| `akis()` | kablodaki veri, sinyal yönü |

### Bölünme

Şekil matematiksel olarak ikiye ayrılmaz (gereksiz karmaşıklık). Bunun yerine:

1. Hücre uzar, ortası incelir.
2. Motor tam aynı yerde bir kopya oluşturur — görsel olarak hiçbir şey değişmez.
3. İkisi ters yönlere ayrılıp normal şekline döner.

Asıl nesne birinci yavru olarak yaşamaya devam eder. Her nesne **soy**, **kuşak** ve **etiket** taşır; etiketler yavrulara miras kalır.

## 3. Seçim dili

Sahnedeki her nesne tek tek veya grup olarak seçilir; fiil seçilenlerin hepsine uygulanır. (CSS seçicileri / jQuery / D3 kalıbı — AI'lar bunu iyi bilir.)

| Seçim | Anlamı |
|---|---|
| `sahne.sec('hucre')` | tüm hücreler |
| `sahne.sec('.kanser')` | etiketi kanser olanlar |
| `.haric('h3')` | hariç tutma |
| `.kusak(3)`, `.soyu(x)` | nesil / soy |
| `.ilk()`, `.son()`, `.rastgele(n)` | tekil seçim |
| `.filtre(fn)` | değere göre |

`{ sirali: ms }` seçeneği fiili nesnelere arayla uygular.

```js
const k = sahne.sec('hucre').kusak(3).ilk()
await k.etiketle('kanser')
for (let i = 0; i < 4; i++) await sahne.sec('.kanser').bol({ yon: 'bosluga' })
```

## 4. Bileşenler veriyle beslenir

```js
const ag = sahne.sinirAgi({ katmanlar: [2, 5, 1], gizli: true })
ag.agirliklar(W); ag.girdi([0.5, 0.8])
await ag.katman(0).goster()
await ag.ileriYayilim({ adimAdim: true })
```

Başka bir örnek için ağ yeniden çizilmez; yalnız veri değişir. **Alıştırma modu** bu sayede kendiliğinden çıkar: öğrencinin girdiği yeni değerlerle aynı anlatım yeniden çalışır.

## 5. Motorun AI'dan aldığı yükler

- Yerleşim ve çakışma önleme (koordinatsız yerleşim)
- Renklerin tasarım sisteminden gelmesi, etiket mirası
- Her adım sonunda durum kaydı → "Geri" tuşu
- Hız ayarı, duraklatma, "Devam"a basınca animasyonu anında tamamlama
- Nesne sayısı artınca ölçekleme / kamera

## 6. Kaçış kapısı

Kütüphanenin kapsamadığı bir görsel gerekirse AI düz SVG yazabilir. Döngüde tekrar eden ihtiyaçlar yeni bileşen olarak kütüphaneye eklenir (açık/kapalı prensibi).

## 7. Tasarım prensipleri

Yapı bilinçli olarak SOLID ve clean code prensiplerini izler:

| Prensip | Karşılığı |
|---|---|
| Tek sorumluluk | Motor *nasıl*, ders *ne* anlatılacağını bilir |
| Açık/kapalı | Yeni konu → yeni bileşen; motor değişmez |
| Yerine geçebilme | Bakteri, nöron, tablo hücresi aynı fiillere aynı şekilde cevap verir |
| Arayüz ayrımı | Küçük, tek işli fiiller |
| Bağımlılığın tersine çevrilmesi | AI GSAP'a değil fiillerimize bağlı |

## 8. Skill yapısı

Başlangıçta **tek skill**:

```
skill/
├── SKILL.md              ← akış + her derste geçerli kısa kurallar
├── references/
│   └── formulas.md       ← formül sunumu (konudan bağımsız)
├── assets/
│   └── lab-template.html ← motor + şablon
└── scripts/
    └── qa.mjs            ← otomatik test
```

- Her derste geçerli kurallar `SKILL.md`'de; yalnız bazı durumlarda gerekenler `references/` altında ve `SKILL.md`'den açıkça yönlendirilir.
- `domains/` (alan tuzakları), `motion.md`, `design-system.md` gibi dosyalar ancak ihtiyaç doğunca ayrılır.
- `SKILL.md` "nasıl anlatılır" sorusunu, `scripts/` "doğru mu" sorusunu cevaplar.
