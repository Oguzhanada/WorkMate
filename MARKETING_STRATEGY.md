# WorkMate — Kapsamlı Pazarlama Strateji Raporu

**Hazırlayan:** Growth Marketing Direktörü | **Tarih:** 10 Mart 2026
**Proje:** WorkMate — Ireland-First Hizmet Marketplace'i
**Durum:** Pre-production → Production Launch

---

## 1. Proje Özeti ve Pazarlama Hedefleri

### 1.1 Proje Özeti

WorkMate, İrlanda genelinde (26 county) hizmet arayanları (customer) doğrulanmış hizmet sağlayıcılarla (verified provider) buluşturan iki taraflı bir pazaryeridir. Ürün, İrlanda'ya özgü uyumluluk gereksinimleri (SafePass, Public Liability Insurance, Tax Clearance, Garda Vetting) üzerine inşa edilmiş olup, güven ve şeffaflık üzerine konumlanmaktadır.

**Gelir Modeli:**
| Kaynak | Detay |
|--------|-------|
| Müşteri Servis Ücreti | %5 (€100+ işlerde), %3 tekrar rezervasyonlarda |
| Provider Komisyonu | %3 Starter, %1.5 Pro/Pro+ (€100+ işlerde) |
| Provider Abonelik | €0/ay (Starter), €19/ay (Pro), €39/ay (Pro+) |
| Yıllık Abonelik | €179/yıl (Pro), €349/yıl (Pro+) |

**10 Hizmet Kategorisi, 45 Alt Kategori:** Temizlik, Tamir & Renovasyon, Bahçe, Taşınma, Eğitim, Teknik Destek, Güzellik, Etkinlik, Evcil Hayvan, Profesyonel Hizmetler.

### 1.2 SMART Pazarlama Hedefleri

| # | Hedef | Metrik | Zaman | Ölçüm |
|---|-------|--------|-------|-------|
| H1 | İlk 100 doğrulanmış provider'ı onboard etmek (Founding Pro) | Onboarded & verified provider sayısı | Launch + 90 gün | `founding_pro_config.current_count` |
| H2 | Aylık 500 aktif iş ilanı | `jobs` tablosu `status='open'` sayısı/ay | Launch + 6 ay | Supabase query |
| H3 | İlk işlem hacmi: €50K GMV | Stripe `payment_intent.succeeded` toplamı | Launch + 6 ay | Stripe Dashboard |
| H4 | Customer acquisition cost (CAC) < €15 | Toplam harcama / yeni müşteri | Sürekli | GA4 + Stripe |
| H5 | Provider-to-customer oranı 1:5 | Provider / aktif customer | Launch + 6 ay | Supabase query |
| H6 | NPS > 40 | NPS survey | Launch + 3 ay | Typeform/Hotjar |
| H7 | Organik trafik: 10K aylık ziyaretçi | GA4 sessions | Launch + 6 ay | GA4 |

> **Geliştiricilere Not:**
> - H1 tracking: `founding_pro_config` tablosundaki `current_count` alanı zaten mevcut (migration 071).
> - H2 tracking: `funnel_events` tablosu (migration 061) + admin analytics paneli (`/dashboard/admin/analytics`) mevcut.
> - H3 tracking: Stripe webhook `payment_intent.succeeded` event'i mevcut handler'a GMV aggregation eklenebilir.
> - H5 tracking: `profiles` tablosunda `role` alanı üzerinden ratio hesaplama API endpoint'i gerekli.

---

## 2. Hedef Kitle Analizi

### 2.1 Customer Persona'ları

#### Persona 1: "Busy Brian" — Ev Sahibi (Primary)
| Özellik | Detay |
|---------|-------|
| Demografik | 30-50 yaş, İrlanda'da ev sahibi, orta-üst gelir |
| Lokasyon | Dublin, Cork, Galway (büyük şehirler) |
| Motivasyon | Ev bakım/onarım işlerini güvenilir birine yaptırmak |
| Pain Points | Güvenilir tradesperson bulmak zor, fiyat şeffaflığı yok, "cash-in-hand" güvensizliği |
| Tetikleyiciler | Acil tamir (su kaçağı, elektrik arızası), taşınma, yeni ev |
| İtirazlar | "Online platformlara güvenmem", "Komşumun tavsiyesi daha güvenli" |
| Trust Bariyeri | Provider'ın sigortalı, vergi uyumlu ve deneyimli olduğundan emin olma |
| Kanal Tercihi | Google arama, WhatsApp grupları, yerel Facebook grupları |

#### Persona 2: "New Nora" — Kiracı / Yeni Yerleşen
| Özellik | Detay |
|---------|-------|
| Demografik | 25-35 yaş, yeni İrlanda'ya taşınmış (expat/uluslararası) |
| Motivasyon | Kişisel ağı olmadığı için güvenilir hizmet bulmak |
| Pain Points | Yerel ağı yok, dil/kültür bariyeri, dolandırıcılık korkusu |
| Trust Bariyeri | Platform güvenliği, escrow ödeme, review'ların gerçekliği |

#### Persona 3: "Practical Patricia" — Emlak Yöneticisi / Landlord
| Özellik | Detay |
|---------|-------|
| Demografik | 40-60 yaş, birden fazla mülk yöneten |
| Motivasyon | Düzenli bakım için güvenilir provider havuzu |
| Pain Points | Her seferinde yeni tradesperson aramak, fatura takibi |
| Trust Bariyeri | Fiyat tutarlılığı, tekrar rezervasyon kolaylığı |

### 2.2 Provider Persona'ları

#### Persona 1: "Solo Seán" — Bağımsız Tradesperson
| Özellik | Detay |
|---------|-------|
| Demografik | 25-45 yaş, tek başına çalışan tesisatçı/elektrikçi/boyacı |
| Motivasyon | Daha fazla müşteri, düzenli iş akışı |
| Pain Points | Lead başına ödeme (Bark €15/lead), ödeme tahsilatı sorunu, "no-show" müşteriler |
| Tetikleyiciler | İş azalması, Bark/RatedPeople maliyet artışı, kış sezonu |
| İtirazlar | "Başka bir platform daha mı? Zaten yeterince var" |
| Trust Bariyeri | Platformun gerçekten ödeme yapacağından emin olma |

#### Persona 2: "Growing Grace" — Küçük İşletme Sahibi
| Özellik | Detay |
|---------|-------|
| Demografik | 30-50 yaş, 2-5 çalışanlı temizlik/bahçe firması |
| Motivasyon | İş hacmini artırmak, çalışanlarını meşgul tutmak |
| Pain Points | Marketing maliyeti, müşteri edinme süresi, admin yükü |
| Trust Bariyeri | ROI kanıtı, platform komisyonunun rekabetçiliği |

### 2.3 AARRR + Marketplace Journey Map

```
CUSTOMER JOURNEY                          PROVIDER JOURNEY
═══════════════                          ════════════════
ACQUISITION                              ACQUISITION
├─ Google "plumber Dublin"               ├─ "earn more as plumber Ireland"
├─ Facebook local group referral         ├─ Provider referral (WM-XXXXXXXX)
├─ Direct URL workmate.ie               ├─ Founding Pro campaign
└─ County landing page                   └─ Trade association partnership

ACTIVATION                               ACTIVATION
├─ Post first job (free)                 ├─ Complete 4-step onboarding
├─ Browse categories                     ├─ Upload 4 documents
├─ Receive first quote                   ├─ Get verified (<24h)
└─ funnel: job_posting step 1-3          └─ funnel: provider_onboarding step 1-6

RETENTION                                RETENTION
├─ Accept quote → secure hold            ├─ Win first job → first payout
├─ Complete job → release payment        ├─ Receive first review (5★)
├─ Post second job                       ├─ Quote 2nd job
└─ Rebook same provider (3% fee)         └─ Upgrade to Pro (unlimited quotes)

REVENUE                                  REVENUE
├─ 5% service fee per job                ├─ 3% commission (Starter)
├─ Repeat booking (3%)                   ├─ 1.5% commission (Pro/Pro+)
└─ Future: premium customer tier?        └─ €19/mo or €39/mo subscription

REFERRAL                                 REFERRAL
├─ Share job link                        ├─ Founding Pro referral code
├─ "Referred by" tracking               ├─ WM-XXXXXXXX (max 10 uses)
└─ NPS-driven word of mouth             └─ Trade network WOM
```

**Supply/Demand Denge Metrikleri:**
| Metrik | Hedef | Kritik Eşik |
|--------|-------|-------------|
| Provider/Customer oranı | 1:5 | <1:10 = supply kıtlığı |
| Ortalama quote/iş | 3-5 | <2 = müşteri kaybı |
| Quote-to-accept oranı | >30% | <15% = fiyat/kalite sorunu |
| İlk quote süresi | <4 saat | >24 saat = provider aktivasyonu sorunu |

