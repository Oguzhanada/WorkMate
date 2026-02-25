alter table public.payments enable row level security;

drop policy if exists payments_select_customer_own on public.payments;
create policy payments_select_customer_own
on public.payments
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists payments_select_pro_own on public.payments;
create policy payments_select_pro_own
on public.payments
for select
to authenticated
using (pro_id = auth.uid());

drop policy if exists payments_select_admin on public.payments;
create policy payments_select_admin
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
