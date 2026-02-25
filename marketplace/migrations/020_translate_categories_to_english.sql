-- Normalize legacy Turkish category slugs/names into English.
-- Safe for environments where English rows already exist.

create or replace function public.merge_category_slug(
  old_slug text,
  new_slug text,
  new_name text
)
returns void
language plpgsql
as $$
declare
  old_id uuid;
  new_id uuid;
begin
  select id into old_id from public.categories where slug = old_slug;
  if old_id is null then
    return;
  end if;

  select id into new_id from public.categories where slug = new_slug;

  if new_id is null then
    update public.categories
    set slug = new_slug,
        name = new_name
    where id = old_id;
    return;
  end if;

  -- If target exists, merge all references from old -> new.
  update public.categories
  set parent_id = new_id
  where parent_id = old_id;

  update public.jobs
  set category_id = new_id
  where category_id = old_id;

  update public.job_intents
  set category_id = new_id
  where category_id = old_id;

  -- pro_services has unique(profile_id, category_id), so merge carefully.
  insert into public.pro_services (profile_id, category_id, created_at)
  select ps.profile_id, new_id, ps.created_at
  from public.pro_services ps
  where ps.category_id = old_id
    and not exists (
      select 1
      from public.pro_services x
      where x.profile_id = ps.profile_id
        and x.category_id = new_id
    );

  delete from public.pro_services where category_id = old_id;

  update public.pro_portfolio
  set category_id = new_id
  where category_id = old_id;

  delete from public.categories where id = old_id;

  -- Enforce canonical English name on target row.
  update public.categories
  set name = new_name
  where id = new_id;
end;
$$;

select public.merge_category_slug('temizlik', 'cleaning', 'Cleaning');
select public.merge_category_slug('tadilat', 'renovation', 'Renovation');
select public.merge_category_slug('nakliyat', 'moving', 'Moving');
select public.merge_category_slug('tamir', 'repairs', 'Repairs');
select public.merge_category_slug('ozel-ders', 'private-lessons', 'Private Lessons');
select public.merge_category_slug('organizasyon', 'events', 'Events');

select public.merge_category_slug('ev-temizligi', 'home-cleaning', 'Home Cleaning');
select public.merge_category_slug('ofis-temizligi', 'office-cleaning', 'Office Cleaning');
select public.merge_category_slug('boya-badana', 'painting-decorating', 'Painting & Decorating');
select public.merge_category_slug('fayans-doseme', 'tiling', 'Tiling');
select public.merge_category_slug('sehir-ici-nakliyat', 'local-moving', 'Local Moving');
select public.merge_category_slug('sehirler-arasi-nakliyat', 'intercity-moving', 'Intercity Moving');
select public.merge_category_slug('tesisat-tamiri', 'plumbing-repair', 'Plumbing Repair');
select public.merge_category_slug('elektrik-tamiri', 'electrical-repair', 'Electrical Repair');
select public.merge_category_slug('matematik-ozel-ders', 'math-tutoring', 'Math Tutoring');
select public.merge_category_slug('ingilizce-ozel-ders', 'english-tutoring', 'English Tutoring');
select public.merge_category_slug('dugun-organizasyonu', 'wedding-planning', 'Wedding Planning');
select public.merge_category_slug('dogum-gunu-organizasyonu', 'birthday-planning', 'Birthday Planning');

drop function if exists public.merge_category_slug(text, text, text);

-- Keep legacy text category field in jobs aligned where still used.
update public.jobs j
set category = c.name
from public.categories c
where j.category_id = c.id
  and coalesce(j.category, '') <> c.name;
