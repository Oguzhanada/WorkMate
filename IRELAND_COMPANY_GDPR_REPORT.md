# WorkMate — İrlanda Şirket Kuruluşu + GDPR Uyum Raporu

**Hazırlayan:** Kurumsal Hukuk & Veri Koruma Danışmanı | **Tarih:** 10 Mart 2026
**Proje:** WorkMate — Ireland-First Hizmet Marketplace'i
**Kapsam:** Şirket kuruluşu, vergi, GDPR tam uyum, teknik entegrasyon
**Mevzuat Referansı:** Companies Act 2014, GDPR (2016/679), Irish Data Protection Act 2018, ePrivacy Regulations 2011 (SI 336)

---

## 1. İrlanda'da Şirket Türü ve Yapı Seçimi

### 1.1 Seçenekler

| Tür | Tam Adı | Min Yönetici | Secretary | Hisse Sınırı | Audit Muafiyeti | Uygunluk |
|-----|---------|-------------|-----------|-------------|-----------------|----------|
| **LTD** | Private Company Limited by Shares | 1 | Gerekli değil | Sınırsız | Küçük şirket muafiyeti var | ✅ **Önerilen** |
| DAC | Designated Activity Company | 2 | 1 gerekli | Sınırsız | Var | Niş sektör |
| CLG | Company Limited by Guarantee | 2 | 1 gerekli | Hisse yok | Var | Hayır kurumu |
| PLC | Public Limited Company | 2 | 1 gerekli | Halka açık | Yok | Büyük şirket |
| ULC | Unlimited Company | 1 | Değişir | Sınırsız | Yok | Çok nadir |

### 1.2 Öneri: LTD (Private Company Limited by Shares)

