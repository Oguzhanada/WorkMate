# WorkMate — Satış ve Müşteri Başarısı / Destek Strateji ve Teknik Entegrasyon Raporu

**Hazırlayan:** Sales & Customer Success Director (14+ yıl B2C/B2B startup deneyimi)
**Tarih:** 10 Mart 2026
**Ürün:** WorkMate — İrlanda odaklı hizmet marketplace'i
**Durum:** MVP / Pre-production, launch hazırlığı
**Ekip:** Tek kurucu + küçük teknik ekip

---

## 1. Genel Satış ve Müşteri Başarısı Vizyonu

### Stratejik Çerçeve

WorkMate iki taraflı bir marketplace olarak **arz (provider) tarafını önce doldurmalı**, ardından talep (customer) tarafını çekmelidir. İlk 6 ayda odak:

| Öncelik | Hedef | Metrik |
|---------|-------|--------|
| 1 | Provider arzını oluştur | 100 verified provider (Founding Pro programı) |
| 2 | İlk müşteri deneyimini mükemmelleştir | Time-to-first-quote < 4 saat |
| 3 | Tekrar kullanımı tetikle | Repeat booking rate > 25% |
| 4 | Organik büyümeyi başlat | Referral acquisition > 15% |

**Marketplace Flywheel:**
```
Daha fazla Provider → Daha hızlı quote → Daha iyi müşteri deneyimi
     ↑                                           ↓
Daha fazla gelir  ←  Daha fazla iş  ←  Daha fazla müşteri
```

### Satış + CS Entegrasyonu

Küçük ekipte Sales ve CS **aynı kişi/sistem** tarafından yönetilmeli. Ayrı departman kurmak erken aşamada kaynak israfı.

**Tek kişi modeli:**
- **Hafta içi sabah (2 saat):** Provider outreach + onboarding desteği
- **Gün içi (pasif):** Otomasyon + self-service ile müşteri desteği
- **Hafta sonu:** Sadece kritik ticket'lar (otomasyon ile filtrelenmiş)

> **Geliştiricilere Direkt Not:**
> Mevcut altyapınız zaten güçlü: funnel analytics (`lib/analytics/funnel.ts`), 11 email template, in-app notification sistemi, automation rules engine (`lib/automation/engine.ts`). Eksik olan **CRM event sync** ve **live chat widget** entegrasyonu. Bu rapor bu iki boşluğu kapatacak.

> **Tek Kişi / Küçük Ekip İpucu:**
> İlk 90 gün boyunca CRM olarak **Notion database** veya **HubSpot Free** kullanın. Supabase'den event push'u custom webhook ile yapın. Pahalı CRM'e geçiş ancak MRR > €5K sonrası değerlendirilmeli.

> **Araç Entegrasyonu:**
> Mevcut `automation_rules` tablosu (trigger_event + conditions + action) zaten basit bir CRM workflow engine. Bunu genişleterek ilk CRM ihtiyaçlarınızı karşılayabilirsiniz.

