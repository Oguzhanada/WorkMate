# WorkMate — Record of Processing Activities (RoPA)

**Data Controller:** WorkMate Ltd (pending incorporation)
**Contact:** [founder email — to be added]
**Last Updated:** 2026-03-10
**Legal Basis:** GDPR Article 30

---

## Processing Activities

| # | Processing Activity | Data Categories | Data Subjects | Legal Basis | Retention Period | Recipients | Non-EU Transfer |
|---|---------------------|-----------------|---------------|-------------|-----------------|------------|-----------------|
| 1 | User registration & authentication | Name, email, password (hashed) | Customers + Providers | Art.6(1)(b) Contract | Account active + 30 days | Supabase (EU) | No |
| 2 | Provider onboarding & verification | Name, phone, ID document, SafePass, PLI cert, Tax Clearance, Garda vetting ref | Providers | Art.6(1)(b) Contract + Art.6(1)(c) Legal obligation | Documents: approval + 30 days; verification status: account active | Supabase (EU) | No |
| 3 | Job posting | Title, description, Eircode, address, photos, budget | Customers | Art.6(1)(b) Contract | Job completion + 1 year | Supabase (EU) | No |
| 4 | Quotes & messaging | Message content, file attachments | Customers + Providers | Art.6(1)(b) Contract | Job completion + 1 year | Supabase (EU) | No |
| 5 | Payment processing | Stripe Payment Intent ID, amount, commission, VAT | Customers + Providers | Art.6(1)(b) Contract + Art.6(1)(c) Legal obligation | **7 years** (Revenue Commissioners) | Stripe Ireland (EU), Supabase (EU) | No |
| 6 | Reviews & ratings | Rating, comment, quality/communication/punctuality/value scores | Customers (authors) + Providers (subjects) | Art.6(1)(f) Legitimate interest | Account active + post-deletion | Supabase (EU), public profile | No |
| 7 | Transactional email | Email address, name, job details | Customers + Providers | Art.6(1)(b) Contract | 30 days in Resend | Resend (EU) | No |
| 8 | AI job description generation | Job title, category, scope (no PII) | N/A | Art.6(1)(f) Legitimate interest | Processing duration only | Anthropic (US) | **Yes** |
| 9 | Error tracking | User ID, IP, error context (scrubbed via beforeSend) | All users | Art.6(1)(f) Legitimate interest | 90 days (Sentry default) | Sentry (EU/US) | **Review needed** |
| 10 | Address validation | Eircode | Customers + Providers | Art.6(1)(b) Contract | Account active | Ideal Postcodes (UK) | UK adequacy decision |
| 11 | Analytics (funnel events) | Session ID, step, timestamp (anonymous) | Anonymous | Art.6(1)(f) Legitimate interest | 90 days | Supabase (EU) | No |
| 12 | Cookie consent preference | Consent state | All visitors | Art.6(1)(a) Consent | 180 days | localStorage (client-side) | No |

---

## Legal Bases Summary

| Processing | Legal Basis | Consent Required? | Notes |
|-----------|-------------|-------------------|-------|
| Account creation | Contract Art.6(1)(b) | No | Required for service delivery |
| Payment processing | Contract + Legal obligation | No | Stripe + Revenue requirements |
| Provider verification | Contract + Legal obligation | No | Platform safety + Irish regulations |
| Transactional email | Contract | No | Part of service delivery |
| Analytics cookies | Consent Art.6(1)(a) | **Yes** | ePrivacy Regulation SI 336 |
| Marketing cookies | Consent Art.6(1)(a) | **Yes** | ePrivacy Regulation SI 336 |
| Marketing email | Consent Art.6(1)(a) | **Yes** | SI 535/2003 (e-Commerce) |
| AI job description | Legitimate interest Art.6(1)(f) | No | No PII sent; LIA document required |
| Error tracking (Sentry) | Legitimate interest Art.6(1)(f) | No | Service quality; PII scrubbed via beforeSend hook |
| Reviews | Legitimate interest Art.6(1)(f) | No | Platform trust & safety |

---

## Data Processing Agreements (DPAs)

| # | Processor | Data Type | DPA Status | Action Required |
|---|-----------|-----------|-----------|-----------------|
| 1 | **Supabase** (Supabase Inc.) | All user data | Available | Sign via Dashboard → Settings |
| 2 | **Stripe** (Stripe Ireland Ltd) | Payment data, KYC | Auto-accepted via ToS | Confirm in Dashboard |
| 3 | **Resend** (Resend Inc.) | Email addresses, names, job details | To be verified | Request DPA or check ToS DPA clause |
| 4 | **Sentry** (Functional Software Inc.) | User ID, IP, error context | Available | Sign via Dashboard → Settings |
| 5 | **Anthropic** (Anthropic Inc. — US) | Job category, scope (no PII) | API ToS includes DPA | Review API Terms + SCC/TIA required |
| 6 | **Vercel** (Vercel Inc. — US) | HTTP request metadata, edge cache | Available | Sign via Dashboard |
| 7 | **Ideal Postcodes** (Allies Computing Ltd — UK) | Eircode | UK adequacy decision | Request DPA |

### DPA Checklist (for each processor)
- [ ] Processing purpose and scope clearly defined
- [ ] Sub-processor list available
- [ ] Data breach notification timeline (≤48 hours)
- [ ] Contract termination → data deletion/return clause
- [ ] SCC attached for non-EU transfers
- [ ] Technical and organisational measures (ToM) specified

---

## Non-EU Transfers

| Processor | Country | Transfer Mechanism | Risk Level |
|-----------|---------|-------------------|------------|
| Anthropic | US | SCC + Transfer Impact Assessment required | Low (no PII transferred) |
| Sentry | EU/US | SCC (if US processing) | Medium (PII scrubbed via beforeSend) |
| Ideal Postcodes | UK | EU adequacy decision for UK | Low |

---

## Data Subject Rights Implementation

| Right | Implementation | Status |
|-------|---------------|--------|
| Access (Art.15) | `GET /api/profile/gdpr` — exports all user data as JSON | Implemented |
| Erasure (Art.17) | `DELETE /api/account/delete` — 30-day soft delete + hard delete via edge function | Implemented (deploy pending) |
| Rectification (Art.16) | Profile edit functionality | Implemented |
| Portability (Art.20) | Same as Access — JSON export | Implemented |
| Restriction (Art.18) | Manual process via support | Not automated |
| Objection (Art.21) | Cookie consent reject + email unsubscribe | Implemented |

---

## Review Schedule

This document must be reviewed and updated:
- Every 6 months (minimum)
- When new data processing activities are added
- When new third-party processors are engaged
- After any data breach incident

**Next review due:** 2026-09-10