> **Geliştiricilere Not:**
> - Supply/demand ratio dashboard'u: `profiles` tablosunda `role` bazlı count + `jobs` tablosunda aktif iş sayısı ile ölçülebilir.
> - Quote response time: `quotes` tablosunda `created_at` - `jobs.created_at` farkı (yeni metrik endpoint'i gerekli).
> - Referral tracking: `referral_codes` + `referral_redemptions` tabloları mevcut (migration 072), UI'da kullanım paneli gerekli.

---

## 3. Rakip ve Pazar Analizi

### 3.1 İrlanda Pazar Büyüklüğü

**Varsayım:** İrlanda ev hizmetleri pazarı yıllık ~€2-3 milyar (AB ortalaması baz alınarak, 5.1M nüfus). Online penetrasyon oranı %8-12 (UK benchmark'ına kıyasla düşük — büyüme fırsatı).

### 3.2 Rakip Analizi

| Rakip | Model | İrlanda Varlığı | Güçlü | Zayıf | WorkMate Farkı |
|-------|-------|-----------------|-------|-------|----------------|
| **Bark** | Lead başına ödeme (€2-15) | Aktif, güçlü | SEO dominansı, geniş kategori | Provider'lar için pahalı, lead kalitesi düşük, doğrulama yok | %3 komisyon vs lead başına maliyet; tam doğrulama |
| **TaskRabbit** | %15 komisyon | Dublin merkezli, sınırlı | Global marka, IKEA ortaklığı | Yüksek komisyon, İrlanda dışı odak, sınırlı kategori | %3 vs %15; 26 county kapsam; İrlanda uyumluluğu |
| **MyBuilder** | %8-12 + abonelik | UK odaklı, İrlanda'da zayıf | Güçlü UK tabanı | İrlanda'ya özel değil, aylık maliyet yüksek | İrlanda-first; €0 başlangıç; SafePass/Tax Clearance |
| **Rated People** | Lead başına £5-30 | UK odaklı, İrlanda'da minimal | Büyük lead havuzu | Sterling bazlı, İrlanda regülasyonuna uyumsuz | EUR bazlı; Eircode; İrlanda hukuku uyumlu |
| **Airtasker** | %20-30 komisyon | İrlanda'da yok | Geniş kategori, esnek model | Çok yüksek komisyon, İrlanda'da varlık yok | Düşük komisyon; yerel compliance; fiziksel varlık |
| **Checkatrade** | Abonelik (£40-120/ay) | İrlanda'da yok (UK) | Güçlü doğrulama; TV reklamları | Çok pahalı provider maliyeti; İrlanda'da yok | Ücretsiz başlangıç; komisyon bazlı büyüme modeli |
| **Facebook Groups** | Ücretsiz | Çok aktif (her county) | Sıfır maliyet, güven (yerel) | Doğrulama yok, ödeme güvencesi yok, aranabilirlik yok | Güven katmanı; escrow; aranabilir platform |
| **Word of Mouth** | Ücretsiz | Dominant kanal | En güvenilir | Ölçeklenemez, yeni yerleşenler için erişilemez | Dijital WOM + doğrulama + ödeme güvencesi |

### 3.3 WorkMate Rekabet Avantajı Özeti

1. **İrlanda Compliance Stack:** SafePass + PLI (€6.5M min) + Tax Clearance + Garda Vetting — hiçbir rakip bu paketi sunmuyor
2. **Düşük Komisyon:** %3 Starter / %1.5 Pro — pazar ortalamasının çok altında
3. **Secure Payment Hold:** Stripe escrow — iş tamamlanmadan ödeme serbest bırakılmıyor
4. **26 County Kapsam:** Dublin dışı İrlanda'yı aktif olarak hedefleyen tek platform
5. **€0 Başlangıç:** Provider'lar ücretsiz başlayıp büyüdükçe ödüyor
6. **GDPR-Native:** Veri saklama, silme, dışa aktarma akışları ürüne entegre

> **Geliştiricilere Not:**
> - Rakip karşılaştırma tablosu pricing sayfasında zaten mevcut (`pricing/page.tsx`). Bu veriyi blog içerikleri ve landing page'lerde de kullanın.
> - `robots.txt`'teki sitemap URL'i `localhost:3000` → production domain'e güncellenmeli (SEO kritik).

---

## 4. Pozisyonlama ve Mesajlaşma Stratejisi

### 4.1 UVP (Unique Value Proposition)

**Tek Cümle:** "Ireland's only marketplace where every pro is compliance-verified, every payment is Stripe-secured, and you never pay until the job is done right."

**Kısa Versiyon:** "Verified pros. Secure payments. Built for Ireland."

### 4.2 RTB (Reasons to Believe)

| RTB | Kanıt |
|-----|-------|
| Güvenilir Provider'lar | SafePass, PLI (€6.5M), Tax Clearance, Garda Vetting — admin onaylı |
| Güvenli Ödeme | Stripe escrow: ödeme iş tamamlanana kadar tutulur |
| Şeffaf Fiyatlandırma | Teklif karşılaştırma, komisyon oranları açık, gizli ücret yok |
| İrlanda Odaklı | 26 county, Eircode doğrulama, EUR, İrlanda regülasyonları |
| Düşük Maliyet | %3 komisyon vs Bark'ın €15/lead, TaskRabbit'ın %15 |
| 7 Gün Garanti | Happiness Pledge: memnun değilseniz çözüm incelemesi |

### 4.3 Value Proposition Matrix

| Segment | Birincil Değer | İkincil Değer | Mesaj Tonu |
|---------|---------------|---------------|------------|
| Ev Sahibi (müşteri) | Güvenli ödeme + doğrulanmış pro | Kolay karşılaştırma | Güven veren, sade |
| Expat/Yeni Yerleşen | Dil bariyersiz güvenilir hizmet | County bazlı arama | Kapsayıcı, destekleyici |
| Landlord/Yönetici | Tekrar rezervasyon kolaylığı | İndirimli komisyon | Profesyonel, verimlilik |
| Solo Tradesperson | Ücretsiz müşteri edinme | Düşük komisyon | Kardeş tonu, empati |
| Küçük İşletme | İş hacmi büyütme | Analytics + Pro badge | İş ortağı, profesyonel |

### 4.4 Mesaj Setleri

#### Customer Acquisition Mesajları (İngilizce — ürün dili)

| Kanal | Başlık | Alt Metin | CTA |
|-------|--------|-----------|-----|
| Google Ads | "Verified Plumber in Dublin — Free to Post" | "SafePass checked, insured, Stripe-secured payment. Get quotes in hours." | "Post Your Job Free" |
| Facebook | "Stop asking WhatsApp groups. Start trusting WorkMate." | "Every pro is admin-verified. Your payment held until you're satisfied." | "Find a Pro Now" |
| SEO Blog | "How to Find a Reliable Plumber in Cork" | "5 things to check before hiring (and how WorkMate checks them for you)" | "Compare Verified Pros" |
| Email | "Your job got 3 new quotes" | "Compare prices, reviews, and compliance — all in one place." | "View Quotes" |

#### Provider Acquisition Mesajları (İngilizce)

| Kanal | Başlık | Alt Metin | CTA |
|-------|--------|-----------|-----|
| Google Ads | "Get Plumbing Jobs in Dublin — No Lead Fees" | "3% commission, not €15 per lead. Free to start. Unlimited with Pro." | "Apply Free Today" |
| Facebook | "Tired of paying for leads that don't answer?" | "WorkMate: only pay when you actually earn. Verified customers, secure payments." | "Join 100 Founding Pros" |
| Trade Forum | "WorkMate vs Bark: The Real Cost Comparison" | "Detailed breakdown: €250 job costs you €7.50 on WorkMate vs €15+ on Bark for just the lead." | "Calculate Your Savings" |
| LinkedIn | "Irish tradespeople: your compliance docs are your superpower" | "WorkMate rewards SafePass, insurance, and tax clearance with priority visibility." | "Become a Verified Pro" |

### 4.5 Slogan Önerileri

| Slogan | Kullanım Alanı |
|--------|---------------|
| **"Find your perfect pro."** | Ana tagline (mevcut — HeroSection) |
| **"Verified pros. Secure payments. Built for Ireland."** | Alt tagline / paid ads |
| **"Grow your trade. Not your overheads."** | Provider acquisition (mevcut — become-provider) |
| **"Post free. Pay only when satisfied."** | Customer trust mesajı |
| **"Ireland's compliance-first marketplace."** | PR / B2B / trade partnerships |

### 4.6 Tone of Voice

| Durum | Ton | Örnek |
|-------|-----|-------|
| Customer-facing | Güven veren, dostça, net | "Your payment is held safely until you confirm the work is done." |
| Provider-facing | Empatik, kardeşçe, iş ortağı | "We know lead fees hurt. That's why we only charge when you earn." |
| Trust/Legal | Ciddi ama erişilebilir | "Every provider is manually reviewed by our team. No exceptions." |
| Marketing/Social | Enerji, cesaret, humor (ölçülü) | "WhatsApp group recommendations? That's so 2023." |
| Error/Support | Empatik, çözüm odaklı | "Something went wrong. Our team is already on it." |

> **Geliştiricilere Not:**
> - Mevcut copy zaten güçlü (HeroSection, WhyWorkMate, become-provider). Yeni landing page'ler için bu tone of voice kılavuzunu referans alın.
> - `messages/en.json` dosyasındaki çeviri anahtarları henüz tüm yeni mesaj setlerini kapsamıyor — yeni mesajlar eklenmeli.
> - Dinamik OG image (`app/og/route.tsx`) zaten mevcut — county bazlı ve kategori bazlı OG image'lar ekleyin.

---

## 5. Pazarlama Kanalları ve Öncelik Sıralaması

### 5.1 Faz Bazlı Kanal Önceliklendirme

#### Pre-Launch (Launch - 30 gün)

| Öncelik | Kanal | Hedef | Taktik |
|---------|-------|-------|--------|
| 🔴 P0 | Founding Pro Kampanyası | 100 provider onboarding | LinkedIn outreach, trade forums, WhatsApp grupları |
| 🔴 P0 | Local SEO Altyapısı | County landing page'ler | 26 county + 10 kategori = 260 sayfa |
| 🟡 P1 | Email Waitlist | 1000 customer email | Landing page + "Post first — get notified" |
| 🟡 P1 | Social Proof Toplama | 10 testimonial | Provider beta test + video testimonials |
| 🟢 P2 | PR/Media | Brand awareness | Irish Times, TheJournal.ie, Boards.ie |

#### Launch (0-30 gün)

| Öncelik | Kanal | Hedef | Taktik |
|---------|-------|-------|--------|
| 🔴 P0 | Google Ads (Search) | Customer acquisition | "plumber dublin", "electrician cork" vb. |
| 🔴 P0 | Facebook/Instagram Ads | Dual-sided acquisition | County-targeted, separate customer/provider campaigns |
| 🟡 P1 | Content Marketing | Organic traffic foundation | "How to hire" guides, cost guides |
| 🟡 P1 | Referral Program | Viral growth | Founding Pro referral codes (WM-XXXXXXXX) |
| 🟢 P2 | Email Lifecycle | Activation + retention | Welcome series, quote notification, review request |

#### Growth (30-180 gün)

| Öncelik | Kanal | Hedef | Taktik |
|---------|-------|-------|--------|
| 🔴 P0 | SEO (Organic) | CAC düşürme | County + category pages, blog, schema markup |
| 🔴 P0 | Lifecycle Email | Retention + upgrade | Provider upsell (Starter→Pro), re-engagement |
| 🟡 P1 | Partnerships | Supply growth | CIF, RECI, trade schools, local chambers |
| 🟡 P1 | Retargeting | Conversion optimization | Abandoned job post, visited-but-not-posted |
| 🟢 P2 | Community | Brand building | Provider WhatsApp group, customer newsletter |

### 5.2 Kanal ROI Beklentisi (Varsayım)

| Kanal | Beklenen CAC | Payback | Öncelik |
|-------|-------------|---------|---------|
| Organic SEO | €2-5 | 3-6 ay yatırım, sonra kümülatif | Uzun vade P0 |
| Google Ads | €10-20 | İlk işlemde | Kısa vade P0 |
| Facebook Ads | €8-15 | İlk işlemde | Kısa vade P0 |
| Referral | €3-8 | İlk işlemde | Orta vade P1 |
| Email | €1-3 | Retention döngüsü | Sürekli P1 |
| PR | €0 (time cost) | Brand awareness | Fırsat bazlı |

> **Geliştiricilere Not:**
> - County landing page'ler: `app/[locale]/services/[county]/page.tsx` yapısı ile 26 dinamik sayfa oluşturulabilir (mevcut `ireland-locations.ts` verisi kullanılarak).
> - Waitlist: Basit bir `POST /api/waitlist` endpoint'i + `waitlist_emails` tablosu yeterli (migration 073 adayı).
> - Referral code UI: `founding_pro` API endpoint'i mevcut; provider dashboard'a "Referral Code" kartı eklenmeli.

---

## 6. Dijital Pazarlama Planı

### 6.1 SEO Stratejisi

#### Teknik SEO (Mevcut Durum + Aksiyon)

| Alan | Mevcut Durum | Aksiyon |
|------|-------------|--------|
| Sitemap | ✅ Mevcut (`app/sitemap.ts`) | County + kategori sayfaları eklenmeli |
| robots.txt | ⚠️ localhost URL | Production domain'e güncelle |
| JSON-LD | ✅ WebSite + LocalBusiness + Organization | Service schema'ya Review aggregate ekle |
| OG Image | ✅ Dinamik (`app/og/route.tsx`) | County/kategori bazlı varyantlar |
| Meta Tags | ✅ Layout'ta mevcut | County sayfaları için dinamik title/description |
| Core Web Vitals | ❓ Test edilmedi | Lighthouse CI pipeline'a ekle |
| Canonical URLs | ❓ Kontrol edilmedi | next-intl locale prefix'leri için canonical |

#### İçerik SEO — Anahtar Kelime Stratejisi

**Tier 1 (High Intent — Google Ads + Organik):**
```
[service] + [city/county] → "plumber dublin", "electrician cork"
[service] + near me → "plumber near me ireland"
[service] + cost → "how much does a plumber cost ireland"
```

**Tier 2 (Informational — Blog):**
```
"how to find a reliable [service] in [county]"
"average cost of [service] in ireland 2026"
"do I need planning permission for [renovation] ireland"
"safeguard checklist hiring tradesperson ireland"
```

**Tier 3 (Provider — Long Tail):**
```
"how to get more plumbing jobs ireland"
"bark alternative ireland"
"best platform for tradespeople ireland"
"tradesperson insurance requirements ireland"
```

#### County Landing Page Yapısı (260 Sayfa Hedef)

```
/en/services/dublin/plumbing     → "Verified Plumbers in Dublin"
/en/services/cork/cleaning       → "Professional Cleaners in Cork"
/en/services/galway/gardening    → "Garden Services in Galway"
...
```

Her sayfa:
- Dinamik H1: "Verified [Service] in [County]"
- County-specific provider listesi
- Ortalama fiyat bilgisi (category price estimate API mevcut)
- JSON-LD: Service + AreaServed schema
- İç linkler: diğer county'ler + ilgili kategoriler

### 6.2 SEM (Paid Search) Planı

**Google Ads Yapısı:**

| Kampanya | Hedef | Anahtar Kelimeler | Bütçe Payı |
|----------|-------|-------------------|------------|
| Brand | Marka aramaları | "workmate ireland", "workmate.ie" | %5 |
| Customer — High Intent | Müşteri edinme | "[service] [city]", "[service] near me" | %40 |
| Customer — Cost | Bilgi arayan → dönüşüm | "[service] cost ireland", "how much [service]" | %20 |
| Provider — Acquisition | Provider edinme | "get [trade] jobs ireland", "bark alternative" | %25 |
| Retargeting | Geri kazanma | Site ziyaretçileri, abandoned job posts | %10 |

**Negatif Keyword Listesi:** UK, London, free [service], DIY, jobs (employment), salary

### 6.3 Sosyal Medya Planı

| Platform | Hedef | İçerik Türü | Frekans |
|----------|-------|-------------|---------|
| **Facebook** | Customer acquisition + community | Before/after, cost guides, testimonials | 4x/hafta |
| **Instagram** | Brand awareness + trust | Provider spotlights, work portfolio, reels | 3x/hafta |
| **LinkedIn** | Provider acquisition + B2B | Industry insights, provider success stories | 2x/hafta |
| **TikTok** | Awareness (genç kitle) | "How much does X cost?", transformation videos | 2x/hafta |
| **X (Twitter)** | PR + customer support | Launch announcements, quick tips | 2x/hafta |

**Paid Social Kampanya Yapısı:**

| Kampanya | Platform | Hedefleme | Kreatif |
|----------|----------|-----------|---------|
| Customer — Awareness | Facebook/IG | 25-55 yaş, İrlanda, ev sahipleri | Video: "3 steps to hire a verified pro" |
| Customer — Consideration | Facebook/IG | Retargeting: site ziyaretçileri | Carousel: testimonials + pricing comparison |
| Customer — Conversion | Facebook/IG | Lookalike: completed bookings | Single image: "Post free. Pay when satisfied." |
| Provider — Acquisition | Facebook/LinkedIn | Trade-related interests, İrlanda | Cost comparison: WorkMate vs Bark vs TaskRabbit |
| Provider — Founding Pro | LinkedIn/Facebook | Tradespeople, contractor groups | "100 spots. Lifetime badge. 6 months free Pro." |

### 6.4 Email Marketing Planı

#### Mevcut Email Altyapısı (11 template)
Resend entegrasyonu hazır. Mevcut template'ler: quote received/accepted, payment released, contract lifecycle (3), garda vetting (2), subscription status, first quote celebration, GDPR deletion.

#### Eklenmesi Gereken Lifecycle Email'ler

| Email | Tetikleyici | Hedef | Öncelik |
|-------|------------|-------|---------|
| Welcome Series (Customer) | Kayıt | Aktivasyon → ilk job post | 🔴 P0 |
| Welcome Series (Provider) | Onboarding başlangıcı | Doğrulama tamamlama | 🔴 P0 |
| Abandoned Job Post | job_posting funnel step 1-2, 24h inaktif | İş ilanını tamamla | 🔴 P0 |
| Re-engagement | 30 gün inaktif customer | Tekrar iş oluştur | 🟡 P1 |
| Provider Upsell | 5+ tamamlanmış iş (Starter) | Pro upgrade | 🟡 P1 |
| Weekly Digest (Provider) | Cuma | Haftalık yeni iş özetleri | 🟡 P1 |
| Review Request | İş tamamlanma + 48h | Customer'dan review al | 🔴 P0 |
| NPS Survey | İlk işlem + 7 gün | NPS skoru topla | 🟢 P2 |

### 6.5 Referral Program Detayı

**Mevcut Altyapı:** `referral_codes` + `referral_redemptions` tabloları, otomatik kod üretimi (WM-XXXXXXXX format), Founding Pro'lara özel.

**Genişletme Önerisi:**
1. **Provider → Provider Referral:** Founding Pro'lar kendi kodlarıyla 10 provider davet edebilir (mevcut)
2. **Customer → Customer Referral:** Her müşteriye benzersiz referral kodu (yeni — migration gerekli)
3. **Customer → Provider Referral:** "Know a great tradesperson? Invite them" akışı

**İnsentif Yapısı (Varsayım):**

| Referral Tipi | Refer Eden | Davet Edilen | Tetikleyici |
|---------------|-----------|-------------|------------|
| Provider → Provider | 1 ay ücretsiz Pro | Founding Pro badge | İlk doğrulanmış iş |
| Customer → Customer | €10 kredi | €10 kredi | Davet edilenin ilk işlemi |
| Customer → Provider | €15 kredi | Priorite listing 1 hafta | Provider doğrulanınca |

> **Geliştiricilere Not:**
> - **Email lifecycle:** `lib/email/templates.ts`'e yeni template'ler ekleyin. Tetikleyiciler: funnel_events tablosu + Supabase edge function (cron).
> - **Abandoned job post:** `funnel_events` tablosunda `funnel_name='job_posting'` + `step_number < 3` + `created_at < now() - 24h` sorgusu.
> - **Customer referral:** Yeni migration (073) ile `customer_referral_codes` tablosu + profiles'a `referred_by` alanı.
> - **Review request email:** `jobs` tablosunda `status='completed'` + `completed_at < now() - 48h` + review yoksa tetikle.

---

## 7. İçerik Stratejisi ve 90 Günlük İçerik Takvimi

### 7.1 İçerik Stratejisi

**İçerik Sütunları:**
1. **Trust & Safety:** Doğrulama sürecini anlatan içerikler (güven inşası)
2. **Cost Guides:** İrlanda'da hizmet maliyeti rehberleri (SEO + dönüşüm)
3. **Provider Success:** Başarı hikayeleri + ipuçları (provider acquisition)
4. **How-To:** Pratik ev bakım rehberleri (organik trafik)
5. **Market Insights:** İrlanda hizmet pazarı verileri (PR + authority)

### 7.2 90 Günlük İçerik Takvimi

#### Ay 1 (Launch Ayı)

| Hafta | Funnel Stage | Persona | Format | Başlık | CTA | Kanal | KPI |
|-------|-------------|---------|--------|--------|-----|-------|-----|
| H1 | Awareness | Customer | Blog | "Why You Should Never Hire an Uninsured Tradesperson in Ireland" | Post a Job | SEO, Social | Pageviews, time on page |
| H1 | Awareness | Provider | Blog | "Bark vs WorkMate: The Real Cost of Getting Leads in Ireland" | Apply Free | SEO, LinkedIn | Pageviews, provider signups |
| H1 | Awareness | Both | Press Release | "WorkMate Launches: Ireland's First Compliance-Verified Marketplace" | Visit workmate.ie | PR, Email | Media coverage count |
| H2 | Consideration | Customer | Infographic | "What Does a Plumber Cost in Dublin? 2026 Price Guide" | Get Free Quotes | Social, SEO | Shares, job posts |
| H2 | Consideration | Provider | Video | "Meet Darren: How He Got 12 Jobs in His First Month" | Become a Pro | Social, YouTube | Views, signups |
| H2 | Activation | Customer | Email | "Welcome to WorkMate — Post Your First Job in 2 Minutes" | Post a Job | Email | Open rate, job posts |
| H3 | Consideration | Customer | Blog | "10 Questions to Ask Before Hiring a Painter in Ireland" | Compare Pros | SEO, Social | Pageviews, signups |
| H3 | Acquisition | Provider | Social Post | "100 Founding Pro spots left: [X] remaining" | Apply Now | LinkedIn, FB | Signups |
| H3 | Activation | Provider | Email | "Your verification is approved — here's your first step" | Browse Jobs | Email | Quote rate |
| H4 | Retention | Customer | Email | "Your quote is waiting — 3 pros responded" | View Quotes | Email | Quote accept rate |
| H4 | Consideration | Customer | Blog | "How Stripe Secure Payment Hold Protects You" | Learn More | SEO, Social | Pageviews, trust |
| H4 | Revenue | Provider | Email | "You've completed 3 jobs — unlock Pro features for €19/mo" | Upgrade | Email | Conversion rate |

#### Ay 2 (Growth Ayı)

| Hafta | Funnel Stage | Persona | Format | Başlık | CTA | Kanal | KPI |
|-------|-------------|---------|--------|--------|-----|-------|-----|
| H5 | Awareness | Customer | Blog | "Average Cost of Home Cleaning in Ireland: County-by-County Guide" | Find a Cleaner | SEO | Organic traffic |
| H5 | Awareness | Provider | LinkedIn Article | "5 Ways Irish Tradespeople Are Losing Money on Lead Platforms" | Join WorkMate | LinkedIn | Engagement, signups |
| H6 | Consideration | Customer | Video | "How WorkMate Works: 60-Second Explainer" | Post a Job | Social, YouTube | Views, signups |
| H6 | Retention | Provider | Blog | "How to Win More Quotes: 7 Tips from Top-Rated WorkMate Pros" | Log In | Email, Blog | Engagement |
| H7 | Awareness | Customer | Blog | "Planning Permission in Ireland: What You Need to Know Before Renovating" | Find a Builder | SEO | Organic traffic |
| H7 | Acquisition | Both | Social Campaign | "Customer of the Week / Pro of the Week" | Tag/Share | Social | Engagement, UGC |
| H8 | Consideration | Customer | Cost Guide | "Electrician Costs Ireland 2026: Emergency vs Planned Work" | Get Quotes | SEO | Pageviews, job posts |
| H8 | Revenue | Provider | Case Study | "How Grace Grew Her Cleaning Business 40% with WorkMate Pro" | Upgrade to Pro | Email, Blog | Pro upgrades |

#### Ay 3 (Optimization Ayı)

| Hafta | Funnel Stage | Persona | Format | Başlık | CTA | Kanal | KPI |
|-------|-------------|---------|--------|--------|-----|-------|-----|
| H9 | Awareness | Customer | Blog | "Hiring a Gardener in Ireland: Seasonal Guide (Spring Edition)" | Find a Gardener | SEO | Organic traffic |
| H9 | Acquisition | Provider | Webinar | "Tax Clearance & Insurance: A Tradesperson's Compliance Checklist" | Register | Email, LinkedIn | Registrations, signups |
| H10 | Retention | Customer | Email | "Jobs like yours got done 30% faster with verified pros" | Post Another Job | Email | Repeat booking rate |
| H10 | Referral | Provider | Social | "Refer a Tradesperson, Get 1 Month Free Pro" | Share Your Code | Social, Email | Referral signups |
| H11 | Awareness | Customer | Blog | "Best Home Renovation Companies in Cork: How to Choose" | Compare in Cork | SEO | Organic traffic |
| H11 | Revenue | Provider | Email | "Your monthly earning report + how Pro could boost it" | View Report | Email | Pro upgrade rate |
| H12 | Retention | Both | Newsletter | "WorkMate Monthly: Top providers, most popular services, pro tips" | Read More | Email | Open rate, engagement |
| H12 | Referral | Customer | Email | "Love WorkMate? Invite a friend, get €10 credit" | Share Link | Email | Referral conversions |

> **Geliştiricilere Not:**
> - Blog altyapısı: `app/[locale]/blog/` dizini + MDX veya headless CMS (önerilen: Notion API veya Contentful).
> - Cost guide verileri: `GET /api/categories/[categoryId]/price-estimate` mevcut API'den çekilebilir.
> - "Pro of the Week" otomasyonu: En yüksek rating + en çok tamamlanmış iş sorgusu ile otomatik seçim.

---

## 8. Bütçe Dağılımı

### 8.1 Üç Senaryo

**Varsayımlar:**
- LTV (Customer): €75 (ortalama 3 iş × €500 GMV × %5 fee = €75 — 12 ayda)
- LTV (Provider — Starter): €180 (ortalama 5 iş/ay × €300 × %3 × 12 ay)
- LTV (Provider — Pro): €828 (€19/ay × 12 + 5 iş/ay × €300 × %1.5 × 12)
- Payback hedefi: <3 ay

#### Senaryo 1: Minimum (Bootstrap) — €3,000/ay

| Kanal | Aylık Bütçe | Payı | Beklenen Çıktı |
|-------|-------------|------|----------------|
| Google Ads | €1,200 | %40 | ~80-120 customer lead (€10-15/lead) |
| Facebook/IG Ads | €800 | %27 | ~60-100 customer + 20 provider lead |
| Content/SEO | €500 | %17 | Blog yazım (freelancer), county pages |
| Email/Tools | €300 | %10 | Resend Pro, analytics tools |
| PR/Community | €200 | %6 | Boards.ie, local events |
| **Toplam** | **€3,000** | **100%** | **~200 leads/ay** |

**Beklenen CAC:** €15-20 | **Payback:** ~1.5 ay (customer), ~1 ay (provider)

#### Senaryo 2: Optimum (Seed-Funded) — €8,000/ay

| Kanal | Aylık Bütçe | Payı | Beklenen Çıktı |
|-------|-------------|------|----------------|
| Google Ads | €2,500 | %31 | ~200 customer lead |
| Facebook/IG Ads | €2,000 | %25 | ~150 customer + 50 provider lead |
| LinkedIn Ads | €800 | %10 | ~40 provider lead |
| Content/SEO | €1,200 | %15 | In-house content + freelancer |
| Email/CRM | €500 | %6 | Customer.io veya HubSpot |
| Video Production | €500 | %6 | Testimonial + explainer videos |
| PR/Events | €300 | %4 | Launch event, media outreach |
| Tools/Analytics | €200 | %3 | PostHog, GTM, attribution |
| **Toplam** | **€8,000** | **100%** | **~500 leads/ay** |

**Beklenen CAC:** €12-16 | **Payback:** ~1 ay (customer), <1 ay (provider)

#### Senaryo 3: Agresif (Series A) — €20,000/ay

| Kanal | Aylık Bütçe | Payı | Beklenen Çıktı |
|-------|-------------|------|----------------|
| Google Ads | €5,000 | %25 | ~400 customer lead |
| Facebook/IG Ads | €4,000 | %20 | ~300 customer + 100 provider lead |
| LinkedIn Ads | €2,000 | %10 | ~100 provider lead |
| Content Team | €3,000 | %15 | Full-time content manager |
| Video/Creative | €2,000 | %10 | Professional production |
| Influencer/Creator | €1,500 | %7.5 | İrlanda home/lifestyle influencer'lar |
| PR Agency | €1,500 | %7.5 | Retainer, Irish Times, RTE |
| CRM/Tools | €500 | %2.5 | Full stack (HubSpot + PostHog + GA4) |
| Events/Sponsorship | €500 | %2.5 | Trade shows, local community events |
| **Toplam** | **€20,000** | **100%** | **~1,200 leads/ay** |

**Beklenen CAC:** €10-15 | **Payback:** <1 ay

### 8.2 CAC / LTV Özet Tablosu

| Metrik | Customer | Provider (Starter) | Provider (Pro) |
|--------|----------|-------------------|---------------|
| Ortalama İşlem Değeri | €350 (varsayım) | - | - |
| Platform Geliri/İşlem | €17.50 (%5) | €10.50 (%3) | €5.25 (%1.5) + €19 sub |
| Yıllık İşlem Sayısı | 3 (varsayım) | 60 (5/ay) | 60 (5/ay) |
| LTV (12 ay) | €52.50 | €630 | €543 + €228 = €771 |
| Hedef CAC | <€15 | <€30 | <€50 |
| LTV:CAC Oranı | >3.5:1 | >21:1 | >15:1 |

> **Geliştiricilere Not:**
> - LTV/CAC tracking: Stripe'ta `metadata.acquisition_source` alanı ekleyerek attribution yapılabilir.
> - Her Stripe `payment_intent` oluşturulurken `metadata: { utm_source, utm_medium, utm_campaign }` bilgisi depolanmalı.
> - Attribution API endpoint'i: UTM parametreleri → `profiles.acquisition_source` alanı (yeni kolon gerekli).

---

## 9. Zaman Çizelgesi (Gantt-Style)

### 9.1 Pre-Launch → Launch → Post-Launch (6 Ay)

```
                        PRE-LAUNCH      LAUNCH        MONTH 2       MONTH 3       MONTH 4       MONTH 5       MONTH 6
Aktivite                 [-30 → 0]      [0 → 30]     [30 → 60]     [60 → 90]     [90 → 120]    [120 → 150]   [150 → 180]
═══════════════════════  ═══════════    ═══════════   ═══════════   ═══════════   ═══════════   ═══════════   ═══════════

ALTYAPI
County landing pages     [████████]     [███]
Blog altyapısı           [████████]     [███]
Analytics & attribution  [████████]     [███]
Email lifecycle setup    [████████]     [████████]

SUPPLY (Provider)
Founding Pro kampanyası  [████████████████████]
Trade association outreach[████████]    [████████]
Provider referral prog.                 [████████████████████████████████████████████████████████████████]
LinkedIn provider ads                   [████████████████████████████████████████████████████████████████]

DEMAND (Customer)
Waitlist / pre-reg       [████████████████████]
Google Ads                              [████████████████████████████████████████████████████████████████]
Facebook/IG Ads                         [████████████████████████████████████████████████████████████████]
SEO content (blog)       [███]          [████████████████████████████████████████████████████████████████]
Email nurturing                         [████████████████████████████████████████████████████████████████]

GROWTH
Referral program (cust.)                              [████████████████████████████████████████████████]
Retargeting campaigns                                 [████████████████████████████████████████████████]
PR / media outreach                     [████████]                  [████████]                  [████████]
Partnership expansion                                               [████████████████████████████████████]
Community building                                    [████████████████████████████████████████████████]

OPTIMIZATION
A/B testing (landing)                                 [████████████████████████████████████████████████]
Conversion rate opt.                                                [████████████████████████████████████]
CAC reduction sprints                                                             [████████████████████]
Expansion planning                                                                              [█████]
```

### 9.2 Milestone'lar

| Milestone | Tarih | Ölçüm | Hedef |
|-----------|-------|-------|-------|
| M1: Founding Pro Tamamlanma | Launch + 60 gün | `founding_pro_config.current_count` | 100 provider |
| M2: İlk 1000 İş İlanı | Launch + 90 gün | Toplam `jobs` count | 1000 kümülatif |
| M3: İlk €25K GMV | Launch + 90 gün | Stripe toplam | €25,000 |
| M4: Organik Trafik Kırılımı | Launch + 120 gün | GA4 | Organik > paid trafik |
| M5: Provider Upsell Başlangıcı | Launch + 90 gün | Pro + Pro+ subscriber sayısı | 30 paid subscriber |
| M6: CAC Hedefi | Launch + 150 gün | Blended CAC | <€12 |
| M7: 6 Aylık GMV | Launch + 180 gün | Stripe toplam | €50,000 |

> **Geliştiricilere Not:**
> - Milestone tracking: Admin analytics dashboard'a (`/dashboard/admin/analytics`) GMV ve provider growth widget'ları ekleyin.
> - `founding_pro_config` tablosundaki `current_count` zaten mevcut — admin panele "Founding Pro Progress" bar'ı ekleyin.

---

## 10. Teknik Entegrasyon ve Otomasyon Önerileri

### 10.1 Analytics Event Taxonomy

**Mevcut Yapı:** `funnel_events` tablosu (migration 061) + `trackFunnelStep()` fonksiyonu (`lib/analytics/funnel.ts`).

**Önerilen Genişletme — Tam Event Taxonomy:**

| Event Name | Tetikleyici | Payload | Takip Aracı |
|------------|------------|---------|-------------|
| `page_view` | Her sayfa yüklenmesi | `{ path, referrer, utm_source, utm_medium, utm_campaign }` | GA4 + PostHog |
| `job_posted` | İş ilanı oluşturulma | `{ job_id, category, county, budget_range, urgency }` | PostHog + Supabase |
| `quote_sent` | Provider teklif gönderme | `{ quote_id, job_id, provider_id, amount_cents }` | Supabase |
| `quote_accepted` | Müşteri teklif kabul | `{ quote_id, job_id, amount_cents, time_to_accept_hours }` | PostHog + Supabase |
| `payment_held` | Stripe escrow oluşturma | `{ payment_intent_id, amount_cents, job_id }` | Stripe + Supabase |
| `payment_released` | İş tamamlanma + ödeme | `{ payment_intent_id, amount_cents, job_id, satisfaction_score }` | Stripe + Supabase |
| `provider_signup` | Provider kayıt başlangıcı | `{ utm_source, utm_medium, referral_code }` | GA4 + PostHog |
| `provider_verified` | Admin doğrulama onayı | `{ provider_id, verification_time_hours }` | Supabase |
| `provider_upgrade` | Abonelik yükseltme | `{ provider_id, from_plan, to_plan, annual }` | Stripe + PostHog |
| `review_submitted` | Review yazılma | `{ review_id, job_id, rating, has_text }` | Supabase |
| `referral_shared` | Referral kodu paylaşma | `{ referral_code, channel }` | PostHog |
| `referral_redeemed` | Referral kodu kullanılma | `{ referral_code, redeemed_by }` | Supabase |
| `search_performed` | Marketplace arama | `{ query, county, category, results_count }` | PostHog |
| `cta_clicked` | CTA tıklama | `{ cta_id, page, variant }` | GA4 + PostHog |

### 10.2 Önerilen Analytics Stack

```
┌──────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                        │
│                                                           │
│  Client-Side          Server-Side          Webhook        │
│  ┌─────────┐         ┌──────────┐        ┌──────────┐   │
│  │ PostHog │         │ Supabase │        │ Stripe   │   │
│  │ JS SDK  │         │ funnel_  │        │ Webhooks │   │
│  │ + GA4   │         │ events   │        │          │   │
│  └────┬────┘         └─────┬────┘        └─────┬────┘   │
│       │                    │                    │         │
│  ┌────▼────────────────────▼────────────────────▼────┐   │
│  │              GTM Server-Side Container             │   │
│  └────┬─────────┬──────────┬──────────┬──────────┬───┘   │
│       │         │          │          │          │        │
│  ┌────▼───┐ ┌──▼────┐ ┌───▼───┐ ┌───▼────┐ ┌──▼────┐  │
│  │  GA4   │ │PostHog│ │Meta   │ │Google  │ │ CRM   │  │
│  │        │ │       │ │CAPI   │ │Ads API │ │       │  │
│  └────────┘ └───────┘ └───────┘ └────────┘ └───────┘  │
└──────────────────────────────────────────────────────────┘
```

| Araç | Amaç | Maliyet | Entegrasyon |
|------|------|---------|-------------|
| **GA4** | Genel web analytics, attribution | Ücretsiz | GTM + `next/script` |
| **PostHog** | Product analytics, funnel, cohort | Ücretsiz (1M event/ay) | JS SDK + API |
| **GTM (Server-Side)** | Tag management, CAPI | ~€30/ay (Cloud Run) | Next.js middleware |
| **Meta CAPI** | Facebook conversion attribution | Ücretsiz (GTM üzerinden) | Server-side GTM |
| **Google Ads CAPI** | Google conversion attribution | Ücretsiz (GTM üzerinden) | Server-side GTM |
| **Customer.io** | Lifecycle email + push | €150/ay (startup plan) | REST API + webhooks |
| **Hotjar** | Heatmaps, session recordings | Ücretsiz (basic) | JS snippet |

### 10.3 Mevcut Yapıya Uyum

| Mevcut Altyapı | Pazarlama Entegrasyonu |
|----------------|----------------------|
| `funnel_events` tablosu | PostHog'a mirror → funnel visualization |
| `lib/analytics/funnel.ts` | PostHog `posthog.capture()` çağrısı ekleyin |
| Stripe webhooks (`app/api/webhooks/stripe/`) | `payment_intent.succeeded` → GA4 purchase event |
| Resend email (`lib/email/send.ts`) | Email open/click tracking → PostHog |
| `notifications` tablosu | In-app re-engagement trigger'ları |
| `referral_codes` / `referral_redemptions` | Referral attribution → PostHog |
| Supabase Auth | Signup source tracking (`raw_user_meta_data.utm_*`) |

### 10.4 Teknik Uygulama Öncelikleri

#### P0 — Launch İçin Gerekli
```typescript
// 1. PostHog entegrasyonu (app/layout.tsx)
// Dosya: marketplace/lib/analytics/posthog.ts
import posthog from 'posthog-js'
posthog.init('phc_XXXXX', { api_host: 'https://eu.posthog.com' }) // EU hosting (GDPR)

// 2. UTM parametrelerini yakalama (middleware veya layout)
// Dosya: marketplace/lib/analytics/utm.ts
export function captureUTM(searchParams: URLSearchParams) {
  const utm = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
  }
  sessionStorage.setItem('wm_utm', JSON.stringify(utm))
  return utm
}

// 3. Stripe metadata'ya UTM ekleme
// Dosya: app/api/payments/create-intent/route.ts
const paymentIntent = await stripe.paymentIntents.create({
  metadata: {
    job_id,
    utm_source: utm?.utm_source || 'direct',
    utm_campaign: utm?.utm_campaign || '',
  }
})

// 4. GA4 purchase event (Stripe webhook handler'da)
// Dosya: app/api/webhooks/stripe/route.ts → payment_intent.succeeded handler
// Server-side GA4 Measurement Protocol call
```

#### P1 — Launch + 30 Gün
```typescript
// 5. Meta Conversion API (server-side)
// Dosya: marketplace/lib/analytics/meta-capi.ts
export async function trackMetaConversion(event: string, userData: object, customData: object) {
  await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events`, {
    method: 'POST',
    body: JSON.stringify({
      data: [{ event_name: event, user_data: userData, custom_data: customData }],
      access_token: META_CAPI_TOKEN
    })
  })
}

