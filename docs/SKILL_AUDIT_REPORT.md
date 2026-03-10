# WorkMate Skill Audit Report

**Date:** 2026-03-10
**Auditor:** Claude Opus 4.6 (Skill Manager Agent)
**Scope:** All rules, standards, frozen decisions, guardrails, skills, and decision records
**Sources Scanned:** 7 documentation files, 9 project skills, 8 user skills, 6 decision records, config files, lib/ guardrails

---

## 1. Executive Summary

### Genel Durum Puanı: 6.5 / 10

| Alan | Puan | Not |
|------|------|-----|
| Güvenlik temeli | 9/10 | RLS, Zod, RBAC, HMAC webhooks, rate limiting — sağlam |
| Kural tutarlılığı | 4/10 | Aynı kural 4-6 kaynakta tekrarlanıyor, drift kaçınılmaz |
| Dokümantasyon güncelliği | 5/10 | Migration count 5 dosyada yanlış, 3 stale risk |
| Audit kapsamı | 6/10 | Schema Guardian sadece 12/22 FD'yi audit ediyor |
| Skill organizasyonu | 7/10 | İyi yapı ama 1 overlap (front-engineer ≈ frontend-design) |
| Otomasyon | 7/10 | Pre-commit hook aktif, Backstop/Lighthouse gate tanımlı |

### En Kritik 5 Bulgu

1. **Migration count 5 dosyada eski** — 059 yazıyor, gerçek 073. Yeni migration oluşturulurken çakışma riski.
2. **Schema Guardian sadece FD-01–12 audit ediyor** — FD-13–22 (contrast, theme, file org, pre-commit) kapsam dışı.
3. **CONTRIBUTING.md "strict mode enabled" diyor** ama `tsconfig.json` → `strict: false`. Yanıltıcı.
4. **Aynı kural 4-6 kaynakta tekrarlanıyor** — Supabase client kuralı 6 yerde, money kuralı 4 yerde. Güncelleme yapıldığında drift oluşuyor.
5. **ARCHITECTURE_REVIEW.md 3 risk artık yanlış** — pre-commit var, error helpers eklendi, bazı risk'ler çözüldü.

### Hızlı Kazanım 5 Aksiyon

| # | Aksiyon | Çaba | Etki |
|---|---------|------|------|
| 1 | Migration count → 073 (5 dosya) | 30dk | Yanlış yönlendirmeyi kaldırır |
| 2 | Schema Guardian → FD-01–22 genişlet | 1 saat | 10 FD'yi audit kapsamına alır |
| 3 | ARCHITECTURE_REVIEW stale risk güncelle | 30dk | Yanlış bilgiyi düzeltir |
| 4 | CONTRIBUTING.md TS strict → "strict: false (planned)" | 10dk | Çakışmayı giderir |
| 5 | PRODUCTION_LAUNCH.md migration count güncelle | 10dk | Yanlış yönlendirmeyi kaldırır |

---

## 2. Skill Inventory

### 2a. Frozen Decisions (FD-01 → FD-22)

