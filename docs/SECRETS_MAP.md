> **Scope note:** This document covers environment variables and service setup only. It is not a source of truth for AI rules or frozen decisions.
> Canonical AI sources: `ai-context/context/agents.md` · `ai-context/context/PROJECT_CONTEXT.md` · `ai-context/decisions/index.md`

# WorkMate — Secrets, API Keys & Service Setup Guide

> **Tek kaynak.** Yeni bir key eklendiğinde veya servis değiştiğinde bu dosyayı güncelle.
> `.env.local` → local dev | Vercel → production | GitHub Secrets → CI/CD | OS Env → geliştirici makinesi (MCP)

---

## Hızlı Referans — Hangi Key Nerede?

| Key | `.env.local` | Vercel | GitHub | OS Env |
|-----|:---:|:---:|:---:|:---:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | — | — |
| `SUPABASE_ACCESS_TOKEN` | — | — | — | ✅ |
| `STRIPE_SECRET_KEY` | ✅ test | ✅ live | — | — |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ test | ✅ live | — | — |
| `STRIPE_CONNECT_CLIENT_ID` | ✅ | ✅ | — | — |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ | — | — |
| `STRIPE_WEBHOOK_SECRETVercel` | ✅ | ✅ | — | — |
| `RESEND_API_KEY` | ✅ | ✅ | — | ✅ |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | — | — |
| `SENTRY_DSN` | ✅ | ✅ | — | — |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | ✅ | — | — |
| `SENTRY_AUTH_TOKEN` | ✅ | ✅ | — | — |
| `SENTRY_ACCESS_TOKEN` | — | — | — | ✅ |
| `SENTRY_ORG` | ✅ | ✅ | — | — |
| `SENTRY_PROJECT` | ✅ | ✅ | — | — |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | ✅ | — | — |
| `TURNSTILE_SECRET_KEY` | ✅ | ✅ | — | — |
| `CLOUDFLARE_AI_GATEWAY_URL` | ✅ | ✅ | — | — |
| `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | ✅ | ✅ | — | — |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | ✅ | ✅ | — | — |
| `CLOUDFLARE_R2_SECRET_KEY` | ✅ | ✅ | — | — |
| `CLOUDFLARE_R2_BUCKET_NAME` | ✅ | ✅ | — | — |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | ✅ | — | — |
| `ADDRESS_PROVIDER` | ✅ | ✅ | — | — |
| `IDEAL_POSTCODES_API_KEY` | ✅ | ✅ | — | — |
| `LOQATE_API_KEY` | ✅ | ✅ | — | — |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ | ✅ | — | — |
| `TASK_ALERT_SECRET` | ✅ | ✅ | — | — |
| `CRON_SECRET` | ✅ | ✅ | — | — |
| `NEXTAUTH_SECRET` | ✅ | ✅ | — | — |
| `NEXTAUTH_URL` | ✅ | ✅ | — | — |
| `NEXT_PUBLIC_PLATFORM_BASE_URL` | ✅ | ✅ | — | — |
| `LIVE_SERVICES_ENABLED` | — | ✅ | — | — |
| `EMAIL_SEND_ENABLED` | — | ✅ | — | — |
| `AI_CALLS_ENABLED` | — | ✅ | — | — |
| `REQUIRE_GUEST_EMAIL_VERIFICATION` | — | ✅ | — | — |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | — | — | — | ✅ |
| `VERCEL_API_TOKEN` | — | — | — | ✅ |
| `E2E_CUSTOMER_EMAIL` | — | — | ✅ | — |
| `E2E_CUSTOMER_PASSWORD` | — | — | ✅ | — |
| `E2E_ADMIN_EMAIL` | — | — | ✅ | — |
| `E2E_ADMIN_PASSWORD` | — | — | ✅ | — |
| `SLACK_WEBHOOK_URL` | — | — | ✅ opt | — |

---

## Servis Kurulum Rehberi

### 1. Supabase
**Nedir:** Veritabanı, Auth, Storage, Edge Functions

**Kurulum:**
1. [supabase.com](https://supabase.com) → New Project → `workmate-ie`
2. Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL (`https://xxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (gizli! backend only)
3. Account → Access Tokens → New token → `WorkMate_MCP`:
   - `SUPABASE_ACCESS_TOKEN` = `sbp_...` (sadece MCP için, OS env)