// 6. A/B test altyapısı (PostHog Feature Flags)
// Mevcut feature_flags tablosu (migration 057) + PostHog FF sync
```

### 10.5 Landing Page ve A/B Test Önerileri

| Test | Varyant A (Control) | Varyant B | Metrik | Araç |
|------|--------------------|-----------|----|------|
| Hero CTA | "Post a Job — Free" | "Get Free Quotes in Hours" | Job post conversion | PostHog |
| Hero Tagline | "Find your perfect pro." | "Verified pros. Secure payments." | Bounce rate | PostHog |
| Pricing Page | Current layout | Provider savings calculator | Provider signup rate | PostHog |
| Trust Badges | 4 badges | 4 badges + "As seen in Irish Times" | Signup rate | PostHog |
| Provider CTA | "Apply Free Today" | "Join 100 Founding Pros" | Provider applications | PostHog |

> **Geliştiricilere Not:**
> - **PostHog:** EU hosting seçin (GDPR uyumu). `posthog-js` + `posthog-node` paketleri. Client-side: `app/layout.tsx`'e provider component. Server-side: API route'larda `posthog-node`.
> - **GA4:** `next/script` ile `gtag.js` yükleyin. `window.gtag('event', ...)` wrapper'ı oluşturun.
> - **GTM Server-Side:** Google Cloud Run üzerinde. Next.js `middleware.ts`'ten first-party cookie set edin.
> - **Meta CAPI:** GTM server container veya doğrudan `fetch()` ile. `user_data` alanında hashed email gönderin (SHA-256).
> - **Customer.io:** Mevcut Resend yerine geçmez — lifecycle automation (drip campaigns, segmentation) için ek katman.
> - **A/B test:** PostHog Feature Flags kullanın — mevcut `feature_flags` tablosu (migration 057) ile senkronize edilebilir.
> - **Cookie consent:** GDPR gereği analytics cookie'ler için consent banner gerekli (cookiebot.com veya custom).

---

## 11. KPI'lar ve Ölçüm Sistemi

### 11.1 North Star Metric

**"Tamamlanmış ve ödenen iş sayısı / ay"** (Completed & Paid Jobs per Month)

Bu metrik hem supply (provider) hem demand (customer) tarafının sağlıklı çalıştığını, güvenin oluştuğunu ve gelirin aktığını tek bir rakamda özetler.

### 11.2 Pirate Metrics (AARRR) Dashboard

| Metrik | Tanım | Ölçüm | Hedef (6 ay) |
|--------|-------|-------|-------------|
| **Acquisition** | Yeni kullanıcı kaydı/ay | `profiles` created_at count | 500 customer + 50 provider/ay |
| **Activation** | İlk anlamlı aksiyon | Customer: ilk job post / Provider: ilk quote | %40 (customer), %60 (provider) |
| **Retention** | 30 gün sonra tekrar kullanım | Customer: 2. job post / Provider: 2. quote ay | %25 (customer), %50 (provider) |
| **Revenue** | ARPU (Average Revenue Per User) | Toplam gelir / aktif kullanıcı | Customer: €5/ay, Provider: €15/ay |
| **Referral** | Referral ile gelen kullanıcı oranı | `referral_redemptions` count / total signups | %10 |

### 11.3 Marketplace Denge Metrikleri

| Metrik | Formül | Sağlıklı Aralık | Alarm |
|--------|--------|-----------------|-------|
| Liquidity Rate | İş ilanlarının quote alan oranı | >70% | <50% |
| Provider Utilization | Aktif provider'ların iş alan oranı/ay | >40% | <20% |
| Time-to-First-Quote | İş ilanı → ilk quote süresi | <4 saat | >24 saat |
| Quote-to-Accept Ratio | Kabul edilen quote / toplam quote | >25% | <15% |
| Supply-Demand Ratio | Aktif provider / açık iş (county bazlı) | 1:3 - 1:8 | >1:15 veya <1:2 |
| Take Rate | Platform geliri / GMV | %7-8 | <%5 (sürdürülemez) |
| Dispute Rate | Dispute / tamamlanmış iş | <%3 | >%5 |
| Churn Rate (Provider) | İptal eden provider / aktif provider | <%5/ay | >%10/ay |

### 11.4 Dashboard Önerisi

```
┌─────────────────────────────────────────────────────┐
│                WORKMATE GROWTH DASHBOARD              │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │ GMV      │ │ Jobs     │ │ Providers│ │ Take    ││
│  │ €12,450  │ │ 156 (/mo)│ │ 87 active│ │ Rate    ││
│  │ ▲ 23%    │ │ ▲ 15%    │ │ ▲ 8%     │ │ 7.2%    ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                       │
│  ACQUISITION        ACTIVATION       RETENTION        │
│  ┌─────────────┐   ┌─────────────┐  ┌─────────────┐ │
│  │ New Users   │   │ First Action│  │ 30-Day      │ │
│  │ 342 (/mo)   │   │ 41% rate    │  │ 28% return  │ │
│  │ CAC: €13    │   │             │  │             │ │
│  └─────────────┘   └─────────────┘  └─────────────┘ │
│                                                       │
│  MARKETPLACE HEALTH                                   │
│  ┌─────────────┐   ┌─────────────┐  ┌─────────────┐ │
│  │ Liquidity   │   │ Avg Quote   │  │ Dispute     │ │
│  │ 72%         │   │ Time: 3.2h  │  │ Rate: 1.8%  │ │
│  └─────────────┘   └─────────────┘  └─────────────┘ │
│                                                       │
│  COUNTY HEATMAP                                       │
│  Dublin: ████████████ 45%                             │
│  Cork:   ██████ 18%                                   │
│  Galway: ████ 12%                                     │
│  Others: ████████ 25%                                 │
└─────────────────────────────────────────────────────┘
```

> **Geliştiricilere Not:**
> - Growth dashboard: Mevcut admin analytics panelini (`/dashboard/admin/analytics`) genişletin.
> - County heatmap: `jobs` tablosunda `county` alanı + `ireland-locations.ts` verisi ile.
> - Liquidity rate: `jobs` tablosunda `status='open'` ve en az 1 quote'u olanlar / toplam open jobs.
> - Time-to-first-quote: `quotes.created_at - jobs.created_at` ortalaması (yeni SQL view).
> - Take rate: Stripe `payment_intent.succeeded` toplam × fee oranı / GMV.
> - Tüm metrikler için yeni API endpoint: `GET /api/admin/growth-metrics` (admin-only, cached 5 min).

---

## 12. Riskler, Mitigasyon Planları ve Contingency

| # | Risk | Olasılık | Etki | Mitigasyon | Contingency |
|---|------|----------|------|-----------|-------------|
| R1 | **Supply-Demand Dengesizliği** — Provider yetersizliği, müşteriler quote alamıyor | Yüksek | Kritik | Founding Pro kampanyası ile 100 provider garantile; county bazlı supply monitoring; provider onboarding süresini <24h tut | Belirli county'lerde "coming soon" göster; guest-job akışını aktifleştir (email ile bekleme listesi) |
| R2 | **Doğrulama Gecikmeleri** — Admin review 24h'i aşıyor, provider frustration | Orta | Yüksek | Admin queue dashboard mevcut; SLA alarm ekle; yarı-otomatik doğrulama (ID API) | Geçici "pending" statüsünde sınırlı quote hakkı (2 quote) |
| R3 | **CAC Artışı** — Paid kanallar pahalılaşıyor | Orta | Orta | SEO + content marketing → organik kanal büyütme; referral program optimize | Paid budget'ı %30 azalt, organik + partnership'e kaydır |
| R4 | **Provider Churn** — Düşük iş hacmi → provider platformu terk ediyor | Orta | Yüksek | Provider weekly digest (yeni işler); Pro upsell (priority listing); ilk 5 iş garanti kampanyası | Churn riski yüksek provider'lara 1 ay ücretsiz Pro teklif et |
| R5 | **Fraud / Dispute** — Sahte provider veya müşteri | Düşük | Kritik | Garda vetting, ID doğrulama, risk_score sistemi (mevcut migration 054); dispute rate <%3 hedef | Stripe dispute yönetimi + otomatik provider risk flagging |
| R6 | **Düzenleyici Risk** — P2B regülasyonu, GDPR cezası | Düşük | Kritik | GDPR akışları ürüne entegre (mevcut); P2B uyumlu şeffaf sıralama; veri saklama politikası | Hukuk danışmanlığı; privacy impact assessment |
| R7 | **Tek County Bağımlılığı** — Dublin'de tıkanma, diğer county'ler boş | Yüksek | Orta | County bazlı kampanyalar; Cork + Galway erken odak; yerel partnership'ler | Dublin'i ana pazar olarak daralt, diğerlerini "waitlist" yap |
| R8 | **Negatif Review Cascade** — İlk kötü deneyimler platformun itibarını zedeler | Düşük | Yüksek | Happiness Pledge (7 gün); hızlı dispute çözümü; provider kalite eşiği | Proaktif müşteri takibi; kötü review'lara 24h içinde yanıt |

> **Geliştiricilere Not:**
> - **R1 monitoring:** County bazlı `supply_demand_ratio` widget'ı admin dashboard'a ekleyin. Alert: ratio <1:10 olduğunda admin'e notification.
> - **R2 SLA:** `admin_audit_logs` tablosunda doğrulama süresini izleyin. >24h olduğunda admin email tetikleyin.
> - **R4 churn prediction:** `provider_subscriptions.status` + `quotes` sayısı + `jobs completed` sayısı ile basit churn skoru.
> - **R5 fraud:** Mevcut `risk_score` + `risk_flags` alanları (migration 054) kullanılabilir. Otomatik flag: aynı IP'den 3+ kayıt.

---

## 13. Hızlı Kazanım (Quick Wins) ve İlk 30 Gün Aksiyon Listesi

| # | Aksiyon | Owner | Effort | Etki | Bağımlılık | Detay |
|---|---------|-------|--------|------|-----------|-------|
| 1 | **robots.txt production URL güncelleme** | Dev | S | Yüksek | Domain kararı | `marketplace/public/robots.txt` → `https://workmate.ie/sitemap.xml` |
| 2 | **26 County landing page'ler oluşturma** | Dev | M | Çok Yüksek | `ireland-locations.ts` mevcut | `app/[locale]/services/[county]/page.tsx` — dinamik, her county için SEO-optimize sayfa |
| 3 | **PostHog entegrasyonu** | Dev | S | Yüksek | PostHog hesap açma | `posthog-js` paketi + layout.tsx provider + EU hosting |
| 4 | **GA4 kurulumu + GTM** | Dev | S | Yüksek | GA4 hesap | `next/script` ile gtag.js + temel event tracking |
| 5 | **Welcome email serisi (3 email)** | Dev + Content | M | Yüksek | Resend mevcut | `lib/email/templates.ts`'e 3 yeni template: welcome, activation tip, first job nudge |
| 6 | **Abandoned job post recovery email** | Dev | M | Yüksek | funnel_events mevcut | `funnel_events` sorgusu (step <3, 24h ago) → otomatik email |
| 7 | **Review request email (48h post-completion)** | Dev | S | Orta | Email template mevcut | `jobs.status='completed'` + `completed_at` trigger |
| 8 | **Provider referral code dashboard widget** | Dev | S | Orta | referral_codes mevcut | Provider dashboard'a "Your Referral Code: WM-XXXXXXXX" kartı |
| 9 | **UTM parameter capture** | Dev | S | Yüksek | Yok | Middleware'de UTM → sessionStorage + Supabase auth metadata |
| 10 | **Founding Pro countdown banner** | Dev | S | Orta | founding_pro_config mevcut | Homepage + become-provider: "[X] of 100 spots remaining" |
| 11 | **Sitemap'e county + kategori sayfaları ekleme** | Dev | S | Yüksek | #2 tamamlanınca | `app/sitemap.ts` güncelleme |
| 12 | **Cookie consent banner** | Dev | M | Yüksek (GDPR) | Yok | GDPR uyumu için analytics cookie consent (cookiebot veya custom) |
| 13 | **Cost guide blog yazıları (ilk 5)** | Content | M | Orta | Blog altyapısı | Top 5 kategori için İrlanda fiyat rehberi |
| 14 | **Meta Pixel + CAPI setup** | Dev | M | Yüksek | Meta Business hesap | Client pixel + server-side conversion tracking |
| 15 | **Google Ads conversion tracking** | Dev | S | Yüksek | Google Ads hesap | `job_posted` + `quote_accepted` + `payment_released` event'leri |
| 16 | **Provider weekly digest email** | Dev | M | Orta | Email template | Cuma: son 7 gündeki yeni iş ilanları özeti (county + kategori bazlı) |
| 17 | **Admin growth metrics endpoint** | Dev | M | Orta | Yok | `GET /api/admin/growth-metrics` — GMV, user count, liquidity, churn |
| 18 | **OG image county varyantları** | Dev | S | Orta | #2 tamamlanınca | `app/og/route.tsx`'e county parametresi |
| 19 | **Stripe metadata'ya UTM ekleme** | Dev | S | Yüksek | #9 tamamlanınca | payment_intent.create → metadata.utm_source |
| 20 | **Social media profilleri oluşturma** | Marketing | S | Orta | Brand assets | Facebook, Instagram, LinkedIn, X iş profilleri |

