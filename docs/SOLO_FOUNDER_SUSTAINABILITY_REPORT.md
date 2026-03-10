# Tek Kişilik Product + Engineering Ekibiyle WorkMate İlerletme ve Sürdürülebilirlik Raporu

> **Tarih:** 2026-03-10
> **Proje:** WorkMate — İrlanda odaklı hizmet marketplace'i
> **Durum:** MVP/pre-production, launch hazırlığı
> **Mevcut Kod Tabanı:** 104 API route · 54 sayfa · 152 bileşen · 74 migration · ~18K satır TS/JS

---

## 1. Rol Tanımı ve Günlük/Haftalık Zaman Bölümü

Tek kişilik ekipte en büyük risk **context switching** maliyetidir. Çözüm: günleri tema bazlı bölmek.

### Haftalık Zaman Bloğu (40 saat)

| Gün | Sabah (3s) | Öğleden Sonra (3s) | Akşam (1-2s, opsiyonel) |
|-----|-----------|---------------------|------------------------|
| **Pazartesi** | Sprint planlama + backlog grooming | Feature geliştirme | — |
| **Salı** | Feature geliştirme (deep work) | Feature geliştirme | Code review (kendi PR'ları) |
| **Çarşamba** | Bug fix + tech debt | Test yazma + QA | — |
| **Perşembe** | Feature geliştirme (deep work) | Feature geliştirme | — |
| **Cuma** | Kullanıcı feedback analizi + metrik kontrolü | Dokümantasyon + retro | Deploy (varsa) |

### Yüzdelik Dağılım

| Aktivite | Oran | Haftalık Saat |
|----------|------|--------------|
| Feature geliştirme (Engineering) | 45% | 18s |
| Bug fix + tech debt | 15% | 6s |
| Product (backlog, feedback, metrikler) | 15% | 6s |
| Test + QA | 10% | 4s |
| Planlama + retro + dokümantasyon | 10% | 4s |
| Ops + deploy + monitoring | 5% | 2s |

> **Tek Kişilik İpucu:** "Maker schedule" uygula — toplantısız 4 saatlik deep work blokları koru. Bildirim kapalı, Slack sessiz. Context switch = 23 dakika kayıp (UC Irvine araştırması).

> **Araç Önerisi:** [Toggl Track](https://toggl.com) (ücretsiz) — haftalık zaman dağılımını izle. Product vs Engineering oranın %40-60 bandında kalmalı.

> **Haftalık Zaman Dağılımı:** Pazartesi sabah 30dk "self-standup": MEMORY.md oku, Sentry kontrol et, PostHog/GA4 metriklerine bak, haftanın 3 hedefini yaz.

> **Geliştiricilere Direkt Aksiyon:**
> ```bash
> # Her Pazartesi sabah çalıştır:
> cd marketplace && npm run health-check
> # Sentry'de unresolved errors kontrol et
> # GitHub Issues'dan "bug" label'lı olanları filtrele
> ```

---

## 2. MVP Roadmap — İlk 90 Gün + 6 Ay

### Mevcut Durum Özeti

WorkMate'in kod tabanı production-ready seviyede:
- 104 API endpoint, 54 sayfa, 152 bileşen hazır
- 74 migration uygulanmış (RLS, GDPR, Stripe Connect, referral)
- CI/CD: 6 GitHub Actions workflow (lint, test, CodeQL, Lighthouse, BackstopJS, nightly E2E)
- Güvenlik: rate limiting, FK indexes, admin auth, RBAC
- Eksik: gerçek kullanıcı testi, domain, production env vars

### Supply-Demand Dengeleme Stratejisi

İki taraflı marketplace'in en kritik sorunu **tavuk-yumurta problemi**. WorkMate için strateji: **Supply-first** (önce provider'lar).

```
Supply-First Mantığı:
Provider yok → Job post eden customer teklif alamaz → Churn
Provider var → Customer job post eder → Quote gelir → Değer döngüsü başlar
```

### İlk 90 Gün — Launch & Traction

| Hafta | Odak | Çıktı | Metrik |
|-------|------|-------|--------|
| **1-2** | Production deploy | Domain aktif, env vars set, GDPR cron deploy | Site canlı |
| **3-4** | Provider onboarding kampanyası | 20-30 founding pro davet, LinkedIn/WhatsApp outreach | Provider sign-up rate |
| **5-6** | İlk customer acquisition | Google Ads (Dublin), SEO content (5 blog post) | İlk 50 job post |
| **7-8** | Feedback loop kurulumu | In-app NPS, Hotjar/PostHog session replay | NPS > 30 |
| **9-10** | İlk iterasyon | Top 3 kullanıcı şikayetini çöz | Bug close rate |
| **11-12** | Growth experiment | Referral system aktif (migration 072 hazır), founding pro incentive | Referral conversion |

### 6 Aylık Roadmap (Ay 1-6)

| Ay | Product Focus | Engineering Focus | Hedef Metrik |
|----|--------------|-------------------|-------------|
| **1** | Launch + 30 founding pro | Deploy, monitoring, hotfix | Site uptime > 99.5% |
| **2** | İlk 100 job post | Performance opt, caching | Time-to-first-quote < 24h |
| **3** | Quote-to-win optimizasyonu | A/B test altyapısı (feature flags hazır: migration 057) | Quote-to-win > 25% |
| **4** | Provider retention | Earnings dashboard iyileştirme, payout hızı | Provider churn < 10%/ay |
| **5** | Customer retention | Review sistemi aktif, saved searches (migration 066) | Repeat booking > 15% |
| **6** | Growth scaling | SEO teknik audit, county expansion | 500+ aktif kullanıcı |

> **Tek Kişilik İpucu:** İlk 30 gün sadece launch + provider onboarding. Feature ekleme yok. "Launch etmeden feature eklemek" en yaygın solo-founder tuzağı.

> **Araç Önerisi:** Notion veya GitHub Projects ile basit Kanban: `Backlog → This Week → In Progress → Done`. Fazlası gereksiz.

> **Haftalık Zaman Dağılımı:** Ay 1-2'de Engineering %60, Product %40. Ay 3+'ten sonra Product %50, Engineering %50.

> **Geliştiricilere Direkt Aksiyon:**
> İlk hafta yapılacaklar zaten `docs/PRODUCTION_LAUNCH.md`'de tanımlı:
> 1. Supabase Pro PITR aktif et
> 2. workmate.ie domain al + Vercel bağla
> 3. `LIVE_SERVICES_ENABLED=true` Vercel'de set et
> 4. `supabase functions deploy gdpr-retention-processor`
> 5. Lighthouse baseline al

---

## 3. Teknik Mimari ve Scalability Planı

### Mevcut Mimari Güçlü Yanları

```
marketplace/
├── app/                    # 54 sayfa, App Router
│   ├── api/               # 104 endpoint — Zod + RBAC + rate limiting
│   └── [locale]/          # next-intl routing (EN-only şimdilik)
├── components/            # 152 bileşen, 21 kategori
├── lib/                   # 45 utility, 20 alt dizin
│   ├── validation/api.ts  # 40+ Zod schema (734 satır, tek dosya)
│   ├── rate-limit/        # Sliding window, 6 config
│   ├── email/             # 11 template, fire-and-forget
│   ├── supabase/          # 4 client tipi (browser/server/route/service)
│   └── auth/rbac.ts       # RBAC helpers
├── migrations/            # 74 SQL, additive-only
└── tests/                 # vitest + playwright
```

### Tek Kişiyle Sürdürülebilir Kod Kuralları

| Kural | Neden | WorkMate Uygulaması |
|-------|-------|---------------------|
| **Tek validation kaynağı** | Duplicate schema = sync bug | `lib/validation/api.ts` — 40+ schema tek dosyada |
| **Additive-only migration** | Rollback riski yok | Asla eski migration düzenleme, sonraki = 073 |
| **Fire-and-forget side effects** | Email/notification hata ana akışı kırmasın | `sendTransactionalEmail()` asla throw etmez |
| **Live services guard** | Dev'de maliyet sıfır | `LIVE_SERVICES_ENABLED` master switch |
| **RBAC iki katman** | RLS + uygulama seviyesi | Supabase RLS + `ensureAdminRoute()` |

### CI/CD Pipeline (Mevcut — 6 Workflow)

```
PR açıldığında:
  ├── workmate-ci-tests.yml    → Lint + tsc + vitest + Playwright smoke
  ├── workmate-english-only.yml → Dil kontrolü
  └── codeql.yml               → Güvenlik taraması

Nightly:
  └── workmate-nightly-e2e.yml → Tam E2E suite

Manuel:
  ├── lighthouse.yml           → Performance audit
  └── backstop.yml            → Visual regression
```

### Tech Debt Yönetim Sistemi

| Kategori | Takip Yeri | Kural |
|----------|-----------|-------|
| **P0 — Güvenlik** | GitHub Issues + `security` label | 24 saat içinde çöz |
| **P1 — Data integrity** | GitHub Issues + `data` label | Sprint içinde çöz |
| **P2 — Performance** | GitHub Issues + `perf` label | 2 sprint içinde çöz |
| **P3 — Code smell** | Kod içi `// TODO(tech-debt):` yorum | Çeyrek sonunda temizle |

```bash
# Tech debt takibi — her Çarşamba çalıştır:
grep -r "TODO(tech-debt)" marketplace/app marketplace/lib marketplace/components --include="*.ts" --include="*.tsx" | wc -l
```

### Scalability Kontrol Noktaları

| Kullanıcı Sayısı | Darboğaz | Aksiyon |
|-------------------|----------|---------|
| **0-500** | Yok | Mevcut stack yeterli |
| **500-2K** | Rate limiting (in-memory) | Redis'e geç (Upstash, $10/ay) |
| **2K-5K** | Supabase free tier | Pro plan'a geç ($25/ay) |
| **5K-10K** | Email volume | Resend Pro ($80/ay), batch API |
| **10K+** | DB connection pooling | Supabase pooler + read replicas |

> **Tek Kişilik İpucu:** Premature optimization yapma. İlk 1000 kullanıcıya kadar mevcut stack yeterli. Supabase free tier 500MB DB + 50K auth users destekliyor.

> **Araç Önerisi:** Supabase Dashboard → Database → Advisors — index önerileri ve slow query tespiti ücretsiz.

> **Haftalık Zaman Dağılımı:** Tech debt'e haftada max 3 saat ayır. Çarşamba sabahları.

> **Geliştiricilere Direkt Aksiyon:**
> ```bash
> # Migration disiplini — yeni migration oluşturma:
> # Dosya adı: marketplace/migrations/073_description.sql
> # Kural: Additive only, DROP/ALTER sadece yeni tablolar için
> # Test: Supabase MCP ile apply et, rollback planı yaz
> ```

---

## 4. Product Backlog ve Prioritizasyon

### RICE Skorlama Modeli (WorkMate Uyarlaması)

| Faktör | Ölçek | Açıklama |
|--------|-------|----------|
| **R**each | 1-5 | Kaç kullanıcıyı etkiler (1=<10, 5=tüm kullanıcılar) |
| **I**mpact | 1-5 | Etkisi ne kadar büyük (1=minimal, 5=game-changer) |
| **C**onfidence | 0.5-1.0 | Ne kadar eminiz (0.5=tahmin, 1.0=veri var) |
| **E**ffort | 1-5 | Kaç gün sürer (1=<0.5 gün, 5=>1 hafta) |

**RICE Skoru = (R x I x C) / E**

### Mevcut Backlog (MoSCoW + RICE)

#### Must Have (Launch Blocker)

| Feature | R | I | C | E | RICE | Durum |
|---------|---|---|---|---|------|-------|
| Production deploy | 5 | 5 | 1.0 | 2 | 12.5 | `docs/PRODUCTION_LAUNCH.md` hazır |
| Domain + SSL | 5 | 5 | 1.0 | 1 | 25.0 | workmate.ie satın al |
| GDPR cron deploy | 5 | 4 | 1.0 | 1 | 20.0 | Edge function hazır |
| UX testing (3-5 kişi) | 5 | 4 | 0.8 | 3 | 5.3 | Manuel |
| Mobile responsive QA | 5 | 4 | 0.8 | 2 | 8.0 | Safari + Firefox |

#### Should Have (İlk 30 Gün)

| Feature | R | I | C | E | RICE | Not |
|---------|---|---|---|---|------|-----|
| Provider onboarding email dizisi | 4 | 4 | 0.8 | 2 | 6.4 | Resend ile 3 email |
| Landing page A/B test | 5 | 3 | 0.5 | 3 | 2.5 | Feature flags hazır (057) |
| Error monitoring triage | 5 | 3 | 1.0 | 1 | 15.0 | Sentry entegre |
| Analytics dashboard genişletme | 3 | 3 | 0.8 | 2 | 3.6 | Funnel events hazır |

#### Could Have (Ay 2-3)

| Feature | R | I | C | E | RICE | Not |
|---------|---|---|---|---|------|-----|
| Push notifications | 4 | 3 | 0.5 | 4 | 1.5 | Web push, service worker |
| Multi-language (Gaeilge) | 2 | 2 | 0.8 | 5 | 0.6 | next-intl hazır ama düşük ROI |
| Provider mobile app | 3 | 4 | 0.5 | 5 | 1.2 | PWA önce, native sonra |

### Kullanıcı Feedback Yönetim Sistemi

```
Feedback Kaynakları → Tek Kutu → Prioritize → Sprint'e al

Kaynaklar:
├── In-app NPS (henüz yok — 1. ayda ekle)
├── Sentry user feedback
├── Email (contact@workmate.ie)
├── GitHub Issues (internal)
└── WhatsApp/DM (erken kullanıcılar)

Tek Kutu: GitHub Issues
├── Label: feedback/bug/feature-request/ux
├── Template: {Kaynak, Kullanıcı Rolü, Etki Skoru, Tekrar Sayısı}
└── Haftalık review: Cuma 30dk
```

> **Tek Kişilik İpucu:** Feedback'i topladığın an GitHub Issue yaz. "Sonra yazarım" = kaybolur. Issue template kullan.

> **Araç Önerisi:** GitHub Issues (ücretsiz) + label sistemi. Linear ($0/1 kişi) alternatif.

> **Haftalık Zaman Dağılımı:** Cuma sabah 1 saat: feedback triage + backlog grooming.

> **Geliştiricilere Direkt Aksiyon:**
> GitHub Issues'da şu label'ları oluştur:
> `must-have`, `should-have`, `could-have`, `tech-debt`, `bug`, `feedback`, `security`, `provider-side`, `customer-side`, `admin-side`

---

## 5. Geliştirme Süreçleri (Tek Kişilik Agile)

### Sprint Yapısı

```
Sprint Uzunluğu: 1 hafta (tek kişi için 2 hafta çok uzun)
Planlama: Pazartesi sabah 30dk
Daily standup: Self-check 5dk (sabah)
Retro: Cuma akşam 15dk
Demo: Yok (kendi kendine demo gereksiz — deploy = demo)
```

### Self-Standup Template (Her Sabah, 5 dakika)

```markdown
## Self-Standup — [Tarih]
**Dün:** [1-2 cümle]
**Bugün:** [1-2 cümle, max 3 task]
**Blocker:** [varsa]
**Enerji seviyesi:** [1-5] → 3'ün altıysa bug fix/refactor gün yap, feature ekleme
```

### Retro Template (Her Cuma, 15 dakika)

```markdown
## Haftalık Retro — Hafta [X]
**Tamamlanan:** [liste]
**Yarım kalan:** [liste + neden]
**Öğrenilen:** [1-2 madde]
**Gelecek hafta odak:** [max 3 hedef]
**Tech debt birikti mi:** [evet/hayır + aksiyon]
```

### Git Workflow

```
main (production)
  └── feature/WM-xxx-description
       └── PR → CI checks → self-review → merge → auto-deploy (Vercel)

Kurallar:
- Her feature kendi branch'inde
- PR açmadan merge yok (CI tetiklenmeli)
- Commit mesajı: feat/fix/chore/docs: açıklama
- Force push yasak (main'e kesinlikle)
- Migration PR'ları ayrı, feature PR'larından bağımsız
```

### PR Self-Review Checklist

```markdown
- [ ] tsc hata vermiyor
- [ ] Yeni endpoint varsa → Zod schema lib/validation/api.ts'de
- [ ] Yeni endpoint varsa → rate limiting uygulandı
- [ ] Admin endpoint varsa → ensureAdminRoute() kullanıldı
- [ ] Hardcoded hex yok → --wm-* token kullanıldı
- [ ] Console.log temizlendi
- [ ] Migration varsa → additive-only, rollback planı var
- [ ] Sensitive data log'lanmıyor
```

> **Tek Kişilik İpucu:** PR açıp 1 saat sonra self-review yap. "Taze göz" etkisi yaratır. Hemen merge etme.

> **Araç Önerisi:** GitHub PR template (`.github/pull_request_template.md`) + checklist. CI zaten 6 workflow çalıştırıyor.

> **Haftalık Zaman Dağılımı:** Planlama 30dk Pazartesi + standup 5dk/gün + retro 15dk Cuma = toplam ~1.5 saat/hafta.

> **Geliştiricilere Direkt Aksiyon:**
> ```bash
> # Branch oluşturma standardı:
> git checkout -b feature/WM-001-provider-onboarding-email
> # Commit standardı:
> git commit -m "feat: add provider welcome email sequence"
> ```

---

## 6. Araç Stack'i (2026, Düşük Bütçe Öncelikli)

### Mevcut Stack + Maliyet Tahmini

| Kategori | Araç | Maliyet/Ay | Durum |
|----------|------|-----------|-------|
| **Hosting** | Vercel (Hobby → Pro) | $0-20 | Aktif |
| **Database** | Supabase (Free → Pro) | $0-25 | Aktif |
| **Payments** | Stripe Connect | %2.9 + komisyon | Aktif |
| **Email** | Resend | $0 (3K/ay) → $20 | Aktif |
| **Error tracking** | Sentry | $0 (5K events) | Aktif |
| **AI** | Anthropic API | Pay-per-use (~$5-20) | Aktif |
| **CI/CD** | GitHub Actions | $0 (public) / $0 (2K dk/ay) | Aktif |
| **Domain** | workmate.ie | ~15/yıl | Bekliyor |
| **Visual regression** | BackstopJS | $0 (open source) | Aktif |
| **Monitoring** | Vercel Analytics | $0 (dahil) | Aktif |

**Toplam MVP maliyeti: ~$20-50/ay** (Supabase Pro + Resend + domain)

### Önerilen Ek Araçlar (Ücretsiz/Düşük Maliyet)

| İhtiyaç | Araç | Maliyet | Neden |
|---------|------|---------|-------|
| **Proje yönetimi** | GitHub Projects | $0 | Zaten GitHub'dasın, ekstra araç gereksiz |
| **Analytics** | PostHog (veya Vercel Analytics) | $0 (1M event) | Funnel + session replay |
| **Uptime monitoring** | BetterUptime / UptimeRobot | $0 | 5dk aralık, Slack/email alert |
| **Log yönetimi** | Supabase Logs + Sentry | $0 | Başlangıç için yeterli |
| **Kullanıcı feedback** | GitHub Issues | $0 | Label sistemiyle |
| **Zaman takibi** | Toggl Track | $0 | Product vs Engineering oranı |
| **Dokümantasyon** | Repo içi Markdown | $0 | `docs/` dizini zaten var |
| **Tasarım** | Figma (free) | $0 | 3 dosya limiti yeterli |

### Araç Ekleme Kuralı

```
Yeni araç eklemeden önce sor:
1. Mevcut araçla yapabilir miyim? (genellikle evet)
2. Ücretsiz tier'ı yeterli mi?
3. Vendor lock-in riski var mı?
4. Tek kişi için bakım yükü ne?

Kural: Ayda $50'ı geçen araç → ROI hesapla, yoksa ekleme.
```

> **Tek Kişilik İpucu:** Araç sayısını minimize et. Her araç = login + öğrenme + bakım maliyeti. 5-6 araç ideal, 10+ araç = overhead.

> **Araç Önerisi:** PostHog Self-Hosted (Docker) yerine PostHog Cloud (1M event/ay ücretsiz) — bakım yükü sıfır.

> **Haftalık Zaman Dağılımı:** Araç yönetimi haftada max 30dk. Cuma retro'da "bu hafta hangi araç beni yavaşlattı?" sorusu sor.

> **Geliştiricilere Direkt Aksiyon:**
> ```bash
> # UptimeRobot ücretsiz hesap aç, şu endpoint'leri ekle:
> # https://workmate.ie/api/health (5dk interval)
> # https://workmate.ie (5dk interval)
> # Alert: email + Slack webhook
> ```

---

## 7. Kalite Güvence ve Test Stratejisi

### Mevcut Test Altyapısı

| Katman | Araç | Dosya Sayısı | Durum |
|--------|------|-------------|-------|
| Unit/Integration | Vitest + Testing Library | 22 dosya | Config hazır, coverage düşük |
| E2E Smoke | Playwright | 10 spec | Aktif, nightly workflow var |
| Visual Regression | BackstopJS | Config var | Aktif |
| Security Scan | CodeQL | Workflow var | Aktif |
| Type Check | tsc (build içinde) | — | Her PR'da çalışıyor |
| Lint | ESLint + english-only | — | Her PR'da çalışıyor |

### Test Piramidi (Tek Kişi Gerçekliği)

```
         /  E2E Smoke  \          ← 10 test (kritik akışlar) — mevcut
        / Visual Regress \         ← BackstopJS — mevcut
       / Integration Tests \       ← API route testleri — ONCELIK
      /    Unit Tests       \      ← Zod schema + utils — ONCELIK
     /  Static Analysis (tsc) \    ← Her build'de — mevcut
    /_________________________ \
```

### Öncelikli Test Yazma Planı

| Öncelik | Ne Test Edilecek | Kaç Test | Efor |
|---------|-----------------|----------|------|
| **P0** | API route handlers (auth, payments, admin) | ~20 | 2 gün |
| **P1** | Zod schemas (edge cases, invalid input) | ~15 | 1 gün |
| **P2** | RBAC helpers (role checks, access control) | ~10 | 0.5 gün |
| **P3** | Utility functions (completeness, ranking) | ~10 | 0.5 gün |
| **P4** | Component smoke tests (render without crash) | ~20 | 2 gün |

### Manuel Test Checklist (Her Deploy Öncesi)

```markdown
## Pre-Deploy QA Checklist
### Customer Akışı
- [ ] Ana sayfa yükleniyor, CTA'lar çalışıyor
- [ ] Sign-up → email confirmation → login
- [ ] Job post → form validation → submit → result sayfası
- [ ] Provider arama → filtreler çalışıyor → profil sayfası açılıyor
- [ ] Quote kabul → secure hold → ödeme akışı

### Provider Akışı
- [ ] Become provider → apply → form submit
- [ ] Dashboard → widget'lar yükleniyor
- [ ] Quote gönder → job detail'da görünüyor
- [ ] Earnings sayfası yükleniyor

### Admin Akışı
- [ ] Admin dashboard erişim → RBAC çalışıyor
- [ ] Provider applications listesi
- [ ] Verification queue → approve/reject
- [ ] Risk assessment panel

### Teknik
- [ ] /api/health 200 dönüyor
- [ ] Sentry'de yeni hata yok
- [ ] Console'da error yok
- [ ] Mobile responsive (Chrome DevTools)
```

> **Tek Kişilik İpucu:** %100 test coverage hedefleme. Pareto kuralı: ödeme + auth + admin route'ları = toplam bug'ların %80'i. Onları test et.

> **Araç Önerisi:** `npm run test:e2e:smoke` ve `npm run test` — her PR'dan önce lokal çalıştır. CI zaten çalıştırıyor ama lokal'de 2dk'da feedback al.

> **Haftalık Zaman Dağılımı:** Çarşamba öğleden sonra 2-3 saat test yazma. Her yeni feature'da "feature + test" birlikte merge et.

> **Geliştiricilere Direkt Aksiyon:**
> ```bash
> # Mevcut test suite'i çalıştır:
> cd marketplace
> npm run test              # Vitest unit/integration
> npm run test:e2e:smoke    # Playwright smoke
> npm run test:visual       # BackstopJS visual regression
>
> # Yeni test dosyası oluşturma standardı:
> # tests/unit/api-auth-login.test.ts
> # tests/integration/job-posting-flow.test.ts
> ```

---

## 8. Teknik Dokümantasyon ve Bilgi Transferi

### Mevcut Dokümantasyon Durumu

| Dosya | Konum | İçerik | Kalite |
|-------|-------|--------|--------|
| `PROJECT_CONTEXT.md` | `ai-context/context/` | Proje bağlamı, 14 bölüm | Mükemmel |
| `PRODUCTION_LAUNCH.md` | `docs/` | 5 fazlı launch checklist | Mükemmel |
| `DB_RUNBOOK.md` | `docs/` | Migration, backup, rollback | İyi |
| `design-system.md` | `docs/` | Token sistemi, kullanım | İyi |
| `ui-architecture.md` | `docs/` | UI yapısı | İyi |
| `MEMORY.md` | `.claude/memory/` | 25 session geçmişi | İyi ama büyümüş (236 satır) |
| Claude Skills (8 adet) | `.claude/skills/` | API route, schema, launch vb. | Mükemmel |
| Checkpoint docs (5+) | `docs/` | Session bazlı snapshot'lar | İyi |

### Yeni Developer Onboarding Süreci (Hedef: 1 Gün)

```
Gün 1 — Yeni Developer Onboarding:

Saat 1: Bağlam
├── PROJECT_CONTEXT.md oku (30dk)
├── PRODUCTION_LAUNCH.md oku (15dk)
└── DB_RUNBOOK.md oku (15dk)

Saat 2: Ortam Kurulumu
├── git clone + npm install
├── .env.local kopyala (template'den)
├── npm run dev → localhost:3000 çalışıyor mu?
└── npm run health-check

Saat 3: Kod Yapısı Turu
├── app/api/ → 3 örnek route oku (auth/login, jobs, admin)
├── lib/validation/api.ts → Zod pattern'i anla
├── components/ui/ → design system token'ları
└── migrations/ → son 5 migration'ı oku

Saat 4: İlk PR
├── Basit bir bug fix veya typo düzeltme
├── PR aç → CI'ın çalıştığını gör
├── Self-review checklist uygula
└── Merge
```

### Eksik Dokümantasyon (Oluşturulması Gereken)

| Dosya | İçerik | Öncelik |
|-------|--------|---------|
| `docs/ONBOARDING.md` | Yukarıdaki 1 günlük plan | P0 |
| `docs/API_PATTERNS.md` | API route yazma kuralları (skill'den çıkar) | P1 |
| `docs/ENV_VARS.md` | Tüm env var'lar + açıklamaları | P0 |
| `.github/pull_request_template.md` | PR checklist | P1 |
| `docs/ADR/` | Architectural Decision Records (frozen decisions) | P2 |

> **Tek Kişilik İpucu:** Dokümantasyonu ayrı bir iş olarak görme. Her feature PR'ında ilgili doc'u güncelle. "Doc debt" tech debt'ten daha tehlikeli — 2. developer geldiğinde 1 hafta kayıp.

> **Araç Önerisi:** Claude Skills (`.claude/skills/`) = yaşayan dokümantasyon. 8 skill zaten var, her yeni pattern'de skill ekle.

> **Haftalık Zaman Dağılımı:** Cuma öğleden sonra 1 saat dokümantasyon güncellemesi.

> **Geliştiricilere Direkt Aksiyon:**
> İlk hafta `docs/ONBOARDING.md` ve `docs/ENV_VARS.md` oluştur. Claude skill `workmate-api-route` zaten API pattern'lerini içeriyor — bunu referans ver.

---

## 9. Ölçüm ve Analitik Kurulumu

### Marketplace-Specific Metrikler

#### Temel Metrikler (North Star)

| Metrik | Tanım | Hedef (6 ay) | Ölçüm |
|--------|-------|-------------|--------|
| **GMV** (Gross Merchandise Value) | Platform üzerinden geçen toplam ödeme | 50K | Stripe Dashboard |
| **Aktif provider sayısı** | Son 30 günde quote gönderen | 50 | Supabase query |
| **Aktif customer sayısı** | Son 30 günde job post eden | 200 | Supabase query |
| **Take rate** | Platform komisyon oranı | %10-15 | Stripe |

#### Supply-Side (Provider) Metrikleri

| Metrik | Tanım | Hedef | Mevcut Altyapı |
|--------|-------|-------|----------------|
| **Provider activation rate** | Kayıt → ilk quote süresi | <48h | `funnel_events` tablosu (migration 061) |
| **Quote-to-win ratio** | Gönderilen quote / kabul edilen | >25% | API query |
| **Time-to-first-quote** | Job post → ilk quote süresi | <24h | Timestamp diff |
| **Provider NPS** | Memnuniyet | >40 | Henüz yok — P1 |
| **Monthly provider churn** | Ay sonunda aktif olmayan | <10% | Query |
| **Founding pro fill rate** | 100 slot'tan doluluk | 30% (ay 1) | `founding_pro_config` tablosu |

#### Demand-Side (Customer) Metrikleri

| Metrik | Tanım | Hedef | Mevcut Altyapı |
|--------|-------|-------|----------------|
| **Job completion rate** | Post → completed | >60% | Job status query |
| **Repeat booking rate** | 2+ job post eden customer | >15% | Query |
| **Quote response time** | Customer'ın quote'a karar süresi | <48h | Timestamp diff |
| **Search-to-post rate** | Arama yapan → job post eden | >5% | Funnel events |

#### Operasyonel Metrikler

| Metrik | Tanım | Hedef | Mevcut Altyapı |
|--------|-------|-------|----------------|
| **Dispute rate** | Job başına dispute oranı | <2% | `disputes` tablosu |
| **Verification turnaround** | Provider başvuru → onay süresi | <24h | Admin query |
| **Uptime** | Site erişilebilirlik | >99.5% | UptimeRobot |
| **Error rate** | Sentry unresolved/hafta | <10 | Sentry dashboard |
| **P95 response time** | API yanıt süresi | <500ms | Vercel Analytics |

### Analitik Dashboard Kurulumu

```
Mevcut:
├── /dashboard/admin/analytics → Funnel visualization (CSS bars, date filter)
├── /dashboard/admin/stats → StatCards
├── Sentry → Error tracking
├── Vercel Analytics → Performance
└── Stripe Dashboard → Payment metrics

Eklenecek (P1, ücretsiz):
├── PostHog veya Vercel Web Analytics → User behavior
├── /api/metrics/quotes → Quote analytics (zaten var, admin-only)
└── Haftalık otomatik email raporu (Resend + cron)
```

> **Tek Kişilik İpucu:** İlk 30 gün sadece 3 metriğe bak: (1) provider sign-up rate, (2) job post sayısı, (3) time-to-first-quote. Geri kalanı ay 2'de ekle.

> **Araç Önerisi:** Supabase SQL Editor'de haftalık dashboard query'leri kaydet. Ücretsiz, bakım gerektirmez.

> **Haftalık Zaman Dağılımı:** Cuma sabah 30dk metrik kontrolü. Pazartesi standup'ta geçen haftanın sayılarını yaz.

> **Geliştiricilere Direkt Aksiyon:**
> ```sql
> -- Haftalık metrik query (Supabase SQL Editor'de kaydet):
> SELECT
>   COUNT(*) FILTER (WHERE role = 'provider' AND created_at > NOW() - INTERVAL '7 days') as new_providers,
>   COUNT(*) FILTER (WHERE role = 'customer' AND created_at > NOW() - INTERVAL '7 days') as new_customers
> FROM profiles;
>
> SELECT
>   COUNT(*) as total_jobs,
>   COUNT(*) FILTER (WHERE status = 'open') as open_jobs,
>   COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_jobs_this_week
> FROM jobs;
> ```

---

## 10. Riskler ve Tek Kişi Bottleneck'leri + Mitigasyon

### Risk Matrisi

| Risk | Olasılık | Etki | Risk Skoru | Mitigasyon |
|------|----------|------|-----------|------------|
| **Burnout** | Yüksek | Kritik | KIRMIZI | Haftalık max 45 saat, Pazar çalışma yasak |
| **Feature creep** | Yüksek | Yüksek | KIRMIZI | RICE skoru <3 olan feature'ı sprint'e alma |
| **Güvenlik açığı** | Orta | Kritik | KIRMIZI | CodeQL + Sentry + rate limiting + RLS |
| **Tek kişi bus factor** | Yüksek | Kritik | KIRMIZI | Dokümantasyon + Claude Skills + checkpoint'ler |
| **Tech debt birikimi** | Yüksek | Orta | SARI | Çarşamba tech debt günü |
| **Compliance riski (GDPR)** | Düşük | Kritik | SARI | GDPR cron + soft delete + audit log |
| **Stripe entegrasyon hatası** | Orta | Yüksek | SARI | Webhook idempotency (migration 059) + test mode |
| **Supabase downtime** | Düşük | Yüksek | SARI | PITR backup + health check endpoint |
| **Kalite düşüşü** | Orta | Orta | SARI | CI pipeline + pre-deploy checklist |
| **Kullanıcı kazanım başarısızlığı** | Orta | Kritik | KIRMIZI | Supply-first strateji + founding pro incentive |

### Burnout Önleme Protokolü

```
Kurallar:
1. Hafta sonu çalışma = sadece P0 hotfix
2. 3 ardışık "düşük enerji" günü → 1 gün off al
3. Her 6 haftada 1 gün "zero code" günü (sadece düşün, yaz, planla)
4. Akşam 21:00'den sonra commit yok
5. Her sprint sonunda "bu hafta ne öğrendim" yaz (cognitive reward)
```

### Bus Factor Mitigasyonu

```
Bugün bus factor = 1 (kritik risk)

Mitigasyon katmanları:
├── Katman 1: Dokümantasyon (mevcut — iyi seviyede)
│   ├── PROJECT_CONTEXT.md → proje bağlamı
│   ├── PRODUCTION_LAUNCH.md → launch süreci
│   ├── DB_RUNBOOK.md → veritabanı operasyonları
│   └── Claude Skills (8 adet) → pattern library
│
├── Katman 2: Kod kalitesi
│   ├── TypeScript strict mode → tip güvenliği
│   ├── Zod validation → runtime güvenliği
│   ├── Consistent patterns → öğrenme eğrisi düşük
│   └── No magic → her şey explicit
│
├── Katman 3: Otomasyon
│   ├── CI/CD 6 workflow → otomatik kalite kapısı
│   ├── Migration chain → DB değişiklikleri izlenebilir
│   └── Health check → sistem durumu anlık görünür
│
└── Katman 4: Harici yedek
    └── Freelancer listesi hazırla (Upwork/Toptal)
    └── "Acil durum" rehberi yaz (docs/EMERGENCY.md)
```

> **Tek Kişilik İpucu:** "Yarın otobüse çarpsam, başka biri bu projeyi 1 haftada çalıştırabilir mi?" sorusunu her ay sor. Cevap "hayır" ise dokümantasyon önceliğini artır.

> **Araç Önerisi:** `docs/EMERGENCY.md` dosyası oluştur: Supabase/Stripe/Vercel/Resend login bilgileri, rollback prosedürü, critical endpoint listesi.

> **Haftalık Zaman Dağılımı:** Risk review haftada 15dk (Cuma retro'nun parçası).

> **Geliştiricilere Direkt Aksiyon:**
> Şu 3 şeyi bu hafta yap:
> 1. `docs/EMERGENCY.md` oluştur (acil durum rehberi)
> 2. UptimeRobot'a health endpoint ekle
> 3. Sentry alert kurallarını yapılandır (error spike → email)

---

## 11. Büyüme Hazırlığı

### 2. Developer Ne Zaman Alınır?

| Sinyal | Açıklama | Aksiyon |
|--------|----------|---------|
| **Revenue > 5K/ay** | Platform commission'dan sürdürülebilir gelir | Part-time backend dev |
| **Bug backlog > 20** | Düzeltemediğin bug birikmeye başladı | Freelancer bug fix sprint |
| **Feature velocity < 1/hafta** | Artık haftada 1 feature çıkaramıyorsun | Full-time developer ara |
| **Support > 2 saat/gün** | Kullanıcı destek zamanını yiyor | Support/VA hire |
| **Uptime < 99%** | Sistem kararsız, firefighting modundasın | DevOps freelancer |

### İlk İşe Alım Sırası

```
1. Part-time Frontend Developer (ay 4-6, 2-3K/ay)
   → Dashboard iyileştirme, yeni sayfa, responsive QA
   → Onboarding: 1 gün (docs/ONBOARDING.md)

2. Virtual Assistant / Customer Support (ay 3-4, 500-1K/ay)
   → Email yanıtlama, provider onboarding yardımı
   → Araç: Intercom free tier veya email template'ler

3. Full-stack Developer (ay 6+, 4-5K/ay)
   → Feature geliştirme, tech debt, test yazma
   → Onboarding: 2 gün
```

### Dış Kaynak (Outsource) Edilebilecek İşler

| İş | Ne Zaman | Platform | Tahmini Maliyet |
|----|----------|----------|----------------|
| **Logo/brand design** | Şimdi | Fiverr/99designs | 100-300 (bir kez) |
| **Content writing (blog/SEO)** | Ay 2 | Fiverr/ContentFly | 200-500/ay |
| **Security penetration test** | Launch öncesi | Upwork | 500-1K (bir kez) |
| **Legal review (T&C, Privacy)** | Launch öncesi | İrlanda avukat | 300-500 (bir kez) |
| **Mobile app (PWA → native)** | Ay 6+ | Toptal | 3-5K (bir kez) |
| **Accountant/tax** | Launch sonrası | Lokal | 100-200/ay |

### Kod Tabanı "2. Developer Ready" Checklist

```markdown
- [x] TypeScript strict mode → tip güvenliği
- [x] Consistent API patterns → öğrenme eğrisi düşük
- [x] Centralized validation (lib/validation/api.ts)
- [x] Design system tokens (--wm-* tokens, zero hardcoded hex)
- [x] CI/CD pipeline (6 workflows)
- [x] Migration chain (74 migration, additive-only)
- [x] Claude Skills (8 pattern library)
- [ ] ONBOARDING.md → P0
- [ ] ENV_VARS.md → P0
- [ ] PR template → P1
- [ ] ADR docs → P2
- [ ] Test coverage >30% → P2
```

> **Tek Kişilik İpucu:** 2. developer'ı alana kadar "code review buddy" olarak Claude Code kullan. PR açtığında `/review-pr` komutu ile hızlı review al.

> **Araç Önerisi:** İlk hire'da Upwork üzerinden 10-20 saatlik "trial project" ver. Küçük, izole bir feature (ör: yeni bir dashboard widget). Kod kalitesini test et.

> **Haftalık Zaman Dağılımı:** Hiring düşünme zamanı: ayda 1 saat, revenue milestone'larını kontrol et.

> **Geliştiricilere Direkt Aksiyon:**
> Developer-ready checklist'teki eksik 5 maddeyi 2 hafta içinde tamamla. Özellikle `ONBOARDING.md` ve `ENV_VARS.md` — bunlar olmadan 2. developer 3 gün kaybeder.

---

## 12. İlk 30 Gün Acil Aksiyon Listesi

### Hafta 1 — Production Deploy

| # | Aksiyon | Etki | Efor | Kaynak |
|---|--------|------|------|--------|
| 1 | Supabase Pro PITR backup aktif et | KRITIK | 10dk | Dashboard |
| 2 | workmate.ie domain satın al | KRITIK | 30dk | Registrar |
| 3 | Domain'i Vercel'e bağla + SSL | KRITIK | 30dk | Vercel Dashboard |
| 4 | `LIVE_SERVICES_ENABLED=true` set et (Vercel) | KRITIK | 5dk | Vercel env vars |
| 5 | GDPR cron deploy et | KRITIK | 15dk | `supabase functions deploy` |

### Hafta 2 — Monitoring & Güvenlik

| # | Aksiyon | Etki | Efor | Kaynak |
|---|--------|------|------|--------|
| 6 | UptimeRobot hesap aç + health endpoint ekle | YUKSEK | 15dk | UptimeRobot.com |
| 7 | Sentry alert kuralları yapılandır | YUKSEK | 30dk | Sentry Dashboard |
| 8 | Lighthouse baseline al (production URL) | YUKSEK | 15dk | Chrome DevTools |
| 9 | `docs/EMERGENCY.md` acil durum rehberi yaz | YUKSEK | 1s | Markdown |
| 10 | `docs/ENV_VARS.md` tüm env var'ları dokümante et | YUKSEK | 1s | Markdown |

### Hafta 3 — Provider Onboarding

| # | Aksiyon | Etki | Efor | Kaynak |
|---|--------|------|------|--------|
| 11 | 20 founding pro aday listesi hazırla | KRITIK | 2s | LinkedIn/WhatsApp |
| 12 | Provider welcome email dizisi oluştur (3 email) | YUKSEK | 2s | Resend templates |
| 13 | `docs/ONBOARDING.md` yeni developer rehberi yaz | YUKSEK | 1s | Markdown |
| 14 | GitHub Issues label sistemi kur | ORTA | 15dk | GitHub |
| 15 | `.github/pull_request_template.md` oluştur | ORTA | 30dk | Markdown |

### Hafta 4 — Feedback & İterasyon

| # | Aksiyon | Etki | Efor | Kaynak |
|---|--------|------|------|--------|
| 16 | 3-5 kişiyle UX test seansı yap | KRITIK | 3s | Zoom/yüz yüze |
| 17 | UX test bulgularından top 3 bug'ı düzelt | KRITIK | 3-4s | Kod |
| 18 | Safari + Firefox + mobile responsive QA | YUKSEK | 2s | Manuel test |
| 19 | Haftalık metrik query'lerini Supabase'e kaydet | ORTA | 1s | SQL Editor |
| 20 | İlk haftalık retro yaz + MEMORY.md güncelle | ORTA | 30dk | Markdown |

### Özet Timeline

```
Hafta 1: LAUNCH (deploy + domain + env vars)
Hafta 2: KORUMA (monitoring + docs + güvenlik)
Hafta 3: SUPPLY (provider onboarding + outreach)
Hafta 4: ITERASYON (UX test + fix + metrikler)
```

> **Tek Kişilik İpucu:** İlk 2 hafta SIFIR yeni feature. Sadece deploy + monitor + stabilize. Feature eklemek isteyeceksin — diren.

> **Araç Önerisi:** Bu 20 maddeyi GitHub Projects'te bir "Launch Sprint" board'una ekle. Her maddeyi tamamladıkça işaretle.

> **Haftalık Zaman Dağılımı:** İlk 30 gün: %30 ops/deploy, %30 outreach/product, %20 bug fix, %20 docs.

> **Geliştiricilere Direkt Aksiyon:**
> Bu listeyi kopyala, GitHub Issues'a 20 ayrı issue olarak oluştur, `launch-sprint` label'ı ekle. Her gün 1-2 madde kapat.

---

## Bu Raporu Uygulamak İçin Geliştiricilerden (ve Benden) İstediğim İlk 3 Şey

### 1. Bu Hafta Production'a Deploy Et
Kod hazır. 74 migration uygulanmış, 6 CI workflow çalışıyor, güvenlik audit yapılmış. `docs/PRODUCTION_LAUNCH.md`'deki 5 fazı sırayla takip et. Erteleme = feature creep riski.

```bash
# Adım 1: Domain al (workmate.ie)
# Adım 2: Vercel'e bağla
# Adım 3: Env vars set et (özellikle LIVE_SERVICES_ENABLED=true)
# Adım 4: supabase functions deploy gdpr-retention-processor
# Adım 5: Lighthouse baseline al
```

### 2. 20 Founding Pro Bul ve Kişisel Olarak Davet Et
Marketplace'in değeri = provider kalitesi. LinkedIn'de Dublin/Cork/Galway'deki hizmet sağlayıcıları bul. Her birine kişisel mesaj at. Platform commission'ı ilk 3 ay %0 teklif et (founding pro migration 071 + referral 072 hazır).

### 3. `docs/ONBOARDING.md` + `docs/ENV_VARS.md` + `docs/EMERGENCY.md` Yaz
Bus factor = 1. Yarın hasta olursan, freelancer'ın projeyi 1 günde çalıştırabilmesi lazım. Bu 3 dosya = sigortanız.

---

> **Son not:** Bu rapor WorkMate'in gerçek kod tabanı, migration'ları, CI/CD pipeline'ı ve mevcut dokümantasyonu incelenerek hazırlanmıştır. Genel geçer tavsiyeler değil, projenin somut durumuna dayalı aksiyon planıdır. Her bölümdeki komutlar ve dosya yolları doğrudan uygulanabilir.
