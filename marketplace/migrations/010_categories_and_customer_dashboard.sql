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
  ('cleaning', 'Cleaning', null, 10),
  ('renovation', 'Renovation', null, 20),
  ('moving', 'Moving', null, 30),
  ('repairs', 'Repairs', null, 40),
  ('private-lessons', 'Private Lessons', null, 50),
  ('events', 'Events', null, 60)
on conflict (slug) do nothing;

-- Subcategories
insert into public.categories (slug, name, parent_id, sort_order)
select v.slug, v.name, p.id, v.sort_order
from (
  values
    ('home-cleaning', 'Home Cleaning', 'cleaning', 101),
    ('office-cleaning', 'Office Cleaning', 'cleaning', 102),
    ('painting-decorating', 'Painting & Decorating', 'renovation', 201),
    ('tiling', 'Tiling', 'renovation', 202),
    ('local-moving', 'Local Moving', 'moving', 301),
    ('intercity-moving', 'Intercity Moving', 'moving', 302),
    ('plumbing-repair', 'Plumbing Repair', 'repairs', 401),
    ('electrical-repair', 'Electrical Repair', 'repairs', 402),
    ('math-tutoring', 'Math Tutoring', 'private-lessons', 501),
    ('english-tutoring', 'English Tutoring', 'private-lessons', 502),
    ('wedding-planning', 'Wedding Planning', 'events', 601),
    ('birthday-planning', 'Birthday Planning', 'events', 602)
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