### İlk 30 Gün Öncelik Sırası

**Hafta 1 (Launch öncesi — altyapı):**
- #1 robots.txt düzeltme (5 dk)
- #3 PostHog entegrasyonu (2-3 saat)
- #4 GA4 + GTM kurulumu (2-3 saat)
- #9 UTM capture (1-2 saat)
- #12 Cookie consent banner (4-6 saat)
- #20 Social media profilleri (1-2 saat)

**Hafta 2 (Launch — acquisition):**
- #2 County landing page'ler (1-2 gün)
- #11 Sitemap güncelleme (30 dk)
- #14 Meta Pixel + CAPI (4-6 saat)
- #15 Google Ads conversion tracking (2-3 saat)
- #10 Founding Pro countdown banner (2-3 saat)
- #18 OG image varyantları (1-2 saat)

**Hafta 3 (Launch — engagement):**
- #5 Welcome email serisi (4-6 saat)
- #7 Review request email (2-3 saat)
- #8 Referral code widget (2-3 saat)
- #19 Stripe UTM metadata (1-2 saat)

**Hafta 4 (Growth — retention):**
- #6 Abandoned job recovery email (4-6 saat)
- #16 Provider weekly digest (4-6 saat)
- #17 Admin growth metrics (4-6 saat)
- #13 Cost guide blog yazıları başlangıcı

