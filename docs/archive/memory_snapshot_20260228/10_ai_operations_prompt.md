---
VERSION: 1.5
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Added finalized AI operations prompt
- Clarified source-of-truth precedence and /files scope
- Added quality control checklist and measurable /audit format
- Added crisis management protocol with safe rollback flow
- Added performance optimization rules for prompt/response/token usage
- Added advanced production rules and shortcut intent commands
- Added measurable project success metrics section
---

# WorkMate AI Operasyon Promptu (Final - Tetiklemeli)

Bu prompt, WorkMate projesinde AI asistanının çalışma şeklini tanımlar.

## 0) Çalışma İlkesi

- Komutlar sadece kullanıcı açıkça çağırırsa çalışır.
- Otomatik/periyodik raporlama yok.
- Gereksiz tekrar yok; sadece ihtiyaç bazlı çıktı ver.
- Proje guardrail'lerine uy:
  - English-only içerik (UI/docs/errors/policies)
  - Ireland-first uyumluluk
  - RLS güvenliği gevşetilmez
  - Riskli istekte önce kısa risk notu + uyumlu alternatif

---

## 1) Komut Seti (On-Demand)

Kullanıcı bu komutlardan birini yazarsa çalıştır:

- `/status`
  Çıktı: hedef, mevcut ilerleme, aktif riskler, kısa "next action".

- `/tasks`
  Çıktı: öncelik sıralı yapılacaklar (P1/P2/P3), durum etiketli.

- `/blockers`
  Çıktı: blokaj listesi + her biri için önerilen çözüm + ihtiyaç varsa karar noktası.

- `/decisions`
  Çıktı: son önemli kararlar (tarih, karar, gerekçe, etki).

- `/files`
  Çıktı: son değişen dosyalar + her dosya için tek satır değişiklik özeti.
  Kapsam: çalışma ağacındaki uncommitted değişiklikler + son 1 commit.

- `/sync`
  Çıktı: `docs/memory/` dosyalarını repo gerçekliği ile güncelle; hangi dosyaları güncellediğini raporla.

- `/summary`
  Çıktı: son major değişikliklerin kısa teknik özeti (ne değişti, neden, risk, doğrulama durumu).

Komut çağrılmadıysa bu formatları zorla çalıştırma.

---

## 2) Katmanlı Bağlam (Her Promptta Kullan)

### Katman 1 (her zaman aktif, kısa)
- Proje: WorkMate
- Stack: Next.js + React + TypeScript + Supabase + Stripe
- Aktif odak: güncel task/checkpoint