### ✅ Checklist — Vizyon
- [ ] Founding Pro programını launch öncesi aktifleştir (100 slot — migration 071 ✅ applied)
- [ ] Referral kodlarını test et (migration 072 ✅ applied)
- [ ] Provider outreach listesi hazırla (İrlanda'daki hizmet sağlayıcı grupları)
- [ ] İlk 30 gün Sales + CS tek kişi operasyon planını oluştur

---

## 2. Satış Modeli ve Süreçleri

### 2.1 Monetization Modeli (Mevcut — Kodda Tanımlı)

**Provider Abonelik Katmanları** (`marketplace/app/[locale]/pricing/page.tsx`):

| Plan | Aylık | Yıllık | Komisyon | Öne Çıkan |
|------|-------|--------|----------|-----------|
| **Starter** | Ücretsiz | — | 3% (€100+ işler) | 5 quote/ay, temel profil |
| **WorkMate Pro** | €19 | €179 (€49 tasarruf) | 1.5% | Sınırsız quote, verified badge, öncelikli arama |
| **WorkMate Pro+** | €39 | €349 (€119 tasarruf) | 1.5% | AI quote writer, Top Pro badge, 2x görünürlük |

**Müşteri Tarafı Ücretlendirme** (`marketplace/lib/pricing/fee-calculator.ts`):

| İş Tutarı | Servis Ücreti | Tekrar Rezervasyon |
|-----------|--------------|-------------------|
| < €100 | %0 (direkt ödeme) | %0 |
| ≥ €100 | %5 | %3 (loyal indirim) |

**Varsayım:** Mevcut fiyatlandırma İrlanda pazarı için rekabetçi (TaskRabbit %15, Bark €2-15/lead, MyBuilder %8-12).

### 2.2 Launch Öncesi Satış Stratejisi (Provider Arzı)

**Outbound — İlk 100 Provider:**

| Kanal | Aksiyon | Hedef/Hafta | Maliyet |
|-------|---------|-------------|---------|
| LinkedIn | İrlanda'daki tradesperson, cleaner, handyman gruplarına DM | 50 DM | €0 |
| Facebook Groups | "Tradespeople Ireland", "Handyman Services Dublin" vb. | 3 post/hafta | €0 |
| Google My Business | Düşük rating'li (3-4⭐) provider'lara "daha fazla iş al" mesajı | 20/hafta | €0 |
| WhatsApp Business | Onboarding tamamlamayanlara follow-up | Günlük | €0 |
| Founding Pro Landing | `/founding-pro` sayfası — 100 slot, FOMO | Sürekli | €0 |

**Inbound — Launch Sonrası:**

| Kanal | Aksiyon | Beklenti |
|-------|---------|----------|
| SEO | County + service sayfaları (örn: "plumber dublin") | 3-6 ay sonra organik trafik |
| Referral | WM-XXXXXX kodu ile provider-to-provider | %15 yeni provider |
| Content | Blog + sosyal medya "provider success stories" | Güven oluşturma |
| Partnerships | İrlanda ticaret odaları, yerel iş birlikleri | Toplu onboarding |

### 2.3 Launch Öncesi Satış Süreci (Funnel)

```
LinkedIn/FB outreach → Founding Pro sayfası → Apply form (4 adım)
     ↓                      ↓                       ↓
  İlgi çek            FOMO + değer teklifi    Onboarding funnel
                                                    ↓
                                            Verification → First quote
                                                    ↓
                                            Aktivasyon ✅
```

> **Geliştiricilere Direkt Not:**
> Provider onboarding funnel'ı zaten 6 adımda izleniyor (`become-provider/apply/page.tsx`). Eksik olan: **hangi adımda neden terk ediliyor** bilgisi. `funnel_events` tablosuna `abandon_reason` metadata ekleyin. Ayrıca outbound kampanya kaynağını izlemek için `utm_source` parametresini onboarding formuna ekleyin:

```typescript
// marketplace/lib/analytics/funnel.ts — trackFunnelStep() içine eklenecek
metadata: {
  ...existingMetadata,
  utm_source: new URLSearchParams(window.location.search).get('utm_source'),
  utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
}
```

> **Tek Kişi / Küçük Ekip İpucu:**
> İlk ay sadece LinkedIn + Founding Pro sayfası üzerine yoğunlaşın. Spreadsheet'te 100 potansiyel provider listesi tutun. Haftada 50 DM gönderin, %5-10 dönüşüm bekleyin = haftada 3-5 yeni başvuru.

> **Araç Entegrasyonu:**
> - LinkedIn Sales Navigator (ücretsiz deneme 1 ay)
> - WhatsApp Business (ücretsiz)
> - Google Sheets → provider tracking
> - Mevcut `/api/admin/stats` endpoint'i ile haftalık provider sayısını izleyin

### ✅ Checklist — Satış Modeli
- [ ] Pricing page'i production URL'de test et
- [ ] Stripe'da 3 ürün + 4 fiyat (aylık/yıllık Pro, aylık/yıllık Pro+) oluştur
- [ ] Fee calculator'ı edge case'lerle test et (€99, €100, €101, repeat booking)
- [ ] LinkedIn outreach mesaj template'lerini hazırla (EN)
- [ ] Founding Pro sayfasını sosyal medya paylaşımına hazırla (OG image ✅ mevcut)
- [ ] UTM parametrelerini onboarding formuna ekle
- [ ] İlk 50 hedef provider listesini oluştur

---

## 3. Müşteri Yolculuğu (Customer Journey) ve Onboarding

### 3.1 Customer Journey — İş Veren (Müşteri)

```
Keşif → Kayıt → İlk iş ilanı → Quote alma → Quote kabul → Ödeme → Tamamlanma → Review → Tekrar
 (1)     (2)       (3)           (4)          (5)          (6)        (7)         (8)     (9)
```

| Adım | Kritik Metrik | Hedef | Mevcut İzleme |
|------|--------------|-------|---------------|
| 1→2 | Visitor-to-signup | >5% | GA4/PostHog (henüz yok) |
| 2→3 | Time-to-first-job | <10 dk | Funnel: job_posting_started |
| 3→4 | Time-to-first-quote | <4 saat | `api/metrics/quotes` — first_quote_median_minutes |
| 4→5 | Quote-to-accept rate | >30% | Hesaplanabilir (quotes vs accepted_quotes) |
| 5→6 | Accept-to-payment | >90% | Stripe webhook tracking |
| 7→8 | Completion-to-review | >40% | Hesaplanabilir |
| 8→9 | Repeat booking rate | >25% | `customer_provider_history` tablosu |

**İlk Değer Anı (Aha Moment):** Müşteri ilk quote'u aldığında. Bu an < 4 saat olmalı.

**Müdahale Noktaları:**
- 📧 İş ilanı sonrası 2 saat: "İlanınız X provider'a gösterildi" (güven)
- 📧 İlk quote gelince: Push notification + email (hız)
- 📧 Quote kabul sonrası 24 saat: Ödeme hatırlatma
- 📧 İş tamamlanma sonrası: Review isteği + referral kodu teklifi

### 3.2 Provider Journey — Hizmet Sağlayıcı

```
Keşif → Başvuru (4 adım) → Doğrulama → İlk quote → İlk iş → İlk ödeme → Büyüme
 (1)        (2)              (3)          (4)         (5)        (6)         (7)
```

| Adım | Kritik Metrik | Hedef | Mevcut İzleme |
|------|--------------|-------|---------------|
| 1→2 | Landing-to-apply | >15% | Funnel: onboarding_started |
| 2 | Form completion rate | >60% | Funnel: 6 step tracking |
| 2→3 | Apply-to-verified | <48 saat | Admin verification queue |
| 3→4 | Verified-to-first-quote | <7 gün | Hesaplanabilir |
| 4→5 | Quote-to-first-win | <14 gün | Mevcut (first_quote celebration email) |
| 5→6 | Job-to-payout | 2-3 iş günü | Stripe Connect SEPA |
| 7 | Monthly active quoting | >50% | Hesaplanabilir |

**İlk Değer Anı:** Provider'ın ilk quote'unun kabul edilmesi ve ilk ödemeyi alması.

**Müdahale Noktaları:**
- 📧 Başvuru tamamlanınca: "Başvurunuz alındı, X saat içinde değerlendireceğiz"
- 📧 Doğrulama sonrası: "Tebrikler! Profilinizi tamamlayın" + completeness widget
- 📧 7 gün quote göndermezse: "İlk iş fırsatlarınız sizi bekliyor" (job alert)
- 📧 İlk ödeme sonrası: "Harika! İşte daha fazla iş almanın yolları" (upsell Pro)

> **Geliştiricilere Direkt Not:**
> Mevcut altyapı journey tracking için güçlü. Eksik parçalar:
> 1. **Customer-side funnel tracking yok** — sadece provider onboarding, job posting ve booking izleniyor. Signup → first job arası izlenmiyor.
> 2. **Automated lifecycle emails eksik** — 11 template var ama "nudge" email'leri (inaktif kullanıcı, terk edilmiş form, upsell) yok.
> 3. **Quote-to-accept rate** hesaplaması için query gerekiyor.
>
> Yeni automation rule önerisi (`automation_rules` tablosuna):
> ```json
> {
>   "trigger_event": "provider_verified",
>   "conditions": { "days_since_first_quote": "7", "total_quotes_sent": "0" },
>   "action_type": "send_notification",
>   "action_config": {
>     "template": "inactive_provider_nudge",
>     "channel": "email"
>   }
> }
> ```

> **Tek Kişi / Küçük Ekip İpucu:**
> İlk aşamada automated email sequence (Resend + cron) yeterli. Kişisel WhatsApp follow-up sadece ilk 100 provider ve ilk 50 customer için yapın.

> **Araç Entegrasyonu:**
> - Mevcut `sendTransactionalEmail()` + `sendNotification()` — lifecycle email'ler için kullanın
> - Resend ile drip campaign: `marketplace/lib/email/send.ts` üzerine scheduled send özelliği
> - PostHog (ücretsiz, 1M event/ay) → customer-side funnel tracking

### ✅ Checklist — Journey & Onboarding
- [ ] Customer signup → first job arası funnel tracking ekle
- [ ] "İnaktif provider" nudge email template'i oluştur
- [ ] "İnaktif customer" nudge email template'i oluştur
- [ ] Quote-to-accept rate SQL query'sini admin dashboard'a ekle
- [ ] PostHog veya GA4 client-side tracking entegrasyonu planla
- [ ] Provider onboarding formunda adım bazlı terk nedeni metadata'sı ekle
- [ ] Verification queue SLA'ını < 48 saat olarak belirle

---

## 4. Customer Success Stratejisi

### 4.1 Retention Playbook

**Segment Bazlı Yaklaşım:**

| Segment | Tanım | Risk | Aksiyon |
|---------|-------|------|---------|
| **New Customer** | İlk 30 gün | Yüksek churn | Onboarding email serisi + kişisel check-in |
| **Active Customer** | Ayda 1+ iş | Düşük | Repeat booking teşvikleri (%3 indirim mevcut) |
| **At-Risk Customer** | 60+ gün inaktif | Orta-yüksek | Re-engagement email + özel teklif |
| **Churned Customer** | 90+ gün inaktif | — | Win-back kampanyası (sezonluk) |

| Segment | Tanım | Risk | Aksiyon |
|---------|-------|------|---------|
| **New Provider** | İlk 30 gün | Yüksek churn | Profile completeness nudge + ilk quote desteği |
| **Active Provider** | Haftalık quote gönderen | Düşük | Pro upsell + review teşviki |
| **At-Risk Provider** | 30+ gün quote göndermemiş | Orta | "Yeni iş fırsatları" email + WhatsApp |
| **Power Provider** | Ayda 5+ tamamlanan iş | Çok düşük | Pro+ upsell + case study teklifi |

### 4.2 Churn Önleme Playbook

**Erken Uyarı Sinyalleri ve Otomatik Müdahaleler:**

| Sinyal | Eşik | Otomatik Aksiyon | Manuel Aksiyon |
|--------|------|-----------------|----------------|
| Provider quote göndermedi | 7 gün | Email: "Yeni iş fırsatları" | — |
| Provider quote göndermedi | 14 gün | Email + in-app notification | WhatsApp mesajı |
| Provider quote göndermedi | 30 gün | Email: "Seni özledik" | Telefon araması |
| Customer iş ilanı vermedi | 30 gün | Email: sezonluk hizmet önerisi | — |
| Customer iş ilanı vermedi | 60 gün | Email: %10 indirim kodu | — |
| Provider subscription past_due | Anında | Mevcut webhook handler aktif ✅ | — |
| Düşük review (1-2 ⭐) | Anında | Admin notification ✅ | Müşteriye ulaş |
| Dispute açıldı | Anında | Admin notification ✅ | 4 saat SLA |

### 4.3 Upsell Stratejisi

**Starter → Pro Upsell Tetikleyicileri:**

| Tetikleyici | Mesaj | Kanal |
|------------|-------|-------|
| 5. quote limitine ulaştı | "Sınırsız quote ile daha fazla iş kazanın" | In-app modal + email |
| İlk 3 işi tamamladı | "Pro ile verified badge kazanın, güvenilirliğiniz artsın" | Email |
| Profile completeness > 80% | "Pro'ya yükselin, profiliniz zaten hazır" | Dashboard banner |
| Rakip provider Pro badge'li | Arama sonuçlarında "Pro providers get 2x more quotes" | Search results hint |

**Pro → Pro+ Upsell Tetikleyicileri:**

| Tetikleyici | Mesaj | Kanal |
|------------|-------|-------|
| Ayda 10+ quote | "AI ile daha hızlı quote yazın" | Email |
| 4.5+ ortalama rating | "Top Pro badge ile öne çıkın" | Dashboard banner |
| Quote win rate > %40 | "Featured listing ile 2x görünürlük" | In-app |

> **Geliştiricilere Direkt Not:**
> Upsell tetikleyicileri için mevcut `automation_rules` engine'ini kullanabilirsiniz. Önerilen yeni trigger event'ler:
> ```
> quote_limit_reached    — Starter provider 5/5 quote kullanınca
> milestone_jobs_completed — Provider X. işini tamamlayınca
> profile_completeness_threshold — Skor belirli eşiği aşınca
> subscription_renewal_approaching — Yenileme 7 gün kala
> ```
> Bu event'leri ilgili API route'larında `fireAutomationEvent()` çağrısıyla tetikleyin.

> **Tek Kişi / Küçük Ekip İpucu:**
> İlk 3 ay sadece 2 otomatik aksiyon kurun:
> 1. Quote limitine ulaşan Starter provider'a upsell email
> 2. 14+ gün inaktif provider'a nudge email
> Geri kalanını MRR > €2K olunca ekleyin.

> **Araç Entegrasyonu:**
> - `fireAutomationEvent()` → mevcut engine (`lib/automation/engine.ts`)
> - Email: mevcut `sendTransactionalEmail()` (`lib/email/send.ts`)
> - In-app: mevcut `sendNotification()` (`lib/notifications/send.ts`)

### ✅ Checklist — Customer Success
- [ ] Churn sinyalleri için cron job/scheduled function tasarla
- [ ] `quote_limit_reached` automation event'ini provider quote route'una ekle
- [ ] 3 yeni email template: inactive_provider, inactive_customer, upsell_pro
- [ ] At-risk segment SQL query'si oluştur (admin dashboard widget)
- [ ] Repeat booking rate'i admin stats'a ekle

---

## 5. Müşteri Destek Sistemi

### 5.1 Destek Kanalları (Öncelik Sırasıyla)

| Kanal | Araç | Maliyet | 7/24 | Kurulum |
|-------|------|---------|------|---------|
| **Self-Service FAQ** | Mevcut `/faq` sayfası ✅ | €0 | ✅ | Mevcut |
| **In-App Help Center** | Intercom Articles veya Notion embed | €0-74/ay | ✅ | 1 hafta |
| **Email Ticket** | Freshdesk Free veya Zoho Desk Free | €0 | — | 2 gün |
| **Live Chat** | Intercom Starter veya Crisp Free | €0-29/ay | Bot ile | 3 gün |
| **WhatsApp** | WhatsApp Business | €0 | — | 1 gün |

**Varsayım:** İlk 6 ay günlük ticket hacmi < 20. Bu hacimde ücretsiz tier araçlar yeterli.

### 5.2 Destek Operasyonu — Tek Kişi Modeli

**Günlük Rutin (toplam ~2 saat):**

| Saat | Aksiyon | Süre |
|------|---------|------|
| 09:00 | Ticket inbox kontrolü + önceliklendirme | 15 dk |
| 09:15 | Kritik ticket'ları yanıtla | 30 dk |
| 13:00 | Yeni ticket'ları yanıtla | 30 dk |
| 17:00 | Son kontrol + escalation | 15 dk |
| Arası | Bot + auto-reply ile kapat | Otomatik |

**SLA Hedefleri:**

| Öncelik | İlk Yanıt | Çözüm | Örnek |
|---------|-----------|-------|-------|
| P1 — Kritik | 1 saat | 4 saat | Ödeme sorunu, güvenlik |
| P2 — Yüksek | 4 saat | 24 saat | Verification gecikmesi, dispute |
| P3 — Normal | 24 saat | 48 saat | Profil düzenleme, genel soru |
| P4 — Düşük | 48 saat | 1 hafta | Feature request, öneri |

### 5.3 Self-Service Knowledge Base Yapısı

```
Help Center/
├── Getting Started/
│   ├── How to post your first job
│   ├── How to become a provider
│   └── How payments work
├── For Customers/
│   ├── Choosing the right provider
│   ├── What if I'm not satisfied?
│   └── Cancellation and refunds
├── For Providers/
│   ├── Writing winning quotes
│   ├── Getting verified
│   ├── Understanding your dashboard
│   └── Garda Vetting guide
├── Payments & Billing/
│   ├── How secure holds work
│   ├── Provider payouts (SEPA)
│   └── Subscription plans explained
├── Trust & Safety/
│   ├── How verification works
│   ├── Dispute resolution process
│   └── Community guidelines
└── Account & Privacy/
    ├── GDPR — Your data rights
    ├── How to export your data
    └── How to delete your account
```

### 5.4 Chatbot / Auto-Reply Kurulumu

**Senaryo 1 — FAQ Bot (Intercom/Crisp):**
```
Müşteri: "How do I get a refund?"
Bot: "Refunds are processed through our dispute resolution system.
      Here's how it works: [link to /faq#payments]

      If you need immediate help, click below to create a support ticket."
      [Create Ticket] [Chat with Human]
```

**Senaryo 2 — Otomatik Ticket Kategorileme:**
```
Email subject contains "payment" → Category: Payments, Priority: P2
Email subject contains "verification" → Category: Trust, Priority: P2
Email subject contains "delete" or "GDPR" → Category: Privacy, Priority: P1
Default → Category: General, Priority: P3
```

> **Geliştiricilere Direkt Not:**
> Live chat widget entegrasyonu için Next.js App Router'da:
>
> ```typescript
> // marketplace/components/support/ChatWidget.tsx
> 'use client';
>
> import { useEffect } from 'react';
>
> export function ChatWidget() {
>   useEffect(() => {
>     // Intercom örneği
>     if (typeof window !== 'undefined') {
>       (window as any).intercomSettings = {
>         api_base: "https://api-iam.intercom.io",
>         app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
>       };
>       // Intercom boot script (SDK lazy load)
>       const script = document.createElement('script');
>       script.src = `https://widget.intercom.io/widget/${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}`;
>       script.async = true;
>       document.body.appendChild(script);
>     }
>   }, []);
>   return null;
> }
>
> // Crisp alternatifi (tamamen ücretsiz):
> // window.$crisp = [];
> // window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_ID;
> ```
>
> Bu component'i `marketplace/app/[locale]/layout.tsx` içinde `</body>` öncesine ekleyin. **Sadece production'da yükleyin** (LIVE_SERVICES_ENABLED check).

> **Tek Kişi / Küçük Ekip İpucu:**
> **Crisp.chat** (ücretsiz plan: 2 operator, live chat + chatbot) ile başlayın. Intercom'a geçiş ancak aylık 100+ aktif conversation olunca. FAQ sayfanız zaten mevcut — bunu Crisp'in help center'ına da kopyalayın.

> **Araç Entegrasyonu:**
> - **Ücretsiz:** Crisp (chat) + Freshdesk Free (ticket) + mevcut FAQ
> - **Düşük bütçe (€29-74/ay):** Intercom Starter (chat + help center + bot)
> - **Orta bütçe (€100+/ay):** Intercom + Freshdesk Pro (SLA, automation)

### ✅ Checklist — Destek Sistemi
- [ ] Crisp veya Intercom hesabı oluştur
- [ ] Chat widget component'ini oluştur ve layout'a ekle
- [ ] FAQ sayfasını genişlet (yukarıdaki yapıya göre 15+ makale)
- [ ] Auto-reply template'leri hazırla (İngilizce)
- [ ] Destek email adresi oluştur (support@workmate.ie)
- [ ] SLA hedeflerini dokümante et

---

## 6. CRM ve Teknik Entegrasyonlar (Geliştirici Odaklı)

### 6.1 Supabase → CRM Event Sync

**Yaklaşım:** Mevcut `webhook_subscriptions` + `sendWebhookEvent()` altyapısını kullanarak CRM'e event push.

**Sync Edilecek Event'ler:**

| Event | Trigger Noktası | CRM Aksiyonu |
|-------|----------------|--------------|
| `user.registered` | `/api/register` | Contact oluştur |
| `provider.application_submitted` | Onboarding form submit | Deal/opportunity oluştur |
| `provider.verified` | Admin verification action | Deal stage: "Activated" |
| `job.created` | Job post submit | Activity log |
| `quote.accepted` | Quote accept action | Revenue event |
| `payment.completed` | Stripe webhook: invoice.paid | Revenue attribution |
| `subscription.created` | Stripe webhook: subscription.created | MRR tracking |
| `subscription.cancelled` | Stripe webhook: subscription.deleted | Churn alert |

**Entegrasyon Mimarisi:**

```
Supabase DB → API Route (event occurs) → sendWebhookEvent()
                                              ↓
                                    webhook_subscriptions table
                                              ↓
                               CRM Webhook URL (HubSpot/Zoho/Attio)
                                              ↓
                                    CRM Contact/Deal Update
