import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name,parent_id,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ categories: data ?? [] });
}
