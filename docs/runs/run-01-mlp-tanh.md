# Üretim testi 01: MLP ileri yayılım (tanh)

## Düzen

| | |
|---|---|
| Tarih | 31.10.2026 |
| Ajan | Claude Code (3P), gateway modeli `Opus-6` |
| Skill sürümü | v0.1 (`visual-agent-teacher-runs/skill-v0.1`, yalıtılmış kopya) |
| Konu | Kullanıcının ders slaytındaki çözümlü örnek ("Ders 7 — MLP ileri yayılım") |
| Örnek | tanh aktivasyonu, bias girdisi x₀ = −1, katmanlar [2 → 2 → 3 → 1], hata E = ½(y − out)² |

Ajan, slayttaki tüm ara değerleri (`checks.known`) ve gerçek çıktıyı doğru verdi.

## Sonuç

- **Ders tamamlandı.** QA 0 hata ve 0 uyarıyla geçti. 13 bilinen değer kontrolü geçti (slayttaki değerler). 52 nesne var.
  - Durak sayıları: özet 7, normal 18, mikro 29.
  - Normal detayda süre 50 saniye.
- **Çalışma:** 115 tur, 11 build, 14 QA turu, 18 ekran görüntüsü incelemesi. Gateway'in raporladığı maliyet ~10,6 $.
- **Ajan durdu:** API hatası 400 ("upstream service could not complete the request").
  - **Sebep:** Sağlayıcı istek başına en fazla 16 görsel kabul ediyor. Ajan 18 ekran görüntüsü okumuştu.
  - Bu yüzden son adımdaki `notes.md` yazılamadı.
- **Davranış:** Ajan dersi kendi başına derledi, test etti ve görsel olarak düzeltti. Ağ ile grafiğin çakıştığını kendi fark edip düzeltti. Özet ve mikro seviyelerini görmek için kendi küçük ekran görüntüsü betiğini yazdı.

## Bulgular ve yapılan düzeltmeler

| Bulgu | Kimin sorunu | Düzeltme |
|---|---|---|
| Sınırsız görsel okuma, sağlayıcının 16 görsel sınırına takıldı | Skill | `qa.mjs --sheet`: 6 durak tek görselde (kontak sayfası). SKILL.md ve rehbere "en fazla 8 görsel" bütçesi eklendi. |
| QA ekran görüntüsünü yalnız normal detayda alıyor; ajan özet/mikro için kendi betiğini yazdı | Skill | Açık iş: QA'ya `--levels` seçeneği eklenecek. |
| Ajan motorun derlenmiş kaynağını 13 kez taradı (`neuralNet`'in bias gösterimi, `roleVar` vb.) | Belgeler | Rehbere "Component notes" eklendi: neuralNet parçaları ve iki bias gösterimi (nöron başına b / x₀ = −1). |
| Anlatımda ve formül kelime satırında elle yazılmış sayılar ("0.4·(−1)"): girdi değişince eskiyor, Türkçe ondalık virgülüyle tutarsız | Ders (kural ihlali), lint yakalamıyordu | Lint eklendi: ders dilinin ayırıcısına aykırı elle yazılmış ondalık sayı uyarı veriyor. Bu derste 10 yer yakaladı. |
| Ağırlık çipi kesişen iki kenarın tam ortasına düşüp belirsiz oluyor ("0,7" hangi kenarın?) | Bileşen | Çipler kaynağa yakın, kademeli konumlara (kenarın %20–52'si) taşındı. |
| Formülde dolmamış yuvalar serif sembol, dolmuş olanlar kalın sans gösteriliyor | Tasarım (küçük) | Açık iş. |

## Kullanıcı için

Ajanın dersi (güncel motorla yeniden derlenmiş hali) `playground/run-01/lab.html` dosyasında. Tarayıcıda açılabilir.