```

**Implementasyon — Yeni Event'leri Mevcut Sisteme Ekleme:**

```typescript
// marketplace/app/api/register/route.ts — kayıt sonrası
import { sendWebhookEvent } from '@/lib/webhook/send';

// Mevcut kayıt işlemi sonrası eklenecek:
await sendWebhookEvent('user.registered', {
  user_id: newUser.id,
  email: newUser.email,
  role: newUser.role,
  source: body.utm_source || 'direct',
  registered_at: new Date().toISOString(),
});
```

```typescript
// Mevcut webhook event'lerine eklenmesi gereken yeni event tipleri:
// lib/webhook/send.ts içindeki WEBHOOK_EVENTS dizisine:
const WEBHOOK_EVENTS = [
  'job.created',
  'quote.accepted',
  'payment.completed',
  'provider.approved',
  'document.verified',
  'document.rejected',
  // YENİ — CRM sync için:
  'user.registered',
  'provider.application_submitted',
  'provider.verified',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'review.submitted',
  'dispute.created',
] as const;
```

### 6.2 Stripe Webhook → CS Otomasyon

**Mevcut Stripe webhook handler** (`/api/webhooks/stripe/route.ts`) zaten 9 event işliyor. CS otomasyonu için eklenmesi gerekenler:

| Stripe Event | Mevcut İşlem | Eklenecek CS Aksiyonu |
|-------------|-------------|----------------------|
| `invoice.paid` | ✅ Payment release + notification | ➕ CRM revenue event + upsell check |
| `customer.subscription.created` | ✅ DB upsert | ➕ CRM deal stage update + welcome email |
| `customer.subscription.deleted` | ✅ Status update | ➕ CRM churn flag + win-back sequence trigger |
| `invoice.payment_failed` | ✅ Past_due status | ➕ CRM risk flag + 48h dunning email |
| `charge.dispute.created` | ✅ Admin notify | ➕ CRM escalation + customer outreach |

**Implementasyon Örneği — Subscription Churn Trigger:**

```typescript
// marketplace/app/api/webhooks/stripe/route.ts
// customer.subscription.deleted handler'ına eklenecek:

