import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError } from '@/lib/api/error-response';

type Params = Promise<{ providerId: string }>;

// GET /api/providers/[providerId]/portfolio — public, no auth required
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { providerId } = await params;

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('portfolio_items')
    .select('id, title, description, image_url, display_order')
    .eq('provider_id', providerId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ items: data ?? [] }, { status: 200 });
}