> **Geliştiricilere Not:**
> - Her madde mevcut mimari üzerine inşa edilir — yeni framework veya major refactor gerekmez.
> - Email template'ler: Mevcut `lib/email/templates.ts` pattern'ini takip edin (HTML table layout, inline styles, WM tokens).
> - County pages: `lib/ireland-locations.ts` + `lib/service-taxonomy.ts` verilerini kullanın — API call gerekmez.
> - PostHog EU hosting: GDPR uyumu için `eu.posthog.com` kullanın, `api_host` parametresini ayarlayın.

---

## Bu Raporu Uygulamak İçin Geliştiricilerden İstediğim İlk 3 Şey

### 1. Analytics Altyapısını Kurun (Gün 1-3)
PostHog (EU hosting) + GA4 + UTM capture'ı entegre edin. Mevcut `funnel_events` tablosu ve `trackFunnelStep()` fonksiyonu zaten var — bunları PostHog'a da mirror edin. Cookie consent banner'ı GDPR uyumlu şekilde ekleyin. Bu olmadan hiçbir pazarlama kanalının ROI'si ölçülemez.

**Dosyalar:**
- Yeni: `marketplace/lib/analytics/posthog.ts` (PostHog client init)
- Yeni: `marketplace/components/analytics/PostHogProvider.tsx` (React context)
- Yeni: `marketplace/lib/analytics/utm.ts` (UTM capture utility)
- Yeni: `marketplace/components/common/CookieConsent.tsx` (GDPR banner)
- Güncelle: `marketplace/app/[locale]/layout.tsx` (PostHog + GA4 script injection)
- Güncelle: `marketplace/lib/analytics/funnel.ts` (PostHog mirror ekleme)