case 'customer.subscription.deleted': {
  // ... mevcut kod (status update, notification)

  // YENİ — CS churn playbook tetikle:
  await sendWebhookEvent('subscription.cancelled', {
    provider_id: subscription.metadata.workmate_provider_id,
    plan: subscription.metadata.workmate_plan,
    cancelled_at: new Date().toISOString(),
    lifetime_value: subscription.metadata.total_paid || 0,
  });

  // YENİ — Churn survey email (Resend)
  await sendTransactionalEmail({
    to: providerEmail,
    template: 'subscription_churn_survey',
    data: {
      name: providerName,
      plan: subscription.metadata.workmate_plan,
      surveyUrl: `${baseUrl}/feedback/churn?pid=${providerId}`,
    },
  });
  break;
}
```

### 6.3 Chat/Helpdesk Entegrasyonu — Next.js Yaklaşımı

**Seçenek A — Intercom (Önerilen, €29-74/ay):**

```typescript
// marketplace/components/support/IntercomProvider.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/hooks/useSession'; // mevcut auth hook

interface IntercomSettings {
  app_id: string;
  user_id?: string;
  email?: string;
  name?: string;
  created_at?: number;
  user_hash?: string; // Identity verification (HMAC)
  company?: { company_id: string; name: string; plan: string };
  custom_attributes?: Record<string, unknown>;
}

export function IntercomProvider() {
  const { user, profile } = useSession();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_INTERCOM_APP_ID) return;

    const settings: IntercomSettings = {
      app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
    };

    if (user && profile) {
      settings.user_id = user.id;
      settings.email = user.email;
      settings.name = profile.full_name;
      settings.created_at = Math.floor(new Date(user.created_at).getTime() / 1000);
      settings.company = {
        company_id: profile.role === 'provider' ? `provider_${user.id}` : `customer_${user.id}`,
        name: profile.full_name || 'Unknown',
        plan: profile.subscription_plan || 'starter',
      };
      settings.custom_attributes = {
        role: profile.role,
        county: profile.county,
        verified: profile.id_verification_status === 'approved',
        profile_completeness: profile.completeness_score,
        total_jobs: profile.total_jobs || 0,
      };
    }

    (window as any).intercomSettings = settings;

    // Lazy load Intercom SDK
    const s = document.createElement('script');
    s.src = `https://widget.intercom.io/widget/${settings.app_id}`;
    s.async = true;
    document.body.appendChild(s);

    return () => {
      if ((window as any).Intercom) (window as any).Intercom('shutdown');
    };
  }, [user, profile]);

  return null;
}
```

**Seçenek B — Crisp (Ücretsiz):**

```typescript
// marketplace/components/support/CrispProvider.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/hooks/useSession';

