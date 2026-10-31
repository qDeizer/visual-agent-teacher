# İstekler

Bu belge projenin pusulasıdır. Her yeni karar ve her inceleme turu buradaki maddelere göre değerlendirilir. Yeni istek geldikçe güncellenir.

## 1. Kapsam

- **Global bir skill.** Belirli bir konu için değil; bilgisayar ağları, fizik, istatistik, matematik, biyoloji, kodlama, sistem mimarileri gibi her alanda kullanılacak.
- Skill'e "şu konunun şu kısmını şöyle anlat" gibi konuya özel talimatlar **yazılmaz**. Bunun yerine genel bir üretim hattı tanımlanır: nasıl anlatılacağı, nasıl sunulacağı, hangi teknolojiyle, hangi kurallarla, hangi tasarım diliyle.
- Çıktı: tarayıcıda açılan, tek dosyalık, internetsiz çalışan etkileşimli bir öğrenme laboratuvarı.

## 2. Anlatım

- **Önce "ne" ve "neden".** Konuya doğrudan dalınmaz; ne olduğu ve neden var olduğu anlatılır.
- **Öğrencinin bilgisi sıfır kabul edilir.** Her terim açıklanır. Formüldeki her sembolün ne olduğu belirtilir.
- **İfadeler tek tek açılır.** Bir cümlede geçen bilinmeyen her kavram ayrıca açıklanır.
- **Süreç ve örüntü öğretilir.** Sadece sonuç değil, işin bir iş akışı (pipeline) olarak örüntüsü de gösterilir.
- **Ezber gereken şeyler işaretlenir.** Formüller gibi ezberlenmesi gerekenler ayrıca belirtilir; gerekirse sembol yerine kelimelerle de yazılır: `<şuradaki değer> + <şuradaki değer> / e`.
- **Sayıların yolculuğu görünür.** Bir sayının formüle nereden geldiği ve sonucun nereye gittiği izlenebilir.
- **Öğrenciye anlamsız soru sorulmaz.** Öğrenme aşamasındaki kullanıcının akışı "tahminin nedir?" gibi sorularla kesilmez.
- **Dil:** Kullanıcı hangi dilde isterse o dilde. Türkçe anlatımda, Türkçe literatürde de yabancı karşılığıyla kullanılan terimler (örn. "pektoralis majör kası") olduğu gibi kalır.

## 3. Görsellik ve etkileşim

- **Her şey olabildiğince görsel.** kNN öğretiliyorsa grafik çizilir; CNN öğretiliyorsa çekirdeğin görüntü üzerinde kayarak taramasının tamamı izlenir.
- **Görsel öğeler gerçekten çalışır.** Bir resim değil, çalışan bir uygulama gibi davranır.
- **Etkileşimli bir dünya.** Öğrenci girdileri değiştirebilir, öğeleri kurcalayabilir.
- **Alıştırma modu.** Öğretilen problem başka değerlerle, başka özelliklerle kullanıcıya da çözdürülür.

## 4. Kontrol

- **Mikro-atomik adımlar.** Süreç en küçük anlamlı adımlara bölünür.
- **Detay seviyesi arayüzden ayarlanır.** Adımların ne kadar ince olacağını kullanıcı seçer.
- **Animasyon hızı arayüzden ayarlanır.** Her adımdaki animasyonun hızı kullanıcı tarafından değiştirilebilir.

## 5. Tasarım ve hareket

- **Kullanıcı gözüne uygun, düzgün oranlı bir arayüz.** Önceki denemelerdeki orantısız öğeler, kötü renkler ve dev "Devam" düğmesi gibi hatalar tekrarlanmaz.
- **Ani geçiş yok.** "İleri" denildiğinde slayt değişiyormuş gibi her şey birden değişmez; sahne yerinde, akıcı biçimde dönüşür.
- **Sayfa zıplamaz.** "Devam"a basınca sayfa en üste atılmaz.
- **Hazır tasarım/animasyon bilgisi aktarılır.** Remotion, animasyon ve tasarım skill'lerindeki birikim harmanlanarak skill'e aktarılır.

## 6. AI'ın çalışma ortamı

