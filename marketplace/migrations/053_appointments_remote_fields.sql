-- Migration 053: Remote appointment fields
-- Adds video_link and notes to appointments table to support remote/video-call jobs.
-- Both columns are nullable so existing appointments are unaffected.

alter table public.appointments
  add column if not exists video_link text check (
    video_link is null or (
      char_length(video_link) <= 500
      and (
        video_link ilike 'https://meet.google.com/%'
        or video_link ilike 'https://zoom.us/%'
        or video_link ilike 'https://teams.microsoft.com/%'
        or video_link ilike 'https://whereby.com/%'
        or video_link ilike 'https://%'
      )
    )
  ),
  add column if not exists notes text check (notes is null or char_length(notes) <= 2000);

comment on column public.appointments.video_link is 'Optional video call link for remote appointments (Google Meet, Zoom, Teams, etc.)';
comment on column public.appointments.notes is 'Optional notes for the appointment visible to both parties';
