import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getTaxonomyCategories } from '@/lib/data/services';

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ categories: getTaxonomyCategories() });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name,parent_id,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ categories: getTaxonomyCategories(), warning: error.message });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      categories: getTaxonomyCategories(),
      warning: 'Categories table is empty. Using taxonomy fallback.'
    });
  }

  return NextResponse.json({ categories: data ?? [] });
}
