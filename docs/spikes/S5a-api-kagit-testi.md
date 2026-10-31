# S5a: API kağıt testi

**Soru:** Motor yazılmadan önce, yalnız API tanımı (`engine-api.d.ts`) ve rehberle (`engine-guide.md`) bir üretici ajan bu API'yi doğru kullanabiliyor mu? API'nin anlatamadığı neler var?

**Düzen:**
- Üç ayrı Sonnet (medium) ajan çalıştı. Birbirini görmedi; yalnız iki API dosyasını okuyabildi.
- Tip denetleyicisi ya da build kullanmalarına izin verilmedi (ilk taslağın ham hata oranı ölçülsün diye).
- Konular türce farklı seçildi:
  - **MLP ileri yayılım:** sayısal.
  - **TCP el sıkışma:** protokol, sayısal olmayan olaylar.
  - **Hücre bölünmesi ve kanser:** nesne, bölünme, seçim, kamera.
- Dosyalar: `spikes/S5a-api-kagit-testi/out/{mlp,tcp,cell}/`.

## Sonuçlar

**API hata oranı:** Toplam **927 satırda 1 tip hatası** çıktı (`tsc --checkJs`). O tek hata da ajanın değil API'nin eksiği: `Sel.highlight` seçeneğinde `style` yok, ama `Obj.highlight`'ta var.

**Denetleyicinin kendi testi:** Bilerek hatalı yazılmış bir dosyada uydurma fiil, piksel koordinatı, modelde olmayan alan ve olmayan adım fonksiyonu hatalarının dördünü de yakaladı. Yani düşük hata sayısı denetleyicinin kör olmasından değil.

| | MLP | TCP | Hücre |
|---|---|---|---|
| Satır | 349 | 237 | 341 |
| Bölüm / adım / anlatım | 7 / 20 / 27 | 6 / 19 / 25 | 10 / 24 / 34 |
| Seviye 3 (mikro) adım | 5 | 4 | 8 |
| Sözlük terimi | 24 | 22 | 16 |
| `fly` (sayı uçuşu) / kamera | 4 / 3 | 6 / 0 | 1 / 8 |
| Kaçış kapısı kullanımı | 0 | 0 | 0 |
| Yasak API (random, Date, timer, await) | 0 | 0 | 0 |
| Dış kaynaklı doğrulama | Matt Mazur backprop örneği | RFC 9293 | Weinberg (1 cm³ ≈ 10⁹ hücre ≈ 30 bölünme) |

**Yorum:**
- Hazır fiil yaklaşımı kağıt düzeyinde güçlü bir sinyal veriyor. Üç farklı alanda da ajanlar API'yi neredeyse hatasız kullandı ve hiç kaçış kapısına ihtiyaç duymadı.
- **Sınırlar:**
  - Tip denetimi anlamsal yanlış kullanımı yakalamaz. Örneğin `practice.prompt` içinde `{{doublings}}` kullanılması tip olarak geçerli, ama API bunu desteklediğini söylemiyor.
  - Gerçek motor olmadan "çalışıyor mu" sorusu cevapsız. Bu S5b'nin işi.

## Üç ajanın ortak takıldığı yerler (API belgesindeki boşluklar)

Üç ajan bağımsız olarak aynı belirsizliklere takıldı. Bu, sorunun API tarafında olduğunu gösteriyor:

1. **Bölümün seviyesi ve anlatımı:** Bölüm (`chapter`) bir durak mı, `say`'i hangi seviyede görünür?
2. **Sıra:** Bir adımın doğrudan fiilleri ile alt adımları hangi sırayla oynar?
3. **`summary` ile alt adımların ilişkisi:** Birbirinin yerine mi geçer, birlikte mi oynar? (Hücre ajanı aynı mantığı iki kez yazmak zorunda kaldı.)
4. **`fly` ile `formula.fill`:** `fly` yuvayı dolduruyor mu? (İki ajan güvenli olsun diye ikisini birden çağırdı.)
5. **`{{…}}` işaretlemesi nerede çalışıyor?** Bileşen etiketleri, alıştırma soruları?
6. **`tolerance`:** Mutlak mı, göreli mi?

