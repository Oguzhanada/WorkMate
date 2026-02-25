-- Allow users to remove their own notifications from inbox.

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());
