# Test rehberi: skill'i bir ajanla denemek

Bu rehber, skill'i herhangi bir Claude Code oturumunda (3P modda DeepSeek gibi Claude dışı modellerle de) denemek içindir.

## Gerekenler

- **Node.js 22 veya üstü** (`node --version`).
- **Edge ya da Chrome.** QA bunu görünmez modda çalıştırır. Bulunamazsa `VAT_BROWSER` ortam değişkenine tarayıcının yolunu ver.
- **Skill klasörü:** repodaki `skill/`. Başka bir şey gerekmez; motor `skill/assets` içinde hazır derlenmiş halde durur.

## Kurulum: iki yol

1. **Kalıcı kurulum:** `skill/` klasörünü `~/.claude/skills/visual-agent-teacher/` olarak kopyala. Claude Code skill'i adından ve açıklamasından tanır. "X konusunu adım adım öğret" dediğinde kendiliğinden kullanır.
2. **Kurmadan deneme (önerilen, karşılaştırması kolay):** Ajana skill klasörünün yolunu doğrudan ver. Aşağıdaki şablon bunu yapıyor.

## Prompt şablonu

```text
Sen bir öğretim lab'ı üreten ajansın. Görevin, aşağıdaki skill'i kullanarak bir ders üretmek.

SKILL: <skill klasörünün tam yolu>
- Önce SKILL.md dosyasını oku ve oradaki iş akışını aynen uygula (references klasöründeki dosyaları da oku).
- Yalnız skill klasörünü ve şu anki çalışma klasörünü kullan.

KONU: <konu; varsa ders slaytındaki çözümlü örneğin verileri>

Öğrencinin hiç bilgisi yok kabul et. Ders dili Türkçe. Çıktıları bu klasöre yaz.
Build ve QA hatasız geçene kadar düzelt.
En sonunda notes.md yaz: skill/API'de zorlandığın yerler, hangi hata mesajları yardımcı oldu, kaç tur sürdü.
Kullanıcıya soru sorma.
```

İpucu: Konuya ders slaytındaki çözümlü örneğin sayılarını eklersen ajan `checks.known` için gerçek bir dış kaynak kullanır. Bu da matematiğin doğru olduğunu garanti eder.

## Neye bakmalı

| Soru | Nereden anlaşılır |
|---|---|
| Ajan skill'i anladı mı? | Ders dosyasının (`lesson.js`) ilk build'i kaç hatayla başladı; ajanın `notes.md` notu |
| Hata mesajları işe yaradı mı? | Ajan aynı hatayı tekrar tekrar mı yaptı, yoksa mesajı okuyup düzeltti mi? |
| Sonuç hatasız mı? | `qa-report.json`: `errors` boş olmalı |
| Ders iyi mi? | `lab.html`'i tarayıcıda aç: Devam/Geri, Özet/Normal/Mikro, hız, Kurcala, Alıştırma |
| Matematik doğru mu? | Build çıktısındaki "✓ N known-value check(s) passed" satırı |

## Elle derleme ve test

```bash
node skill/scripts/build.mjs <klasör>/lesson.js          # lab.html üretir
node skill/scripts/qa.mjs <klasör>/lab.html --shots      # test + ekran görüntüleri (qa-shots/)
```

## Sonuçları bize iletmek için

Ajanın klasörünü (`lesson.js`, `notes.md`, `qa-report.json`, birkaç ekran görüntüsü) ve kullandığın modeli not et. Karşılaştırma için en faydalı bilgiler:
- Kaç turda bitti?
- Hangi API'yi yanlış kullandı?
- Nerede takıldı?