## API'nin ifade edemedikleri

| İhtiyaç | Kim istedi | Öneri |
|---|---|---|
| `neuralNet` değerleri spec'ten alsın (girdi, ağırlık, sapma, aktivasyon) | MLP | `values: {…}` alanı, `Val` kabul eden |
| Kenar kalınlığı ve rengi değere bağlı olsun (\|w\|, işaret) | MLP | `edgeStyle: 'by-value'` |
| Hazır trace yardımcıları (`dot`, `sigmoid`, `neuron`) | MLP | `t.dot`, `t.sum`, yaygın fonksiyonlar |
| Mesajın üzerinde gidip gelen ya da kaybolan "paket" nesnesi | TCP | `sequence.packet(msg)` |
| Yapılandırılmış mesaj alanları (flags/seq/ack) ve etiketlerde `{{…}}` | TCP | `message(from, to, { flags, seq, ack })` |
| Olay içeriği (payload) `Val` tutsun, `known.expect` olay alanlarını da kontrol edebilsin | TCP | `'msg2.ack': 101` gibi anahtarlar |
| Mesajla tetiklenen durum geçişleri (iki durum makinesi arasında bağ) | TCP | `stateMachine` ↔ `sequence` bağı |
| Büyük sayı aralığı ve log ölçekli girdi | TCP, Hücre | `InputSpec.scale`, `Axis.scale: 'log'` |
| Milyarlık popülasyonu küçük bir örnekle temsil etmek | Hücre | `stage.population({ count, sample })` |
| `split` ile oluşan soydan otomatik soy ağacı | Hücre | `stage.lineage(root)` |
| Komşuluk sorgusu (temas engeli) | Hücre | `obj.neighbours`, `Sel.touching(o)` |
| Eğrinin modelden gelmesi | Hücre | Model saf fonksiyon da dışa verebilsin (`model` → `{ fns: { growth } }`) ya da `plot.series(Val[])` |
| **Türkçe ek sorunu:** `[[cell]]'den` bozuk görünüyor | Hücre | `[[cell\|hücreden]]`: görünen metni ezen sözdizimi. **Önemli; Türkçe'nin tamamını etkiler.** |
| Biçim belirteci (`{{x:pct}}`) | Hücre | `{{id:pct}}`, `{{id:2}}` |
| Alıştırma sorusunun girdilere göre değişmesi | Hücre | `prompt: (inputs) => string` |
| 5 kavram rengi sınırı katı | TCP | Sert hata yerine uyarı |
| `recolor` `split` ile miras kalıyor mu? `split` yer bulamazsa ne olur? | Hücre | Belgelenmeli |

## Kurallara uyum

- **Ders içinde soru:** Hiçbir ajan ders içinde öğrenciye soru sormadı; tahmin soruları yalnız alıştırmada.
- **"Her sayı modelden gelir" kuralı:** Hücre ajanı eğriyi modelin dışındaki bir fonksiyonla çizdi ve bunu kendisi not etti. Kural eğriler için fazla katı: bir eğri "sayı" değil, bir fonksiyon. Çözüm: model saf fonksiyonları da dışa verebilmeli.
- **Doğrulama:** Üçü de gerçek bir dış kaynak gösterdi. MLP ajanı değerleri hafızadan yazdığını dürüstçe belirtti. Kontrol ettim: Mazur örneğinin ileri geçiş değerleri doğru (z₁ = 0.3775, y = 0.75136507).

## Karar

- **Hazır fiil yaklaşımı:** Devam. Kağıt testi yaklaşımı destekliyor.
- **API v0.1:** Yukarıdaki ortak belirsizlikler kesin kurallarla yazılacak, eksikler eklenecek. Önce yürütme semantiği gelir (1–4), çünkü motorun derleyicisi tam olarak bunu uygulayacak.
- **S5b (gerçek A/B):** S1 prototipinden sonra yapılacak. Kağıt testi DSL lehine yanlı olabilir: ajan yalnız API'yi okudu, çalıştırmadı.