export function CrispProvider() {
  const { user, profile } = useSession();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID) return;

    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    const s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.body.appendChild(s);

    // Identify user after SDK loads
    s.onload = () => {
      if (user && (window as any).$crisp) {
        (window as any).$crisp.push(['set', 'user:email', [user.email]]);
        (window as any).$crisp.push(['set', 'user:nickname', [profile?.full_name]]);
        (window as any).$crisp.push(['set', 'session:data', [
          ['role', profile?.role],
          ['county', profile?.county],
          ['plan', profile?.subscription_plan || 'starter'],
        ]]);
      }
    };
  }, [user, profile]);

  return null;
}
```

### 6.4 GDPR Uyumlu Veri Akışı

**Mevcut GDPR Altyapısı (Güçlü ✅):**
- Data export: `GET /api/profile/gdpr` → JSON download
- Deletion request: `DELETE /api/profile/gdpr` → 30-gün soft-delete
- Automated hard-delete: `gdpr-retention-processor` edge function
- Confirmation email: `gdprDeletionConfirmEmail()` template
- Financial data retention: 7 yıl (yasal zorunluluk)

**CRM Entegrasyonu İçin GDPR Kuralları:**

| Kural | Uygulama |
|-------|----------|
| **Consent** | CRM'e veri göndermeden önce kullanıcı consent'i gerekli (ToS + Privacy Policy'de belirtilmeli) |
| **Data Minimization** | CRM'e sadece gerekli veriyi gönderin (isim, email, rol, plan) — adres, Eircode, ID belgeleri GÖNDERMEYİN |
| **Right to Erasure** | Kullanıcı silme talep ettiğinde CRM'deki verisi de silinmeli |
| **DPA (Data Processing Agreement)** | CRM sağlayıcıyla DPA imzalanmalı (HubSpot, Intercom, Crisp hepsi sunuyor) |
| **Data Location** | CRM verisi EU bölgesinde saklanmalı (tüm önerilen araçlar EU option sunuyor) |

**DSAR (Data Subject Access Request) Flow — CRM Entegrasyonu:**

```
Kullanıcı → DELETE /api/profile/gdpr
    ↓
1. Supabase: deletion_requested_at = now()
2. CRM Webhook: user.deletion_requested event
    ↓
CRM: Contact'ı "Pending Deletion" olarak işaretle
    ↓
30 gün sonra (cron):
3. Supabase: Hard delete + PII mask
4. CRM API call: Contact'ı tamamen sil
5. Audit log: Deletion completed
```

**Implementasyon — CRM Cleanup on GDPR Delete:**

```typescript
// marketplace/supabase/functions/gdpr-retention-processor/index.ts
// Mevcut hard-delete işleminden sonra eklenecek:

