-- Notify receiver when a private message is sent.

create or replace function public.notify_user_on_new_private_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  if new.visibility <> 'private' then
    return new;
  end if;

  if new.receiver_id is null or new.receiver_id = new.sender_id then
    return new;
  end if;

  select p.full_name into sender_name
  from public.profiles p
  where p.id = new.sender_id;

  insert into public.notifications (user_id, type, payload)
  values (
    new.receiver_id,
    'new_message',
    jsonb_build_object(
      'job_id', new.job_id,
      'quote_id', new.quote_id,
      'sender_id', new.sender_id,
      'sender_name', coalesce(sender_name, 'User'),
      'preview', left(new.message, 120)
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_user_on_new_private_message on public.job_messages;
create trigger trg_notify_user_on_new_private_message
after insert on public.job_messages
for each row execute function public.notify_user_on_new_private_message();
