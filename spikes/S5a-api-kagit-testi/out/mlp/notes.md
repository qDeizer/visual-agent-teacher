# MLP dersi: API notları

## (a) Anlatmak istediğim ama API'nin ifade edemediği şeyler
- **Vektör/matris görünümü** (`z = W·x + b`, tüm katman tek hamlede) yok. Table/Grid var ama nöronlarla bağı yok.
- **Kenar kalınlığı/rengi değere göre** (ağırlığın büyüklüğü ve işareti) değişemiyor. `recolor` yalnızca glossary rolü alıyor; "pozitif/negatif" için iki sahte rol gerekirdi.
- **Plot üzerinde z'den eğriye dikey çizgi**: `plot.segment` statik; nöron değişince taşınıp taşınamayacağı belirsiz, sadece işaretçiyi `moveTo` ile taşıdım.
- **Tinkering göstergesi**: bir girdi/ağırlık değişince hangi kenarın etkilendiğini vurgulama yok; `draggable` sadece plot noktalarında. Ağdaki bir kenarı sürükleyerek ağırlığı değiştirmek isterdim.
- **Hesap kartı**: bir nöronun çarpımlarını alt alta gösteren mini tablo (Val'lar uçarak satıra gelsin). `table.addRow` var ama fly ile birlikte tarifi yok.
- `inset` bölgesinin boyutu/konumu üzerinde kontrol yok (sigmoid eğrisini ağın yanına koymak için kullandım).
- Çıktının anlamı (ör. "0.75 = %75 evet") için bir gösterge (gauge/bar) yok; `value` çipi yetersiz.

## (b) Kafa karıştıran / belirsiz yerler
- `neuralNet` spec'i **sayı almıyor** (girdi, ağırlık, sapma, aktivasyon). Değerleri `nodeValue/weight/bias(...).setValue` ile script'te yerleştirdim. Scene'de mi script'te mi yapılmalı? Scene'de verb çağırmak geçerli mi?
- `nodeValue('h1')` başta boş mu, model'den otomatik mi doluyor?
- `s.fly(from, slot)` slotu dolduruyor mu yoksa sadece animasyon mu? `formula.fill` ile örtüşüyor; ikisini de çağırdım.
- `fly(Val, ...)`: "bir Val'ın gösterildiği yer" ne demek, hiçbir yerde gösterilmiyorsa?
- Chapter bir `StepBuilder` alıyor: chapter'ın kendi `say`'i ve seviyesi ne? Ben chapter say'ini düzey-1 özet kabul ettim. Chapter içinde `level: 1` ve `level: 2` karışık kullandım; bir chapter'ın doğrudan çocuğu olan level 2 step, detay 1 seçilince nasıl katlanıyor?
- Ebeveyn `say` çocuklardan önce mi çalışır? Ben önce yazdım.
- `s.summary` yalnızca çocuklar katlanınca mı oynar, çocuk animasyonlarının yerine mi?
- `hidden: true` neuralNet'te `net.show()` ile alt parçaların (kenar, sapma, çip) hepsi birlikte mi görünür?
- `checks.known.expect` anahtarları yalnızca türetilmiş id'ler mi, `input` id'leri de olabilir mi? `tolerance` mutlak mı bağıl mı (mutlak varsaydım)?
- `inputs` anahtarlarının trace id'leriyle aynı olması gerekiyor mu (ben aynı tuttum).
- `practice.tasks.answer` string ama "trace id" olarak yorumladım; `id` alanıyla ilişkisi net değil.
- `{{valId}}` metin içinde Val.id ile eşleşiyor; model her yeniden çalışınca aynı id'ler bekleniyor. Aynı id'nin hem input hem trace olarak kullanımı (ör. `x1`) çakışmaz diye varsaydım.
- Module düzeyinde yardımcı (`sigmoid`) tanımlamak serbest mi? Model ve scene'deki `plot.curve` aynı fonksiyonu paylaşıyor; bu, "her sayı model'den gelmeli" kuralını biraz gevşetiyor.

## (c) Tahmin ettiğim davranışlar
- `setValue(Val)` Val değişince (tinkering sonrası yeniden çalıştırma) doğru güncellenir.
- `weights: 'on-focus'` ile `highlight()` edilen kenarın/ağırlığın etiketi görünür.
- `net.bias('y1')` çıktı nöronu için de var; `bias: true` girdi hariç her nöron için.
- `net.edges()` tüm kenarları seçer; `flow(true)` hepsini akıtır.
- `stage.value(..., { at: { near: net.node('h1') } })` geçerli; `Graph.node()` Obj döndürüyor.
- `s.together` içindeki `fly`lar eşzamanlı oynar.
- `camera.focus(..., { padding: 'md' })` geçerli.
- Helper fonksiyon (`neuronSteps`) script içinde tanımlanabilir; script senkron.
- Aynı slot id'lerini (`x1`, `w1`, `b`...) her nöron için yeniden kullanmak serbest, `formula.show` yenisini koyunca eskisi silinir.
- `fmt` Türkçede ondalık virgül mü nokta mı kullanır bilmiyorum.
- Step içinde, çocuk step'lerden sonra yazılan doğrudan verb'ler (ör. `plot.hide()`) sıralı olarak ebeveynin timeline'ına eklenir mi emin değildim; bu yüzden temizliği ayrı bir level-3 `-tidy` step'ine koydum. Bu yapay: level 1/2'de temizlik gözükmeyebilir.

## (d) Değiştirmek istediklerim
1. `NeuralNetSpec`'e değer alanı: `values: { inputs, weights, biases, activations }` (Val kabul etsin).
2. Ortak "nöron hesabı" bileşeni ya da `t.neuron(id, inputs, weights, bias, act)` kısayolu; ağırlıklı toplam çok yaygın bir kalıp. En azından `t.sum` ve `t.dot`, `t.sigmoid` gibi hazır fonksiyonlar.
3. `fly` ile `fill` birleşsin veya fly'ın slotu doldurduğu yazılsın.
4. Chapter için level/say kuralı açık yazılsın; step içinde çocuk ve doğrudan verb'lerin sırası belgelensin.
5. `Val` için "nerede gösteriliyor" sorgusu ya da `fly` için sadece Obj/Val değil `{ val, from }`.
6. Kenar stilinin değere bağlanması (kalınlık = |w|, renk = işaret).
7. `practice.tasks` için `answer: { trace: 'y' }` gibi açık alan; birimli/ondalık biçim ve tolerans türü belirtilsin.
8. `fn(id, name, f, ...)` içindeki `name` ne için kullanılıyor (hover'da formül adı mı) yazılsın.

## Karar notları
- Bilinen durum: Matt Mazur, "A Step by Step Backpropagation Example" (2015). Değerleri (z1=0.3775, a1=0.593269992, z2=0.3925, a2=0.596884378, zo=1.105905967, y=0.75136507) hafızadan yazdım; çevrimiçi doğrulamadım (kural gereği başka kaynağa bakmadım). Mazur'un w1..w4 = w11,w21,w12,w22; w5,w6 = v1,v2; ortak 0.35 sapmasını iki gizli nörona ayrı b1=b2=0.35 olarak verdim; ikinci çıktı nöronu (o2) yok sayıldı.
- Sapma nöron başına (neuralNet `bias` bunu varsayıyor).
- Adımların seviyeleri: chapter/ana nöron step'i level 1, ağırlıklı toplam ve aktivasyon level 2, tek tek çarpımlar ve sigmoid eğrisi level 3.
- Derste soru sorulmadı; tahmin sorularını yalnızca `practice`'e koydum. Pratikte hesap makinesi gerekir; bunu prompt'larda belirtmedim.