### 2. 26 County Landing Page'leri Oluşturun (Gün 4-7)
SEO'nun temel taşı olan county × kategori landing page'lerini dinamik olarak oluşturun. Tüm veri zaten mevcut (`ireland-locations.ts` + `service-taxonomy.ts`). Her sayfada county-specific H1, JSON-LD Service schema, dinamik OG image ve sitemap entegrasyonu olmalı.

**Dosyalar:**
- Yeni: `marketplace/app/[locale]/services/[county]/page.tsx` (dinamik county page)
- Yeni: `marketplace/app/[locale]/services/[county]/[category]/page.tsx` (county + kategori page)
- Güncelle: `marketplace/app/sitemap.ts` (county + kategori URL'leri ekleme)
- Güncelle: `marketplace/app/og/route.tsx` (county parametresi desteği)
- Güncelle: `marketplace/components/seo/JsonLd.tsx` (Service + AreaServed schema)
- Güncelle: `marketplace/public/robots.txt` (production URL)

### 3. Lifecycle Email Serisini Kurun (Gün 8-14)
Welcome email (customer + provider ayrı), abandoned job post recovery (24h), ve review request (48h post-completion) email'lerini oluşturun. Mevcut Resend altyapısı ve template pattern'i (`lib/email/templates.ts`) aynen kullanılabilir. Tetikleyiciler için Supabase Edge Function (cron) veya API route-level trigger kullanın.

**Dosyalar:**
- Güncelle: `marketplace/lib/email/templates.ts` (5 yeni template: welcome customer, welcome provider, abandoned job, review request, provider weekly digest)
- Yeni: `marketplace/app/api/cron/abandoned-jobs/route.ts` (24h abandoned job query + email trigger)
- Yeni: `marketplace/app/api/cron/review-requests/route.ts` (48h post-completion query + email trigger)
- Güncelle: `marketplace/app/api/auth/register/route.ts` (welcome email tetikleme)

---

*Bu rapor WorkMate'in mevcut kod tabanı, veritabanı şeması, API yapısı ve iş modeli analiz edilerek hazırlanmıştır. Tüm teknik öneriler mevcut mimari üzerine inşa edilmiştir ve sıfırdan yeni altyapı gerektirmez. Varsayımlar açıkça etiketlenmiştir.*