| Skill ID | Kategori | Kural | Kaynak | Kanıt | Durum |
|----------|----------|-------|--------|-------|-------|
| FD-01 | Validation | Tüm Zod şemaları `lib/validation/api.ts`'de | agents.md:253 | 749 satır, 60+ şema | Geçerli |
| FD-02 | UX | Her data-fetching page'de `loading.tsx` | agents.md:254 | 54 loading.tsx | Geçerli |
| FD-03 | Design | CSS `--wm-*` token'ları only | agents.md:255 | globals.css 60+ token | Geçerli |
| FD-04 | Design | `<Button>` always, raw button yasak | agents.md:256 | components/ui/Button.tsx | Geçerli |
| FD-05 | Design | `<PageHeader>` always | agents.md:257 | components/ui/PageHeader.tsx | Geçerli |
| FD-06 | UX | `<EmptyState>` on every list | agents.md:258 | components/ui/EmptyState.tsx | Geçerli |
| FD-07 | Design | Responsive grid `sm:grid-cols-2 lg:grid-cols-3` | agents.md:259 | Kod genelinde uygulanıyor | Geçerli |
| FD-08 | Security | Supabase per-context client, singleton yasak | agents.md:260 | 4 client dosyası | Geçerli |
| FD-09 | Finance | Money = integer cents, EUR only | agents.md:261 | `*_amount_cents` pattern | Geçerli |
| FD-10 | Security | RLS never `FOR ALL USING (true)` | agents.md:262 | 72 migration dosyası | Geçerli |
| FD-11 | Routing | No hardcoded `/en/` | agents.md:263 | lib/i18n/locale-path.ts | Geçerli |
| FD-12 | Security | Webhooks HTTPS + HMAC-SHA256 | agents.md:264 | lib/webhook/send.ts | Geçerli |
| FD-13 | Design | Contrast — semantic text tokens | agents.md:265 | — | Geçerli, **guardian eksik** |
| FD-14 | Design | Light theme locked, no auto dark | agents.md:266 | html data-theme="light" | Geçerli, **guardian eksik** |
| FD-15 | Design | No page-level opacity on content | agents.md:267 | — | Geçerli, **guardian eksik** |
| FD-16 | Org | Ireland logic → `lib/ireland/` | agents.md:268 | lib/ireland/index.ts | Geçerli, **guardian eksik** |
| FD-17 | Org | Static data → `lib/data/` | agents.md:269 | lib/data/index.ts | Geçerli, **guardian eksik** |
| FD-18 | Org | Stripe SDK → `lib/stripe/client.ts` | agents.md:270 | lib/stripe/client.ts | Geçerli, **guardian eksik** |
| FD-19 | Org | Feature comp → domain dir, not dashboard/ | agents.md:271 | components/jobs/ etc. | Geçerli, **guardian eksik** |
| FD-20 | Org | No orphaned files in lib/ root | agents.md:272 | live-services.ts, i18n.ts | Geçerli, **guardian eksik** |
| FD-21 | Org | components/ui/index.ts barrel updated | agents.md:273 | 26 export | Geçerli, **guardian eksik** |
| FD-22 | Quality | Pre-commit hooks never bypassed | agents.md:274 | .husky/pre-commit | Geçerli, **guardian eksik** |

### 2b. Technical Guardrails (agents.md Rules 1–18)

| Skill ID | Kategori | Kural | Kaynak | Durum |
|----------|----------|-------|--------|-------|
| GR-01 | Policy | English only | agents.md:49-51 | Geçerli |
| GR-02 | Policy | Ireland-first | agents.md:53-55 | Geçerli |
| GR-03 | Legal | No copy competitor legal text | agents.md:58-59 | Geçerli |
| GR-04 | Legal | Ireland terminology (PPSN, TIN) | agents.md:63-66 | Geçerli |
| GR-05 | Arch | Remove dead code, centralize SoT | agents.md:68-71 | Geçerli |
| GR-06 | Quality | Pre-commit: lint+test; PR: Backstop+Lighthouse | agents.md:73-80 | Geçerli |
| GR-07 | Delivery | Explain risky changes, provide alternatives | agents.md:82-86 | Geçerli |
| GR-07.1 | Delivery | Flow maturity execution order | agents.md:88-94 | Geçerli |
| GR-08 | UI | No raw page-level CSS, use tokens+primitives | agents.md:96-107 | Geçerli |
| GR-09 | Security | Supabase client STRICT import rule | agents.md:113-135 | Geçerli, FD-08 ile overlap |
| GR-10 | Routing | Locale STRICT path rule | agents.md:137-153 | Geçerli, FD-11 ile overlap |
| GR-11 | Finance | Money STRICT currency rule | agents.md:155-159 | Geçerli, FD-09 ile overlap |
| GR-12 | Security | Database STRICT RLS + migration count | agents.md:161-166 | **ESKİ: 059 → 073** |
| GR-13 | Validation | Zod API validation rule | agents.md:168-171 | Geçerli, FD-01 ile overlap |
| GR-14 | Arch | Dashboard widget STRICT extension rule | agents.md:173-177 | Geçerli |
| GR-15 | Security | Webhook + public API rules | agents.md:179-182 | Geçerli, FD-12 ile overlap |
| GR-16 | Validation | Ireland validation rules | agents.md:184-187 | Geçerli |
| GR-17 | Process | Skill activation guide | agents.md:189-211 | Geçerli |
| GR-17.1 | Security | MCP pilot matrix | agents.md:212-227 | **STALE: pilot bitti** |
| GR-17.2 | Security | MCP security note | agents.md:229-240 | Geçerli |

### 2c. Decision Records (DR-001 → DR-006)

| ID | Konu | Tarih | Durum |
|----|------|-------|-------|
| DR-001 | AI Context Consolidation | 2026-03-08 | Accepted |
| DR-002 | Hybrid UI Strategy | 2026-03-09 | Accepted |
| DR-003 | Cancellation/Refund Policy | 2026-03-09 | Accepted |
| DR-004 | Provider Funnel Standardization | 2026-03-09 | Accepted |
| DR-005 | Flow Maturity Consolidation | 2026-03-09 | Accepted |
| DR-006 | MCP Read-Only Pilot | 2026-03-09 | **STALE — pilot tamamlandı, status → completed** |

