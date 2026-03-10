# WorkMate — Tasarım (UX/UI + Product Design) Strateji ve Uygulama Raporu

> **Hazırlayan:** Senior UX/UI Design Lead (12+ yıl deneyim)
> **Tarih:** 10 Mart 2026
> **Proje:** WorkMate — İrlanda odaklı hizmet marketplace'i
> **Durum:** MVP/pre-production, launch hazırlığı
> **Hedef:** Geliştiricilerin direkt kopyala-yapıştır uygulayabileceği, ölçülebilir tasarım stratejisi

---

## İçindekiler

1. [Tasarım Stratejisi ve Vizyon](#1-tasarım-stratejisi-ve-vizyon)
2. [Kullanıcı Araştırması Planı](#2-kullanıcı-araştırması-planı)
3. [User Personas, Journey Map ve Empathy Map](#3-user-personas-journey-map-ve-empathy-map)
4. [Information Architecture, Sitemap ve Low-Fidelity Wireframes](#4-information-architecture-sitemap-ve-low-fidelity-wireframes)
5. [High-Fidelity UI Design ve Visual Identity](#5-high-fidelity-ui-design-ve-visual-identity)
6. [Interactive Prototyping ve Usability Testing Planı](#6-interactive-prototyping-ve-usability-testing-planı)
7. [Tasarım Sistemi Kurulumu](#7-tasarım-sistemi-kurulumu)
8. [Developer Handoff Süreci](#8-developer-handoff-süreci)
9. [Araç Stack'i (2026, Düşük Bütçe Öncelikli)](#9-araç-stacki-2026-düşük-bütçe-öncelikli)
10. [Zaman Çizelgesi ve Sprint Dağılımı](#10-zaman-çizelgesi-ve-sprint-dağılımı)
11. [Bütçe ve Kaynak Tahmini](#11-bütçe-ve-kaynak-tahmini)
12. [Tasarım KPI'ları ve Ölçüm Sistemi](#12-tasarım-kpıları-ve-ölçüm-sistemi)
13. [Riskler, Bottleneck'ler ve Mitigasyon](#13-riskler-bottleneckler-ve-mitigasyon)
14. [İlk 30 Gün Acil Aksiyon Listesi](#14-ilk-30-gün-acil-aksiyon-listesi)

---

## 1. Tasarım Stratejisi ve Vizyon

### 1.1 Tasarım Prensipleri

WorkMate'in 4 temel tasarım prensibi — her karar bu filtreden geçmeli:

| # | Prensip | Tanım | Kod Karşılığı |
|---|---------|-------|----------------|
| 1 | **Güven (Trust)** | İrlanda pazarında hizmet alımı yüksek güven gerektirir. Kimlik doğrulama, Garda vetting badge'leri, sigorta durumu her yüzeyde görünür olmalı | `ComplianceBadge`, `GardaVettingBadge`, `VerificationBadge` bileşenleri |
| 2 | **Hız (Speed)** | İlk anlamlı etkileşime (job post veya quote) 60 saniye altında ulaşılmalı | 4 adımlı `JobMultiStepForm`, loading.tsx skeleton'lar |
| 3 | **Netlik (Clarity)** | Kullanıcı her an nerede olduğunu, ne yapması gerektiğini bilmeli | `JobStatusTimeline`, `ProfileCompletenessWidget`, breadcrumb |
| 4 | **Dönüşüm (Conversion)** | Her ekran bir sonraki adıma yönlendirmeli; çıkmaz sayfa olmamalı | Funnel tracking (`lib/analytics/funnel.ts`), CTA hierarchy |

### 1.2 Stratejik Tasarım Kararları

| Karar | Gerekçe | Uygulama |
|-------|---------|----------|
| Light-first UI, dark mode yok | İrlanda pazarı, gündüz kullanımlı hizmet marketplace'i; dark mode ROI düşük | `tokens.css` sadece light theme |
| Glass morphism + grain texture | Premium hissiyat, sıradan marketplace görünümünden ayrışma | `.wm-glass`, `.wm-grain` utility sınıfları |
| Celtic deco subtil kullanım | İrlanda kimliği, kültürel bağ — ama abartısız | `.wm-celtic-deco` (opacity: 0.03) |
| Syne + Plus Jakarta Sans | Display font kişilikli, body font okunaklı | `--wm-font-display`, `--wm-font-sans` |
| Token-first, hex yok | Tutarlılık, theme değişikliği tek noktadan, bakım kolaylığı | 85+ `--wm-*` CSS custom property |

### 1.3 GDPR/ePrivacy Tasarım Prensipleri

| Unsur | Uygulama | Konum |
|-------|----------|-------|
| Cookie consent | Granüler tercih paneli (analytics/marketing ayrı toggle) | `CookieConsent.tsx`, `CookieConsentBanner.tsx` |
| Veri erişim hakkı (DSAR) | "Export My Data" butonu → JSON export | `GdprPanel.tsx` → `POST /api/profile/gdpr` |
| Hesap silme | 30 gün bekleme + soft delete + email onayı | `DeleteAccountPanel.tsx` → `POST /api/account/delete` |
| Şeffaflık metinleri | Privacy policy, data retention, cookie policy sayfaları | `/privacy`, `/data-retention`, `/cookie-policy` |
| Consent-first | Hiçbir analytics/marketing cookie consent olmadan çalışmaz | `CookieConsent` bileşeninde guard |

> **📦 Geliştiricilere Direkt Not**
> Mevcut GDPR altyapısı sağlam (`GdprPanel`, 30 gün hold, email onayı). Eksik olan:
> 1. Cookie consent UI'ın "Reject All" butonunun "Accept All" ile eşit görsel ağırlıkta olması (GDPR requirement)
> 2. Consent tercihlerinin footer'dan her zaman erişilebilir olması ("Manage Cookies" linki)
> 3. Veri silme talebi sonrası kullanıcıya kalan süreyi gösteren countdown UI

> **💡 Tek Kişi / Küçük Ekip İpucu**
> GDPR compliance'ı launch-blocker olarak düşün. Minimum viable compliance = cookie banner + privacy policy + delete account. Geri kalanı post-launch iterate edilebilir.

> **🔧 Araç Önerisi**
> - [Iubenda](https://www.iubenda.com) — €27/yıl, GDPR cookie banner + privacy policy auto-generate
> - Alternatif: Mevcut custom `CookieConsent.tsx` zaten iyi — sadece "Reject All" butonunu ekle

> **✅ Checklist**
> - [ ] Cookie banner'da "Reject All" butonu ekle (eşit görsel ağırlık)
> - [ ] Footer'a "Manage Cookies" linki ekle
> - [ ] Privacy policy sayfasını son haliyle kontrol et
> - [ ] DSAR (data export) akışını test et
> - [ ] Hesap silme 30-gün countdown UI ekle
> - [ ] Consent yokken analytics/marketing script'leri çalışmıyor mu kontrol et

---

## 2. Kullanıcı Araştırması Planı

### 2.1 Customer Araştırma Planı

| Yöntem | Hedef | Süre | Katılımcı |
|--------|-------|------|-----------|
| **Competitor Analysis** | Bark.com, MyBuilder.com, Rated People, Checkatrade UX'ini analiz et | 2 gün | Solo |
| **5-Second Test** | Homepage'in ilk izlenimi + value prop netliği | 1 gün | 5–8 kişi (tanıdık ağı) |
| **Unmoderated Task Test** | Job posting akışı completion rate | 2 gün | 5 kişi (Maze.co ücretsiz plan) |
| **Survey** | İrlanda'da hizmet arama davranışları, güven faktörleri | 3 gün | 20–30 kişi (Google Forms) |
| **Micro-interview** | 15 dk görüşme: son hizmet arama deneyimi, pain point | 1 hafta | 5 kişi |

**Sorulacak kritik sorular:**
1. "When you last hired someone for a home service, what was your biggest frustration?"
2. "What would make you trust a tradesperson you found online?"
3. "How do you currently find and compare service providers?"

### 2.2 Provider Araştırma Planı

| Yöntem | Hedef | Süre | Katılımcı |
|--------|-------|------|-----------|
| **Competitor Analysis** | Provider dashboard UX'i: Bark, Thumbtack, TaskRabbit | 2 gün | Solo |
| **Contextual Inquiry** | Provider onboarding akışını gözlemle | 1 gün | 3 provider (İrlanda'dan) |
| **Survey** | Lead kalitesi, fiyatlama beklentisi, platform tercihi | 3 gün | 15–20 kişi |
| **Diary Study (hafif)** | 1 hafta boyunca günlük 2-dk ses kaydı: "Bugün ne iş aldım?" | 1 hafta | 3 kişi |

### 2.3 Admin Araştırma Planı

| Yöntem | Hedef | Süre |
|--------|-------|------|
| **Heuristic Evaluation** | Admin dashboard'u Nielsen 10 heuristic ile değerlendir | 1 gün |
| **Task Analysis** | Provider onayı, dispute çözümü, GDPR silme akışlarını dokümanla | 1 gün |
| **Dogfooding** | Kurucu olarak admin rolünde 1 hafta aktif kullan, notlar tut | Sürekli |

> **📦 Geliştiricilere Direkt Not**
> Araştırma sürecinde geliştirme durmaz. Şu anki funnel tracking (`trackFunnelStep`) zaten önemli veri topluyor. Araştırma sonuçlarını uygulamak için component props'larını esnek tutun (text, CTA label, renk gibi değerler prop olarak alınsın, hardcode olmasın).

> **💡 Tek Kişi / Küçük Ekip İpucu**
> **Hepsini yapma.** MVP için minimum: 5 competitor screenshot + 5 unmoderated test + 1 survey. Bu bile 10 güne sığar.
> Araştırmayı "batch" yapma — her sprint'te 2-3 mikro-test yeterli (continuous discovery).

> **🔧 Araç Önerisi**
> | Araç | Maliyet | Kullanım |
> |------|---------|----------|
> | Maze.co (free plan) | €0 | Unmoderated usability test (5 test/ay) |
> | Google Forms | €0 | Survey |
> | Loom | €0 (free tier) | Kullanıcı görüşmesi kaydı |
> | Hotjar (free plan) | €0 | Heatmap + session recording (35 session/gün) |
> | Notion | €0 (free) | Araştırma insight'larını organize et |

> **✅ Checklist**
> - [ ] 5 competitor'ın homepage + job posting + provider profile screenshot'ını al
> - [ ] Google Forms ile customer survey oluştur (max 12 soru)
> - [ ] 5 kişiyle unmoderated job posting testi kur (Maze.co)
> - [ ] Provider survey oluştur (lead kalitesi, fiyatlama, platform tercihi)
> - [ ] Admin dashboard heuristic evaluation dokümanı yaz
> - [ ] İlk 5 customer interview'ü planla (tanıdık ağı + Reddit Ireland)

---

## 3. User Personas, Journey Map ve Empathy Map

### 3.1 Persona 1: Sarah — Customer (Ev Sahibi)

| Alan | Detay |
|------|-------|
| **Yaş/Konum** | 34, Dublin 7 (Phibsborough) |
| **Meslek** | Marketing Manager, hybrid çalışan |
| **Teknoloji** | iPhone 15, MacBook, WhatsApp ağırlıklı |
| **Hedef** | Güvenilir bir tesisatçı bulmak, fiyat karşılaştırması yapmak, işin düzgün yapıldığından emin olmak |
| **Pain Points** | 1. "Daha önce kötü deneyim yaşadım, güvenemiyorum" 2. "Fiyatlar şeffaf değil" 3. "Randevu almak telefon + WhatsApp mesajla zor" |
| **Motivasyon** | Hızlı, güvenli, karşılaştırmalı fiyat teklifi |
| **Quote** | *"I just want someone reliable who shows up on time and doesn't overcharge."* |

**Sarah'nın Journey Map:**

```
[Farkındalık]        [Araştırma]           [Karar]              [Kullanım]           [Sadakat]
Google "plumber      WorkMate'te search    3 quote karşılaştır   Job takibi           Review bırak
Dublin" → WM'yi      → provider profil     → en uygununu seç     + mesajlaşma         + saved provider
bulur                 → badge'leri          → ödeme yap           + timeline izle       + tekrar kullan
                      kontrol et
    😐                    🤔                    😬                    😊                   😍
Emotion: Nötr        Emotion: Meraklı      Emotion: Endişeli     Emotion: Rahat       Emotion: Memnun
                      ama temkinli          (para riski)          (takip edebiliyor)

Touch: Google SEO    Touch: Homepage       Touch: Quote panel    Touch: Dashboard     Touch: Review form
       OG image            Search                Job detail           Messages             Email
```

**Empathy Map — Sarah:**

| Düşünüyor | Hissediyor | Görüyor | Yapıyor |
|-----------|------------|---------|---------|
| "Bu adam gerçekten iyi mi?" | Endişeli — para kaybı riski | Review'lar, badge'ler, fotoğraflar | Profilleri tek tek inceliyor |
| "Fiyat adil mi?" | Sabırsız — hızlı sonuç istiyor | Fiyat aralığı, quote detayları | 3 teklifi karşılaştırıyor |
| "İşi yarıda bırakırsa?" | Güvensiz — geçmiş kötü deneyim | Garda vetting badge, sigorta | Verified provider'ları filtreliyor |

---

### 3.2 Persona 2: Padraig — Provider (Boyacı/Dekoratör)

| Alan | Detay |
|------|-------|
| **Yaş/Konum** | 42, Galway city |
| **Meslek** | Self-employed painter & decorator, 12 yıl deneyim |
| **Teknoloji** | Samsung Galaxy, temel bilgisayar bilgisi, WhatsApp + Facebook |
| **Hedef** | Düzenli iş akışı, gereksiz aramaları elemek, ödemelerini zamanında almak |
| **Pain Points** | 1. "Lead'ler kalitesiz, çoğu ciddi değil" 2. "Platform komisyonları yüksek" 3. "Profil doldurmak çok uzun sürüyor" |
| **Motivasyon** | Kendi ağının dışında yeni müşteriler bulmak |
| **Quote** | *"I need real jobs, not time wasters. And I need to get paid on time."* |

**Padraig'in Journey Map:**

```
[Keşif]              [Onboarding]          [İlk İş]             [Aktif Kullanım]     [Büyüme]
Facebook'ta WM       6 adım form           İlk quote gönder     Günlük lead check    Portfolio ekle
reklamı görür        → ID upload           → kabul edilir        → earnings takip     → review topla
→ /become-provider   → sigorta upload      → işi tamamla        → availability       → founding pro
                     → Garda vetting                              güncelle
    🤔                    😤                    😊                    😐                   😍
Emotion: Şüpheci     Emotion: Sıkılmış     Emotion: Heyecanlı   Emotion: Rutin      Emotion: Bağlı
                      (form uzun)           (para kazandı!)       (engagement risk)

Touch: Facebook ad   Touch: Apply form     Touch: Quote panel    Touch: Pro dashboard Touch: Portfolio
       Landing page        Email onayı           Stripe Connect        Task alerts          Reviews
```

**Empathy Map — Padraig:**

| Düşünüyor | Hissediyor | Görüyor | Yapıyor |
|-----------|------------|---------|---------|
| "Bu platform bana gerçekten iş getirir mi?" | Şüpheci — diğer platformlarda hayal kırıklığı | Earnings widget, active jobs sayısı | İlk günlerde sık kontrol ediyor |
| "Form çok uzun, yarıda bırakayım" | Sabırsız — mobilde form doldurma zor | 6 adımlı progress bar | Her adımda kaydediyor mu kontrol ediyor |
| "Ödeme ne zaman gelecek?" | Endişeli — nakit akışı kritik | Payment timeline, Stripe dashboard | Stripe Connect linkini kontrol ediyor |

---

### 3.3 Persona 3: Admin (Kurucu — Sen)

| Alan | Detay |
|------|-------|
| **Yaş/Konum** | Kurucu, Dublin |
| **Hedef** | Platform sağlığını izlemek, provider kalitesini korumak, dispute'ları çözmek |
| **Pain Points** | 1. "Hangi metriklere bakmalıyım?" 2. "Provider başvurularını hızlı onaylamalıyım yoksa kaybederim" 3. "GDPR compliance'ı takip etmek zor" |
| **Kritik Akışlar** | Provider onayı (< 24 saat), Dispute çözümü (< 48 saat), GDPR silme (30 gün hold) |

**Admin Journey Map:**

```
[Sabah Check]        [Provider Ops]        [Dispute/Risk]       [Analytics]          [GDPR/Compliance]
Dashboard → stats    Verification queue    Risk score review    Funnel analytics     GDPR deletion queue
→ pending jobs       → approve/reject      → bulk mark-reviewed → conversion rates   → 30-day hold check
→ alerts             → Garda vetting       → dispute resolve    → drop-off points    → audit logs
    📊                    ✅/❌                  ⚠️                    📈                   🔒
```

> **📦 Geliştiricilere Direkt Not**
> Bu persona'lar component tasarımını doğrudan etkiler:
> - Sarah (customer): `VerificationBadge`, `ComplianceBadge` her provider kartında görünmeli
> - Padraig (provider): Onboarding form'da progress göstergesi + otomatik kaydetme (draft state) kritik
> - Admin: Dashboard'da "items needing attention" count badge'i her section'da olmalı

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Persona'ları duvara as (veya Notion'a koy). Her feature kararında "Sarah bunu anlar mı? Padraig bunu mobilde yapabilir mi?" diye sor. Bu 2 saniye soru, saatlerce yanlış geliştirmeyi önler.

> **🔧 Araç Önerisi**
> - Figma FigJam — Persona kartları + journey map (free plan yeterli)
> - Alternatif: Notion template (ücretsiz persona şablonları mevcut)

> **✅ Checklist**
> - [ ] 3 persona kartını Figma/Notion'a taşı
> - [ ] Her persona için "kırmızı hat" belirle (bırakma noktası)
> - [ ] Journey map'leri ekiple paylaş (Notion page veya Figma frame)
> - [ ] Her sprint planning'de persona referansı kullan
> - [ ] Gerçek kullanıcı interview'larıyla persona'ları doğrula/güncelle

---

## 4. Information Architecture, Sitemap ve Low-Fidelity Wireframes

### 4.1 Sitemap (Mevcut Yapı — 52 Sayfa)

```
WorkMate.ie
├── / (Homepage)
├── /search (Marketplace — services/providers toggle)
├── /find-services (Category browser)
├── /providers (Provider directory)
├── /jobs (Public job feed)
├── /jobs/[jobId] (Job detail + collaboration)
├── /post-job (4-step job form)
│   └── /post-job/result/[jobId]
├── /become-provider (Landing)
│   └── /become-provider/apply (6-step form)
├── /founding-pro (Founding Pro tier)
├── /pricing (Plans)
├── /how-it-works
├── /about
├── /blog
├── /faq
├── /contact
│
├── Auth
│   ├── /login
│   ├── /sign-up
│   ├── /forgot-password
│   └── /reset-password
│
├── Dashboard — Customer
│   ├── /dashboard/customer (Jobs, quotes, history)
│   ├── /dashboard/appointments
│   ├── /dashboard/disputes
│   └── /dashboard/disputes/[id]
│
├── Dashboard — Provider
│   ├── /dashboard/pro (Leads, earnings, availability)
│   ├── /dashboard/pro/earnings
│   ├── /dashboard/appointments
│   └── /dashboard/disputes
│
├── Dashboard — Admin
│   ├── /dashboard/admin (Stats, pending)
│   ├── /dashboard/admin/stats
│   ├── /dashboard/admin/analytics (Funnel)
│   ├── /dashboard/admin/risk
│   ├── /dashboard/admin/applications/[id]
│   ├── /dashboard/admin/verification
│   ├── /dashboard/admin/garda-vetting
│   ├── /dashboard/admin/gdpr
│   └── /dashboard/admin/audit-logs
│
├── Profile & Account
│   ├── /profile (Edit own)
│   ├── /profile/public/[id] (Public view)
│   ├── /account/settings
│   ├── /messages
│   ├── /notifications
│   ├── /saved-searches
│   └── /saved-providers
│
└── Legal
    ├── /terms
    ├── /privacy
    ├── /privacy-policy
    ├── /cookie-policy
    ├── /data-retention
    └── /community-guidelines
```

### 4.2 Core Akış Wireframe Tarifleri

**Akış 1: Job Posting (Customer)**

```
┌─────────────────────────────────────────┐
│ STEP 1/4 — "What do you need?"          │
│                                         │
│ [Category Dropdown ▼]                   │
│ [Job Title _______________]             │
│ [Description textarea                   │
│  ________________________              │
│  ________________________]             │
│                                         │
│ AI assist: "Improve my description" →   │
│                                         │
│ [← Back]                    [Next →]    │
│ ████░░░░░░░░ Step 1 of 4               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ STEP 2/4 — "Where?"                    │
│                                         │
│ [Eircode _______] → Auto-fill address   │
│                                         │
│ County: [Dublin ▼]                      │
│ Address: [Auto-filled from Eircode]     │
│                                         │
│ 🗺️ Map preview (Leaflet)               │
│                                         │
│ [← Back]                    [Next →]    │
│ ████████░░░░ Step 2 of 4               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ STEP 3/4 — "Budget & Type"             │
│                                         │
│ Job type:                               │
│ (●) Get Quotes  ( ) Quick Hire          │
│ ( ) Direct Request                      │
│                                         │
│ Budget: [€___] — [€___]                │
│                                         │
│ Timeline: [ASAP ▼]                      │
│                                         │
│ [← Back]                    [Next →]    │
│ ████████████░ Step 3 of 4              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ STEP 4/4 — "Photos & Confirm"          │
│                                         │
│ [📷 Upload photos (optional)]           │
│ [img] [img] [+]                         │
│                                         │
│ ┌─ Summary ────────────────┐            │
│ │ 🔧 Plumbing — Kitchen    │            │
│ │ 📍 Dublin 7, D07 X5R2    │            │
│ │ 💰 €100–€300              │            │
│ │ ⏰ ASAP                   │            │
│ └──────────────────────────┘            │
│                                         │
│ [← Back]              [Post Job ✓]      │
│ ████████████████ Step 4 of 4           │
└─────────────────────────────────────────┘
```

**Akış 2: Provider Onboarding**

```
┌─────────────────────────────────────────┐
│ BECOME A PRO — Step 1/6                 │
│ "What services do you offer?"           │
│                                         │
│ ☐ Plumbing  ☐ Electrical  ☐ Painting   │
│ ☐ Cleaning  ☐ Gardening  ☐ Carpentry   │
│ ☐ Roofing   ☐ Tiling     ☐ Other       │
│                                         │
│ [Next →]                                │
│ ●○○○○○                                  │
└─────────────────────────────────────────┘

... → Step 6: Review & Submit

Key UX notes:
- Her adımda auto-save (draft state)
- Progress indicator daima görünür
- "Save & continue later" butonu
- Mobilde single-column layout
```

**Akış 3: Quote Comparison (Customer)**

```
┌─────────────────────────────────────────┐
│ JOB: Kitchen Plumbing — 3 Quotes       │
│                                         │
│ ┌─ Quote 1 ──────────┐ ┌─ Quote 2 ─┐  │
│ │ 👤 John Murphy       │ │ 👤 Sean O' │  │
│ │ ⭐ 4.8 (23 reviews)  │ │ ⭐ 4.5 (12 │  │
│ │ ✅ Verified  🛡️ Garda │ │ ✅ Verified │  │
│ │ 💰 €250              │ │ 💰 €195    │  │
│ │ 📅 Available Mon      │ │ 📅 Tues    │  │
│ │                      │ │            │  │
│ │ [View Profile]       │ │ [View]     │  │
│ │ [Accept Quote ✓]     │ │ [Accept]   │  │
│ └──────────────────────┘ └────────────┘  │
│                                         │
│ Sort: [Price ▼] [Rating ▼] [Avail. ▼]  │
└─────────────────────────────────────────┘
```

### 4.3 Navigation Hierarchy — Önerilen İyileştirmeler

| Mevcut Durum | Öneri | Etki |
|-------------|-------|------|
| Homepage → Search tek CTA | Homepage'e "Post a Job" + "Find a Pro" ikili CTA | Dönüşüm +15-25% (varsayım) |
| Dashboard 3 ayrı role yönlendirme | Role-based redirect zaten var ✅ | — |
| Mobile nav'da 4+ item | Hamburger → Bottom sheet (max 5 item) | Mobile UX iyileştirme |
| Provider onboarding 6 adım | Her adıma "estimated time" ekle ("~2 min left") | Completion rate +10-20% (varsayım) |

> **📦 Geliştiricilere Direkt Not**
> Mevcut route yapısı (52 sayfa) MVP için yeterli. Yeni sayfa eklemeyin — mevcut sayfaların UX kalitesini artırın.
> IA değişikliklerinden önce mevcut funnel verilerini kontrol edin (`/api/analytics/funnel-summary`).
> Özellikle `job_posting` funnel'ında hangi step'te drop-off var — ona göre wireframe revize edin.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Wireframe için Figma gerekmiyor. Kağıt + kalem + fotoğraf çekip Notion'a yapıştır. Ya da FigJam'de 15 dakikada çiz. Yüksek sadakat wireframe zaman kaybı — doğrudan high-fidelity'ye geç (zaten token sisteminiz var).

> **🔧 Araç Önerisi**
> - FigJam (free) — hızlı wireframe + flow diagram
> - Whimsical (free tier) — flowchart + wireframe birlikte
> - Excalidraw (free, open source) — hand-drawn style wireframe

> **✅ Checklist**
> - [ ] 5 core akışın wireframe'ini çiz (job post, onboarding, search, quote compare, dashboard)
> - [ ] Mobile-first wireframe (375px genişlik)
> - [ ] Her wireframe'de CTA hierarchy belirle (primary + secondary)
> - [ ] Navigation akışını 3-click test ile doğrula (herhangi bir hedef 3 tıkla ulaşılabilir mi?)
> - [ ] Funnel drop-off verilerini wireframe kararlarına yansıt

---

## 5. High-Fidelity UI Design ve Visual Identity

### 5.1 Renk Paleti (Mevcut Token Sistemi)

| Token | Hex | Kullanım | Erişilebilirlik (WCAG AA) |
|-------|-----|----------|---------------------------|
| `--wm-primary` | `#10b981` | CTA, aktif durum, başarı | ⚠️ Beyaz üzerinde 3.4:1 — büyük text OK, küçük text FAIL |
| `--wm-primary-dark` | `#059669` | Hover, vurgu | ✅ Beyaz üzerinde 4.6:1 |
| `--wm-navy` | `#0f172a` | Primary text | ✅ Beyaz üzerinde 16.8:1 |
| `--wm-navy-mid` | `#1e293b` | Secondary text | ✅ Beyaz üzerinde 13.5:1 |
| `--wm-amber` | `#f59e0b` | Warning, highlight | ⚠️ Beyaz üzerinde 2.1:1 — sadece ikon/dekoratif |
| `--wm-destructive` | `#dc2626` | Error, delete | ✅ Beyaz üzerinde 4.6:1 |
| `--wm-blue` | `#2563eb` | Secondary CTA, link | ✅ Beyaz üzerinde 4.6:1 |

**⚠️ Erişilebilirlik Uyarısı:**
`--wm-primary` (#10b981) beyaz arka plan üzerinde küçük text için WCAG AA'yı geçmiyor. Çözüm:
- Küçük text'te `--wm-primary-dark` (#059669) kullan
- `--wm-primary` sadece büyük text (18px+), ikonlar ve buton arka planı için
- Buton text'i beyaz (#fff) `--wm-primary` arka plan üzerinde 3.4:1 — `--wm-primary-dark` arka planında 4.6:1 ✅

### 5.2 Tipografi Scale

| Element | Font | Weight | Size | Token |
|---------|------|--------|------|-------|
| Display (Hero) | Syne | 800 | clamp(2.5rem, 5vw, 4rem) | `--wm-font-display` |
| H1 | Syne | 800 | clamp(2rem, 4vw, 3rem) | `--wm-font-display` |
| H2 | Syne | 800 | clamp(1.5rem, 3vw, 2.25rem) | `--wm-font-display` |
| H3 | Syne | 700 | 1.25rem | `--wm-font-display` |
| H4 | Syne | 600 | 1.125rem | `--wm-font-display` |
| Body | Plus Jakarta Sans | 400 | 1rem (16px) | `--wm-font-sans` |
| Body Small | Plus Jakarta Sans | 400 | 0.875rem (14px) | `--wm-font-sans` |
| Caption | Plus Jakarta Sans | 500 | 0.75rem (12px) | `--wm-font-sans` |
| Button | Plus Jakarta Sans | 600 | 0.875rem | `--wm-font-sans` |
| Label | Plus Jakarta Sans | 500 | 0.875rem | `--wm-font-sans` |
| Badge/Tag | Syne | 700 | 0.7rem | `--wm-font-display` |

### 5.3 Spacing Scale

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--wm-space-xs` | 4px | İkon + text arası |
| `--wm-space-sm` | 8px | İç padding (badge, tag) |
| `--wm-space-md` | 16px | Component iç padding |
| `--wm-space-lg` | 24px | Section arası (component) |
| `--wm-space-xl` | 32px | Section arası (page) |
| `--wm-space-2xl` | 48px | Major section arası |
| `--wm-space-3xl` | 64px | Page section arası |

> **Varsayım:** Spacing token'ları henüz `tokens.css`'te tanımlı değil. Tailwind utility'leri (p-2, p-4, gap-6 vb.) ile yönetiliyor. Formal spacing token'ları tanımlamak tutarlılık sağlar.

### 5.4 İkon Stratejisi

| Mevcut | Önerilen |
|--------|----------|
| Lucide React | ✅ Tutarlı, 1000+ ikon, tree-shakeable |
| Kullanım: `h-3 w-3` ~ `h-14 w-14` | Standartlaştır: `xs=14`, `sm=16`, `md=20`, `lg=24`, `xl=32` |

**İkon boyut standardı:**

```tsx
// Önerilen ikon boyut sabitleri (lib/ui/icon-sizes.ts)
export const ICON_SIZE = {
  xs: 14,  // Badge, inline text
  sm: 16,  // Button inline, form hint
  md: 20,  // Default, nav item
  lg: 24,  // Card header, stat
  xl: 32,  // Empty state, hero
} as const;
```

### 5.5 Border Radius Kullanım Rehberi

| Token | Değer | Nerede Kullanılır |
|-------|-------|-------------------|
| `--wm-radius-xs` | 6px | Checkbox, small badge |
| `--wm-radius-sm` | 8px | Input, small card |
| `--wm-radius-md` | 12px | Button, dropdown |
| `--wm-radius-lg` | 16px | Card, panel |
| `--wm-radius-xl` | 20px | Modal |
| `--wm-radius-2xl` | 24px | Hero card, .wm-surface |
| `--wm-radius-3xl` | 32px | Full-bleed section |
| `999px` | Pill | Badge, tag, .wm-section-label |

### 5.6 Shadow Kullanım Rehberi

| Token | Nerede |
|-------|--------|
| `--wm-shadow-xs` | Input focus, subtle divider |
| `--wm-shadow-sm` | Card (rest) |
| `--wm-shadow-md` | Card (hover), dropdown |
| `--wm-shadow-lg` | Modal, floating panel |
| `--wm-shadow-xl` | Overlay, hero card |
| `--wm-shadow-2xl` | Full-page overlay |

> **📦 Geliştiricilere Direkt Not**
> **Erişilebilirlik kritik:** `--wm-primary` (#10b981) küçük text'te WCAG AA'yı geçmiyor.
> - Tüm `color: var(--wm-primary)` kullanımlarını tarayın
> - Küçük text (< 18px) olanları `var(--wm-primary-dark)` ile değiştirin
> - Buton arka planı olarak kullanıyorsanız, buton text'inin beyaz + bold olduğundan emin olun
>
> **Spacing token'ları ekleyin:** `tokens.css`'e `--wm-space-*` scale'ini eklemek, Tailwind utility'lerine bağımlılığı azaltır ve tasarım tutarlılığını artırır.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Erişilebilirlik testini Chrome DevTools > Lighthouse > Accessibility ile hızlıca yapın. Launch öncesi minimum 90 skor hedefleyin. WebAIM Contrast Checker (ücretsiz) ile renk çiftlerini kontrol edin.

> **🔧 Araç Önerisi**
> - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — ücretsiz, anlık renk kontrast kontrolü
> - [Stark (Figma plugin)](https://www.getstark.co/) — free tier, Figma içinde erişilebilirlik kontrolü
> - Chrome Lighthouse — yerleşik, otomatik erişilebilirlik denetimi

> **✅ Checklist**
> - [ ] `--wm-primary` kullanılan tüm küçük text'leri `--wm-primary-dark` ile değiştir
> - [ ] Spacing token'larını `tokens.css`'e ekle (`--wm-space-xs` ~ `--wm-space-3xl`)
> - [ ] İkon boyut standardını oluştur ve dokümante et
> - [ ] Tüm butonların minimum 44×44px touch target'ı olduğunu kontrol et (mobil)
> - [ ] Lighthouse Accessibility skoru ≥ 90 hedefle
> - [ ] Tüm form input'larında visible label olduğunu kontrol et (placeholder-only olmasın)
> - [ ] Focus ring'in tüm interaktif elementlerde görünür olduğunu doğrula

---

## 6. Interactive Prototyping ve Usability Testing Planı

### 6.1 Test Senaryoları

| # | Senaryo | Rol | Başarı Kriteri | Süre Limiti |
|---|---------|-----|----------------|-------------|
| T1 | "Find a plumber in Dublin and post a job" | Customer | Job başarıyla post edildi | 3 dk |
| T2 | "Compare 3 quotes and accept one" | Customer | Quote kabul edildi | 2 dk |
| T3 | "Sign up as a provider and complete your profile" | Provider | Profil %80+ tamamlandı | 5 dk |
| T4 | "Submit a quote for a job" | Provider | Quote başarıyla gönderildi | 2 dk |
| T5 | "Find your booking and check status" | Customer | Doğru job detail sayfasına ulaştı | 1 dk |
| T6 | "Delete your account" | Customer | Silme talebi gönderildi | 1 dk |
| T7 | "Change your cookie preferences" | Any | Tercih paneline ulaştı + değişiklik yaptı | 30 sn |

### 6.2 Test Metrikleri

| Metrik | Hedef | Ölçüm |
|--------|-------|-------|
| Task Completion Rate | ≥ 85% | Başarılı tamamlama / toplam deneme |
| Time on Task | Senaryo bazlı (yukarıdaki tablo) | Maze.co timer |
| Error Rate | ≤ 2 hata / senaryo | Yanlış tıklama, geri dönme |
| SUS (System Usability Scale) | ≥ 72 (B sınıfı) | 10 soruluk anket |
| NPS (Net Promoter Score) | ≥ 30 | "Would you recommend?" |
| First Click Success | ≥ 80% | İlk tıklama doğru hedefe mi? |

### 6.3 Test Planı

| Hafta | Aktivite | Katılımcı | Araç |
|-------|----------|-----------|------|
| 1 | Prototype hazırlık (Figma) | — | Figma |
| 2 | Unmoderated test (T1–T3) | 5 kişi | Maze.co |
| 3 | Analiz + revize | — | — |
| 4 | Moderated test (T4–T7) | 3 kişi | Zoom + Loom |
| 5 | Final revizyon | — | — |

### 6.4 Kabul Kriterleri (Go/No-Go)

| Kriter | Go | No-Go |
|--------|-----|-------|
| Task Completion Rate | ≥ 80% | < 60% |
| SUS Score | ≥ 68 | < 55 |
| Critical Error (data loss, stuck) | 0 | ≥ 1 |
| GDPR flow tamamlanma | ≥ 90% | < 70% |

> **📦 Geliştiricilere Direkt Not**
> Test senaryolarını code'daki funnel step'leriyle eşleştirin:
> - T1 → `job_posting` funnel (4 step) — `trackFunnelStep('job_posting', step)`
> - T3 → `provider_onboarding` funnel (6 step) — `trackFunnelStep('provider_onboarding', step)`
> - T4 → `booking` funnel (3 step)
>
> Test sonuçlarını funnel analytics ile karşılaştırarak hangi adımda UX problemi var belirleyin.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> 5 kişiyle test = problemlerin %85'ini bulur (Nielsen Norman). 5'ten fazla kişi gereksiz. Aileden, arkadaşlardan başla — ideal olmasa da hiç test yapmamaktan iyi. Maze.co free plan = ayda 1 proje, 5 test. Yeterli.

> **🔧 Araç Önerisi**
> | Araç | Maliyet | Kullanım |
> |------|---------|----------|
> | Maze.co (free) | €0 | Unmoderated test, heatmap, analytics |
> | Loom (free) | €0 | Moderated test kayıt |
> | UsabilityHub (free tier) | €0 | 5-second test, first click test |
> | Google Forms | €0 | SUS anketi |

> **✅ Checklist**
> - [ ] 7 test senaryosunu finalize et
> - [ ] Maze.co'da ilk unmoderated test'i kur (T1: job posting)
> - [ ] SUS anket formunu hazırla (10 standart soru)
> - [ ] 5 test katılımcısı bul ve davet et
> - [ ] Test sonuçlarını issue tracker'a dönüştür (bulgu → task)
> - [ ] Critical error = launch blocker olarak işaretle

---

## 7. Tasarım Sistemi Kurulumu

### 7.1 Mevcut Durum

| Alan | Durum | Not |
|------|-------|-----|
| Token tanımları | ✅ Tam | 85+ CSS custom property, `tokens.css` + `globals.css` |
| UI component library | ✅ 26 primitive | `components/ui/` — Button, Badge, Card, Input, vb. |
| Utility class'lar | ✅ 10+ | `.wm-surface`, `.wm-glass`, `.wm-grain`, `.wm-section-label`, `.wm-display` |
| Variant sistemi | ✅ | Button (6 variant), Badge (8 tone), StatCard (4 accent) |
| Storybook | ⚠️ Ayrı repo | `clouddash-design-system/` — referans, production'da değil |
| Figma variables | ❌ Yok | Token → Figma eşlemesi yapılmamış |
| Figma component library | ❌ Yok | Kod bazlı library var, Figma'da yok |
| Dark mode | ❌ Planlanmıyor | Light-first, İrlanda pazarı kararı |

### 7.2 Component İsimlendirme Standardı

**Naming Convention:**

```
[Domain]/[ComponentName].tsx

Örnekler:
ui/Button.tsx           → <Button variant="primary" size="md" />
ui/Badge.tsx            → <Badge tone="pending" />
ui/Card.tsx             → <Card hover glass />
dashboard/StatCard.tsx  → <StatCard accent="primary" />
forms/JobMultiStepForm.tsx → <JobMultiStepForm />
```

**Prop isimlendirme kuralları:**

| Prop Tipi | İsimlendirme | Örnek |
|-----------|-------------|-------|
| Boolean | `is` veya direkt | `isLoading`, `hover`, `glass` |
| Variant/Tone | enum string | `variant="primary"`, `tone="pending"` |
| Boyut | `size` | `size="sm" \| "md" \| "lg"` |
| Event handler | `on` prefix | `onClick`, `onSubmit` |
| Children slot | `children` veya named | `children`, `icon`, `action` |
| CSS override | `className` + `style` | Her component'te standart |

### 7.3 Figma Variables Kurulumu

Figma'da token sisteminizi yansıtmak için:

**Collection 1: Colors**
```
Primary/Default     → #10b981
Primary/Dark        → #059669
Primary/Light       → #d1fae5
Primary/Faint       → #ecfdf5
Navy/Default        → #0f172a
Navy/Mid            → #1e293b
Navy/Soft           → #334155
Amber/Default       → #f59e0b
Amber/Dark          → #d97706
Blue/Default        → #2563eb
Destructive/Default → #dc2626
Surface/Default     → rgba(255,255,255,0.95)
Surface/Alt         → rgba(248,250,252,0.90)
Border/Default      → #dbe1e7
Text/Strong         → #0b1324
Text/Default        → #0f172a
Text/Muted          → #334155
Text/Soft           → #475569
```

**Collection 2: Typography**
```
Display  → Syne 800
Heading  → Syne 700–800
Body     → Plus Jakarta Sans 400
Label    → Plus Jakarta Sans 500
Button   → Plus Jakarta Sans 600
Caption  → Plus Jakarta Sans 500
```

**Collection 3: Spacing**
```
XS → 4    SM → 8    MD → 16
LG → 24   XL → 32   2XL → 48   3XL → 64
```

**Collection 4: Radius**
```
XS → 6    SM → 8    MD → 12   LG → 16
XL → 20   2XL → 24  3XL → 32  Pill → 999
```

### 7.4 Auto-Layout Kuralları (Figma)

| Element | Padding | Gap | Direction |
|---------|---------|-----|-----------|
| Button | 12h, 24w | 8 | Horizontal |
| Card | 24 all | 16 | Vertical |
| Form Field | 0 | 4 | Vertical |
| Nav Item | 8h, 16w | 8 | Horizontal |
| Section | 48 top/bottom, 24 sides | 24 | Vertical |
| Badge | 4h, 12w | 4 | Horizontal |
| Modal | 32 all | 24 | Vertical |

### 7.5 Component Variant Matrisi (Figma)

**Button:**
```
Variants:
  variant: primary | secondary | ghost | outline | destructive | navy
  size: sm | md | lg | xl
  state: default | hover | active | disabled | loading
  icon: none | left | right | only
```

**Badge:**
```
Variants:
  tone: open | pending | completed | assigned | neutral | primary | amber | navy
  dot: true | false
  size: sm | md
```

**Card:**
```
Variants:
  glass: true | false
  hover: true | false
  shadow: sm | md | lg
```

> **📦 Geliştiricilere Direkt Not**
> Figma component oluştururken, her component'in prop yapısını **kod karşılığıyla birebir eşleştirin**.
> Figma'da `variant="primary"` → kodda `variant="primary"`. Aynı isim, aynı değerler.
> Bu sayede handoff sırasında "Figma'da X diyor ama kodda Y" sorunu olmaz.
>
> **Yeni component ekleme kuralı:**
> 1. Önce `components/ui/` altında primitive var mı kontrol et
> 2. Yoksa, mevcut primitive'i extend et (compose)
> 3. Yeni primitive gerçekten gerekliyse: token-first yaz, Figma'ya da ekle

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Figma component library'yi sıfırdan kurmak 2-3 hafta sürer. **Kısayol:** Figma Community'den "Design System Starter" template'i fork'la, renkleri ve fontları `--wm-*` token'larına eşle. İlk günde çalışan bir temel olur.
>
> Storybook'u marketplace'e entegre etmeyin (bakım yükü). Bunun yerine: Figma = design truth, Kod = implementation truth. İkisi arasındaki fark Design QA'de yakalanır.

> **🔧 Araç Önerisi**
> - Figma (free plan) — 3 Figma file + unlimited viewers
> - Figma Variables (free) — Token tanımları
> - [Token Studio (Figma plugin)](https://tokens.studio/) — Free, Figma'dan JSON token export → `tokens.json` sync
> - Storybook (mevcut `clouddash-design-system/`) — Referans olarak kalsın, production'a ekleme

> **✅ Checklist**
> - [ ] Figma'da yeni WorkMate project oluştur
> - [ ] 4 variable collection tanımla (Colors, Typography, Spacing, Radius)
> - [ ] Button component (6 variant × 4 size × 5 state) oluştur
> - [ ] Badge component (8 tone × 2 dot × 2 size) oluştur
> - [ ] Card component (2 glass × 2 hover × 3 shadow) oluştur
> - [ ] Input/FormField component oluştur
> - [ ] Token Studio plugin'i kur → `tokens.json` export
> - [ ] 5 core page'in Figma frame'ini oluştur (Homepage, Search, Job Post, Dashboard, Profile)

---

## 8. Developer Handoff Süreci

### 8.1 Figma Dev Mode / Inspect Akışı

```
                Tasarımcı                           Geliştirici
                ─────────                           ───────────

 1. Figma'da component tasarla
    → Variables kullan (token-first)
    → Auto-layout doğru kur
    → State'leri ekle (hover, active, etc)
                    │
                    ▼
 2. "Ready for dev" flag'i koy
    → Figma section'ına taşı
    → Annotasyon ekle (davranış notu)
                    │
                    ▼
                                            3. Figma Dev Mode aç
                                               → Token değerlerini oku
                                               → CSS property'leri kopyala
                                               → Component prop'larını eşle
                    │
                    ▼
                                            4. Kod yaz
                                               → `--wm-*` token kullan
                                               → Mevcut component'ı extend et
                                               → PR aç
                    │
                    ▼
 5. Design QA yap
    → PR'daki deploy preview'ı kontrol et
    → Spacing, renk, tipografi kontrol
    → Responsive kontrol (375px, 768px, 1440px)
    → Approval ver veya revizyon iste
```

### 8.2 Token → Kod Eşleme Tablosu

| Figma Variable | CSS Token | React Kullanımı |
|---------------|-----------|-----------------|
| `Colors/Primary/Default` | `--wm-primary` | `style={{ color: 'var(--wm-primary)' }}` |
| `Colors/Navy/Default` | `--wm-navy` | `style={{ color: 'var(--wm-navy)' }}` |
| `Typography/Display` | `--wm-font-display` | `style={{ fontFamily: 'var(--wm-font-display)' }}` |
| `Typography/Body` | `--wm-font-sans` | `style={{ fontFamily: 'var(--wm-font-sans)' }}` |
| `Spacing/MD` | (Tailwind `p-4`) | `className="p-4"` veya `style={{ padding: '16px' }}` |
| `Radius/2XL` | `--wm-radius-2xl` | `style={{ borderRadius: 'var(--wm-radius-2xl)' }}` |
| `Shadow/LG` | `--wm-shadow-lg` | `style={{ boxShadow: 'var(--wm-shadow-lg)' }}` |

**Component Eşleme:**

| Figma Component | React Component | Import Path |
|-----------------|----------------|-------------|
| `Button/Primary/MD` | `<Button variant="primary" size="md">` | `@/components/ui/Button` |
| `Badge/Pending` | `<Badge tone="pending">` | `@/components/ui/Badge` |
| `Card/Glass` | `<Card glass>` | `@/components/ui/Card` |
| `StatCard/Primary` | `<StatCard accent="primary">` | `@/components/dashboard/StatCard` |
| `FormField` | `<FormField label="..." error="...">` | `@/components/ui/FormField` |
| `PageHeader` | `<PageHeader title="..." badge="...">` | `@/components/ui/PageHeader` |

### 8.3 Design QA Checklist

Her PR'da tasarım review'ı için bu checklist'i kullanın:

```markdown
## Design QA Checklist

### Genel
- [ ] Tüm renkler `--wm-*` token kullanıyor (hex yok)
- [ ] Font'lar `--wm-font-display` veya `--wm-font-sans` kullanıyor
- [ ] Border radius `--wm-radius-*` token kullanıyor
- [ ] Shadow `--wm-shadow-*` token kullanıyor
- [ ] Hardcoded Tailwind renk sınıfı yok (text-zinc-*, bg-emerald-*, vb.)

### Tipografi
- [ ] Heading'ler Syne font kullanıyor
- [ ] Body text Plus Jakarta Sans kullanıyor
- [ ] Font size hierarchy mantıklı (H1 > H2 > H3 > Body)
- [ ] Line height okunaklı (body ≥ 1.5)

### Spacing
- [ ] Component iç padding tutarlı (8px grid)
- [ ] Section arası boşluk tutarlı
- [ ] Mobilde yeterli touch target (min 44×44px)

### Responsive
- [ ] 375px (mobile) — tek kolon, hamburger menu
- [ ] 768px (tablet) — 2 kolon grid
- [ ] 1440px (desktop) — max-width container, 3-4 kolon
- [ ] Text overflow/truncation kontrol edildi

### Erişilebilirlik
- [ ] Renk kontrastı WCAG AA (4.5:1 küçük text, 3:1 büyük text)
- [ ] Focus ring tüm interaktif elementlerde görünür
- [ ] Form label'ları visible (placeholder-only değil)
- [ ] Alt text imajlarda mevcut
- [ ] Keyboard navigation çalışıyor

### GDPR/Privacy
- [ ] Consent olmadan tracking/analytics yok
- [ ] Privacy link footer'da mevcut
- [ ] Veri toplama noktalarında bilgilendirme var
```

> **📦 Geliştiricilere Direkt Not**
> Bu checklist'i PR template'ine ekleyin. GitHub'da `.github/PULL_REQUEST_TEMPLATE.md` olarak kaydedin.
> Otomatik kontrol için: ESLint'e custom rule ekleyerek hardcoded hex/zinc class'ları yakalayın (session 24'te zaten bir tur temizlik yapıldı).

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Her PR'da full Design QA yapmak gerçekçi değil. **Kural:** Kullanıcının gördüğü her değişiklik → Design QA. Backend/API değişikliği → skip. Bu, review yükünü %60 azaltır.

> **🔧 Araç Önerisi**
> - Figma Dev Mode (free, view-only) — Token inspect
> - Vercel Preview — Her PR'da deploy preview (zaten entegre varsayım)
> - BackstopJS (mevcut) — Visual regression test
> - PixelPerfect (Chrome extension, free) — Figma → browser overlay karşılaştırma

> **✅ Checklist**
> - [ ] PR template'e Design QA checklist'i ekle
> - [ ] BackstopJS reference screenshot'larını güncelle
> - [ ] Token → Figma eşleme dokümanını Notion/README'e ekle
> - [ ] Her yeni component için Figma + Kod simultane oluştur kuralı koy
> - [ ] Haftalık 30-dk Design QA session'ı takvime ekle

---

## 9. Araç Stack'i (2026, Düşük Bütçe Öncelikli)

### 9.1 Araç Matrisi

| Kategori | Araç | Maliyet/Yıl | Neden |
|----------|------|-------------|-------|
| **Design & Prototype** | Figma (free plan) | €0 | 3 dosya, unlimited viewer, variables, auto-layout |
| **Whiteboard & Flow** | FigJam (free) | €0 | Journey map, IA, brainstorm |
| **Usability Test** | Maze.co (free) | €0 | Unmoderated test, heatmap, analytics (1 proje/ay) |
| **Survey** | Google Forms | €0 | Basit survey, yeterli |
| **Heatmap & Recording** | Hotjar (free) | €0 | 35 session/gün, heatmap, feedback widget |
| **Visual Regression** | BackstopJS (mevcut) | €0 | Open source, CI entegrasyonu |
| **Erişilebilirlik** | Chrome Lighthouse | €0 | Yerleşik, otomatik |
| **Contrast Check** | WebAIM Checker | €0 | Web-based, anlık |
| **Screenshot Karşılaştırma** | PixelPerfect (extension) | €0 | Figma overlay |
| **Proje Yönetimi** | GitHub Issues + Projects | €0 | Zaten kullanılıyor |
| **Doküman** | Notion (free) | €0 | Persona, araştırma, design decision log |
| **Analytics** | Mevcut funnel tracking | €0 | `lib/analytics/funnel.ts` |
| **Video Kayıt** | Loom (free) | €0 | Test kaydı, async iletişim |
| **AI Design Assist** | Figma AI / v0.dev | €0–20/ay | Component prototip hızlandırma |

### 9.2 Opsiyonel (Bütçe Varsa)

| Araç | Maliyet/Yıl | Eklenen Değer |
|------|-------------|---------------|
| Figma Professional | ~€144 | Unlimited dosya, team library, branching |
| Maze Pro | ~€600 | Unlimited test, A/B, participant recruitment |
| Hotjar Plus | ~€384 | Unlimited session, funnel analizi |
| Stark Pro (Figma) | ~€120 | Tam erişilebilirlik audit |
| Token Studio Pro | ~€120 | Multi-file sync, GitHub integration |

**Toplam minimum stack: €0/yıl** (tümü free tier)
**Önerilen stack: €144/yıl** (Figma Pro + diğerleri free)

> **📦 Geliştiricilere Direkt Not**
> Analytics altyapısı zaten mevcut (`trackFunnelStep`). Eksik olan: **sayfa bazlı scroll depth** ve **CTA click tracking**. Bunları eklemek için:
> 1. `lib/analytics/` altına `trackClick(elementId, label)` fonksiyonu ekle
> 2. Hero CTA, nav items ve form submit butonlarına wire et
> 3. Hotjar free plan'ı aktive et (sadece production'da)

> **💡 Tek Kişi / Küçük Ekip İpucu**
> "En iyi araç kullanılan araçtır." 10 araç kurma — 3 taneyi iyi kullan:
> 1. **Figma** — tasarım + prototip
> 2. **Maze.co** — test
> 3. **Hotjar** — real user data
> Bu üçlü, bütçesi olan startup'ların %80'inin kullandığı ile aynı kapasitede.

> **🔧 Araç Önerisi**
> **AI kısayolları (2026 gerçeği):**
> - Figma AI — component önerisi, auto-layout düzeltme
> - v0.dev (Vercel) — text → React component prototip (free tier)
> - Claude — tasarım kararı tartışma, copy writing, edge case listeleme
> Bu AI araçları, bir kişilik ekibi 2-3 kişilik ekip çıktısına yaklaştırır.

> **✅ Checklist**
> - [ ] Figma hesabı oluştur (veya mevcut hesabı kontrol et)
> - [ ] FigJam'de ilk board'u kur (journey map)
> - [ ] Maze.co free plan aktive et
> - [ ] Hotjar free plan'ı production URL'e entegre et (consent sonrası!)
> - [ ] Notion workspace kur (Personas, Research, Decisions)
> - [ ] Loom hesabı oluştur (test kayıtları için)

---

## 10. Zaman Çizelgesi ve Sprint Dağılımı

### 10.1 İlk 90 Gün (MVP Launch Focus)

| Hafta | Sprint | Odak | Çıktı |
|-------|--------|------|-------|
| **1–2** | Sprint 1 | 🔍 Araştırma + Setup | Competitor analysis, Figma setup, token eşleme, 5 persona doğrulama interview'ı |
| **3–4** | Sprint 2 | 📐 IA + Wireframe | Sitemap finalize, 5 core flow wireframe, navigation test |
| **5–6** | Sprint 3 | 🎨 Hi-Fi: Homepage + Auth | Homepage redesign Figma, login/signup Figma, handoff |
| **7–8** | Sprint 4 | 🎨 Hi-Fi: Job Post + Search | Job posting 4-step flow Figma, search results, filter panel |
| **9–10** | Sprint 5 | 🎨 Hi-Fi: Dashboard + Profile | Customer/provider dashboard, profile edit, provider public profile |
| **11–12** | Sprint 6 | 🧪 Test + Iterate | Usability test (5 kişi), SUS anketi, kritik bulguları fix et |
| **13** | Sprint 7 | 🚀 Launch Prep | Final Design QA, responsive check, erişilebilirlik audit |

### 10.2 6 Ay Yol Haritası (Gantt Tarzı)

```
         Ay 1        Ay 2        Ay 3        Ay 4        Ay 5        Ay 6
         ──────      ──────      ──────      ──────      ──────      ──────
Research ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
         S1──────S2

IA/Wire  ░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
              S2──────

Hi-Fi    ░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                 S3──────S4──────S5

Test     ░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░████████░░░░░░░░░░░░░
                                  S6              S8 (post-launch)

Launch   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░
                                      S7

Iterate  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████████████
                                           S8────S9────S10───S11───S12

Design   Continuous ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
System   (token updates, new components as needed)
```

### 10.3 Post-Launch Iteration (Ay 4–6)

| Sprint | Odak | Detay |
|--------|------|-------|
| S8 | Post-launch data analizi | Hotjar heatmap, funnel drop-off, SUS |
| S9 | Provider UX iyileştirme | Onboarding simplification, earnings clarity |
| S10 | Mobile optimization | Touch target, scroll performance, PWA |
| S11 | Advanced features UX | Dispute flow, Garda vetting self-service |
| S12 | Design system v2 | Component audit, yeni patterns, Figma library genişletme |

> **📦 Geliştiricilere Direkt Not**
> Sprint 1-2'de geliştirme durmaz. Araştırma ve setup paralel yürür. Sprint 3'ten itibaren Figma → Kod handoff başlar.
> **Her sprint'te 1 design QA session zorunlu** (30 dk, Perşembe).

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Bu timeline'ı "kutsal" olarak görme. Gerçeklik: tek kişi + kod + tasarım → her sprint 1.5x uzar.
> **Kural:** Her sprint'te sadece 1 major tasarım çıktısı hedefle. "Bu sprint Homepage, sonraki sprint Dashboard." Paralel yapma.

> **🔧 Araç Önerisi**
> - GitHub Projects (free) — Sprint board, milestone tracking
> - Google Calendar — Sprint start/end, Design QA session
> - Notion — Sprint retrospective log

> **✅ Checklist**
> - [ ] Sprint 1 taskları GitHub Issues'a ekle
> - [ ] Her sprint için milestone oluştur
> - [ ] Design QA session'ı takvime ekle (2 haftada 1, 30 dk)
> - [ ] Sprint retrospective template oluştur (5 dk, 3 soru: ne iyi gitti, ne kötü gitti, ne değişmeli)

---

## 11. Bütçe ve Kaynak Tahmini

### 11.1 Üç Senaryo

| Kalem | Sıfır Bütçe (€0) | Minimum (€500/6 ay) | Profesyonel (€5,000/6 ay) |
|-------|-------------------|---------------------|---------------------------|
| **Design Tool** | Figma Free | Figma Pro (€72) | Figma Pro (€72) |
| **Testing** | Maze Free + tanıdıklar | Maze Free + €50 gift card (5 kişi) | Maze Pro (€300) + UserTesting (€600) |
| **Analytics** | Mevcut funnel + Hotjar Free | Hotjar Free + Clarity (free) | Hotjar Plus (€192) |
| **User Research** | Google Forms + Zoom | €100 research incentive | €500 research incentive |
| **Accessibility** | Lighthouse + WebAIM | Stark Free + axe DevTools | Stark Pro (€60) |
| **Freelance Design** | — | — | Fiverr/Toptal micro-task (€2,000) |
| **Asset (ikon, illüstrasyon)** | Lucide (free) + Unsplash | €50 iStock credits | €200 custom illustration |
| **AI Tools** | Claude + v0.dev free | Claude + v0.dev free | Claude Pro + Midjourney (€50) |
| **TOPLAM** | **€0** | **~€272** | **~€3,474** |

### 11.2 ROI Tahmini

| Yatırım | Beklenen Etki | Varsayım |
|---------|---------------|----------|
| 5 kişi usability test (€50 gift card) | Task completion +15–25% | Nielsen Norman benchmarklara dayalı |
| Figma Pro (€72/6 ay) | Handoff hızı 2x | Unlimited dosya + team library |
| Hotjar Free | Heatmap ile 3-5 UX problemi keşfi | İlk ayda yeterli session data |
| Erişilebilirlik audit | Potansiyel kullanıcı kaybının %5-10'unu önleme | Engelli kullanıcı oranı İrlanda: ~13% |

> **📦 Geliştiricilere Direkt Not**
> Sıfır bütçe senaryosunda bile yapılması gereken: erişilebilirlik audit (Lighthouse) ve 5 kişilik test (tanıdık ağı). Bunlar €0 maliyetle en yüksek ROI sağlar.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> **"Minimum" senaryo önerisi: €272/6 ay.** Bu, Figma Pro + test incentive'i kapsar. İrlanda'da bir kahve €4.50 — 6 ayda 60 kahve yerine 5 kullanıcı testine yatır. ROI karşılaştırılamaz.

> **🔧 Araç Önerisi**
> Bütçe yoksa bile: Google Forms (survey) + Loom (test kaydı) + Figma Free + Hotjar Free = tam araştırma + test + analytics stack'i. Sıfır euro.

> **✅ Checklist**
> - [ ] Bütçe senaryosunu seç (sıfır/minimum/profesyonel)
> - [ ] Seçilen senaryonun araçlarını aktive et
> - [ ] Test incentive bütçesini ayır (minimum: 5 × €10 Amazon gift card)
> - [ ] 3 aylık review: ROI'yi değerlendir, sonraki 3 ay bütçeyi ayarla

---

## 12. Tasarım KPI'ları ve Ölçüm Sistemi

### 12.1 KPI Dashboard

| KPI | Tanım | Hedef (Launch) | Hedef (6 Ay) | Ölçüm Aracı |
|-----|-------|----------------|--------------|--------------|
| **SUS Score** | System Usability Scale | ≥ 68 (C+) | ≥ 75 (B) | Google Forms anketi |
| **Task Completion Rate** | Kritik görev tamamlama | ≥ 80% | ≥ 90% | Maze.co / funnel data |
| **Job Post Completion** | Post-job funnel dönüşümü | ≥ 60% | ≥ 75% | `trackFunnelStep('job_posting', 4)` |
| **Provider Onboarding Completion** | Onboarding funnel dönüşümü | ≥ 40% | ≥ 60% | `trackFunnelStep('provider_onboarding', 6)` |
| **Quote Accept Rate** | Gelen quote'ların kabul oranı | ≥ 25% | ≥ 40% | DB query: quotes accepted / total |
| **Time to First Action** | Kayıt → ilk job post veya quote süresi | < 5 dk | < 3 dk | Timestamp diff |
| **Bounce Rate (Homepage)** | Homepage'den hemen çıkma | < 60% | < 45% | Hotjar / analytics |
| **Lighthouse Accessibility** | Otomatik erişilebilirlik skoru | ≥ 85 | ≥ 95 | Lighthouse |
| **Lighthouse Performance** | Core Web Vitals (LCP, FID, CLS) | LCP < 2.5s | LCP < 1.8s | Lighthouse |
| **Error Rate** | Kritik akışta hata oranı | < 5% | < 2% | Error logging (Sentry) |
| **GDPR Compliance Rate** | DSAR yanıt süresi (< 30 gün) | 100% | 100% | Admin audit log |
| **Retention (7-day)** | 7 gün içinde tekrar giriş | ≥ 20% | ≥ 35% | DB query |
| **NPS** | Net Promoter Score | ≥ 20 | ≥ 40 | Post-task survey |

### 12.2 Ölçüm Altyapısı

| Veri Kaynağı | Mevcut Durum | Eksik |
|-------------|--------------|-------|
| Funnel events | ✅ `funnel_events` tablosu + API | — |
| Admin analytics | ✅ `/dashboard/admin/analytics` | — |
| SUS anketi | ❌ | Google Forms template oluştur |
| Hotjar heatmap | ❌ | Free plan aktive et |
| CTA click tracking | ❌ | `trackClick()` fonksiyonu ekle |
| Scroll depth | ❌ | Intersection Observer ile ekle |
| Session duration | ❌ | Hotjar veya custom |

### 12.3 Ölçüm Ritüeli

| Zaman | Aktivite | Sorumlu |
|-------|----------|---------|
| Haftalık | Funnel conversion check (admin analytics) | Kurucu |
| 2 Haftalık | Hotjar heatmap review (top 3 sayfa) | Kurucu |
| Aylık | SUS anketi (5-10 aktif kullanıcıya gönder) | Kurucu |
| Çeyreklik | Tam UX audit (10 heuristic + erişilebilirlik) | Kurucu + dış gözlemci |

> **📦 Geliştiricilere Direkt Not**
> Mevcut funnel tracking zaten güçlü. Eksik 3 ölçüm:
> 1. **CTA click tracking** — `lib/analytics/` altına `trackClick(id, label)` ekle
> 2. **Scroll depth** — Homepage'de %25, %50, %75, %100 scroll event'ları fire et
> 3. **Session duration** — `performance.now()` ile sayfa giriş → çıkış süresini ölç
>
> Bu 3'ü eklemek toplam ~2 saat iş. ROI çok yüksek.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> Tüm KPI'ları aynı anda takip etmeye çalışma. **İlk 30 gün sadece 3 metrik:**
> 1. Job post completion rate
> 2. Provider onboarding completion rate
> 3. Bounce rate
> Bu üçü düzelirse, diğerleri de düzelir.

> **🔧 Araç Önerisi**
> - Mevcut admin analytics dashboard → funnel KPI'ları
> - Google Forms → SUS anketi (template: https://measuringu.com/sus/)
> - Hotjar Free → heatmap + scroll depth
> - Notion → KPI dashboard (haftalık güncelle)

> **✅ Checklist**
> - [ ] CTA click tracking fonksiyonunu ekle
> - [ ] Scroll depth tracking ekle (Homepage, Search, Job Post)
> - [ ] SUS anketi template'i oluştur
> - [ ] Hotjar free plan'ı production'a entegre et (consent guard'lı!)
> - [ ] Haftalık funnel check'i takvime ekle
> - [ ] İlk SUS anketini launch sonrası 2. haftada gönder
> - [ ] KPI dashboard'u Notion'da oluştur

---

## 13. Riskler, Bottleneck'ler ve Mitigasyon

### 13.1 Risk Matrisi

| # | Risk | Olasılık | Etki | Mitigasyon |
|---|------|----------|------|------------|
| R1 | **Tasarım-kod uyumsuzluğu** — Figma'daki tasarım kodda farklı görünür | Yüksek | Orta | Token-first yaklaşım (zaten var), Design QA checklist, PR'da visual diff |
| R2 | **Revizyon döngüsü** — Sonsuz "biraz daha düzelt" döngüsü | Yüksek | Yüksek | Sprint başında scope freeze, max 2 revizyon kuralı, "good enough for launch" prensibi |
| R3 | **Kapsam kayması (scope creep)** — "Şunu da ekleyelim" sendromu | Yüksek | Yüksek | Feature freeze 2 hafta öncesinden, her yeni fikir → backlog, "not now" listesi |
| R4 | **Tek kişi darboğazı** — Tasarım + kod + test + PM tek kişide | Kesin | Yüksek | AI araçlar (v0.dev, Claude), template kullanımı, 80/20 kuralı |
| R5 | **Mobil UX ihmal** — Desktop-first geliştirme alışkanlığı | Orta | Yüksek | Mobile-first wireframe zorunluluğu, Chrome DevTools mobile preview her PR'da |
| R6 | **Erişilebilirlik borcu** — Launch sonrası düzeltme maliyeti 10x | Orta | Yüksek | Launch öncesi Lighthouse ≥ 85 zorunluluğu, `--wm-primary` kontrast fix'i |
| R7 | **Kullanıcı test verisi yetersizliği** — "Test edecek kullanıcı bulamadım" | Orta | Orta | Reddit Ireland, Facebook community grupları, €10 gift card incentive |
| R8 | **GDPR uyumsuzluk** — Consent akışı eksik/hatalı | Düşük | Çok Yüksek | Mevcut altyapı sağlam, "Reject All" butonu eklenmeli |
| R9 | **Performans (Core Web Vitals)** — LCP > 2.5s | Orta | Yüksek | Image optimization, font preload (zaten var), skeleton loading (zaten var) |
| R10 | **Provider onboarding drop-off** — %60+ kullanıcı formu yarıda bırakır | Yüksek | Çok Yüksek | Auto-save, progress indicator, "continue later" butonu, step-by-step motivation text |

### 13.2 Bottleneck Analizi

| Bottleneck | Neden | Çözüm |
|------------|-------|-------|
| **Figma ↔ Kod senkronizasyonu** | Tek kişi hem tasarlıyor hem kodluyor → biri gecikilir | Figma'da "rough is enough" prensibi, token sistemi sayesinde kodda hızlı uygulama |
| **Test katılımcısı bulma** | İrlanda pazarı, İngilizce, spesifik demografi | Reddit r/ireland, Facebook "Dublin Tradespeople" grupları, Nextdoor |
| **Design karar felci** | "Acaba şu renk mi bu renk mi?" sonsuz döngüsü | 48 saat kuralı: karar 48 saat içinde verilmezse, default seçenek uygulanır |
| **Responsive test** | Gerçek cihaz erişimi sınırlı | BrowserStack free tier (1 paralel session), Chrome DevTools emülasyonu |

> **📦 Geliştiricilere Direkt Not**
> **En kritik risk: R2 (revizyon döngüsü) ve R3 (kapsam kayması).**
> Korunma yöntemi: Sprint başında "bu sprint'te NE YAPILMAYACAK" listesi yazın. Bu liste, "yapılacaklar" listesinden daha önemli.
>
> **R10 (provider onboarding drop-off) için immediate fix:**
> `ProOnboardingForm.tsx`'e auto-save ekleyin. Her adım değişikliğinde `localStorage.setItem('onboarding_draft', JSON.stringify(formData))` yapın. Kullanıcı geri geldiğinde draft'tan devam etsin.

> **💡 Tek Kişi / Küçük Ekip İpucu**
> **"Perfect is the enemy of launched."** Her tasarım kararında kendinize sorun: "Bu detayı %80 kalitede bırakırsam, kullanıcı fark eder mi?" Cevap genellikle "hayır". O %20'lik perfection'ı post-launch'a bırakın.

> **🔧 Araç Önerisi**
> - Notion "Not Now" listesi — Her reddedilen fikir buraya
> - GitHub Labels: `scope-creep`, `post-launch`, `nice-to-have`
> - Timer (30 dk) — Tasarım kararı için max süre

> **✅ Checklist**
> - [ ] "Not Now" listesi oluştur (Notion veya GitHub label)
> - [ ] Sprint başında scope freeze kuralı uygula
> - [ ] 48 saat karar kuralını ekiple (kendinle) paylaş
> - [ ] Provider onboarding auto-save ekle (localStorage)
> - [ ] Mobile preview kontrolünü PR checklist'e ekle
> - [ ] Lighthouse ≥ 85 launch-blocker olarak ayarla
> - [ ] `--wm-primary` kontrast sorununu fix et (küçük text → `--wm-primary-dark`)

---

## 14. İlk 30 Gün Acil Aksiyon Listesi

### Bugünden başlanabilecek 18 maddelik checklist

| # | Aksiyon | Etki | Efor | Kategori |
|---|---------|------|------|----------|
| 1 | **Cookie banner'a "Reject All" butonu ekle** (eşit görsel ağırlık) | 🔴 Yüksek | 🟢 Düşük (1 saat) | GDPR |
| 2 | **`--wm-primary` kontrast fix** — küçük text'lerde `--wm-primary-dark` kullan | 🔴 Yüksek | 🟢 Düşük (2 saat) | Erişilebilirlik |
| 3 | **Provider onboarding auto-save** (localStorage draft) | 🔴 Yüksek | 🟡 Orta (4 saat) | Dönüşüm |
| 4 | **Homepage ikili CTA** — "Post a Job" + "Find a Pro" | 🔴 Yüksek | 🟢 Düşük (1 saat) | Dönüşüm |
| 5 | **Footer'a "Manage Cookies" linki ekle** | 🔴 Yüksek | 🟢 Düşük (30 dk) | GDPR |
| 6 | **Figma hesabı + 4 variable collection** oluştur | 🟡 Orta | 🟡 Orta (3 saat) | Sistem |
| 7 | **5 competitor screenshot + karşılaştırma notu** | 🟡 Orta | 🟢 Düşük (2 saat) | Araştırma |
| 8 | **Hotjar free plan aktive et** (production, consent guard'lı) | 🟡 Orta | 🟢 Düşük (1 saat) | Analytics |
| 9 | **SUS anketi template'i oluştur** (Google Forms) | 🟡 Orta | 🟢 Düşük (30 dk) | Test |
| 10 | **PR template'e Design QA checklist ekle** | 🟡 Orta | 🟢 Düşük (30 dk) | Süreç |
| 11 | **CTA click tracking** ekle (`trackClick()` fonksiyonu) | 🟡 Orta | 🟡 Orta (2 saat) | Analytics |
| 12 | **Mobile touch target audit** — 44×44px minimum kontrol | 🟡 Orta | 🟡 Orta (3 saat) | Erişilebilirlik |
| 13 | **Lighthouse Accessibility audit** (top 5 sayfa) | 🟡 Orta | 🟢 Düşük (1 saat) | Erişilebilirlik |
| 14 | **İlk 5 customer interview planla** (tanıdık ağı) | 🟡 Orta | 🟢 Düşük (1 saat) | Araştırma |
| 15 | **Scroll depth tracking** ekle (Homepage, Search, Post Job) | 🟢 Düşük | 🟡 Orta (2 saat) | Analytics |
| 16 | **Spacing token'larını `tokens.css`'e ekle** | 🟢 Düşük | 🟢 Düşük (1 saat) | Sistem |
| 17 | **İkon boyut standardı** oluştur (`ICON_SIZE` sabitleri) | 🟢 Düşük | 🟢 Düşük (30 dk) | Sistem |
| 18 | **"Not Now" backlog listesi** oluştur (GitHub label veya Notion) | 🟢 Düşük | 🟢 Düşük (15 dk) | Süreç |

### Önerilen Sıralama (İlk Hafta)

**Gün 1-2:** #1, #2, #5 (GDPR + erişilebilirlik fix — launch blocker)
**Gün 3-4:** #3, #4 (Dönüşüm iyileştirme — en yüksek ROI)
**Gün 5-7:** #6, #7, #10 (Sistem kurulumu + araştırma başlangıcı)
**Hafta 2:** #8, #9, #11, #13 (Analytics + test altyapısı)
**Hafta 3:** #12, #14, #15, #16, #17 (Audit + detay iyileştirmeler)
**Hafta 4:** #18 + İlk usability test (5 kişi)

---

## Bu Raporu Uygulamak İçin Geliştiricilerden (ve Benden) İstediğim İlk 3 Şey

### 1. 🔴 GDPR + Erişilebilirlik Emergency Fix (Bu Hafta)

**Ne:** Cookie banner'a "Reject All" butonu + footer'a "Manage Cookies" linki + `--wm-primary` kontrast fix (küçük text'lerde `--wm-primary-dark` kullan)

**Neden:** GDPR uyumsuzluğu ve erişilebilirlik eksikliği, İrlanda'da lansman yapan bir platform için yasal ve itibar riski taşır. Bu 3 fix toplam ~3.5 saat iş.

**Dosyalar:**
- `marketplace/components/ui/CookieConsent.tsx` — "Reject All" butonu ekle
- `marketplace/components/site/SiteFooter.tsx` — "Manage Cookies" linki ekle
- `marketplace/app/tokens.css` — küçük text token aliası ekle (opsiyonel)
- Tüm `color: var(--wm-primary)` + küçük text kullanımlarını tara → `var(--wm-primary-dark)` ile değiştir

### 2. 🟡 Funnel Dönüşüm İyileştirmeleri (Bu Sprint)

**Ne:** Provider onboarding auto-save (localStorage) + Homepage ikili CTA + CTA click tracking

**Neden:** Provider onboarding mevcut haliyle muhtemelen %40–50 drop-off yaşıyor (6 adımlı form, kaydetme yok). Auto-save eklemek tek başına completion rate'i %15-25 artırabilir (varsayım). Homepage'de net ikili CTA (Post a Job / Find a Pro) ziyaretçi → kullanıcı dönüşümünü artırır.

**Dosyalar:**
- `marketplace/components/forms/ProOnboardingForm.tsx` — localStorage auto-save
- `marketplace/components/home/HeroSection.tsx` — ikili CTA düzenlemesi
- `marketplace/lib/analytics/` — `trackClick()` fonksiyonu ekleme

### 3. 🟢 Figma Token Eşlemesi + İlk 5 Test (Bu Ay)

**Ne:** Figma'da WorkMate variable collection'larını oluştur (Colors, Typography, Spacing, Radius) + 5 kişilik unmoderated job posting testi yap

**Neden:** Token eşlemesi olmadan Figma ↔ Kod arası çeviri hatası kaçınılmaz. 5 kişilik test, launch öncesi en kritik UX sorunlarını ortaya çıkarır. Bu iki aktivite birlikte, "tahmine dayalı tasarım" yerine "veriye dayalı tasarım" yapmanızı sağlar.

**Çıktılar:**
- Figma dosyası: 4 variable collection + Button/Badge/Card component
- Maze.co testi: 5 katılımcı, job posting flow, task completion rate
- Insight listesi: Top 5 UX sorunu → GitHub Issues

---

> *Bu rapor, WorkMate'in mevcut kod tabanı (152+ component, 85+ token, 52 sayfa, 104 API endpoint) detaylı analiz edilerek hazırlanmıştır. Tüm öneriler mevcut mimari ve token sistemiyle uyumludur. Varsayımlar ilgili satırlarda etiketlenmiştir.*
