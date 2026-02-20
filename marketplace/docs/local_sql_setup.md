# Local SQL / DB setup (best path before server)

This project is Supabase + PostgreSQL based (not MSSQL).

## Recommended now
Use Supabase Cloud while developing locally.

### 1. Create Supabase project
- Create a new project in Supabase dashboard.
- Open Project Settings -> API.

### 2. Fill local env
Edit `marketplace/.env.local` with real values:
- `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
- `NEXT_PUBLIC_PLATFORM_BASE_URL=http://localhost:3000`

### 3. Run SQL schema
In Supabase SQL Editor, run:
- `marketplace/migrations/001_initial_marketplace_schema.sql`

### 4. Validate and run app
```powershell
cd marketplace
npm run preflight
npm run dev
```

## Why this is best for now
- No Docker/CLI dependency on local machine.
- Same Postgres engine you can keep in production.
- Fastest path to continue feature development.

## Later (when renting server)
- Keep DB/Auth/Storage on Supabase managed service.
- Deploy only Next.js app to VPS/container.
