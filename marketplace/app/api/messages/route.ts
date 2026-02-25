import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { createMessageSchema } from '@/lib/validation/api';

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const visibility = request.nextUrl.searchParams.get('visibility') ?? 'public';
  const quoteId = request.nextUrl.searchParams.get('quote_id');
  const jobId = request.nextUrl.searchParams.get('job_id');

  if (!jobId) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
  }

  let query = supabase
    .from('job_messages')
    .select('id,job_id,quote_id,sender_id,receiver_id,visibility,message,created_at')
    .eq('job_id', jobId)
    .eq('visibility', visibility)
    .order('created_at', { ascending: true })
    .limit(200);

  if (quoteId) {
    query = query.eq('quote_id', quoteId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const senderIds = Array.from(new Set((data ?? []).map((item) => item.sender_id)));
  const { data: senders } =
    senderIds.length > 0
      ? await supabase.from('profiles').select('id,full_name').in('id', senderIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };

  const senderNameById = new Map((senders ?? []).map((sender) => [sender.id, sender.full_name ?? 'User']));
  const messages = (data ?? []).map((item) => ({
    ...item,
    sender_name: senderNameById.get(item.sender_id) ?? 'User',
  }));

  return NextResponse.json({ messages }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  if (body.visibility === 'private' && !body.receiver_id) {
    return NextResponse.json({ error: 'receiver_id is required for private messages' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('job_messages')
    .insert({
      job_id: body.job_id,
      quote_id: body.quote_id ?? null,
      sender_id: user.id,
      receiver_id: body.visibility === 'private' ? body.receiver_id ?? null : null,
      visibility: body.visibility,
      message: body.message,
    })
    .select('id,job_id,quote_id,sender_id,receiver_id,visibility,message,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