// CRM cleanup (Intercom örneği)
if (process.env.INTERCOM_ACCESS_TOKEN) {
  try {
    await fetch('https://api.intercom.io/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: { field: 'external_id', operator: '=', value: userId }
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (data.data?.[0]?.id) {
        await fetch(`https://api.intercom.io/contacts/${data.data[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}` },
        });
      }
    });
  } catch (e) {
    console.error('CRM cleanup failed:', e); // Log but don't block
  }
}
```

> **Geliştiricilere Direkt Not:**
> 1. CRM seçiminiz ne olursa olsun **DPA imzalayın** (genelde Settings > Security > DPA). Bu yasal zorunluluk.
> 2. CRM'e veri gönderirken **asla** şunları göndermeyin: PPS numarası, Eircode (tam adres), Garda Vetting referansı, kimlik belgesi URL'leri.
> 3. `sendWebhookEvent()` kullanarak CRM'e event push yapın — mevcut HMAC signing ve retry logic'i otomatik uygulanır.
> 4. Mevcut `webhook_subscriptions` tablosuna CRM endpoint URL'sini kaydedin — bu sayede birden fazla CRM/araç aynı event'leri alabilir.

> **Araç Entegrasyonu:**
> **Env vars eklenecek (`.env.local`):**
> ```
> NEXT_PUBLIC_INTERCOM_APP_ID=       # veya NEXT_PUBLIC_CRISP_WEBSITE_ID=
> INTERCOM_ACCESS_TOKEN=             # Server-side API (GDPR cleanup için)
> CRM_WEBHOOK_SECRET=                # CRM webhook endpoint'i için
> ```

### ✅ Checklist — CRM & Teknik Entegrasyon
- [ ] Yeni webhook event tiplerini `lib/webhook/send.ts`'ye ekle
- [ ] `user.registered` event'ini register route'a ekle
- [ ] Chat widget component'ini oluştur (Crisp veya Intercom)
- [ ] Chat widget'ı layout.tsx'e ekle (LIVE_SERVICES_ENABLED guard ile)
- [ ] CRM sağlayıcıyla DPA imzala
- [ ] GDPR deletion flow'una CRM cleanup ekle
- [ ] CRM webhook URL'sini `webhook_subscriptions` tablosuna kaydet
- [ ] Privacy Policy'yi güncelle (CRM data processing hakkında)

---

## 7. Araç Stack'i (2026 — Düşük Bütçe Öncelikli)

### Katmanlı Araç Seçimi

| Kategori | Sıfır Bütçe | Minimum (€50-100/ay) | Profesyonel (€200-500/ay) |
|----------|------------|----------------------|--------------------------|
| **CRM** | Notion DB + Google Sheets | HubSpot Free CRM | Attio veya HubSpot Starter (€20/ay) |
| **Email Marketing** | Resend (mevcut ✅) | Customer.io Free (200 profile) | Customer.io Growth (€100/ay) |
| **Live Chat** | Crisp Free | Crisp Pro (€25/ay) | Intercom Starter (€74/ay) |
| **Helpdesk/Ticket** | Shared inbox (Gmail) | Freshdesk Free | Freshdesk Growth (€15/ay) |
| **Analytics** | Mevcut admin dashboard ✅ | PostHog Free (1M events) | PostHog + Mixpanel |
| **Survey/NPS** | Google Forms | Typeform Free | Typeform + Hotjar |
| **Communication** | WhatsApp Business | WhatsApp API (Twilio) | Twilio + SMS |
| **Status Page** | GitHub Pages | BetterStack Free | BetterStack Pro |
| **Monitoring** | `/api/health` ✅ | UptimeRobot Free | Sentry (mevcut ✅) + BetterStack |

### Önerilen Başlangıç Stack'i (Launch İçin)

**Toplam maliyet: €0-25/ay**

| Araç | Kullanım | Maliyet |
|------|----------|---------|
| **Crisp** | Live chat + chatbot | €0 (free plan) |
| **Google Sheets** | CRM + provider tracking | €0 |
| **Resend** | Transactional email (mevcut) | €0 (free tier) |
| **PostHog** | Product analytics | €0 (1M events/ay) |
| **WhatsApp Business** | Provider ilişki yönetimi | €0 |
| **Google Forms** | NPS + CSAT survey | €0 |
| **UptimeRobot** | Uptime monitoring | €0 (free tier) |
| **Sentry** | Error tracking (mevcut) | €0 (free tier) |

> **Geliştiricilere Direkt Not:**
> PostHog entegrasyonu için:
> ```typescript
> // marketplace/components/analytics/PostHogProvider.tsx
> 'use client';
> import posthog from 'posthog-js';
> import { PostHogProvider as PHProvider } from 'posthog-js/react';
> import { useEffect } from 'react';
>
> export function PostHogProvider({ children }: { children: React.ReactNode }) {
>   useEffect(() => {
>     if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
>       posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
>         api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
>         capture_pageview: true,
>         capture_pageleave: true,
>         persistence: 'localStorage+cookie',
>         // GDPR: respect DNT
>         respect_dnt: true,
>       });
>     }
>   }, []);
>
>   return <PHProvider client={posthog}>{children}</PHProvider>;
> }
> ```
> **ÖNEMLİ:** PostHog EU instance kullanın (`eu.posthog.com`) — GDPR uyumluluğu için.

> **Tek Kişi / Küçük Ekip İpucu:**
> Araç sayısını minimize edin. Launch'ta 4 araçtan fazlasına ihtiyacınız yok: Crisp + Resend + PostHog + Google Sheets. Her yeni araç öğrenme maliyeti getirir.

### ✅ Checklist — Araç Stack
- [ ] Crisp hesabı oluştur ve widget'ı entegre et
- [ ] PostHog EU hesabı oluştur ve SDK entegre et
- [ ] UptimeRobot'ta `/api/health` endpoint'ini monitor et
- [ ] Google Sheets'te provider tracking template oluştur
- [ ] WhatsApp Business hesabı oluştur (support@workmate.ie numarası)

---

## 8. Satış ve CS KPI'ları + Dashboard

### 8.1 Marketplace KPI Seti

**Supply (Provider) Metrikleri:**

| KPI | Formül | Hedef (6 ay) | Veri Kaynağı |
|-----|--------|-------------|-------------|
| Total Providers | COUNT(profiles WHERE role='provider') | 200 | Supabase |
| Verified Rate | verified / total providers | >80% | Supabase |
| Provider Activation | first_quote_sent / verified × 100 | >60% | funnel_events |
| Monthly Active Providers | unique providers with quote in 30d | >40% | quotes table |
| Avg Quotes per Provider | total_quotes / active_providers | >5/ay | quotes table |
| Provider Churn (monthly) | cancelled_subs / total_subs × 100 | <5% | provider_subscriptions |
| Pro Conversion Rate | pro_subs / total_providers × 100 | >15% | provider_subscriptions |

**Demand (Customer) Metrikleri:**

| KPI | Formül | Hedef (6 ay) | Veri Kaynağı |
|-----|--------|-------------|-------------|
| Total Customers | COUNT(profiles WHERE role='customer') | 500 | Supabase |
| Jobs Posted (monthly) | COUNT(jobs created this month) | 100/ay | jobs table |
| Quote-to-Win Rate | accepted_quotes / total_quotes × 100 | >25% | quotes table |
| Time to First Quote | median minutes from job post to first quote | <4 saat | funnel_events |
| Repeat Booking Rate | customers with 2+ completed jobs / total × 100 | >25% | customer_provider_history |
| CSAT | survey score (1-5) | >4.2 | Google Forms / reviews |
| NPS | promoters - detractors | >30 | Survey |

**Revenue Metrikleri:**

| KPI | Formül | Hedef (6 ay) | Veri Kaynağı |
|-----|--------|-------------|-------------|
| MRR | SUM(active subscriptions × plan price) | €2,000 | provider_subscriptions |
| GMV (Gross Merchandise Value) | SUM(completed job amounts) | €50,000/ay | payments table |
| Platform Revenue | subscription MRR + commission fees | €3,000/ay | Stripe |
| LTV (Provider) | avg_monthly_revenue × avg_lifetime_months | €200+ | Calculated |
| CAC (Provider) | acquisition_cost / new_providers | <€20 | Manual |
| Payback Period | CAC / monthly_revenue_per_provider | <3 ay | Calculated |

### 8.2 Tek Kişi Dashboard Mimarisi

**Mevcut admin dashboard zaten güçlü.** Eksik widget'lar:

```
Admin Dashboard (mevcut: /dashboard/admin)
├── Platform Stats ✅ (mevcut)
├── Funnel Analytics ✅ (mevcut)
├── Verification Queue ✅ (mevcut)
├── Risk Assessment ✅ (mevcut)
│
├── [YENİ] Revenue Dashboard
│   ├── MRR trend (son 6 ay)
│   ├── Subscription breakdown (Starter/Pro/Pro+)
│   ├── Commission revenue (son 30 gün)
│   └── Top earning providers
│
├── [YENİ] CS Health Dashboard
│   ├── Provider activation rate (7d/30d)
│   ├── At-risk providers (14+ gün inaktif)
│   ├── Quote-to-win rate trend
│   ├── Repeat booking rate
│   └── Recent reviews (< 3 ⭐ flagged)
│
└── [YENİ] Sales Pipeline
    ├── Founding Pro slots (X/100 claimed)
    ├── This week's new applications
    ├── Pending verifications (SLA countdown)
    └── Upsell candidates (Starter → Pro)
```

**SQL Query Örnekleri — Yeni KPI'lar:**

```sql
-- Provider Activation Rate (30 gün)
SELECT
  COUNT(DISTINCT q.provider_id) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0)
    AS activation_rate_30d
FROM profiles p
LEFT JOIN quotes q ON q.provider_id = p.id
  AND q.created_at > NOW() - INTERVAL '30 days'
WHERE p.role = 'provider'
  AND p.id_verification_status = 'approved';

-- At-Risk Providers (14+ gün quote göndermemiş)
SELECT p.id, p.full_name, p.email,
  MAX(q.created_at) AS last_quote_at,
  EXTRACT(DAY FROM NOW() - MAX(q.created_at)) AS days_inactive
FROM profiles p
LEFT JOIN quotes q ON q.provider_id = p.id
WHERE p.role = 'provider' AND p.id_verification_status = 'approved'
GROUP BY p.id, p.full_name, p.email
HAVING MAX(q.created_at) < NOW() - INTERVAL '14 days'
   OR MAX(q.created_at) IS NULL
ORDER BY days_inactive DESC;

-- MRR Calculation
SELECT
  SUM(CASE
    WHEN plan = 'professional' AND status = 'active' THEN 19
    WHEN plan = 'premium' AND status = 'active' THEN 39
    ELSE 0
  END) AS current_mrr,
  COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'past_due') AS past_due
FROM provider_subscriptions;

-- Repeat Booking Rate
SELECT
  COUNT(DISTINCT customer_id) FILTER (WHERE completed_jobs >= 2) * 100.0
    / NULLIF(COUNT(DISTINCT customer_id), 0) AS repeat_booking_rate
FROM customer_provider_history;

-- Quote-to-Win Rate (son 30 gün)
SELECT
  COUNT(*) FILTER (WHERE status = 'accepted') * 100.0
    / NULLIF(COUNT(*), 0) AS quote_to_win_rate
