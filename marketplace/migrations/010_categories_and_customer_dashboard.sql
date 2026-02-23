-- Relational categories + job category mapping

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_parent on public.categories(parent_id);
create index if not exists idx_categories_active on public.categories(is_active);

alter table public.categories enable row level security;

drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
on public.categories
for select
to authenticated
using (is_active = true);

insert into public.categories (slug, name, parent_id, sort_order)
values
  ('temizlik', 'Temizlik', null, 10),
  ('tadilat', 'Tadilat', null, 20),
  ('nakliyat', 'Nakliyat', null, 30),
  ('tamir', 'Tamir', null, 40),
  ('ozel-ders', 'Ozel Ders', null, 50),
  ('organizasyon', 'Organizasyon', null, 60)
on conflict (slug) do nothing;

-- Subcategories
insert into public.categories (slug, name, parent_id, sort_order)
select v.slug, v.name, p.id, v.sort_order
from (
  values
    ('ev-temizligi', 'Ev Temizligi', 'temizlik', 101),
    ('ofis-temizligi', 'Ofis Temizligi', 'temizlik', 102),
    ('boya-badana', 'Boya Badana', 'tadilat', 201),
    ('fayans-doseme', 'Fayans Doseme', 'tadilat', 202),
    ('sehir-ici-nakliyat', 'Sehir Ici Nakliyat', 'nakliyat', 301),
    ('sehirler-arasi-nakliyat', 'Sehirler Arasi Nakliyat', 'nakliyat', 302),
    ('tesisat-tamiri', 'Tesisat Tamiri', 'tamir', 401),
    ('elektrik-tamiri', 'Elektrik Tamiri', 'tamir', 402),
    ('matematik-ozel-ders', 'Matematik Ozel Ders', 'ozel-ders', 501),
    ('ingilizce-ozel-ders', 'Ingilizce Ozel Ders', 'ozel-ders', 502),
    ('dugun-organizasyonu', 'Dugun Organizasyonu', 'organizasyon', 601),
    ('dogum-gunu-organizasyonu', 'Dogum Gunu Organizasyonu', 'organizasyon', 602)
) as v(slug, name, parent_slug, sort_order)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

alter table public.jobs
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists idx_jobs_category_id on public.jobs(category_id);

-- Best-effort backfill from free-text category names
update public.jobs j
set category_id = c.id
from public.categories c
where j.category_id is null
  and lower(c.name) = lower(j.category);
