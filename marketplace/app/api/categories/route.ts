import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { services } from '@/lib/marketplace-data';

function getFallbackCategories() {
  const unique = Array.from(new Set(services.map((item) => item.category))).sort((a, b) =>
    a.localeCompare(b)
  );

  return unique.map((name, index) => ({
    id: `fallback-${index + 1}`,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    parent_id: null,
    sort_order: index + 1
  }));
}

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ categories: getFallbackCategories() });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name,parent_id,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ categories: getFallbackCategories(), warning: error.message });
  }

  return NextResponse.json({ categories: data ?? [] });
}