**Gerekçe:**
- **Tek yönetici yeterli:** Founder tek başına director olabilir (Companies Act 2014, Part 2)
- **Secretary zorunlu değil:** LTD için company secretary gerekmez (DAC'ta zorunlu)
- **Constitution:** Tek belge (replaceable constitution) — DAC gibi memorandum + articles ayrımı yok
- **Audit muafiyeti:** Yıllık cirosu <€12M, bilanço <€6M, çalışan <50 ise muaf (küçük şirket kriteri)
- **Hisse esnekliği:** Başlangıçta 100 ordinary share (€1 nominal) yeterli
- **Yatırım uyumluluğu:** VC/angel yatırım için standart yapı; SAFE/convertible note uyumlu
- **İsim:** "WorkMate Ltd" veya "WorkMate Technology Ltd"

### 1.3 Yapılacaklar Listesi

- [ ] Şirket türü kararı: **LTD** ✅
- [ ] Şirket adı kontrol: CRO CORE sistemi üzerinden (core.cro.ie)
- [ ] Yedek isim hazırla: "WorkMate Ireland Ltd", "WorkMate Platform Ltd"
- [ ] Domain uyumu: workmate.ie ile eşleşen isim seç

### 1.4 Maliyet Tahmini

| Kalem | Maliyet |
|-------|---------|
| CRO isim rezervasyonu | €25 |
| LTD kuruluş başvurusu (CORE online) | €50 |
| Hukuk danışmanı (opsiyonel, önerilen) | €500-1,500 |

### 1.5 Zaman Çizelgesi

| Adım | Süre |
|------|------|
| İsim kontrolü ve rezervasyon | 1 iş günü |
| Constitution hazırlama | 2-5 iş günü |
| CRO A1 formu doldurup gönderme | 1 iş günü |
| CRO onayı (online) | 5-10 iş günü |

> **Geliştiricilere / İş Kurucularına Not:**
> - CRO CORE sistemi tamamen online: [core.cro.ie](https://core.cro.ie). CORE hesabı açmak ücretsiz.
> - Şirket ismi onaylandıktan sonra domain (workmate.ie) satın alımını hemen yapın — .ie domain'ler IEDR üzerinden alınır ve İrlanda bağlantısı kanıtı gerektirir (CRO numarası yeterli).
> - LTD seçimi, gelecekte EIS/SEIS (UK yatırımcı) veya EIIS (İrlanda Employment & Investment Incentive Scheme) uyumluluğu için de doğru yapıdır.

---

## 2. İrlanda'da Şirket Kuruluş Süreci (Adım Adım)

### 2.1 Adım Adım Süreç

#### Adım 1: Şirket Adı Kontrolü ve Rezervasyon
- **Platform:** CRO CORE (core.cro.ie)
- **Kontrol:** Aynı veya benzeri isim var mı (Companies Act 2014, s.26-27)
- **Yasak isimler:** "bank", "insurance", "university" gibi kısıtlı kelimeler
- **Rezervasyon süresi:** 28 gün (€25, uzatılabilir)
- **Tavsiye:** "WorkMate Ltd" + yedek "WorkMate Technology Ltd"

#### Adım 2: Constitution Hazırlama
- LTD için tek belge: **Constitution** (Companies Act 2014, Part 2, Chapter 2)
- İçerik: şirket adı, üyelik, hisse yapısı, yönetim kuralları, yetki sınırları
- Seçenek: Model Form constitution kullanılabilir (Companies Act 2014, Schedule 1) veya custom
- **Önerilen:** Startup-uyumlu custom constitution (vesting, pre-emption rights, drag-along/tag-along)

#### Adım 3: CRO Kayıt (Form A1)
- **Online:** CORE üzerinden e-submission
- **Gerekli bilgiler:**
  - Şirket adı + türü (LTD)
  - Registered office adresi (İrlanda'da fiziksel adres — virtual office kabul edilir)
  - Director(lar): tam ad, adres, doğum tarihi, milliyet, meslek
  - Secretary (LTD'de opsiyonel; atanmazsa director aynı zamanda secretary)
  - Hisse yapısı: hisse sayısı, nominal değer, başlangıç tahsisi
  - İmzalı Constitution
  - Consent to Act (director onay formu)
- **Ücret:** €50 (online)

#### Adım 4: CRO Onay ve Incorporation Certificate
- CRO incelemesi: 5-10 iş günü (fast-track: 2-3 iş günü, ek ücret)
- Onay sonrası: **Certificate of Incorporation** + **CRO numarası** (şirket numarası)
- Bu noktada şirket yasal olarak kurulmuştur

#### Adım 5: RBO Kaydı (Register of Beneficial Owners)
- **Zorunlu:** 5 ay içinde (Companies Act 2014, Part 22A)
- **Platform:** rbo.ie
- **Bilgi:** Şirketin %25+ hissesine veya oy hakkına sahip gerçek kişiler
- **Ceza:** Kayıt yapılmazsa €5,000 ceza + hapis riski (ciddi)

#### Adım 6: Revenue Kayıtları (ROS — Revenue Online Service)
- **Platform:** ros.ie
- **TR1 Formu:** Vergi kaydı başvurusu
- **Kayıtlar:**
  - **Corporation Tax** — otomatik (şirket kurulunca zorunlu)
  - **VAT** — €37,500 hizmet eşiği aşılınca zorunlu (WorkMate için erken kayıt önerilir)
  - **PAYE/PRSI** — çalışan istihdam edilince zorunlu (employer registration)
  - **RCT** — construction sektörü (WorkMate'te tradesperson varsa gerekebilir)
- **Tax Clearance Certificate:** Online başvuru (ROS üzerinden, 5-10 iş günü)

#### Adım 7: Banka Hesabı Açma
- **Gerekli:** CRO Certificate of Incorporation, director kimlik, adres kanıtı
- **Önerilen bankalar:** AIB, Bank of Ireland, Permanent TSB, Revolut Business (İrlanda IBAN)
- **Dikkat:** İrlanda'da banka hesabı açmak 2-6 hafta sürebilir (KYC/AML kontrolleri)
- **Alternatif:** Wise Business hesabı (hızlı, EUR IBAN, Stripe uyumlu)

#### Adım 8: Stripe Hesabı (Şirket Olarak)
- Mevcut Stripe Connect yapısı şirket hesabına taşınmalı
- **Gerekli:** CRO numarası, şirket adresi, director kimliği, İrlanda IBAN
- **Dikkat:** Stripe Ireland Ltd üzerinden hizmet alınır (AB içi veri işleme)

### 2.2 Gerekli Belgeler Özet Tablosu

| Belge | Nereden | Ne İçin | Süre |
|-------|---------|---------|------|
| Form A1 (Incorporation) | CRO CORE | Şirket kuruluşu | 1 gün hazırlık |
| Constitution | Hazırlanan | CRO'ya ek | 2-5 gün |
| Consent to Act (Director) | İmzalanan | CRO'ya ek | 1 gün |
| TR1 Formu | ROS | Revenue kaydı | 1 gün |
| Director Kimlik (Pasaport/ID) | Mevcut | CRO + Banka + Revenue | - |
| Adres Kanıtı (Utility Bill) | Mevcut | Banka + Revenue | <3 ay |
| Registered Office Lease/Agreement | Virtual office | CRO | - |
| RBO Bildirimi | rbo.ie | Beneficial ownership | Kuruluş + 5 ay |
| Tax Clearance Certificate | ROS | Ticari işlemler | 5-10 gün |

### 2.3 Maliyet Tahmini

| Kalem | Maliyet |
|-------|---------|
| CRO isim rezervasyonu | €25 |
| CRO incorporation (online) | €50 |
| CRO fast-track (opsiyonel) | €100 ek |
| Virtual office / registered address | €200-500/yıl |
| Revenue kayıt | Ücretsiz |
| RBO kayıt | Ücretsiz |
| Banka hesabı açma | Ücretsiz (çoğu banka) |
| Hukuki danışmanlık (constitution + kurulum) | €500-2,000 |
| **Toplam (minimum)** | **~€375-675** |

> **Geliştiricilere / İş Kurucularına Not:**
> - CRO numarası alındıktan sonra bunu `.env` dosyasına `COMPANY_CRO_NUMBER` olarak ekleyin — faturalandırma ve yasal sayfalar için.
> - Privacy policy'deki "Data Controller" bölümünü şirket adı + CRO numarası ile güncelleyin: `marketplace/app/[locale]/privacy/page.tsx`.
> - VAT numarası alındıktan sonra `lib/pricing/fee-calculator.ts`'teki VAT hesaplamalarını aktifleştirin.
> - Stripe hesabını şirket hesabına geçirirken `STRIPE_SECRET_KEY` değişecek — Vercel env vars güncellenmeli.

---

## 3. Gerekli Belgeler ve Resmi Başvuru Seti

### 3.1 CRO Başvuru Seti

| # | Belge | Format | Notlar |
|---|-------|--------|--------|
| 1 | Form A1 (e-Form) | Online/PDF | CORE üzerinden doldurulur |
| 2 | Constitution | PDF/Word | Model Form veya custom; imzalı |
| 3 | Consent to Act as Director | İmzalı belge | Her director için ayrı |
| 4 | Director Identity Details | Pasaport/ehliyet fotokopisi | AB dışı director için notarize gerekebilir |
| 5 | Registered Office Evidence | Kira sözleşmesi/virtual office anlaşması | İrlanda'da fiziksel adres |
| 6 | Form B10 (ilk yönetim kurulu) | Online | Director ve secretary bilgileri |

### 3.2 Revenue Başvuru Seti

| # | Belge | Ne İçin |
|---|-------|---------|
| 1 | TR1 Form (e-Registration) | Corporation Tax + VAT + PAYE |
| 2 | Certificate of Incorporation | Kimlik doğrulama |
| 3 | Constitution (kopyası) | Şirket yapısı doğrulama |
| 4 | Director PPS Number | İrlanda vergi kimliği (her director için) |
| 5 | Bank account details | Vergi iadesi/ödemesi için |
| 6 | Business plan / nature of business | Revenue'nun risk değerlendirmesi için |

### 3.3 Banka Hesabı Seti

| # | Belge | Notlar |
|---|-------|--------|
| 1 | Certificate of Incorporation | CRO'dan |
| 2 | Constitution | Hisse yapısı ve yetki |
| 3 | Director(lar) kimlik + adres kanıtı | Pasaport + utility bill |
| 4 | Beneficial owner bilgileri | %25+ hissedarlara ait |
| 5 | Şirket faaliyet açıklaması | 1 sayfa business summary |
| 6 | Board resolution (banka hesabı açma kararı) | İmzalı yönetim kurulu kararı |

### 3.4 Stripe Şirket Hesabı Seti

| # | Belge | Notlar |
|---|-------|--------|
| 1 | CRO numarası | Stripe form'unda "Company Number" |
| 2 | Şirket adresi | Registered office adresi |
| 3 | Director kimliği | Stripe Identity verification |
| 4 | İrlanda IBAN | Payout hesabı |
| 5 | VAT numarası (varsa) | AB VAT uyumluluğu |
| 6 | Website URL | workmate.ie — Stripe risk değerlendirmesi |

> **Geliştiricilere / İş Kurucularına Not:**
> - Tüm belgeleri şifreli bir bulut klasöründe (Tresorit veya şifreli Google Drive) saklayın.
> - Legal pages'i (`/privacy`, `/terms`, `/cookie-policy`, `/data-retention`) şirket bilgileriyle güncelleyin: ad, CRO no, registered address, DPC kayıt no.
> - Footer component'inde (`components/layout/Footer.tsx`) şirket bilgilerini ekleyin: "WorkMate Ltd, CRO: XXXXXX, Registered in Ireland"

---

## 4. Sermaye, Hisse Yapısı ve Founder Sözleşmeleri

### 4.1 Önerilen Başlangıç Sermaye Yapısı

| Parametre | Öneri | Gerekçe |
|-----------|-------|---------|
| Hisse Türü | Ordinary Shares | Basit, standart haklar |
| Nominal Değer | €1/hisse | Standart İrlanda pratiği |
| Toplam Hisse | 1,000 | Bölünme esnekliği (yatırımcı girişi için) |
| Başlangıç Tahsisi | Founder(lar)a %100 | Tam kontrol |
| Ödenmiş Sermaye | €100 (100 hisse × €1) | Minimum yasal yükümlülük |

**Çoklu Founder Senaryosu:**

| Founder | Hisse | Vesting | Cliff |
|---------|-------|---------|-------|
| Founder A (Teknik) | 600 (%60) | 4 yıl | 1 yıl |
| Founder B (İş) | 400 (%40) | 4 yıl | 1 yıl |

### 4.2 Gerekli Sözleşmeler

| # | Sözleşme | İçerik | Öncelik | Maliyet (hukuki) |
|---|----------|--------|---------|-----------------|
| 1 | **SHA (Shareholders' Agreement)** | Hisse hakları, oy, devir kısıtı, pre-emption, drag-along/tag-along, dead-lock çözümü | 🔴 P0 | €1,000-3,000 |
| 2 | **IP Assignment Agreement** | Tüm fikri mülkiyetin şirkete devri (kod, tasarım, marka) | 🔴 P0 | €300-500 |
| 3 | **Founder Service Agreement** | Founder rol tanımı, maaş/hak, non-compete, confidentiality | 🟡 P1 | €500-1,000 |
| 4 | **Vesting Agreement** | 4 yıl vesting + 1 yıl cliff + accelerated vesting (exit/control change) | 🟡 P1 | SHA'ya dahil |
| 5 | **ESOP/Share Option Scheme** | Gelecek çalışanlar için hisse opsiyonu havuzu (%10-15) | 🟢 P2 | €500-1,000 |

### 4.3 IP Assignment — Kritik

**Neden acil:** WorkMate'in tüm kodu, tasarımı, veritabanı şeması ve algoritmaları şu anda kişiye ait. Şirket kurulduğunda bunlar resmi olarak şirkete devredilmelidir.

**IP Assignment Agreement içeriği:**
- Tüm mevcut kod (GitHub repo) → WorkMate Ltd mülkiyetine
- Gelecekteki tüm geliştirmeler → otomatik şirket mülkiyeti
- Üçüncü taraf lisansları (MIT, Apache vb.) → uyumluluk kontrolü
- Open source kullanım politikası
- "work for hire" clause

> **Geliştiricilere / İş Kurucularına Not:**
> - IP Assignment imzalanmadan yatırımcı due diligence geçilemez — bu belge Day 1 önceliğidir.
> - GitHub repo ownership'i kişisel hesaptan organization hesabına taşınmalı.
> - Mevcut lisans durumu: `package.json` bağımlılıkları MIT/Apache uyumlu olmalı — `npx license-checker` ile kontrol edin.
> - Trade mark: "WorkMate" ismini EUIPO'da (AB çapında) veya IPOI'de (İrlanda) tescil ettirin (€850 EUIPO, €70 IPOI per class).

---

## 5. Vergi ve Muhasebe Kurulumu (İrlanda)

### 5.1 Vergi Yükümlülükleri

| Vergi | Oran | Eşik | WorkMate İçin |
|-------|------|------|---------------|
| **Corporation Tax** | %12.5 (ticari gelir) | Tüm şirketler | Zorunlu — platform komisyonu + abonelik geliri |
| **VAT** | %23 (standart) | >€37,500 hizmet cirosu | Önerilir: erken kayıt (Stripe VAT gereksinimleri) |
| **PAYE/PRSI** | Değişken | Çalışan istihdam edilince | Gerektiğinde — ilk çalışan alınca |
| **Withholding Tax (WHT)** | %20-25 | AB dışı ödemelerde | Anthropic API, muhtemelen ABD → DTA ile %0-5 |
| **RCT** | %0-35 | İnşaat sektörü | İzlenmeli — tradesperson ödemeleri |
| **Stamp Duty** | %1 hisse devri | Hisse transferinde | Yatırım turlarında |

### 5.2 VAT Detayları

**WorkMate'in VAT pozisyonu:**
- **Platform komisyonu (%3/%1.5):** B2B hizmet → VAT'lı (%23)
- **Müşteri servis ücreti (%5):** B2C hizmet → VAT'lı (%23)
- **Abonelik (€19/€39/ay):** B2B dijital hizmet → VAT'lı (%23)
- **Provider'lara ödeme:** Provider'lar kendi VAT yükümlülüklerini yönetir (WorkMate platform olarak VAT tahsil etmez — sadece kendi komisyon/fee gelirinden)

**Varsayım:** WorkMate, provider ile müşteri arasında aracı platform (intermediary) konumundadır. Provider'lar bağımsız yüklenici (independent contractor) statüsündedir.

### 5.3 Muhasebe Gereksinimleri

| Yükümlülük | Detay | Sıklık | Araç |
|------------|-------|--------|------|
| Annual Return (B1 Form) | CRO'ya yıllık bildirim | Yılda 1 (ARD + 28 gün) | CRO CORE |
| Corporation Tax Return (CT1) | Revenue'ya vergi beyanı | Yılda 1 (mali yıl sonu + 9 ay) | ROS |
| VAT Return (VAT3) | KDV beyanı | İki ayda 1 (bi-monthly) | ROS |
| PAYE Submission | Maaş bordrosu bildirimi | Her ödeme döneminde | ROS |
| Financial Statements | Bilanço + gelir tablosu | Yılda 1 | Muhasebeci |
| Kayıt Saklama | Tüm finansal kayıtlar | **6 yıl** (Revenue) | Dijital/fiziksel |

### 5.4 Önerilen Muhasebe Stack

| Araç | Amaç | Maliyet |
|------|------|---------|
| **Xero** veya **Surf Accounts** | Muhasebe yazılımı (İrlanda uyumlu) | €25-50/ay |
| **Stripe Revenue Recognition** | Gelir tanıma + raporlama | Stripe'a dahil |
| **Muhasebeci (retainer)** | VAT beyanı, CT1, yıllık audit | €150-400/ay |
| **Payroll software** | PAYE/PRSI (çalışan varsa) | €20-50/ay |

### 5.5 Maliyet Tahmini (Yıllık)

| Kalem | Minimum | Orta | Tam Hizmet |
|-------|---------|------|-----------|
| Muhasebeci | €1,800/yıl | €3,600/yıl | €6,000/yıl |
| Muhasebe yazılımı | €300/yıl | €500/yıl | €600/yıl |
| CRO Annual Return | €20 | €20 | €20 |
| Revenue filings | Ücretsiz | Ücretsiz | Ücretsiz |
| **Toplam** | **~€2,120/yıl** | **~€4,120/yıl** | **~€6,620/yıl** |

> **Geliştiricilere / İş Kurucularına Not:**
> - `lib/pricing/fee-calculator.ts`'teki `vat_rate` alanı mevcut — VAT kaydı yapıldıktan sonra `STRIPE_PROCESSING_RATE` gibi `VAT_RATE = 0.23` sabiti ekleyin.
> - Stripe faturalarında VAT gösterimi: Stripe Tax veya Stripe Invoicing ile otomatik VAT hesaplama aktifleştirilmeli.
> - Provider'ların VAT durumu: Provider profil sayfasına "VAT Registered?" toggle + VAT numarası alanı eklenebilir (B2B fatura gereksinimleri için).
> - **7 yıllık finansal kayıt saklama:** Mevcut GDPR hard-delete akışında finansal kayıtlar (job_contracts, payments, provider_subscriptions) zaten korunuyor — bu doğru ve Revenue gereksinimi ile uyumlu.
> - Invoice oluşturma: `GET /api/invoices/[paymentId]` endpoint'i + PDF generator (jsPDF veya React-PDF) eklenmeli.

---

## 6. GDPR Uyum Süreci (9 Adımlı Plan)

### Mevcut Durum Değerlendirmesi

WorkMate'in GDPR altyapısı **%70-80 tamamlanmış** durumda. Mevcut uygulamalar:

| Alan | Durum | Dosya/Tablo |
|------|-------|-------------|
| Veri silme (soft + hard delete) | ✅ Tam | `api/profile/gdpr`, `api/admin/gdpr`, migration 062 |
| Veri dışa aktarma (export) | ✅ Tam | `GET /api/profile/gdpr` |
| 30 gün bekleme + otomatik silme | ✅ Tam | `gdpr-retention-processor` edge function |
| Doküman retention (30 gün) | ✅ Tam | `id-verification-retention` edge function |
| Mesaj retention (1 yıl) | ⚠️ Kısmi | Migration 019 var, cron aktif değil |
| Privacy Policy | ✅ Tam | `/privacy` sayfası |
| Cookie Policy | ✅ Tam | `/cookie-policy` sayfası |
| Data Retention Policy | ✅ Tam | `/data-retention` sayfası |
| Cookie Consent UI | ✅ Tam | `CookieConsent.tsx` (essential/analytics/marketing) |
| Audit Logging | ✅ Tam | `admin_audit_logs` tablosu, `lib/admin/audit.ts` |
| GDPR Deletion Email | ✅ Tam | `gdprDeletionConfirmEmail` template |
| Sentry PII Masking | ✅ Tam | `maskAllText`, `maskAllInputs`, `blockAllMedia` |
| RLS (Row-Level Security) | ✅ Tam | Tüm tablolarda |
| API Key Hashing | ✅ Tam | SHA-256, migration 060 |
| Rate Limiting | ✅ Tam | Tüm yazma endpoint'lerinde |

**Eksikler:**

| Alan | Durum | Gerekli Aksiyon |
|------|-------|----------------|
| RoPA (Records of Processing Activities) | ❌ Yok | Belge hazırlanmalı |
| DPA'lar (Data Processing Agreements) | ❌ Yok | Stripe, Supabase, Resend, Sentry, Anthropic |
| DPO Değerlendirmesi | ❌ Yok | Karar verilmeli |
| DPIA (Data Protection Impact Assessment) | ❌ Yok | Belge hazırlanmalı |
| Veri İhlali Prosedürü (yazılı) | ❌ Yok | Prosedür belgesi |
| AB Dışı Transfer Değerlendirmesi (TIA) | ❌ Yok | Anthropic (ABD) için |
| DPC'ye bildirim | ❌ Yok | Zorunlu değil ama önerilir |
| Consent kayıt mekanizması (DB) | ⚠️ Kısmi | localStorage → DB'ye taşınmalı |
| Sentry PII filtering (beforeSend) | ⚠️ Kısmi | Email/user_id error context'te |

---

### Adım 1: Veri Envanteri (RoPA — Records of Processing Activities)

**Yasal Dayanak:** GDPR Art. 30 — 250+ çalışanı olmayan şirketler bile düzenli veri işleme yapıyorsa zorunlu.

**WorkMate RoPA Tablosu:**

| # | İşleme Faaliyeti | Veri Kategorileri | Veri Sahipleri | Hukuki Dayanak | Saklama Süresi | Alıcılar | AB Dışı Transfer |
|---|-----------------|------------------|---------------|---------------|---------------|----------|------------------|
| 1 | Kullanıcı kaydı + kimlik doğrulama | Ad, email, şifre (hash) | Müşteri + Provider | Art.6(1)(b) Sözleşme | Hesap aktif + 30 gün | Supabase (AB) | Hayır |
| 2 | Provider onboarding + doğrulama | Ad, telefon, kimlik belgesi, SafePass, PLI, Tax Clearance, Garda ref | Provider | Art.6(1)(b) Sözleşme + Art.6(1)(c) Yasal yükümlülük | Belgeler: onay + 30 gün; doğrulama durumu: hesap aktif | Supabase (AB) | Hayır |
| 3 | İş ilanı oluşturma | Başlık, açıklama, Eircode, adres, fotoğraflar, bütçe | Müşteri | Art.6(1)(b) Sözleşme | İş tamamlanma + 1 yıl | Supabase (AB) | Hayır |
| 4 | Teklif ve mesajlaşma | Mesaj içeriği, dosya ekleri | Müşteri + Provider | Art.6(1)(b) Sözleşme | İş tamamlanma + 1 yıl | Supabase (AB) | Hayır |
| 5 | Ödeme işleme | Stripe PI ID, tutar, komisyon, VAT | Müşteri + Provider | Art.6(1)(b) Sözleşme + Art.6(1)(c) Yasal yükümlülük | **7 yıl** (Revenue) | Stripe Ireland (AB), Supabase (AB) | Hayır |
| 6 | İnceleme/değerlendirme | Rating, yorum, kalite skorları | Müşteri (yazan) + Provider (hakkında) | Art.6(1)(f) Meşru menfaat | Hesap aktif + silme sonrası | Supabase (AB), publik profil | Hayır |
| 7 | Transaksiyonel email | Email adresi, ad, iş detayları | Müşteri + Provider | Art.6(1)(b) Sözleşme | Resend'de 30 gün | Resend (AB) | Hayır |
| 8 | AI iş açıklaması üretimi | İş başlığı, kategori, kapsam (PII içermez) | - | Art.6(1)(f) Meşru menfaat | İşlem süresi | Anthropic (ABD) | ⚠️ **Evet** |
| 9 | Hata izleme | User ID, IP, hata detayı (maskelenmiş) | Tüm kullanıcılar | Art.6(1)(f) Meşru menfaat | 90 gün (Sentry default) | Sentry (AB/ABD) | ⚠️ **Kontrol gerekli** |
| 10 | Adres doğrulama | Eircode | Müşteri + Provider | Art.6(1)(b) Sözleşme | Hesap aktif | Ideal Postcodes (UK) | ⚠️ **UK — yeterlilik kararı var** |
| 11 | Analytics (funnel) | Session ID, adım, zaman damgası (anonim) | Anonim | Art.6(1)(f) Meşru menfaat | 90 gün | Supabase (AB) | Hayır |
| 12 | Cookie consent tercihi | Consent durumu | Tüm ziyaretçiler | Art.6(1)(a) Rıza | 180 gün | localStorage (istemci) | Hayır |

### Adım 2: Hukuki Dayanaklar ve Consent/No-Consent Ayrımı

| İşleme | Hukuki Dayanak | Rıza Gerekli mi? | Açıklama |
|--------|---------------|-------------------|----------|
| Hesap oluşturma | **Sözleşme (Art.6(1)(b))** | Hayır | Hizmet sunumu için gerekli |
| Ödeme işleme | **Sözleşme + Yasal yükümlülük** | Hayır | Stripe + Revenue gereksinimleri |
| Provider doğrulama | **Sözleşme + Yasal yükümlülük** | Hayır | Platform güvenliği + İrlanda regülasyonları |
| Transaksiyonel email | **Sözleşme** | Hayır | Hizmet sunumunun parçası |
| Analytics cookie | **Rıza (Art.6(1)(a))** | **Evet** | ePrivacy Reg. SI 336 |
| Marketing cookie | **Rıza (Art.6(1)(a))** | **Evet** | ePrivacy Reg. SI 336 |
| Marketing email | **Rıza (Art.6(1)(a))** | **Evet** | SI 535/2003 (e-Commerce) |
| AI iş açıklaması | **Meşru menfaat (Art.6(1)(f))** | Hayır | PII gönderilmiyor; LIA belgesi hazırlanmalı |
| Hata izleme (Sentry) | **Meşru menfaat (Art.6(1)(f))** | Hayır | Servis kalitesi; PII maskelenmeli |
| Review/değerlendirme | **Meşru menfaat (Art.6(1)(f))** | Hayır | Platform güvenilirliği |

**Kritik Ayrım:** "Transaksiyonel email" (quote bildirim, ödeme onay) consent gerektirmez. "Marketing email" (promosyon, newsletter) **mutlaka opt-in consent** gerektirir.

### Adım 3: DPA'lar (Data Processing Agreements)

| # | İşleyici (Processor) | Veri Tipi | DPA Durumu | Aksiyon |
|---|---------------------|-----------|-----------|--------|
| 1 | **Supabase** (Supabase Inc.) | Tüm kullanıcı verileri | Supabase DPA mevcut (kabul edilmeli) | Dashboard → Settings → DPA'yı imzalayın |
| 2 | **Stripe** (Stripe Ireland Ltd) | Ödeme verileri, KYC | Stripe DPA otomatik kabul | Dashboard → onaylayın |
| 3 | **Resend** (Resend Inc.) | Email adresleri, ad, iş detayları | Resend DPA kontrol edilmeli | DPA talep edin veya ToS'taki DPA clause'u |
| 4 | **Sentry** (Functional Software Inc.) | User ID, IP, hata bağlamı | Sentry DPA mevcut | Dashboard → Settings → DPA'yı kabul edin |
| 5 | **Anthropic** (Anthropic Inc. — ABD) | İş kategorisi, kapsam (PII yok) | ⚠️ API ToS DPA içerir | API Terms'ü inceleyin + SCC/TIA gerekli |
| 6 | **Vercel** (Vercel Inc. — ABD) | HTTP request metadata, edge cache | Vercel DPA mevcut | Dashboard → DPA'yı kabul edin |
| 7 | **Ideal Postcodes** (Allies Computing Ltd — UK) | Eircode | UK yeterlilik kararı (AB) | DPA talep edin |

**Her DPA'da kontrol edilecekler:**
- [ ] İşleme amacı ve kapsamı açıkça belirtilmiş mi?
- [ ] Alt-işleyici (sub-processor) listesi var mı?
- [ ] Veri ihlali bildirim süresi (≤48 saat) belirtilmiş mi?
- [ ] Sözleşme sonlandırma → veri silme/iade maddesi var mı?
- [ ] AB dışı transfer varsa SCC ekli mi?
- [ ] Teknik ve organizasyonel tedbirler (ToM) belirtilmiş mi?

### Adım 4: DPO Gerekliliği Değerlendirmesi

**GDPR Art. 37 — DPO zorunluluk kriterleri:**

| Kriter | WorkMate Durumu | Sonuç |
|--------|----------------|-------|
| Kamu kurumu musunuz? | Hayır | DPO zorunlu değil |
| Büyük ölçekli düzenli ve sistematik izleme mi? | Hayır (marketplace, profiling yok) | DPO zorunlu değil |
| Büyük ölçekli özel kategori veri işleme mi? | Hayır (Garda vetting = ceza kaydı → özel kategori olabilir ama "büyük ölçekli" değil) | ⚠️ Sınırda |

**Sonuç:** Şu an için DPO **yasal olarak zorunlu değil** ancak:
- **Garda vetting verileri** (ceza kaydı kategorisi, Art.10) işleniyor — DPC tarafından "büyük ölçekli" sayılırsa DPO gerekebilir
- **Öneri:** İlk aşamada dış DPO danışmanı (part-time/retainer) atanması; full-time DPO 500+ provider sonrası değerlendirilmeli

**Varsayım:** İlk 1000 provider'a kadar dış DPO danışmanı yeterli (~€200-500/ay retainer).

### Adım 5: Privacy Policy, Cookie Policy, Terms

**Mevcut Durum:**
- ✅ Privacy Policy: `/privacy` — kapsamlı, 9 bölüm
- ✅ Cookie Policy: `/cookie-policy` — i18n destekli
- ✅ Data Retention Policy: `/data-retention` — saklama süreleri belirtilmiş
- ✅ Cookie Consent Banner: `CookieConsent.tsx` — essential/analytics/marketing ayrımı

**Güncellenmesi Gerekenler:**

| Güncelleme | Dosya | Detay |
|-----------|-------|-------|
| Data Controller bilgisi | `app/[locale]/privacy/page.tsx` | "WorkMate Ltd, CRO: XXXXXX, [adres]" |
| DPC şikayet hakkı | `app/[locale]/privacy/page.tsx` | "Data Protection Commission, 21 Fitzwilliam Square South, Dublin 2, info@dataprotection.ie" |
| DPO iletişim (atanınca) | `app/[locale]/privacy/page.tsx` | "dpo@workmate.ie" |
| Garda vetting özel kategori notu | `app/[locale]/privacy/page.tsx` | Art.10 ceza verisi işleme gerekçesi |
| Anthropic veri transferi notu | `app/[locale]/privacy/page.tsx` | ABD transferi + SCC referansı |
| Cookie consent → DB kayıt | `CookieConsent.tsx` | localStorage yerine server-side kayıt |
| Marketing email opt-in | Kayıt formu | Ayrı checkbox (pre-ticked OLMAMALI) |

### Adım 6: Veri İhlali Prosedürü

**Yasal Gereksinim:** GDPR Art. 33-34 — İhlalden haberdar olunca **72 saat** içinde DPC'ye bildirim (risk varsa) + veri sahiplerine bildirim (yüksek risk varsa).

**WorkMate Veri İhlali Müdahale Planı:**

```
SAAT 0: İhlal Tespit
├─ Tespit kaynakları: Sentry alert, admin raporu, kullanıcı şikayeti, Stripe bildirim
├─ İlk aksiyonlar:
│   ├─ Etkilenen sistemi izole et (DB erişimi kısıtla)
│   ├─ Incident kaydı aç (admin_audit_logs + ayrı incident log)
│   └─ DPO/privacy contact'ı bilgilendir

SAAT 0-24: Değerlendirme
├─ Etkilenen veri türleri ve miktarını belirle
├─ Etkilenen veri sahiplerini tespit et
├─ Risk seviyesini değerlendir:
│   ├─ DÜŞÜK: Teknik hata, veri erişimi yok → İç kayıt yeterli
│   ├─ ORTA: Sınırlı veri erişimi → DPC'ye bildirim gerekli
│   └─ YÜKSEK: PII/finansal veri sızıntısı → DPC + veri sahiplerine bildirim
├─ Root cause analizi başlat

SAAT 24-72: Bildirimler
├─ DPC Bildirimi (Art. 33):
│   ├─ Platform: forms.dataprotection.ie
│   ├─ İçerik: ihlalin niteliği, etkilenen kişi sayısı, olası sonuçlar, alınan önlemler
│   └─ Süre: tespitten itibaren 72 saat (gecikme gerekçesi belirtilmeli)
├─ Veri Sahiplerine Bildirim (Art. 34) — yüksek risk varsa:
│   ├─ Kanal: Email (sendTransactionalEmail) + in-app notification
│   ├─ İçerik: ne oldu, hangi veriler etkilendi, ne yaptık, ne yapmalısınız
│   └─ Dil: açık, anlaşılır İngilizce

SAAT 72+: Düzeltme ve Raporlama
├─ Root cause düzelt
├─ Güvenlik önlemlerini güçlendir
├─ İç rapor hazırla (incident post-mortem)
├─ DPC'ye ek bilgi sun (gerekirse)
└─ Prosedür güncelle
```

**Gerekli Teknik Altyapı:**

| Bileşen | Durum | Aksiyon |
|---------|-------|--------|
| Sentry alerting | ✅ Mevcut | Severity threshold ayarla |
| Admin audit logs | ✅ Mevcut | Incident log tipi ekle |
| Email bildirim template | ❌ Yok | `breachNotificationEmail` template ekle |
| DPC bildirim formu şablonu | ❌ Yok | Offline Word/PDF şablon hazırla |
| Incident response runbook | ❌ Yok | `docs/INCIDENT_RESPONSE.md` oluştur |

### Adım 7: AB Dışı Veri Transferleri

**Mevcut AB Dışı Transferler:**

| Hizmet | Lokasyon | Veri | Transfer Mekanizması |
|--------|----------|------|---------------------|
| **Anthropic** | ABD | İş kategorisi/kapsam (PII yok) | SCC + TIA gerekli |
| **Vercel** | ABD (edge: global) | HTTP metadata, sayfa cache | Vercel DPA + SCC |
| **Sentry** | ABD/AB (configurable) | User ID, error context | Sentry DPA + SCC; AB hosting tercih edin |

**Aksiyon Planı:**

1. **Anthropic (ABD):**
   - PII gönderilmiyor (sadece iş başlığı, kategori, kapsam) → düşük risk
   - Yine de SCC (Standard Contractual Clauses) gerekli
   - TIA (Transfer Impact Assessment) hazırlayın: ABD FISA 702 riski vs gönderilen veri (PII yok → düşük)
   - Anthropic'in API Terms'ü SCC içeriyor mu kontrol edin

2. **Vercel (ABD):**
   - Vercel DPA'sı SCC içerir (standart)
   - EU region deployment'ı tercih edin (Vercel EU edge)

3. **Sentry:**
   - EU data residency seçeneği varsa kullanın (sentry.io → Settings → Data Residency)
   - AB hosting = transfer sorunu ortadan kalkar

4. **Supabase, Stripe, Resend:**
   - Supabase: AB bölge seçilmiş → transfer yok ✅
   - Stripe Ireland Ltd: AB → transfer yok ✅
   - Resend: AB sunucu kontrol edin; DPA'daki data residency clause'unu inceleyin

### Adım 8: Teknik ve Organizasyonel Tedbirler

| # | Tedbir | Mevcut Durum | GDPR Referans |
|---|--------|-------------|---------------|
| 1 | Veritabanı şifreleme (at rest) | ✅ Supabase sağlar (AES-256) | Art.32(1)(a) |
| 2 | Transport şifreleme (in transit) | ✅ HTTPS/TLS zorunlu | Art.32(1)(a) |
| 3 | Erişim kontrolü (RBAC) | ✅ RLS + user_roles tablosu | Art.32(1)(b) |
| 4 | API key hashing | ✅ SHA-256 (migration 060) | Art.32(1)(a) |
| 5 | Şifre hashing | ✅ Supabase Auth (bcrypt) | Art.32(1)(a) |
| 6 | Rate limiting | ✅ Tüm yazma endpoint'leri | Art.32(1)(b) |
| 7 | Audit logging | ✅ admin_audit_logs | Art.32(1)(d) |
| 8 | Otomatik veri silme | ✅ GDPR cron + ID retention cron | Art.5(1)(e) |
| 9 | Veri minimizasyonu | ⚠️ Kısmi (mesajlar şifrelenmemiş) | Art.5(1)(c) |
| 10 | Pseudonymization | ⚠️ Kısmi (admin GDPR paneli masked) | Art.32(1)(a) |
| 11 | Backup ve recovery | ⚠️ PITR etkinleştirilmeli | Art.32(1)(c) |
| 12 | Sentry PII masking | ✅ maskAllText/Inputs/Media | Art.32(1)(a) |
| 13 | CSP header | ✅ Mevcut | Art.32(1)(a) |
| 14 | Penetration test | ❌ Yapılmadı | Art.32(1)(d) |
| 15 | Staff training | ❌ Yapılmadı | Art.32(4) |

### Adım 9: Veri Sahibi Hakları Operasyonu

**GDPR Art. 15-22 — Haklar ve WorkMate Uygulaması:**

| Hak | GDPR Maddesi | WorkMate Uygulaması | Süre |
|-----|-------------|-------------------|------|
| **Erişim (Access)** | Art.15 | ✅ `GET /api/profile/gdpr` → JSON export | 30 gün |
| **Düzeltme (Rectification)** | Art.16 | ✅ Profil düzenleme (dashboard) | Anında |
| **Silme (Erasure)** | Art.17 | ✅ `DELETE /api/profile/gdpr` → 30 gün hold → hard delete | 30 gün hold + 30 gün yanıt |
| **İşleme kısıtlama** | Art.18 | ⚠️ Manuel (admin route ile) | 30 gün |
| **Taşınabilirlik (Portability)** | Art.20 | ✅ JSON export (makine okunabilir) | 30 gün |
| **İtiraz (Objection)** | Art.21 | ⚠️ Manuel işlem (email → admin) | 30 gün |
| **Otomatik karar alma** | Art.22 | ℹ️ Smart Match → tam otomatik karar yok, sıralama yardımcı | Gerekli değil |

**DSAR (Data Subject Access Request) Akışı:**

```
Kullanıcı                       WorkMate
   │                               │
   ├─ Dashboard → "Export My Data" ─┤
   │                               ├─ auth.getUser() doğrulama
   │                               ├─ profiles, jobs, appointments,
   │                               │  reviews, addresses, favourites query
   │                               ├─ JSON dosyası oluştur
   │   ◄─ workmate-data-export.json─┤
   │                               │
   ├─ Dashboard → "Delete Account" ─┤
   │                               ├─ confirm: true doğrula
   │                               ├─ deletion_requested_at = now()
   │   ◄─ "30 gün içinde silinecek" ┤
   │                               │
   │     [30 gün sonra]             │
   │                               ├─ gdpr-retention-processor cron
   │                               ├─ FK-safe deletion (reviews→appointments→
   │                               │  jobs→favourites→roles→profiles→auth)
   │                               ├─ Finansal kayıtlar korunur (7 yıl)
   │   ◄─ Deletion confirmation ────┤
```

> **Geliştiricilere / İş Kurucularına Not:**
> - **RoPA belgesi:** `docs/ROPA.md` oluşturun — yukarıdaki tabloyu temel alın, her 6 ayda güncelleyin.
> - **DPA'lar:** Her processor'un dashboard'unda DPA imza sayfası var — hepsini sırayla imzalayın ve `docs/dpas/` klasörüne kaydedin.
> - **Veri ihlali şablonu:** `lib/email/templates.ts`'e `breachNotificationEmail` template ekleyin.
> - **DSAR süresi:** Mevcut export anında indirilir; GDPR 30 gün süre verir ama anında yanıt en iyisi.
> - **Consent DB kaydı:** `CookieConsent.tsx`'teki localStorage'ı sunucu tarafına taşıyın — yeni `consent_records` tablosu (migration 073 adayı): `user_id | consent_type | granted | timestamp | ip_hash`.
> - **Sentry EU hosting:** sentry.io → Settings → General → Data Residency → EU seçin.
> - **İtiraz hakkı:** `privacy@workmate.ie` adresine gelen itirazlar için basit bir ticketing sistemi veya email tagging yeterli (başlangıç için).

---

## 7. Teknik Entegrasyon Gereklilikleri (Geliştiricilere Özel)

### 7.1 Consent Management Platform

**Mevcut:** `CookieConsent.tsx` — localStorage bazlı, essential/analytics/marketing ayrımı.

**Gerekli İyileştirmeler:**

```typescript
// Önerilen: consent_records tablosu (migration 073)
// Dosya: marketplace/migrations/073_consent_records.sql

CREATE TABLE consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- anonim kullanıcılar için
  consent_type TEXT NOT NULL CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'terms')),
  granted BOOLEAN NOT NULL,
  ip_hash TEXT, -- SHA-256 hashed IP (PII olmaktan çıkar)
  user_agent_hash TEXT, -- SHA-256 hashed UA
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- RLS: Kullanıcı kendi kayıtlarını görebilir, admin tümünü
CREATE INDEX idx_consent_records_user ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
```

**CookieConsent.tsx Güncelleme:**
```typescript
// Consent kabul/ret → API call
const saveConsent = async (preferences: ConsentPreferences) => {
  // localStorage'a da yaz (fallback)
  localStorage.setItem('wm_cookie_consent', JSON.stringify(preferences));

  // Server-side kayıt
  await fetch('/api/consent', {
    method: 'POST',
    body: JSON.stringify({
      essential: true, // daima true
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    })
  });
};
```

### 7.2 Supabase GDPR Uyumlu Ayarlar

| Ayar | Mevcut | Gerekli | Nasıl |
|------|--------|---------|-------|
| AB bölge hosting | ✅ | ✅ | Proje oluşturulurken seçilmiş |
| PITR backup | ⚠️ Etkinleştirilmeli | ✅ | Dashboard → Database → Backups → Enable PITR |
| DPA | ❌ İmzalanmamış | ✅ | Dashboard → Settings → Organization → DPA |
| SSL enforcement | ✅ | ✅ | Default olarak zorunlu |
| RLS | ✅ | ✅ | Tüm tablolarda aktif |
| Auth session timeout | ✅ 1 saat | ✅ | Dashboard → Auth → Settings |

### 7.3 Stripe GDPR Uyumlu Ayarlar

| Ayar | Mevcut | Gerekli | Nasıl |
|------|--------|---------|-------|
| Stripe Ireland Ltd | ✅ | ✅ | İrlanda hesabı oluşturulmuş |
| DPA | ✅ Otomatik | ✅ | Stripe ToS'a dahil |
| Radar (fraud) | ✅ | ✅ | Default aktif |
| Data retention | Default | İncele | Dashboard → Settings → Data pipeline |
| Webhook idempotency | ✅ | ✅ | Migration 059 |

### 7.4 Resend GDPR Uyumlu Ayarlar

| Ayar | Gerekli | Nasıl |
|------|---------|-------|
| DPA imzalama | ✅ | Resend dashboard veya email ile talep |
| Unsubscribe header | ✅ | `List-Unsubscribe` header eklenmeli (marketing email'ler için) |
| Data residency | ✅ | AB sunucu seçimi kontrol |
| Bounce handling | ✅ | Webhook ile invalid email'leri temizle |

### 7.5 Sentry GDPR Uyumlu Ayarlar

**Mevcut yapılandırma güçlü ama iyileştirme gerekli:**

```typescript
// sentry.client.config.ts — MEVCUT (iyi)
replaysSessionSampleRate: 0.1,
replaysOnErrorSampleRate: 1.0,
maskAllText: true,
maskAllInputs: true,
blockAllMedia: true,

// EKLENMESİ GEREKEN: PII filtering
Sentry.init({
  // ... mevcut config
  beforeSend(event) {
    // Email adreslerini error context'ten temizle
    if (event.user) {
      delete event.user.email;
      // user.id tutulabilir (pseudonym)
    }
    // Request body'den PII temizle
    if (event.request?.data) {
      const sensitiveKeys = ['password', 'phone', 'eircode', 'full_name', 'email'];
      for (const key of sensitiveKeys) {
        if (event.request.data[key]) {
          event.request.data[key] = '[REDACTED]';
        }
      }
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    // Form input breadcrumb'lardan PII temizle
    if (breadcrumb.category === 'ui.input') {
      breadcrumb.message = '[REDACTED]';
    }
    return breadcrumb;
  }
});
```

### 7.6 Data Retention Otomatik Silme İş Akışları

**Mevcut Cron'lar:**

| Cron | Schedule | İşlev | Durum |
|------|----------|-------|-------|
| `gdpr-retention-processor` | `0 3 * * *` (günlük 03:00) | 30 gün sonrası hard-delete | ✅ Kod hazır, deploy gerekli |
| `id-verification-retention` | `30 2 * * *` (günlük 02:30) | Belge silme (30 gün/onay) | ✅ Kod hazır, deploy gerekli |
| `message-retention` | `15 3 * * *` (günlük 03:15) | Mesaj silme (iş + 1 yıl) | ⚠️ Migration var, cron tam değil |

**Deploy komutları (production):**
```bash
# GDPR retention processor
supabase functions deploy gdpr-retention-processor

# ID verification cleanup
supabase functions deploy id-verification-retention

# pg_cron schedule (Supabase SQL editor'da çalıştırın)
SELECT cron.schedule('gdpr-retention-daily', '0 3 * * *',
  $$SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/gdpr-retention-processor',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'
  )$$
);
```

### 7.7 DPIA Şablonu ve Tetikleyicileri

**DPIA ne zaman gerekli?** (GDPR Art. 35)
- Yeni bir veri işleme faaliyeti başlatılırken
- Büyük ölçekli profiling veya otomatik karar alma eklendiğinde
- Özel kategori veri işleme kapsamı genişletildiğinde

**WorkMate için DPIA gerekli alanlar:**
1. **Stripe Identity (KYC):** Kimlik belgesi + yüz tanıma → DPIA zorunlu
2. **Garda Vetting:** Ceza kaydı verisi (Art.10) → DPIA önerilir
3. **Smart Match sıralama:** Algoritmik sıralama varsa → DPIA değerlendirilmeli

**DPIA belgesi:** `docs/DPIA_TEMPLATE.md` oluşturun:
- İşleme faaliyetinin tanımı
- Gereklilik ve orantılılık değerlendirmesi
- Veri sahipleri için riskler
- Riskleri azaltma tedbirleri
- DPO/danışman görüşü

> **Geliştiricilere / İş Kurucularına Not:**
> - **Consent migration (073):** Yukarıdaki `consent_records` tablosunu oluşturun. `CookieConsent.tsx`'i `POST /api/consent` çağıracak şekilde güncelleyin.
> - **Sentry beforeSend:** `sentry.client.config.ts` ve `sentry.server.config.ts`'e yukarıdaki PII filtering kodunu ekleyin.
> - **Edge function deploy:** `supabase functions deploy` komutu ile production'a deploy edin. Schedule'ları Supabase SQL editor'da çalıştırın.
> - **DPIA:** İlk DPIA'yı Stripe Identity (KYC) için hazırlayın — en yüksek risk kategorisi.
> - **Resend List-Unsubscribe:** Marketing email template'lerine `List-Unsubscribe` header ekleyin: `headers: { 'List-Unsubscribe': '<mailto:unsubscribe@workmate.ie>' }`.

---

## 8. Bütçe Dağılımı (3 Senaryo)

### Senaryo 1: Minimum (DIY + Temel Danışmanlık)

| Kalem | Tek Seferlik | Yıllık | Notlar |
|-------|-------------|--------|--------|
| CRO kuruluş | €75 | - | İsim + incorporation |
| Virtual office | - | €300 | Registered address |
| Constitution (template) | €0-200 | - | Model Form veya basit custom |
| Revenue kayıt | €0 | - | Ücretsiz |
| Muhasebeci (basic) | - | €1,800 | VAT + CT1 beyanları |
| Muhasebe yazılımı | - | €300 | Xero starter |
| DPO danışmanı | - | €0 | DIY (riskli ama mümkün) |
| Hukuki template'ler | €300 | - | Online template (lawdepot.ie) |
| GDPR araçları | - | €0 | Mevcut altyapı yeterli |
| Domain (.ie) | - | €25 | IEDR |
| **Toplam** | **~€575** | **~€2,425/yıl** | |

### Senaryo 2: Orta (Profesyonel Destek)

| Kalem | Tek Seferlik | Yıllık | Notlar |
|-------|-------------|--------|--------|
| CRO kuruluş | €75 | - | |
| Virtual office | - | €400 | Mail forwarding dahil |
| Hukuk danışmanı (kuruluş) | €1,500 | - | Constitution + SHA + IP assignment |
| Revenue kayıt | €0 | - | |
| Muhasebeci (mid) | - | €3,600 | Tam hizmet (VAT + CT1 + advisory) |
| Muhasebe yazılımı | - | €500 | Xero standard |
| DPO danışmanı (retainer) | - | €3,600 | €300/ay, quarterly review |
| GDPR hukuki danışmanlık | €2,000 | - | DPA review + policy audit |
| SHA + Vesting | €2,000 | - | Custom (çoklu founder) |
| IP Assignment | €500 | - | |
| Penetration test | - | €3,000 | Yıllık 1 kez |
| Domain (.ie) | - | €25 | |
| **Toplam** | **~€6,075** | **~€11,125/yıl** | |

### Senaryo 3: Profesyonel (Tam Hizmet + Yatırıma Hazır)

| Kalem | Tek Seferlik | Yıllık | Notlar |
|-------|-------------|--------|--------|
| CRO kuruluş + fast-track | €175 | - | |
| Serviced office (Dublin) | - | €6,000 | Fiziksel adres + toplantı odası |
| Hukuk firması (tam paket) | €5,000 | €3,000 | Kuruluş + SHA + IP + ESOP + ongoing |
| Revenue kayıt | €0 | - | |
| Muhasebe firması (Big4/mid-tier) | - | €6,000 | Tam audit + advisory |
| Muhasebe yazılımı | - | €600 | Xero premium |
| DPO (dış, senior) | - | €6,000 | €500/ay, monthly review + incident support |
| GDPR tam uyum projesi | €5,000 | - | RoPA + DPIA + DPA + policy audit |
| SHA + Vesting + ESOP | €4,000 | - | Investor-ready |
| IP Assignment + TM | €1,500 | - | IP + EUIPO trademark |
| Penetration test | - | €5,000 | Yıllık 2 kez + remediation |
| Cyber insurance | - | €1,500 | Data breach coverage |
| Domain (.ie + .com) | - | €40 | |
| **Toplam** | **~€15,675** | **~€28,140/yıl** | |

### Senaryo Karşılaştırma

| Metrik | Minimum | Orta | Profesyonel |
|--------|---------|------|-------------|
| İlk Yıl Toplam | ~€3,000 | ~€17,200 | ~€43,815 |
| DPC Risk | Yüksek | Düşük | Çok Düşük |
| Yatırımcı Hazırlığı | Düşük | Orta | Yüksek |
| Ölçeklenebilirlik | Sınırlı | İyi | Mükemmel |
| **Önerilen** | MVP/test | **Seed stage** ✅ | Series A+ |

> **Geliştiricilere / İş Kurucularına Not:**
> - **Senaryo 2 önerilir** — yeterli koruma + makul maliyet. DPO retainer + yıllık pentest + tam muhasebeci.
> - Penetration test: OWASP ZAP (ücretsiz, otomatik) + yıllık manuel test (Defensics, Bishop Fox vb.)
> - Cyber insurance: Hiscox Ireland veya Aviva — data breach coverage €500K+.
> - GDPR araç maliyeti: Mevcut altyapı (Supabase RLS, edge functions, audit logs) sayesinde ek araç gerekmez.

---

## 9. Zaman Çizelgesi (Gantt-Style)

```
                        HAFTA 1-2       HAFTA 3-4      AY 2           AY 3           AY 4-6
Aktivite                [Gün 1-14]     [Gün 15-30]    [Gün 31-60]    [Gün 61-90]    [Gün 91-180]
════════════════════    ════════════   ════════════   ════════════   ════════════   ════════════

ŞİRKET KURULUŞU
CRO isim + Form A1      [████████]
CRO onay bekleme                       [████████]
RBO kaydı                              [████████]
Revenue TR1 kaydı                      [████████████████████]
Banka hesabı açma                      [████████████████████████████████]
Stripe şirket hesabı                                  [████████████]

HUKUK & SÖZLEŞMELER
Constitution hazırlama   [████████]
IP Assignment            [████████████████████]
SHA (çoklu founder)                    [████████████████████]
Terms & Conditions güncelle            [████████]
Privacy Policy güncelle  [████████]

GDPR UYUM
RoPA belgesi             [████████████████████]
DPA'ları imzalama        [████████████████████████████████]
Privacy/Cookie policy    [████████]
Cookie consent DB kayıt                [████████]
Sentry PII filtering     [████████]
DPIA (Stripe Identity)                 [████████████████████]
Veri ihlali prosedürü                  [████████████████████]
DPO danışmanı seçimi                                  [████████]
Edge function deploy                   [████████]

VERGİ & MUHASEBE
Muhasebeci seçimi                      [████████████████████]
Xero kurulumu                                         [████████]
VAT kaydı                                             [████████████████████]
İlk VAT beyanı                                                                   [████████]
İlk CT1 (yıl sonu)                                                               [████████████]

DENETİM & SÜREKLİ
İlk internal GDPR audit                                             [████████████]
Penetration test                                                     [████████████]
Staff training                                                       [████████]
Quarterly DPO review                                                               [████████]
Annual return (CRO)                                                                [████████]
```

---

## 10. Riskler, Cezalar ve Mitigasyon Planı

### 10.1 GDPR Cezaları (Mart 2026 İtibarıyla)

| İhlal Türü | Maksimum Ceza | Örnek |
|------------|--------------|-------|
| **Tier 1 (Art.83(4))** | €10M veya global cironun %2'si | Kayıt tutmama (RoPA), DPO atamama, DPIA yapmama |
| **Tier 2 (Art.83(5))** | €20M veya global cironun %4'ü | Hukuki dayanak olmadan işleme, haklar ihlali, AB dışı yasadışı transfer |
| **DPC İdari Ceza** | Değişken | Uyarı → ceza → operasyon durdurma |

### 10.2 Risk Matrisi

| # | Risk | Olasılık | Etki | Ceza Riski | Mitigasyon |
|---|------|----------|------|-----------|------------|
| R1 | **RoPA eksikliği** — DPC denetiminde RoPA sunulamaması | Orta | Yüksek | Tier 1 (€10M) | RoPA belgesini hemen hazırlayın (`docs/ROPA.md`) |
| R2 | **DPA eksikliği** — Processor'larla yazılı sözleşme olmaması | Yüksek | Yüksek | Tier 1 | Tüm processor DPA'larını imzalayın (Supabase, Stripe, Resend, Sentry) |
| R3 | **Consent kaydı tutulmaması** — Cookie consent kanıt eksikliği | Orta | Orta | Tier 1 | localStorage → DB'ye taşıyın (consent_records tablosu) |
| R4 | **AB dışı transfer (Anthropic)** — SCC/TIA olmadan ABD'ye veri transferi | Düşük | Yüksek | Tier 2 (€20M) | TIA hazırlayın; PII gönderilmiyor → düşük gerçek risk |
| R5 | **Veri ihlali → 72 saat bildirim başarısızlığı** | Düşük | Kritik | Tier 2 | Incident response prosedürü + Sentry alerting |
| R6 | **Garda vetting verisi (Art.10)** — Ceza kaydı verisini DPIA olmadan işleme | Orta | Yüksek | Tier 1 | DPIA hazırlayın; işleme gerekçesini belgeleyin |
| R7 | **Sentry'de PII sızıntısı** — Error context'te email/telefon | Orta | Orta | Tier 1 | beforeSend PII filtering ekleyin |
| R8 | **Mesaj şifrelenmemesi** — Job messages plaintext DB'de | Düşük | Orta | Uyarı | Kısa vadede kabul edilebilir; uzun vadede encryption |
| R9 | **Revenue uyumsuzluğu** — 7 yıllık kayıt saklama ihlali | Düşük | Yüksek | Revenue cezası | ✅ Mevcut hard-delete akışı finansal kayıtları koruyor |
| R10 | **IP mülkiyet riski** — Kod şirkete devredilmemiş | Yüksek | Kritik | Yatırım kaybı | IP Assignment Agreement imzalatın (Day 1) |
| R11 | **RBO kaydı yapılmaması** — 5 aylık süre aşımı | Orta | Yüksek | €5,000 + hapis | rbo.ie'ye 5 ay içinde kayıt |
| R12 | **Director compliance** — İrlanda'da en az 1 EEA-resident director | Yüksek | Yüksek | CRO reddi | Section 137 bond (€25K) veya EEA-resident director |

### 10.3 Operasyonel Riskler

| Risk | Açıklama | Mitigasyon |
|------|----------|------------|
| Banka hesabı gecikmesi | İrlanda'da 2-6 hafta sürebilir | Wise Business (hızlı IBAN) başvurusu paralel yapılmalı |
| Revenue VAT kaydı gecikmesi | 3-6 hafta sürebilir | TR1'i erken gönderin; Stripe VAT gereksinimleri bekletilmesin |
| Director residency requirement | En az 1 EEA-resident director veya €25K Section 137 bond | Eğer tüm director'lar EEA dışındaysa bond gerekli |
| Trade mark itirazı | "WorkMate" ismi başka yerde tescilli olabilir | EUIPO TMView + IPOI araması yapın |

> **Geliştiricilere / İş Kurucularına Not:**
> - **R2 (DPA)** en acil risk — Supabase ve Sentry dashboard'larında DPA'yı bugün imzalayabilirsiniz.
> - **R4 (Anthropic transfer):** Gerçek risk düşük çünkü PII gönderilmiyor ama TIA belgesi olması gerekli. Basit 1 sayfa TIA yeterli: "Gönderilen veri: iş kategorisi, kapsam. PII: yok. Risk: minimal."
> - **R7 (Sentry PII):** `beforeSend` hook'u eklemek 30 dakikalık iş — bugün yapılabilir.
> - **R12 (Director residency):** Tüm founder'lar EEA dışındaysa McCann FitzGerald veya A&L Goodbody'den Section 137 bond hizmeti alın (~€1,200/yıl).

---

## 11. İlk 30 Gün Acil Aksiyon Listesi

| # | Aksiyon | Kim | Effort | Etki | Bağımlılık | Gün |
|---|---------|-----|--------|------|-----------|-----|
| 1 | **CRO'da isim kontrolü ve Form A1 gönder** | Kurucu | S | Kritik | - | 1 |
| 2 | **IP Assignment Agreement imzala** | Kurucu + Avukat | S | Kritik | - | 1-3 |
| 3 | **Supabase DPA'yı imzala** | Dev | S | Yüksek | - | 1 |
| 4 | **Sentry DPA'yı imzala** | Dev | S | Yüksek | - | 1 |
| 5 | **Stripe DPA'yı kontrol et** | Dev | S | Yüksek | - | 1 |
| 6 | **Sentry beforeSend PII filtering ekle** | Dev | S | Yüksek | - | 1-2 |
| 7 | **Privacy Policy'yi güncelle** (Data Controller bilgisi) | Dev | S | Yüksek | #1 onay | 5-10 |
| 8 | **RoPA belgesi oluştur** | Kurucu + Dev | M | Yüksek | - | 1-7 |
| 9 | **Revenue TR1 formu gönder** | Kurucu | S | Yüksek | #1 onay | 10-15 |
| 10 | **RBO kaydı yap** | Kurucu | S | Yüksek | #1 onay | 10-15 |
| 11 | **Banka hesabı başvurusu** | Kurucu | M | Yüksek | #1 onay | 10 |
| 12 | **GDPR edge function'ları deploy et** | Dev | S | Yüksek | Production erişimi | 7-14 |
| 13 | **Cookie consent → DB kayıt (migration 073)** | Dev | M | Orta | - | 7-14 |
| 14 | **Veri ihlali müdahale prosedürü yaz** | Kurucu + Dev | M | Yüksek | - | 14-21 |
| 15 | **Muhasebeci seçimi + Xero kurulumu** | Kurucu | M | Orta | #1 onay | 15-30 |

### Öncelik Akışı

```
GÜN 1-3 (Acil)
├─ #1 CRO başvurusu
├─ #2 IP Assignment
├─ #3-5 DPA imzalama (Supabase + Sentry + Stripe)
└─ #6 Sentry PII filtering

GÜN 4-10 (Yasal Temel)
├─ #8 RoPA belgesi
├─ #7 Privacy Policy güncelleme (CRO onayı gelince)
└─ #12 GDPR edge function deploy

GÜN 10-20 (Resmi Kayıtlar)
├─ #9 Revenue TR1
├─ #10 RBO
├─ #11 Banka hesabı
└─ #13 Cookie consent DB

GÜN 20-30 (Operasyonel)
├─ #14 Incident response prosedürü
└─ #15 Muhasebeci + Xero
```

> **Geliştiricilere / İş Kurucularına Not:**
> - #3-5 (DPA'lar) tamamen online yapılabilir — Supabase dashboard, Sentry dashboard, Stripe dashboard. Her biri 5-10 dakika.
> - #6 (Sentry PII): `sentry.client.config.ts` ve `sentry.server.config.ts`'e `beforeSend` hook ekleyin (bkz. Bölüm 7.5).
> - #8 (RoPA): Bölüm 6 Adım 1'deki tabloyu `docs/ROPA.md` olarak kaydedin.
> - #12 (Edge function deploy): `supabase functions deploy gdpr-retention-processor` + SQL editor'da cron schedule.
> - #13 (Consent migration): Bölüm 7.1'deki SQL'i migration 073 olarak oluşturun.

---

## 12. Sürekli Uyum ve Denetim Planı

### 12.1 Yıllık Uyum Takvimi

| Ay | Aktivite | Sorumlu | Çıktı |
|----|----------|---------|-------|
| Ocak | Yıllık GDPR iç denetim | DPO danışmanı | Denetim raporu |
| Şubat | RoPA güncelleme | Dev + DPO | Güncel RoPA |
| Mart | DPA'ları gözden geçirme | Kurucu + DPO | DPA uyum kontrolü |
| Nisan | Penetration test | Güvenlik firması | Pentest raporu + remediation |
| Mayıs | Staff training (GDPR) | DPO danışmanı | Eğitim kaydı |
| Haziran | Privacy Policy gözden geçirme | DPO + Hukuk | Güncel policy |
| Temmuz | Incident drill (simülasyon) | Dev + DPO | Drill raporu |
| Ağustos | Vendor reassessment | Kurucu | Vendor risk raporu |
| Eylül | Cookie/consent audit | Dev | Consent uyum kontrolü |
| Ekim | CRO Annual Return (B1) | Muhasebeci | B1 formu |
| Kasım | CT1 beyanı hazırlığı | Muhasebeci | Vergi raporu |
| Aralık | Yıl sonu güvenlik review | Dev + DPO | Güvenlik raporu |

### 12.2 Tetiklenen Denetimler (Event-Based)

| Tetikleyici | Denetim | Süre |
|------------|---------|------|
| Yeni veri işleme faaliyeti | DPIA değerlendirmesi | 2 hafta |
| Yeni alt-işleyici (sub-processor) | DPA + TIA (AB dışı ise) | 1 hafta |
| Veri ihlali | Post-incident review + DPC raporu | 72 saat + 30 gün |
| Kullanıcı şikayeti (DPC'ye) | İç araştırma + yanıt | 30 gün |
| Yasa değişikliği (GDPR/ePrivacy) | Policy güncelleme | 60 gün |
| Büyük platform güncellemesi | Privacy by design review | 1 hafta |
| 500+ provider milestone | DPO zorunluluğu yeniden değerlendirme | 2 hafta |

### 12.3 Otomasyon Önerileri

| Otomasyon | Mevcut | Aksiyon |
|-----------|--------|--------|
| GDPR hard-delete cron | ✅ Edge function | Production'da aktifleştir |
| Doküman retention cron | ✅ Edge function | Production'da aktifleştir |
| Consent kaydı | ⚠️ localStorage | Migration 073 → DB kayıt |
| DPA expiry tracking | ❌ | Basit reminder (Google Calendar + Slack) |
| Annual return reminder | ❌ | CRO ARD + 28 gün → takvim hatırlatıcı |
| Pentest scheduling | ❌ | Yıllık recurring booking |
| Policy version tracking | ⚠️ Manuel | Privacy policy'ye `version` + `updated_at` metadata |

> **Geliştiricilere / İş Kurucularına Not:**
> - **Incident drill:** Yılda en az 1 kez sahte veri ihlali simülasyonu yapın — Sentry'de test alert → prosedür uygulama → DPC form doldurma (gönderme) pratiği.
> - **Policy versioning:** Privacy policy sayfasına `lastUpdated` metadata ekleyin + kullanıcılara "Policy updated" notification gönderin (14 gün önceden, mevcut altyapı ile: `sendNotification()`).
> - **Vendor reassessment:** Her processor'un güvenlik sertifikasyonunu yıllık kontrol edin (SOC 2, ISO 27001). Supabase: SOC 2 Type II ✅, Stripe: PCI DSS Level 1 ✅.
> - **GDPR training:** DPC'nin ücretsiz online kaynakları: dataprotection.ie/en/organisations/know-your-obligations

---

## Bu Raporu Uygulamak İçin İlk 3 Acil Adım ve Benden İstediğiniz İlk 3 Belge

### İlk 3 Acil Adım

#### 1. CRO'da Şirket Kuruluşu Başlatın (Bugün)
- core.cro.ie'de hesap açın
- "WorkMate Ltd" isim kontrolü yapın
- Form A1'i doldurun (director bilgileri, registered office, constitution)
- €75 ödeyip gönderin
- **Beklenen sonuç:** 5-10 iş günü içinde Certificate of Incorporation

#### 2. DPA'ları İmzalayın + Sentry PII Filtering Ekleyin (Bugün)
- Supabase Dashboard → Settings → DPA (5 dakika)
- Sentry Dashboard → Settings → DPA (5 dakika)
- Stripe Dashboard → DPA kontrol (5 dakika)
- `sentry.client.config.ts` + `sentry.server.config.ts` → `beforeSend` hook (30 dakika)
- **Beklenen sonuç:** En kritik GDPR uyum açıkları hemen kapanır

#### 3. IP Assignment Agreement İmzalatın (Bu Hafta)
- Tüm mevcut kod, tasarım, veritabanı şeması → şirket mülkiyetine devir
- GitHub repo → organization hesabına taşıma
- **Beklenen sonuç:** IP riskleri ortadan kalkar; yatırımcı due diligence için hazır

### Benden İstediğiniz İlk 3 Belge

1. **RoPA (Records of Processing Activities)** — `docs/ROPA.md`
   - Bu rapordaki Bölüm 6 Adım 1 tablosunu düzenlenmiş, resmi format olarak

2. **Veri İhlali Müdahale Prosedürü** — `docs/INCIDENT_RESPONSE.md`
   - 72 saat akışı, roller, iletişim şablonları, DPC form rehberi

3. **DPIA (Data Protection Impact Assessment)** — `docs/DPIA_STRIPE_IDENTITY.md`
   - Stripe Identity (KYC) + Garda Vetting verisi için risk değerlendirmesi

---

*Bu rapor WorkMate'in mevcut kod tabanı (72 migration, 11 email template, 6 edge function, tam RLS yapısı), İrlanda Companies Act 2014, GDPR (2016/679), Irish Data Protection Act 2018, ePrivacy Regulations 2011 (SI 336) ve DPC kılavuzları (Mart 2026) esas alınarak hazırlanmıştır. Vergi oranları ve eşik değerler 2025/2026 İrlanda bütçesine göre geçerlidir. Tüm varsayımlar açıkça etiketlenmiştir.*
