# TCP dersi: API notları

## (a) Anlatmak isteyip API'nin veremediği şeyler
- Paketin yolculuğu: sequence bileşeni mesaj oklarını gösteriyor ama okun üzerinde bir "paket" nesnesinin gidip gelmesini (ya da kaybolmasını) ifade edemedim. `along` yalnızca yol/fonksiyonla çalışıyor, sequence mesajına bağlanamıyor.
- Paket başlığı: SEQ, ACK, bayraklar gibi alanları içeren, mesaja bağlı bir paket şeması için hazır bileşen yok. `table` ile mesajdan bağımsız yapılabilirdi, yapmadım.
- Mesaj etiketindeki sayıların model değerine bağlı kalması (bkz. b).
- Gerçek ISN aralığı (0..2^32-1) ve mod 2^32 taşması: slider bu aralık için kullanışsız, taşmayı (wraparound) gösteremedim. Aralığı 0..1000'e çektim.
- Alternatif senaryolar (eşzamanlı açılış, paket kaybı, SYN yeniden gönderimi): model olaylarıyla yazılır ama sahnede dallanan bir "alternatif zaman çizgisi" kavramı yok. Bu derste kapsam dışı bıraktım.
- İki stateMachine arasında bağ yok; "bu mesaj şu geçişi tetikler" ilişkisini elle senkronladım (goTo çağrılarını mesajın yanına yazarak).
- Durum adlarının (SYN_SENT vb.) model olaylarından (`t.event` payload) sahneye otomatik akması yok; hem modelde hem sahnede tekrar yazdım.

## (b) Belirsiz / kafa karıştıran kısımlar
- `Sequence.message` etiketinde `{{valId}}` işaretlemesi çalışıyor mu? Belirsiz; etiketi `vat.fmt(...)` ile scene içinde string olarak kurdum. Girdi değişince scene yeniden kurulduğu için çalışır, ama Val kaynak izi kaybolur.
- `message(...)` scene'de çağrılırsa gizli; step'te çağrılırsa görünür. Ben scene'de oluşturup step'te `m.show()` dedim. `show()` ile açılacağı belgelenmemiş.
- `chapter(id, title, build)` içindeki `s.say` ve doğrudan verb'ler ile alt `step`'lerin sırası belirsiz (parent'ın kendi animasyonu çocuklardan önce mi?). Rehber örneği bölüm içinde doğrudan say + verb yazıyor, ben de öyle yaptım.
- Level 1 step içine level 2 ve 3 alt adımlar koymak serbest mi? Öyle yaptım; ayrıca level 1 step'in kendi `say` metni "özet" mi, yoksa çocuklar katlandığında tek başına mı gösteriliyor, net değil.
- `role` olarak `concept: true` olmayan glossary anahtarı ne yapıyor? Yalnızca hover mı? 'isn' rolünü label'a verdim.
- `concept` limiti 5: client, server, seq, ack, state ile doldu; SYN gibi kilit terimi renklendiremedim.
- `checks.known.expect` yalnızca trace id → değer; `t.event` payload'ı (bayraklar, durumlar) doğrulanamıyor. RFC'nin durum/bayrak bilgisini kontrol edemedim, sadece sayıları ettim. Durum doğruluğu için invariants içinde kendi kontrolümü yazdım.
- `TraceEvent.payload` Val saklamıyor (`Record<string, unknown>`); `.value` ile düz sayı yazdım, kaynak izi gitti.
- `Obj.highlight` ile `Sel.highlight` seçenekleri farklı (Sel'de `style` yok).

## (c) Tahmin ettiklerim
- `s.fly(d.one, slot)`: sahnede gösterilmeyen bir Val uçurulabilir mi? Rehber "a Val shown somewhere" diyor; `one` için çip oluşturmadım, çalışacağını varsaydım.
- `formula.show` her çağrıda öncekini değiştirir ve slotlar sıfırlanır, `fill` yeniden gerekir. `formula.clear()` Back ile geri alınır.
- `stateMachine` `at: 'left'/'right'` ve sequence `main` bölgesi çakışmadan yerleşir; makineye verilen `role` bütün makineyi renklendirir.
- `goTo` iki makinede aynı id'yi (ESTABLISHED) kullanınca karışmaz.
- Başka bir hidden objeye `near` ile yerleştirme çalışır (ackChip → mesaj).
- Başka bir stateMachine'in başlangıç durumu 'CLOSED' ile 'LISTEN'e geçiş bir step'te goTo ile yapılabilir (sunucunun CLOSED → LISTEN'i tek adım).
- `s.fly(obj, obj)` (çip → sequence mesajı) geçerli.
- `vat.fmt` scene içinde çağrılabilir (saf).
- `known.tolerance: 0` tam eşleşme demektir.
- `practice.answer` trace id'dir ve cevap sayısal karşılaştırılır.
- `invariants` içinde `data.e1.index` / `payload` okunabilir.

## (d) API'de değiştireceğim şeyler
- `Sequence.message` için yapılandırılmış alanlar (`{ flags, seq, ack }` Val kabul eden) ve etiketlerde `{{valId}}` garantisi.
- `TraceEvent.payload` Val kabul etsin; `expect` olay alanlarını (`'msg2.ack': 101`) kontrol edebilsin.
- Sequence'e "paket" nesnesi: okun üzerinde yolculuk, kayıp/gecikme animasyonu.
- Çok aktörlü durum makinesi: mesajla tetiklenen geçişler, modelin olaylarından sürülen durumlar.
- `concept` limiti uyarı olsun, sert olmasın; ya da ayrı hafif vurgu sınıfı.
- `chapter.say` / `step.say` / çocuk adımlar arasındaki ilişkiyi şemada açıkça yaz.
- `InputSpec` için büyük tamsayı aralığı (2^32), log ölçek veya hazır değer (preset) desteği.
- `known.expect` için string değerlerin (durum adları) hangi trace kaynaklarına karşı kontrol edildiğini belgele.
