import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  const { supabase } = auth;

  const { data: docs, error } = await supabase
    .from('pro_documents')
    .select('id,document_type,storage_path,verification_status,created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();
  const withUrls = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: signed, error: signedError } = await serviceClient.storage
        .from('pro-documents')
        .createSignedUrl(doc.storage_path, 60 * 10);

      return {
        ...doc,
        signed_url: signedError ? null : signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ documents: withUrls });
}