4. Tüm migration'ları uygula: `001` → `079` (bkz. `docs/DB_RUNBOOK.md`)
5. Auth → Email confirmation'ı prod'da enable et

**Kullanım yerleri:**
- `lib/supabase/` — server/client/admin istemcileri
- `middleware.ts` / `proxy.ts` — session auth
- Tüm API route'ları

---

### 2. Stripe Connect
**Nedir:** Ödeme altyapısı, provider'lara ödeme dağıtımı

**Kurulum:**
1. [dashboard.stripe.com](https://dashboard.stripe.com) → Test mode ile başla
2. Developers → API Keys:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (dev) / `sk_live_...` (prod)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` / `pk_live_...`
3. Connect → Settings → `STRIPE_CONNECT_CLIENT_ID` = `ca_...`
4. Webhooks → Add endpoint:
   - Dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Prod Vercel: `https://workmate.ie/api/webhooks/stripe`
   - Events: `payment_intent.*`, `account.*`, `checkout.session.*`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
5. Prod'a çıkarken: live mode'a geç, Stripe'tan live key'leri al

**Kullanım yerleri:**
- `lib/stripe/` — Stripe istemcisi
- `app/api/webhooks/stripe/` — webhook handler
- `app/api/payments/` — ödeme API'leri

---

### 3. Resend
**Nedir:** Transactional email servisi

**Kurulum:**
1. [resend.com](https://resend.com) → API Keys → Create:
   - Name: `WorkMate_Production`
   - Permission: Sending access
   - `RESEND_API_KEY` = `re_...`
2. Domains → Add Domain → `mail.workmate.ie`
   - DNS kayıtlarını Cloudflare'e ekle (MX, SPF, DKIM)
   - Domain verify olana kadar onaylı adrese gönderebilirsin
3. Dev'de email göndermek için: `.env.local`'a `EMAIL_SEND_ENABLED=true` ekle

**Kullanım yerleri:**
- `lib/email/` — email şablonları ve gönderim
- `app/api/` — bildirim, doğrulama, onay emailleri

---

### 4. Anthropic (Claude AI)
**Nedir:** AI destekli içerik üretimi (proje açıklamaları, SEO içerikleri)

**Kurulum:**
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
2. Dev'de AI çağrıları yapmak için: `.env.local`'a `AI_CALLS_ENABLED=true` ekle
3. Prod'da `AI_CALLS_ENABLED=true` + `LIVE_SERVICES_ENABLED=true` Vercel'de set et

**Kullanım yerleri:**
- `app/api/ai/` — AI writer endpoint'leri
- Maliyet kontrolü: `lib/live-services.ts` master switch

---

### 5. Sentry
**Nedir:** Hata takibi ve performans izleme

**Kurulum:**
1. [sentry.io](https://sentry.io) → New Project → Next.js → `workmate`
2. Settings → Projects → workmate → DSN:
   - `SENTRY_DSN` = `https://xxx@xxx.sentry.io/xxx`
   - `NEXT_PUBLIC_SENTRY_DSN` = aynı değer (browser'a açık)
3. Settings → Organization → `SENTRY_ORG` = org slug (URL'de görünür)
4. Settings → Projects → `SENTRY_PROJECT` = proje slug
5. Account → API → Auth Tokens → Create:
   - **Build token** (`SENTRY_AUTH_TOKEN`): `project:releases`, `org:read` — Next.js build sırasında source map upload için
   - **MCP token** (`SENTRY_ACCESS_TOKEN`): `org:read`, `project:read/write`, `event:read/write`, `alerts:read/write`, `member:read`, `team:read` — sadece OS env, Claude Code MCP için

> **Önemli:** `SENTRY_AUTH_TOKEN` (build) ≠ `SENTRY_ACCESS_TOKEN` (MCP) — ayrı tokenlar olabilir veya aynı token her iki env var'a atanabilir.

**Kullanım yerleri:**
- `sentry.*.config.ts` — Sentry yapılandırması
- `next.config.ts` → `withSentryConfig`

---

### 6. Cloudflare
**Nedir:** CDN, Turnstile CAPTCHA, AI Gateway, Web Analytics, R2 Object Storage

**Alt servisler ve kurulum:**

#### 6a. Turnstile (Bot Koruması)
1. [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add Site
2. Domain: `workmate.ie`, Widget type: Managed
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = site key (public)
   - `TURNSTILE_SECRET_KEY` = secret key

#### 6b. AI Gateway
1. Cloudflare → AI → AI Gateway → Create
2. Gateway URL'yi kopyala:
   - `CLOUDFLARE_AI_GATEWAY_URL` = `https://gateway.ai.cloudflare.com/v1/xxx/workmate/`
3. Bu URL Anthropic API çağrılarını proxy'ler → rate limit + logging

#### 6c. Web Analytics
1. Cloudflare → Web Analytics → Add Site → `workmate.ie`
   - `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` = token

#### 6d. R2 Object Storage (Dosya Yükleme)
1. Cloudflare → R2 → Create Bucket → `workmate-uploads`
   - `CLOUDFLARE_R2_BUCKET_NAME` = `workmate-uploads`
2. R2 → Manage API Tokens → Create:
   - `CLOUDFLARE_R2_ACCESS_KEY_ID` = access key
   - `CLOUDFLARE_R2_SECRET_KEY` = secret key
3. Cloudflare Account ID (sağ sidebar'da):
   - `CLOUDFLARE_ACCOUNT_ID` = account ID

**Kullanım yerleri:**
- `app/api/upload/` — R2 presign
- `components/auth/SignUpForm.tsx` — Turnstile
- `lib/ai/` — AI Gateway proxy

---

### 7. Ideal Postcodes (İrlanda Adres / Eircode)
**Nedir:** İrlanda Eircode doğrulama ve adres otomatik tamamlama

**Kurulum:**
1. [ideal-postcodes.co.uk](https://ideal-postcodes.co.uk) → API Keys → Create
   - `IDEAL_POSTCODES_API_KEY` = `iddqd_...`
2. `.env.local`:
   ```
   ADDRESS_PROVIDER=ideal_postcodes
   IDEAL_POSTCODES_API_KEY=iddqd_...
   ADDRESS_LOOKUP_ENABLED=true
   ```
3. Alternatif: Loqate API (`ADDRESS_PROVIDER=loqate`)
4. Prod'a çıkmadan DirectAddress.ie ile Eircode API ve DPA imzalanmalı

**Kullanım yerleri:**
- `lib/ireland/eircode.ts` — Eircode doğrulama
- `app/api/address/` — adres lookup endpoint'i

---

### 8. Google Analytics (Opsiyonel)
**Nedir:** Web analytics (Cloudflare Analytics varsa gerekmeyebilir)

**Kurulum:**
1. [analytics.google.com](https://analytics.google.com) → New Property → G-XXXXXXXX
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXX`
2. GA4 + Consent Mode v2 entegrasyonu gerektirir (GDPR)

---

### 9. Vercel (Hosting)
**Nedir:** Next.js deployment platformu

**Kurulum:**
1. [vercel.com](https://vercel.com) → Import Git Repository → `WorkMate`
2. Root Directory: `marketplace`
3. Framework: Next.js (auto-detect)
4. Environment Variables: Tüm production key'leri ekle (bkz. aşağıdaki liste)
5. Custom Domain: `workmate.ie` → Settings → Domains
6. Cron Jobs: `vercel.json` içinde tanımlı (`hobby` vs `pro` plan — `docs/vercel-cron-*.json`)

**MCP için:**
- Settings → Tokens → Create → `WorkMate_Vercel_API_TOKEN`
  - `VERCEL_API_TOKEN` = `vcp_...` (sadece OS env)
- Claude Code MCP: `https://mcp.vercel.com` (OAuth ile bağlan)

---

### 10. GitHub
**Nedir:** Kaynak kod yönetimi + CI/CD (GitHub Actions)

**Kurulum:**
1. Repo: `github.com/[kullanıcı]/WorkMate`
2. Settings → Secrets and variables → Actions → GitHub Secrets:
   ```
   NEXT_PUBLIC_SUPABASE_URL       → Supabase project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY  → Supabase anon key
   E2E_CUSTOMER_EMAIL             → test müşteri emaili
   E2E_CUSTOMER_PASSWORD          → test müşteri şifresi
   E2E_ADMIN_EMAIL                → admin@workmate.ie
   E2E_ADMIN_PASSWORD             → admin şifresi
   SLACK_WEBHOOK_URL              → (opsiyonel) nightly E2E failure bildirimi
   ```
3. MCP için Personal Access Token:
   - Settings → Developer Settings → Personal Access Tokens (Fine-grained)
   - `GITHUB_PERSONAL_ACCESS_TOKEN` = `github_pat_...` (sadece OS env)

---

## Vercel Production — Tam Env Var Listesi

Vercel Dashboard → Project → Settings → Environment Variables → Production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (MUTLAKA live keyler!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_WEBHOOK_SECRETVercel=whsec_live_...

# Email
RESEND_API_KEY=re_...

# AI
ANTHROPIC_API_KEY=sk-ant-...
CLOUDFLARE_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/...

# Sentry
SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntryu_...
SENTRY_ORG=workmate-wz
SENTRY_PROJECT=workmate

# Cloudflare
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
NEXT_PUBLIC_CF_ANALYTICS_TOKEN=xxx
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=workmate-uploads
CLOUDFLARE_ACCOUNT_ID=xxx

# Address
ADDRESS_PROVIDER=ideal_postcodes
ADDRESS_LOOKUP_ENABLED=true
IDEAL_POSTCODES_API_KEY=iddqd_...

# Analytics (opsiyonel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX

# App
NEXT_PUBLIC_PLATFORM_BASE_URL=https://workmate.ie
NEXTAUTH_SECRET=<random 64-char>
NEXTAUTH_URL=https://workmate.ie
TASK_ALERT_SECRET=<random 32-char hex>
CRON_SECRET=<random 32-char hex>

# Feature flags — PROD'DA TRUE!
LIVE_SERVICES_ENABLED=true
EMAIL_SEND_ENABLED=true
AI_CALLS_ENABLED=true
REQUIRE_GUEST_EMAIL_VERIFICATION=true
```

---

## OS Environment Variables (Geliştirici Makinesi — MCP)

PowerShell ile set etmek için:
```powershell
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'sbp_...', 'User')
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'github_pat_...', 'User')
[System.Environment]::SetEnvironmentVariable('RESEND_API_KEY', 're_...', 'User')
[System.Environment]::SetEnvironmentVariable('SENTRY_ACCESS_TOKEN', 'sntryu_...', 'User')
[System.Environment]::SetEnvironmentVariable('VERCEL_API_TOKEN', 'vcp_...', 'User')
```

> **Dikkat:** Vercel MCP → `https://mcp.vercel.com` — OAuth ile bağlanır, token gerekmez.
> `VERCEL_API_TOKEN` yalnızca Vercel CLI veya başka araçlar için saklanıyor.

---

## Prod'a Çıkmadan Rotate Edilecekler

- [ ] `SUPABASE_ACCESS_TOKEN` — Supabase personal token
- [ ] `GITHUB_PERSONAL_ACCESS_TOKEN` — GitHub PAT
- [ ] `RESEND_API_KEY` — Resend API key
- [ ] `VERCEL_API_TOKEN` — Vercel API token

---

## Güvenlik Notları

- `.env.local` → gitignore'da, asla commit etme
- `.mcp.json` → gitignore'da, token içermiyor (OS env'den okuyor)
- `SENTRY_AUTH_TOKEN` (build) ≠ `SENTRY_ACCESS_TOKEN` (MCP) — isimlere dikkat
- Stripe: dev'de `sk_test_`, prod'da `sk_live_` — karıştırma
- `SUPABASE_SERVICE_ROLE_KEY` → sadece backend, asla client'a verme
