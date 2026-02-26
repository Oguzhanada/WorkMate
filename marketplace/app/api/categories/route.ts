import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { SERVICE_TAXONOMY } from '@/lib/service-taxonomy';

function getFallbackCategories() {
  let order = 1;

  return SERVICE_TAXONOMY.flatMap((group, groupIndex) => {
    const parentId = `fallback-parent-${groupIndex + 1}`;
    const parent = {
      id: parentId,
      slug: group.slug,
      name: group.name,
      parent_id: null,
      sort_order: order++
    };

    const children = group.subcategories.map((subcategory) => ({
      id: `fallback-child-${subcategory.slug}`,
      slug: subcategory.slug,
      name: subcategory.name,
      parent_id: parentId,
      sort_order: order++
    }));

    return [parent, ...children];
  });
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