- **AI'ın dikkati koda değil konuya.** AI ham animasyon kodu yazmaz; hazır, küçük fiilleri kullanır: taşı, soldur, ok çiz, parlat, titret...
- **Kalıcı nesneler.** Bir nesne bir kez oluşturulur ve ders boyunca yaşar. Taşındıktan sonra silinip yeniden çizilmez; başka bir fiille başka bir sürece girebilir.
- **AI kendi şeklini tanımlayabilir.** Örneğin bir bakteri hücresini kendi SVG'siyle bir kez çizer; sonra o nesne hazır fiillerle hareket eder.
- **Hazır efektler.** Parlama (glow), çizgilerin titremesi, nefes alma, akış gibi efektler hazır verilir.
- **Bileşenler veriyle beslenir.** Nöral ağ gibi yapılar düğüm düğüm sıfırdan kurulmaz; farklı örneklerde sadece parametreler (girdi, ağırlık) değişir.
- **Tekil ve grup kontrolü.** Bir gruptan tek öğe seçilip odaklanılabilir, diğerleri soldurulabilir/gizlenebilir; öğeler sonradan gösterilmek üzere gizli oluşturulabilir; gruptan bir öğe çekilip ayrı bir hareket sürecine sokulabilir.
- **Bölünme ve çoğalma.** Hücre bölünmesi gibi süreçler nesneyi yeniden üretmeden yapılır; bölünme yönü belirlenebilir; katlanarak çoğalma desteklenir.
- **Etiket ve alt gruplar.** Örneğin bir hücre "kanser" olarak etiketlenip kırmızı görünebilir ve sadece o alt grup bölünmeye devam edebilir.
- **Kaçış kapısı.** Kütüphanenin kapsamadığı bir şey gerekirse AI düz SVG yazabilir; tekrar eden ihtiyaçlar kütüphaneye yeni bileşen olarak eklenir.
- **Sistemi karmaşıklaştıracak özelliklerden kaçınılır.** (Örn. şekli matematiksel olarak ikiye ayırmak yerine kopyalayarak bölmek.)

## 7. Geliştirme süreci

- **Director döngüsü.** Ana ajan director'dır: skill'i yazar, üretici ajana konu ve görev verir, tasarım inceleme ajanından geri bildirim alır, kendisi de öğrenci gözüyle anlatımı değerlendirir, ardından skill'i yeniden yazar. Sistem oturana kadar döngü sürer.
- **Üretici ajan:** Sonnet, medium.
- **Tasarım inceleme ajanı:** Ayrı bir ajan; tasarımcı gözüyle, gerekirse animasyonu kare kare inceler.
- **Kullanıcı da test eder.** Director'ın yanında kullanıcı da sonuçları inceler ve geri bildirim verir.
- **Üretici yalıtılır.** Her turda yeni bir üretici ajan açılır ve yalnızca **skill + konu promptunu** görür. Önceki projeleri, HTML'leri, geri bildirimleri görmez — yoksa kafası onlara kayar.
- **Konu kaynağı:** Kullanıcının vize sınavı konuları ilham olarak kullanılabilir; farklı turlarda farklı konular denenir.

## 8. Otomatik test (ilk sürüm için)

Makinenin kontrol edebileceği istekler QA betiğinde zorunlu kurala dönüşür:

1. "Devam"a basınca sayfanın kaydırma konumu değişmez.
2. Ekranda NaN, Infinity veya ham uzun ondalık görünmez.
3. Alıştırma modu girdi değişince gerçekten yeniden hesaplar ve geçerli sonuç üretir.
4. Detay seviyesi ve hız ayarları gerçekten etki eder (adım sayısı / animasyon süresi değişir).
5. Formüldeki her sembolün bir açıklaması vardır.
6. Ders dışarıdan hiçbir kaynak yüklemez; internetsiz çalışır.
7. Ders akışı hiçbir zaman öğrencinin bir şey girmesine bağlı değildir ve anlatım öğrenciye tahmin ya da cevap sorusu sormaz. Kurcalama kontrolleri (kaydırıcı, sürükleme, seçim) derste serbesttir ama isteğe bağlıdır. Cevap alanları yalnız alıştırma bölümündedir.

Güzellik, anlaşılırlık ve anlatım kalitesi otomatik test edilmez; tasarım inceleme ajanı ve kullanıcı değerlendirir. Matematik doğruluğu şimdilik director kontrolündedir; tekrar eden hatalar çıkarsa konuya özel bağımsız hesap kontrolü eklenir.
