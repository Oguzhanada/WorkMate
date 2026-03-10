import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

const AVATAR_BUCKET = 'profile-avatars';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

function isMissingAvatarColumnError(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('avatar_url') && lower.includes('schema cache');
}

async function ensureAvatarBucket() {
  const serviceClient = getSupabaseServiceClient();
  const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets();
  if (bucketsError) return bucketsError.message;

  const exists = (buckets ?? []).some((bucket) => bucket.id === AVATAR_BUCKET);
  if (exists) return null;

  const { error: createError } = await serviceClient.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

  return createError ? createError.message : null;
}

async function postHandler(request: Request) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Avatar file is required.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'Avatar must be PNG, JPG, JPEG or WEBP.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Avatar must be 5MB or smaller.' }, { status: 400 });
  }

  const bucketError = await ensureAvatarBucket();
  if (bucketError) {
    return NextResponse.json({ error: `Avatar storage setup failed: ${bucketError}` }, { status: 500 });
  }

  const serviceClient = getSupabaseServiceClient();
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await serviceClient.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = serviceClient.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const avatarUrl = publicUrlData.publicUrl;

  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (profileError) {
    if (isMissingAvatarColumnError(profileError.message)) {
      return NextResponse.json(
        {
          error:
            'Profile avatar is not enabled in database yet. Run migration 023_profile_avatar.sql in Supabase SQL Editor, then retry.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ avatar_url: avatarUrl }, { status: 200 });
}

async function deleteHandler() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { error } = await serviceClient.from('profiles').update({ avatar_url: null }).eq('id', user.id);
  if (error) {
    if (isMissingAvatarColumnError(error.message)) {
      return NextResponse.json(
        {
          error:
            'Profile avatar is not enabled in database yet. Run migration 023_profile_avatar.sql in Supabase SQL Editor, then retry.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
