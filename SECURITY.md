# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously at WorkMate. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Email your report to **security@workmate.ie** with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgement** within 48 hours of your report
- **Status update** within 5 business days
- **Resolution timeline** communicated once the issue is triaged

### Scope

The following are in scope for security reports:

- Authentication and authorization bypasses
- Data exposure or leakage (PII, payment data)
- SQL injection, XSS, CSRF vulnerabilities
- RLS (Row Level Security) policy bypasses
- Stripe Connect payment flow vulnerabilities
- GDPR compliance violations
- API rate limiting bypasses

### Out of Scope

- Denial of service attacks
- Social engineering
- Physical security
- Issues in third-party dependencies (report upstream)

### Recognition

We appreciate responsible disclosure and will credit reporters (with permission) in our release notes.

## Security Practices

- All database tables enforce Row Level Security (RLS)
- API routes use centralized Zod validation and RBAC guards
- Webhook endpoints verify HMAC-SHA256 signatures
- Stripe payments use Connect with signature verification
- Environment secrets are never committed (enforced via `.gitignore`)
- CodeQL static analysis runs on every push
- Rate limiting protects all write endpoints
