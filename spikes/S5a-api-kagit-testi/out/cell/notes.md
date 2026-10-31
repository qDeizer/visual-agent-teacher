# Notlar: hücre bölünmesi ve kanser dersi (API kağıt testi)

## (a) Anlatmak isteyip API'nin karşılayamadığı şeyler
- **Gerçek ölçek (2^30 hücre) sahnede çizilemez.** Sahnede en çok onlarca nesne var; milyarlık popülasyon için "yoğunluk/ısı haritası" ya da "N hücreyi temsil eden tek nesne" yok. Sadece `value` chip ile sayı gösterdim; görsel ile gerçek ölçek arasında kopukluk var.
- **Logaritmik eksen yok.** `plot` doğrusal; 2^30'u grafikte göstermek imkansız, bu yüzden grafiği 0..8 tur ile sınırladım.
- **Mutasyonu "DNA'da bir harf değişti" diye göstermek** için DNA dizisi bileşeni yok. Sadece SVG şekli + `part('dna').recolor` kaldı. Aslında kopyalama sırasında hatanın oluşmasını görmek isterdim.
- **Hücrelerin birbirine değmesi (temas engeli) fiziksel olarak ifade edilemiyor.** "Komşusuna değiyor mu?" bilgisi sahnede yok; sadece etiket (`resting`) ve `dim` ile taklit ettim. Kaç komşu değdiğini modelde hesaplayıp gösterecek komponent/yerleşim sorgusu yok.
- **Her hücre için bağımsız zamanlama/rastgelelik** (hücreler aynı anda değil, rastgele zamanlarda bölünür) ifade edilemez; `split` hep eş zamanlı turlar.
- **Hücre ölümü** (apoptoz) ve tümörün gerçekte neden bu kadar hızlı büyümediği: nesneleri `remove` ile silebilirim ama bunu modelle bağlayan "nüfus modeli" yok; metinde dipnot olarak bıraktım.
- **Seçili hücrenin soyunu otomatik renklendirme:** `descendantsOf` var ama tag miras kalmasına rağmen "kök hücreden gelenleri göster" gibi bir soy-ağacı görünümü (ağaç diyagramı) yok. `graph` ile elle kurmak zorunda kalırdım ve sahne hücreleriyle bağlanmaz.
- Bir **animasyonlu "kontrol noktası kapısı"** (sinyal hücreye girip DNA'yı denetleyip geri dönmesi) yok; yalnızca ok + `flow`.

## (b) Kafa karıştıran / belirsiz API kısımları
- **`summary` ile alt adımlar arasındaki ilişki:** Katlanmış (düşük detay) modda `summary` mı yoksa çocuk adımlar mı çalışıyor? İkisi de `split` yaparsa nesne kimlikleri/durum tutarlı mı? Ben aynı işi iki yerde yazdım (yinelenen mantık).
- **Chapter bir `StepBuilder` alıyor ama chapter seviyesi nedir?** Chapter `say`'i "level 1 özeti" mi, chapter doğrudan bir durak mı? Belirsiz.
- **`s.fly` slotu dolduruyor mu?** Uçan değer varınca slot da doluyor mu yoksa ayrıca `formula.fill` gerekir mi? Sonucu (`N`) için `fill`, girdi için `fly` kullandım.
- **`Val` ile `{{id}}`:** `{{n3}}` gibi dinamik id'ler çalışıyor mu? Model döngüyle id üretiyor (`n0..nK`), metinde string birleştirerek çağırdım. `{{tumourPct}}` yüzde formatı için `fmt` kuralı da belli değil.
- **`tolerance` mutlak mı, göreli mi?** 2^30 gibi büyük sayılarda fark önemli. Mutlak varsaydım.
- **Narration içinde Türkçe ek sorunu:** `[[cell]]'den` gibi ekler terimden sonra gelince bozuk görünür (ünlü uyumu terim görünümüne bağlı). Bu yüzden cümleleri eksiz kuracak şekilde yazdım. `[[id]]` için çekim/ek desteği yok.
- **`Obj.tags` içinde `where` kullanımı:** `readonly tags: readonly string[]` olduğu için `includes` kullandım; ayrıca `except('.cancer')` string seçici kabul eder mi emin değildim (`Array<Obj | string>` yazıyor), güvenli olsun diye `where` kullandım.
- **`counter` ve `stage.select`:** sayaç fonksiyonu sahne durumunu *o anki zaman çizgisi konumunda* mı okuyor (Back'te doğru mu)? Varsayım: evet.
- **`camera.magnify` dönen `Obj`:** kalıcı mı, adım sonunda kaybolur mu? Elle `hide()` ettim.
- **`size` biriminin anlamı** (`shape` opts) belirsiz; 60 uydurdum. SVG "~100 birim" diyor ama dünya birimiyle ilişkisi yok.
- **`Plot.point` + `draggable.inputX`:** sadece x sürüklenince y de modelden yeniden hesaplanır mı? Y'yi sabit `d.cap.value` ile verdim; sürüklemede script yeniden çalıştığı için güncellenir diye varsaydım.
- **Aynı bölgeye birden çok nesne** (`top`, `bottom` içinde `u` ile) çakışmayı engelliyor mu? Bölge kapasitesi belirtilmemiş.

## (c) Tahmin etmek zorunda kaldığım davranışlar
- `split({dir:'free'})` dolu bir dokuda (16 hücre) yer bulamazsa ne olur? Komşuları iter mi, üst üste mi biner? Dokunun dolu olduğu yerde mutasyonlu hücrenin bölünmesini bunun çalışacağını varsayarak yazdım.
- `split` sonrası orijinal nesne `c0` ilk çocuk olarak yaşamaya devam ediyor; hücreyi `c0` olarak mutasyona uğrattım (ok `stopArrow` sahnede `c0`'a bağlı olduğu için). Yeni doğan nesnelerin id'leri önceden bilinemediğinden, onlara ok bağlamak/sahnede önceden referans vermek mümkün değil.
- `part('nucleus').jitter/glow/highlight` gibi efektlerin `part` Obj'sinde çalıştığını varsaydım.
- `stagger: 'fast'` `split` seçenekleri için (`SelVerbOpts`) kullanılabiliyor; tohumsuz (deterministik) `sample(3)` her seferinde aynı hücreleri seçiyor varsayıldı.
- Tag mirası: `c0.tag('cancer')` sonrası `split` iki yavruya da etiketi veriyor (API belgesi bunu söylüyor), ama `recolor` de miras kalıyor mu bilmiyorum. Kalıyor varsaydım (yoksa yavrular normal renkte kalırdı). Bu açıkça belirtilmeli.
- Eğri fonksiyonları (`plot.curve`) modelin trace'i dışında; `d.cap.value` kullandım. Kurala göre "ekrandaki her sayı modelden gelmeli" ama eğri fonksiyonunu trace'e bağlayamıyorum.
- `checks.known` için ikinci vaka ağırlıklı olarak matematiksel (2^3=8); gerçek dış kaynak olgusu 1 cm³ ≈ 10^9 hücre ≈ 30 bölünme (Weinberg). Yaklaşık değeri tam 2^30 ile karşılaştırdım; kaynak bile "yaklaşık" diyor.
- Çıktıda `practice.prompt` içinde `{{doublings}}` yazdım; prompt'ta girdi enterpolasyonu varsaydım. Yoksa soru sayı olmadan anlamsız kalır.

## (d) API'de değiştirmek istediklerim
1. **Pratikte sorular için `prompt` bir fonksiyon olsun:** `prompt: (inputs) => string`. Ya da enterpolasyon resmen belgelensin.
2. **Popülasyon bileşeni:** `stage.population({ count: Val, sample: n })` — büyük sayıyı küçük örnekle temsil edip sayacı gerçek sayıya bağlayan, "her nokta ~X hücre" ölçekli bir bileşen.
3. **Log eksen:** `Axis.scale?: 'linear' | 'log'`.
4. **`Plot.curve` için `Val`/trace bağlı veri:** `plot.series(Array<Val>)` ile modelin ürettiği sayıların doğrudan çizilmesi; eğri ile sahne arasında tutarlılık otomatik olsun.
5. **Soy ağacı bileşeni:** `stage.lineage(root)` — `split` ile oluşan ebeveyn/çocuk ilişkisinden otomatik ağaç çizimi (zaten `parent`/`generation` var).
6. **Komşuluk sorgusu:** `obj.neighbours` / `Sel.touching(o)`; temas engeli gibi yerel kuralları modelden değil, yerleşimden okumak için. Ayrıca `split` için "yer yok" durumu davranışı belgelensin.
7. **Chapter/step seviyesini netleştir:** chapter'ın `level` değeri ve `say`'inin hangi detay seviyesinde gösterildiği; `summary` ile çocukların birlikte mi dışlayıcı mı çalıştığı belgelensin.
8. **`recolor`/`tag` mirasını** `split` açıklamasına ekle (görünüm de miras kalıyor mu).
9. **Dinamik `{{id}}` ve biçimleme:** `{{id:pct}}` gibi bir biçim belirteci, `Val.fmt` ile aynı kuralı metinde seçebilmek için.
10. **`[[id]]` için hal eki desteği** (ör. `[[cell|dan]]`) en azından Türkçe için; ya da `GlossaryEntry` içinde çekim ipucu alanı.