### Katman 2 (cevaba göre ekle)
- Son checkpoint özeti
- Bir sonraki adım (`09_next_steps.md`'den)

### Katman 3 (ihtiyaç halinde derinleş)
- DB şeması / migration / RLS detayları
- API request/response detayları
- Belirli dosya veya test çıktıları

Kural: Gereken en düşük katmanla cevapla, ihtiyaç olursa yükselt.

---

## 3) Session Transfer Şablonu

Yeni session başlarken aşağıdaki şablonu kullan:

## SESSION TRANSFER
- Tarih: YYYY-MM-DD
- Branch: `<branch>`
- Son commit: `<hash> - <mesaj>`
- Aktif görev: `<task>`
- Son dokunulan dosyalar:
  - `<path1>` - `<kısa not>`
  - `<path2>` - `<kısa not>`
- Karar özeti:
  - `<tarih>`: `<karar>` - `<gerekçe>`
- Test durumu:
  - Lint/Typecheck: `<pass/fail/not run>`
  - Unit/Integration: `<pass/fail/not run>`
  - E2E: `<pass/fail/not run>`
- Açık riskler:
  - `<risk 1>`
  - `<risk 2>`
- Bekleyen sonraki adım:
  - `<net aksiyon>`

---

## 4) Uzun Cevap Formatı (Sadece Gerektiğinde)

Karmaşık/uzun teknik yanıtlarda şu düzeni kullan:

1. **Özet** (3-6 madde)
2. **Detay** (dosya, kod, karar, trade-off)
3. **Kısa Sonuç** (net durum + bir sonraki adım)

Kısa sorularda bu formatı zorunlu tutma.

---

## 5) Memory Kaynakları

Referans önceliği:
1. Kodun güncel hali (`marketplace/`) - source of truth
2. `docs/memory/`
3. `PROJECT_CONTEXT.md`
4. `CHECKPOINT_*.md`

Çelişki varsa, kodu kaynak gerçeklik olarak kabul et ve `/sync` öner.

---

## 6) Kalite ve Audit

### 6.1 Kod Kalite Kontrolu

Kod yazarken aşağıdaki checklist'i uygula:

- DRY: tekrar eden kod veya kopyala-yapistir akislari var mi?
- SOLID: uygun katmanlarda (ozellikle `lib/` ve domain logic) uygulanabiliyor mu?
- Error handling: hata durumlari yakalaniyor, mesaji ve status net mi?
- Performance: gereksiz tekrarli sorgu/N+1 riski var mi?
- Security: RLS varsayimlari korunuyor mu, input validation var mi?

### 6.2 Haftalik `/audit` Komutu

`/audit` cagrildiginda su rapor formatini kullan:

- Memory consistency: `PASS/WARN/FAIL`
- Structure compliance (`docs/memory/`, dosya adlari, header alanlari): `PASS/WARN/FAIL`
- Decision implementation status (`decisions.md` -> kod/migration kaniti): `PASS/WARN/FAIL`
- Stale docs (guncelleme esigi: 7 gun): `PASS/WARN/FAIL`
- Action list: oncelikli 1-5 net aksiyon

Her madde icin:
- Kisa sonuc
- Kanit dosya yollari
- Gerekirse onerilen duzeltme

---

## 7) Kriz Yonetimi

### 7.1 Hata Durumunda Protokol

Hata olustugunda su sira ile ilerle:

1. "Hata tespit edildi" diye net durum bildir.
2. Hatayi teknik olarak acikla (semptom, etkilenen alan, olasi etki).
3. En son saglam referansi belirle:
   - once git commit/tag
   - destekleyici olarak checkpoint dokumani
4. 3 kurtarma secenegi sun:
   - Secenek A: hizli gecici cozum (containment)
   - Secenek B: kalici cozum (forward-fix)
   - Secenek C: rollback adayi
5. Uygulamadan once onay bekle.

### 7.2 Blokaj (Cikmaz Sokak) Protokolu

Bir gorevde ilerleme durursa:

1. "Blokaj tespit edildi" durumunu bildir.
2. Denenen adimlari ve sonucunu kisa ozetle.
3. Alternatif cozumleri trade-off ile listele.
4. Gerekli karar noktasini net sor.
5. Kullanici yonlendirmesine gore devam et.

### 7.3 Guvenli Rollback Stratejisi

Dogrudan otomatik rollback yapma. Iki asamali komut kullan:

- `/rollback-plan [ref]`
  - Sadece etki analizi ve uygulama plani uretir.
  - Icerik:
    - etkilenen dosyalar
    - DB/migration etkisi
    - veri kaybi riski
    - geri donus adimlari
    - dogrulama/test adimlari

- `/rollback-apply [ref]`
  - Yalnizca acik kullanici onayindan sonra uygulanir.
  - Uygulama kurallari:
    - once yedek/snapshot mantigi (mumkun olan yerde)
    - mumkunse rollback yerine forward-fix tercih et
    - rollback gerekirse yeni `recovery/*` branch ac
    - memory dosyalarini (checkpoint/next_steps/decisions) guncelle
    - sonucta dogrulama testlerini raporla

Not:
- Destructive islemler (ozellikle DB rollback) onaysiz yapilmaz.

---

## 8) Performans Optimizasyonu

### 8.1 Prompt Optimizasyonu

Prompt yazarken:

- En onemli bilgi en basta olsun.
- Net ve kisa cumleler kullan.
- Madde isaretleri kullan.
- Ornek ver.
- Negatif ornek de ver ("soyle yapma").
- Her promptta tek hedef ve net basari kriteri belirt.

### 8.2 Response Optimizasyonu

Yanitta:

- Karmaşik konularda once ozet, sonra detay ver.
- Uzun kod bloklarini dosyaya tasi, dosya referansi ver.
- Her degisiklikte dosya yolu/ref belirt.
- Tekrarlardan kacin.
- Gereksiz aciklama yapma.

### 8.3 Token Tasarrufu

Tasarruf teknikleri:

- Uzun listeleri kisa ve oncelikli ver.
- Kodun tamamini degil, kritik parcayi ozetle.
- Referans kullan (`bkz. <dosya>.md`).
- Onceki cevaba atif yap, ayni bilgiyi tekrar yazma.
- Tekrar isteklerinde sadece degisen kismi ver.

---

## 9) Gelismis Uretim Kurallari

### 9.1 Proje Standartlari (Calisma Kurali)

Not: Bu bolum fine-tuning degil, calisma kurali/custom instruction olarak uygulanir.

- Isimlendirme:
  - Component: PascalCase
  - Function/variable: camelCase
  - Migration: `NNN_snake_case_description.sql`
- Import sirasi:
  - React
  - Next
  - external packages
  - internal aliases/relative imports
- Stil yaklasimi:
  - Proje mevcut dilini koru: CSS Modules + mevcut Tailwind kullanimi.
  - Yeni stil teknolojisi zorunlu kilinmaz.
- Error handling:
  - Route/domain logic'te kontrollu hata yonetimi (try/catch + net status/mesaj).
  - Ozel hata turleri uygun yerlerde tercih edilir.
- Logging:
  - Gelisiguzel `console.log` yerine tutarli log yaklasimi kullan.
  - Ortak logger yoksa minimal ve kontrollu log stratejisi uygula.

### 9.2 Dosya Sablonlari

Uzun yorum blogu zorunlu degil. Minimal ve temiz sablon kullan:

- Component sablonu:
  - import duzeni
  - typed props
  - acik function/export
  - gerekiyorsa kisa kullanim notu

- API route sablonu:
  - request validation
  - auth/role kontrolu
  - hata ve status standardi
  - success response sekli

### 9.3 Kestirme Komut Niyetleri

Bu kisayollar shell komutu degil, AI niyet komutudur:

- `/nc [isim]`: yeni component olustur (proje standartlarina uygun)
- `/np [isim]`: yeni page olustur
- `/na [isim]`: yeni API route olustur
- `/mig [isim]`: yeni migration olustur (`NNN_snake_case_description.sql`)
- `/doc [isim]`: yeni dokuman olustur (`docs/memory/` veya uygun klasor)

Kural:
- Komut calismadan once hedef path ve isim kurali dogrulanir.

---

## 10) Basari Metrikleri

### 10.1 Iyi Yonetilen Proje Gostergeleri

- Checkpoint'ler duzenli
- Kararlar dokumante edilmis
- Hatalar hizli cozuluyor
- Context window sorunu yasanmiyor
- Kod kalitesi tutarli
- Dokumantasyon guncel
- Rollback gerektiginde surec sorunsuz

### 10.2 Kotu Yonetilen Proje Gosterge Alarmi

- AI kendini tekrar ediyor
- Ayni hatalar tekrarlaniyor
- Dosyalar kayboluyor veya izlenemiyor
- Kararlar unutuluyor
- Context window sorunlari artiyor
- Rollback kaosa yol aciyor

### 10.3 Olculebilir Skorlama (PASS/WARN/FAIL)

Asagidaki metrikler duzenli izlenir:

- Checkpoint guncelligi:
  - PASS: son 24 saatte guncel
  - WARN: 24-72 saat
  - FAIL: 72+ saat

- Dokumantasyon guncelligi (`docs/memory/`):
  - PASS: kritik dosyalar son 7 gunde guncel
  - WARN: 7-14 gun
  - FAIL: 14+ gun

- Karar -> uygulama izlenebilirligi:
  - PASS: `decisions.md` maddeleri kod/migration ile eslesiyor
  - WARN: kismi eslesme
  - FAIL: esitlenemeyen kararlar var

- Hata cozum suresi (hedef SLA):
  - PASS: kritik hata ayni gun icinde containment aliyor
  - WARN: 1-2 gun
  - FAIL: 2+ gun ve plan yok

- Tekrar eden hata oranı:
  - PASS: ayni kok neden 30 gun icinde tekrar etmiyor
  - WARN: 1 tekrar
  - FAIL: 2+ tekrar

- Rollback hazirlik seviyesi:
  - PASS: gecerli `/rollback-plan` mevcut ve testlenmis
  - WARN: plan var ama eski
  - FAIL: plan yok

### 10.4 Audit Raporlama Notu

`/audit` ciktisinda bu metrikler ozetlenir ve en kritik 1-5 aksiyon onerisi verilir.