### 2d. Project Skills (9 skill)

| Skill | Durum |
|-------|-------|
| workmate-core | Geçerli, **migration count eski** |
| workmate-schema-guardian | **Eksik: FD-13–22 audit kapsamında değil** |
| workmate-api-route | Geçerli |
| workmate-dashboard-widget | Geçerli |
| workmate-production-launch | **Migration count eski** |
| workmate-front-engineer | **frontend-design ile merge edilecek** |
| workmate-seed-ireland | Geçerli |
| workmate-visual-qa | Geçerli |
| ui-system-hybrid-migration | Geçerli |

### 2e. User Skills (WorkMate-specific, 8 skill)

| Skill | Durum |
|-------|-------|
| supabase-migration-guardian | Geçerli |
| stripe-connect-payment-ops | Geçerli |
| provider-onboarding-qa-ie | Geçerli |
| admin-dashboard-live-qa | Geçerli |
| task-alerts-rls-smoke | Geçerli |
| locale-route-guard-next-intl | Geçerli |
| webapp-testing | Geçerli |
| security-best-practices | Geçerli |

---

## 3. Conflict Matrix

| # | Çakışma | Kaynak A | Kaynak B | Neden | Çözüm |
|---|---------|----------|----------|-------|-------|
| C-01 | Migration count | agents.md Rule 12 (059) | MEMORY.md (073) | MEMORY doğru, doku eski | Tüm dosyaları 073'e güncelle |
| C-02 | Migration count | CONTRIBUTING.md (059) | MEMORY.md (073) | Aynı | Güncelle |
| C-03 | Migration count | PROJECT_CONTEXT.md (058 applied) | MEMORY.md (072 applied) | Aynı | Güncelle |
| C-04 | Migration count | PRODUCTION_LAUNCH.md (049/050) | MEMORY.md (072 applied) | Aynı | Güncelle |
| C-05 | Migration count | workmate-core skill (059) | MEMORY.md (073) | Aynı | Güncelle |
| C-06 | TS strict | CONTRIBUTING.md ("strict enabled") | tsconfig.json (`strict: false`) | Doku yanlış | Doku → "strict: false (planned)" |
| C-07 | Pre-commit | ARCHITECTURE_REVIEW (Risk #3: yok) | .husky/pre-commit (var) | Rapor eski | Raporu güncelle |
| C-08 | FD audit kapsamı | schema-guardian (FD-01–12) | agents.md (FD-01–22) | Skill güncellenmedi | Guardian'ı 22'ye genişlet |
| C-09 | Kural tekrarı | GR-09 ≈ FD-08 (Supabase) | agents.md içinde overlap | Gereksiz tekrar | SoT: agents.md, skills referans |
| C-10 | Skill overlap | workmate-front-engineer | frontend-design (user) | %90 aynı içerik | Merge: front-engineer kalsın |
| C-11 | MCP pilot | DR-006 (pilot aşama) | Gerçek kullanım (aktif) | Pilot tamamlandı | DR-006 → completed |

---

## 4. Gap Analysis

| Eksik Kural | Risk | Öneri |
|-------------|------|-------|
| `next/image` zorunluluğu — raw `<img>` kullanılıyor | Medium | FD-23 adayı: `next/image` required for all images |
| API error response helper zorunluluğu | Medium | FD-24 adayı: `apiError*` helpers from `lib/api/error-response.ts` required |
| Minimum test coverage hedefi tanımlı değil | Low | P2: Test coverage threshold guardrail |
| Rate limiting distributed state (in-memory only) | Low | MVP kabul edilebilir, prod'da monitoring |

---

## 5. Deprecation List

| Eski Kural/Bilgi | Kaynak | Güncelleme |
|------------------|--------|------------|
| "Next migration = 059" | agents.md, CONTRIBUTING.md, PROJECT_CONTEXT.md, workmate-core | → 073 |
| "Migrations 001–058 applied" | PROJECT_CONTEXT.md | → 001–072 applied |
| "Migrations 001–049/050" | PRODUCTION_LAUNCH.md | → 001–072 |
| "No pre-commit hooks" (Risk #3) | ARCHITECTURE_REVIEW.md | Kaldır — artık var |
| "55 API routes raw NextResponse" (Risk #2) | ARCHITECTURE_REVIEW.md | Güncelle — error-response.ts helper eklendi |
| DR-006 "pilot" status | ai-context/decisions/DR-006 | → status: completed |
| "Strict mode enabled" | CONTRIBUTING.md | → "strict: false (planned)" |
| frontend-design skill (user-level) | ~/.claude/skills/ | → workmate-front-engineer ile merge |

---

## 6. Simplification Proposals

### P0 — Acil (yanlış bilgi, güvenlik riski)

| ID | Eylem | Gerekçe | Etki Alanı | Risk | Mitigasyon | Çaba | Öncelik |
|----|-------|---------|------------|------|------------|------|---------|
| SKILL-001 | **Update:** Migration count → 073 | 5 dosyada eski sayı. Yeni migration oluşturulurken çakışma riski. | agents.md Rule 12, CONTRIBUTING.md, PROJECT_CONTEXT.md, workmate-core SKILL.md, PRODUCTION_LAUNCH.md | None | — | S | **P0** |
| SKILL-002 | **Update:** Schema Guardian → FD-01–22 | 10 Frozen Decision audit kapsamı dışında. Violation tespit edilemiyor. | .claude/skills/workmate-schema-guardian/SKILL.md | None | — | M | **P0** |

### P1 — Önemli (tutarsızlık, bakım maliyeti)

| ID | Eylem | Gerekçe | Etki Alanı | Risk | Mitigasyon | Çaba | Öncelik |
|----|-------|---------|------------|------|------------|------|---------|
| SKILL-003 | **Update:** ARCHITECTURE_REVIEW stale risks | 3 risk artık yanlış bilgi veriyor. | docs/ARCHITECTURE_REVIEW.md | None | — | S | **P1** |
| SKILL-004 | **Merge:** frontend-design → workmate-front-engineer | %90 overlap, iki skill arasında kafa karışıklığı. | workmate-front-engineer/SKILL.md | None | — | S | **P1** |
| SKILL-005 | **Update:** CONTRIBUTING.md TS strict | "strict enabled" yanlış. Katkıda bulunanları yanıltıyor. | CONTRIBUTING.md | None | — | S | **P1** |
| SKILL-006 | **Refactor:** agents.md = SoT, diğerleri referans | Kural tekrarını azaltır (4-6x → 1x + referans). Gelecek drift'i önler. | CONTRIBUTING.md, PROJECT_CONTEXT.md | Low — mevcut metni kısaltmak bilgi kaybına yol açabilir | Referans linklerini net yaz, kısa özet koru | M | **P1** |

### P2 — İyileştirme (opsiyonel, risk düşük)

| ID | Eylem | Gerekçe | Etki Alanı | Risk | Mitigasyon | Çaba | Öncelik |
|----|-------|---------|------------|------|------------|------|---------|
| SKILL-007 | **Update:** DR-006 status → completed | Pilot tamamlandı, stale bilgi. | ai-context/decisions/DR-006 | None | — | S | **P2** |
| SKILL-008 | **Add:** FD-23 `next/image` required | Core Web Vitals, performans. Raw `<img>` kullanılıyor. | agents.md Rule 19, schema-guardian | Low | Aşamalı geçiş öner | S | **P2** |
| SKILL-009 | **Add:** FD-24 `apiError*` helpers required | Tutarsız error response format. | agents.md Rule 19, schema-guardian | Low | Mevcut route'ları aşamalı migrate et | S | **P2** |
| SKILL-010 | **Update:** CONTRIBUTING.md TS strict → "planned" | Karar ertelendi, doku yansıtmalı. | CONTRIBUTING.md | None | — | S | **P2** |

---

## 7. Decision Questions

> Tüm sorular Faz 1'de yanıtlandı — açık karar kalmadı.

| # | Soru | Karar | Tarih |
|---|------|-------|-------|
| Q-01 | TS strict: false mu kalsın, true mu açılsın? | Doku düzelt, strict kararı ertele (P2) | 2026-03-10 |
| Q-02 | workmate-front-engineer ≈ frontend-design overlap? | Merge: front-engineer kalsın | 2026-03-10 |
| Q-03 | SoT mimarisi nasıl olsun? | agents.md = tek kaynak, diğerleri referans | 2026-03-10 |
| Q-04 | ARCHITECTURE_REVIEW stale risk'ler? | Güncelle | 2026-03-10 |

---

## Sonraki Adım

Faz 2'ye geçmek için onay verin:

```
APPROVED: [SKILL-001, SKILL-002, ...]
```

Her onaylanan SKILL-ID ayrı commit olarak uygulanacaktır.
Branch: `feat/skill-audit-updates`