FROM quotes
WHERE created_at > NOW() - INTERVAL '30 days';
```

> **Geliştiricilere Direkt Not:**
> Yukarıdaki SQL query'leri yeni API endpoint'leri olarak eklenebilir:
> - `GET /api/admin/kpi/revenue` → MRR + commission breakdown
> - `GET /api/admin/kpi/cs-health` → activation, at-risk, repeat rate
> - `GET /api/admin/kpi/sales-pipeline` → founding pro, applications, upsell candidates
>
> Mevcut `api/admin/stats` ve `api/admin/analytics` endpoint'lerini genişletmek de bir seçenek, ama ayrı endpoint'ler daha temiz.

> **Tek Kişi / Küçük Ekip İpucu:**
> İlk aşamada yeni dashboard widget'lar yerine **haftalık 15 dakikalık SQL check** yapın. Yukarıdaki query'leri Supabase SQL Editor'da çalıştırın ve sonuçları Google Sheets'e not edin. Dashboard widget'larını ancak düzenli takip alışkanlığı oluştuktan sonra geliştirin.

### ✅ Checklist — KPI & Dashboard
- [ ] MRR query'sini admin stats endpoint'ine ekle
- [ ] At-risk provider query'sini haftalık cron olarak çalıştır
- [ ] Quote-to-win rate'i mevcut `/api/metrics/quotes`'a ekle
- [ ] Google Sheets KPI tracker template oluştur
- [ ] Haftalık KPI review rutini belirle (her Pazartesi 09:00)

---

## 9. Zaman Çizelgesi ve Sprint Dağılımı

### İlk 90 Gün — Gantt Tarzı Plan

```
Hafta:  1   2   3   4   5   6   7   8   9  10  11  12
        |---|---|---|---|---|---|---|---|---|---|---|---|
PHASE 1: LAUNCH PREP
├─ Araç kurulumu (Crisp, PostHog)  [███]
├─ Chat widget entegrasyonu        [███]
├─ FAQ genişletme (15+ makale)         [███]
├─ Email template'ler (nudge, upsell)  [███]
├─ UTM tracking ekleme                     [██]
├─ Provider outreach başlat           [███████████████████]
├─ Founding Pro kampanyası            [███████████████████]

PHASE 2: LAUNCH (Hafta 3-4)
├─ Soft launch (davetli)                   [███]
├─ Support inbox aktif                     [███]
├─ İlk 10 provider onboard                [███████]
├─ İlk customer testleri                       [███]

PHASE 3: GROWTH (Hafta 5-8)
├─ CRM event sync ekleme                       [███████]
├─ Automation rules (churn önleme)                 [███████]
├─ CS health dashboard widget                      [███████]
├─ Revenue dashboard widget                            [███]
├─ NPS survey başlat                                   [███]

PHASE 4: OPTIMIZE (Hafta 9-12)
├─ Churn analizi + playbook refinement                     [███████]
├─ Upsell otomasyonu (Starter→Pro)                         [███████]
├─ Knowledge base genişletme                                   [███]
├─ 90 gün retrospektif                                            [█]
```

### 6 Aylık Milestone'lar

| Ay | Milestone | Provider Hedef | Customer Hedef | MRR Hedef |
|----|-----------|---------------|---------------|-----------|
| 1 | Soft launch + Founding Pro | 25 verified | 10 | €0 |
| 2 | Public launch | 50 verified | 50 | €200 |
| 3 | İlk ödenen subscription'lar | 80 verified | 100 | €500 |
| 4 | Referral programı aktif | 120 verified | 200 | €1,000 |
| 5 | Pro+ upsell başlangıcı | 160 verified | 350 | €1,500 |
| 6 | Product-market fit signal | 200 verified | 500 | €2,000 |

---

## 10. Bütçe ve Kaynak Tahmini

### Senaryo 1: Sıfır Bütçe (€0/ay)

| Kalem | Araç | Not |
|-------|------|-----|
| CRM | Google Sheets | Manuel, ölçeklenmez ama başlangıç için yeterli |
| Chat | Crisp Free | 2 operator, canlı chat + basit bot |
| Email | Resend Free (mevcut) | 100 email/gün, yeterli |
| Analytics | Mevcut admin dashboard | SQL query'ler ile destekle |
| Monitoring | UptimeRobot Free | 50 monitor, 5 dk interval |
| Helpdesk | Gmail + labels | Ölçeklenmez ama < 20 ticket/gün için OK |
| Survey | Google Forms | NPS + CSAT |
| **Toplam** | **€0/ay** | |

**Risk:** Manuel iş yükü yüksek, 50+ ticket/gün'de sürdürülemez.

### Senaryo 2: Minimum (€75-150/ay)

| Kalem | Araç | Maliyet |
|-------|------|---------|
| CRM | HubSpot Free + Zapier Free | €0 |
| Chat | Crisp Pro | €25/ay |
| Email | Resend Pro | €20/ay |
| Analytics | PostHog Free | €0 |
| Monitoring | UptimeRobot + Sentry | €0 |
| Helpdesk | Freshdesk Free | €0 |
| Survey | Typeform Free | €0 |
| Ads (test) | Google/Meta | €50/ay |
| **Toplam** | **€95/ay** | |

**Ölçek:** 100 provider, 500 customer, 50 ticket/gün'e kadar.

### Senaryo 3: Profesyonel (€300-500/ay)

| Kalem | Araç | Maliyet |
|-------|------|---------|
| CRM | Attio veya HubSpot Starter | €30/ay |
| Chat + Help Center | Intercom Starter | €74/ay |
| Email Marketing | Customer.io Growth | €100/ay |
| Analytics | PostHog + Mixpanel | €0 (free tiers) |
| Monitoring | BetterStack Pro | €25/ay |
| Helpdesk | Freshdesk Growth | €15/ay |
| Survey | Typeform + Hotjar | €30/ay |
| Ads | Google + Meta + LinkedIn | €150/ay |
| **Toplam** | **€424/ay** | |

**Ölçek:** 500+ provider, 2000+ customer, 100+ ticket/gün.

> **Tek Kişi / Küçük Ekip İpucu:**
> **Senaryo 1 ile başlayın.** MRR > €500 olunca Senaryo 2'ye geçin. MRR > €2,000 olunca Senaryo 3'ü düşünün. Erken aşamada araç maliyeti değil, **zaman maliyeti** asıl kısıttır.

### ✅ Checklist — Bütçe
- [ ] Senaryo 1 araçlarını (Crisp Free, UptimeRobot, Google Sheets) hemen kur
- [ ] Aylık araç maliyetini Google Sheets'te takip et
- [ ] MRR milestone'larına bağlı araç upgrade planını dokümante et
- [ ] Reklam bütçesini ancak organic acquisition kanalları tükendikten sonra başlat

---

## 11. Riskler, Bottleneck'ler ve Mitigasyon

| # | Risk | Etki | Olasılık | Mitigasyon |
|---|------|------|----------|-----------|
| 1 | **Provider churn yüksek** — İlk 30 gün iş gelmezse provider'lar ayrılır | Kritik | Yüksek | Founding Pro ile 6 ay ücretsiz + kişisel onboarding desteği + "guaranteed first job" kampanyası düşün |
| 2 | **Supply-demand dengesizliği** — Provider çok, müşteri az (veya tersi) | Yüksek | Yüksek | County bazlı provider cap (ilk 5 provider/category/county) + demand-side marketing'e ağırlık ver |
| 3 | **Destek yükü patlaması** — Launch'ta beklenenden fazla ticket | Orta | Orta | Self-service FAQ'yu güçlü tut + auto-reply + bot ile %60'ını deflect et |
| 4 | **GDPR ihlali** — CRM'e yanlış veri gönderimi veya silme talebi kaçırma | Kritik | Düşük | DPA imzala + CRM cleanup otomasyonu + aylık GDPR audit |
| 5 | **Tek kişi burnout** — Sales + CS + geliştirme tek kişide yoğunlaşması | Yüksek | Yüksek | Otomasyon öncelikli yaklaşım + haftalık max 10 saat CS/Sales'e ayır + part-time VA düşün |
| 6 | **Düşük quote kalitesi** — Provider'lar düşük kalite quote gönderirse müşteri güveni düşer | Orta | Orta | AI quote writer (Pro+) + quote template önerileri + düşük accept rate'li provider'lara eğitim |
| 7 | **Payment dispute yoğunluğu** — Escrow model'de dispute oranı yüksek olabilir | Orta | Düşük | Net ToS + secure hold sistemi (mevcut ✅) + 4 saat SLA admin müdahale |
| 8 | **Satış-tech uyumsuzluğu** — Satış vaatleri ile ürün kapasitesi arasında fark | Orta | Orta | Sales playbook'u ürün ekibiyle aylık sync + feature request backlog |
| 9 | **Rakip girişi** — TaskRabbit/Bark İrlanda'ya yoğunlaşması | Yüksek | Düşük | Lokal avantaj (İrlanda odak, Eircode, county bazlı) + community building |
| 10 | **Stripe Connect onboarding friction** — Provider'lar KYC sürecinde takılır | Orta | Orta | Adım adım kılavuz + canlı destek + "stuck at Stripe" automation alert |

> **Geliştiricilere Direkt Not:**
> Risk #10 için mevcut `account.updated` webhook handler'ınız `stripe_requirements_due` alanını güncelliyor. Bu veriyi kullanarak:
> ```typescript
> // Automation rule: Provider Stripe onboarding'de takılırsa
> {
>   trigger_event: "provider_stripe_requirements_pending",
>   conditions: { days_since_verification: "3" },
>   action_type: "send_notification",
>   action_config: {
>     template: "stripe_onboarding_help",
>     channel: "email",
>     include_help_link: true
>   }
> }
> ```

### ✅ Checklist — Risk Mitigasyonu
- [ ] County bazlı provider/category cap planla (soft limit, admin alert)
- [ ] Self-service FAQ'da en az 15 makale yayınla (launch öncesi)
- [ ] GDPR audit checklist oluştur (aylık)
- [ ] Haftalık max CS/Sales saat limitini belirle (10 saat)
- [ ] Stripe onboarding help guide hazırla (provider-facing)

---

## 12. İlk 30 Gün Acil Aksiyon Listesi

**Bugün başlanabilecek 20 maddelik checklist — Etki/Efor etiketiyle:**

| # | Aksiyon | Etki | Efor | Sorumlu | Süre |
|---|--------|------|------|---------|------|
| 1 | Crisp Free hesabı oluştur + chat widget component yaz | Yüksek | Düşük | Dev | 2 saat |
| 2 | FAQ sayfasını 15+ makaleye genişlet | Yüksek | Orta | Kurucu | 1 gün |
| 3 | support@workmate.ie email adresi oluştur | Orta | Düşük | Kurucu | 15 dk |
| 4 | Google Sheets'te provider tracking template oluştur | Orta | Düşük | Kurucu | 1 saat |
| 5 | LinkedIn'de ilk 50 hedef provider listesi çıkar | Yüksek | Orta | Kurucu | 2 saat |
| 6 | UTM parametrelerini onboarding formuna ekle | Orta | Düşük | Dev | 1 saat |
| 7 | `user.registered` webhook event'ini register route'a ekle | Yüksek | Düşük | Dev | 30 dk |
| 8 | PostHog EU hesabı oluştur + SDK entegre et | Yüksek | Orta | Dev | 3 saat |
| 9 | Inactive provider nudge email template'i oluştur | Yüksek | Düşük | Dev | 1 saat |
| 10 | Churn survey email template'i oluştur | Orta | Düşük | Dev | 1 saat |
| 11 | MRR query'sini admin stats endpoint'ine ekle | Yüksek | Düşük | Dev | 1 saat |
| 12 | At-risk provider query'sini oluştur (Supabase) | Yüksek | Düşük | Dev | 30 dk |
| 13 | LinkedIn outreach mesaj template'lerini hazırla (EN) | Yüksek | Düşük | Kurucu | 1 saat |
| 14 | WhatsApp Business hesabı oluştur | Düşük | Düşük | Kurucu | 30 dk |
| 15 | UptimeRobot'ta health endpoint'i monitor et | Orta | Düşük | Dev | 15 dk |
| 16 | Auto-reply email template'leri hazırla (EN) | Orta | Düşük | Kurucu | 1 saat |
| 17 | Founding Pro sayfasını sosyal medya'da paylaş | Yüksek | Düşük | Kurucu | 30 dk |
| 18 | İlk 10 provider'a kişisel LinkedIn DM gönder | Yüksek | Düşük | Kurucu | 1 saat |
| 19 | Privacy Policy'yi CRM data processing için güncelle | Yüksek | Orta | Kurucu + Hukuk | 2 saat |
| 20 | Haftalık KPI review takvimi oluştur (Pazartesi 09:00) | Orta | Düşük | Kurucu | 15 dk |

**Öncelik sırası:** 1 → 5 → 13 → 17 → 18 → 3 → 6 → 7 → 8 → 11 → 12 → 9 → 2 → 4 → 15 → 16 → 10 → 14 → 19 → 20

---

## Bu Raporu Uygulamak İçin Geliştiricilerden (ve Benden) İstediğim İlk 3 Şey

### 1. Geliştiricilerden: Chat Widget + Temel CRM Event Sync (3-5 gün)

**Ne:** Crisp (veya Intercom) chat widget component'ini oluşturun ve layout'a ekleyin. Mevcut `sendWebhookEvent()` altyapısına 4 yeni event ekleyin: `user.registered`, `provider.application_submitted`, `subscription.created`, `subscription.cancelled`.

**Neden:** Bu iki parça olmadan müşterilerle gerçek zamanlı iletişim kuramıyoruz ve kullanıcı lifecycle'ını izleyemiyoruz. Mevcut altyapı (webhook engine, notification system, email templates) zaten %80 hazır — sadece bağlamak gerekiyor.

**Dosyalar:**
- `marketplace/components/support/CrispProvider.tsx` (yeni)
- `marketplace/app/[locale]/layout.tsx` (widget ekleme)
- `marketplace/lib/webhook/send.ts` (yeni event tipleri)
- `marketplace/app/api/register/route.ts` (user.registered event)

### 2. Benden (Sales/CS Director): İlk 50 Provider Outreach Başlatma (1 hafta)

**Ne:** LinkedIn + Facebook Groups'ta İrlanda'daki tradesperson, cleaner, handyman topluluklarını tarayıp 50 kişilik hedef listeyi çıkaracağım. Her birine kişiselleştirilmiş DM göndereceğim. Founding Pro programını ana değer teklifi olarak kullanacağım.

**Neden:** Marketplace'in çalışması için supply (provider) tarafı zorunlu. Tek bir müşteri bile gelse, eğer quote verecek provider yoksa değer üretemiyoruz. İlk 25 verified provider olmadan public launch yapmamalıyız.

### 3. Birlikte: KPI Dashboard + Haftalık Review Rutini (2 hafta)

**Ne:** Yukarıdaki SQL query'leri (MRR, activation rate, at-risk providers, quote-to-win) admin dashboard'a ekleyelim veya en azından Supabase SQL Editor'da haftalık çalıştıralım. Her Pazartesi 09:00'da 15 dakikalık KPI review yapalım.

**Neden:** Ölçemediğinizi yönetemezsiniz. Launch'tan önce baseline metrics'i oluşturmalıyız ki growth'u izleyebilelim. Mevcut admin dashboard altyapısı güçlü — sadece 3-4 yeni query/widget eklemek yeterli.

---

*Bu rapor WorkMate'in mevcut kod altyapısı, veritabanı şeması ve mevcut entegrasyonları analiz edilerek hazırlanmıştır. Tüm teknik öneriler mevcut mimariyle uyumludur ve mevcut araçları (automation_rules engine, webhook system, email templates, notification system) yeniden kullanmayı önceliklendirir.*
