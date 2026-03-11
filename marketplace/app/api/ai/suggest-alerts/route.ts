import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { suggestAlertsSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { liveServices } from '@/lib/live-services';
import { getAnthropicClient } from '@/lib/cloudflare/ai-gateway';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

type AISuggestion = {
  keywords: string[];
  category_hint: string;
};

async function handler(request: NextRequest): Promise<NextResponse> {
  // Cost guard — blocked until LIVE_SERVICES_ENABLED=true (or AI_CALLS_ENABLED=true)
  if (!liveServices.ai) {
    return apiError('AI endpoints disabled. Set LIVE_SERVICES_ENABLED=true to enable.', 503);
  }

  // Auth check
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  // RBAC: must be verified_pro or admin
  const service = getSupabaseServiceClient();
  const { data: roleRow } = await service
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['verified_pro', 'admin'])
    .limit(1)
    .maybeSingle();

  if (!roleRow) {
    return apiForbidden('Only verified providers can use AI alert suggestions.');
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = suggestAlertsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }
  const { max_suggestions } = parsed.data;

  // Fetch provider's services via category join
  const { data: proServices, error: servicesError } = await service
    .from('pro_services')
    .select('category_id, categories(name)')
    .eq('profile_id', user.id);

  if (servicesError) {
    return apiServerError('Could not load your services.');
  }

  if (!proServices || proServices.length === 0) {
    return apiError('No services found on your profile. Add services first.', 400);
  }

  const serviceList = proServices
    .map((s) => {
      const cat = s.categories as unknown as { name: string } | null;
      return cat?.name ?? null;
    })
    .filter(Boolean)
    .join(', ');

  // Call Anthropic via AI Gateway
  let suggestions: AISuggestion[] = [];
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping a service provider on WorkMate (Ireland) set up task alerts for new job opportunities.

Provider's services: ${serviceList}

Suggest ${max_suggestions} task alert configurations. For each, provide:
- keywords: array of 2-4 relevant search keywords (Irish context — use Irish service terminology)
- category_hint: brief description of why this alert is useful

Return ONLY valid JSON array: [{"keywords": ["word1", "word2"], "category_hint": "..."}, ...]`,
        },
      ],
    });

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    // Extract JSON array from the response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return apiServerError('AI service temporarily unavailable');
    }
    suggestions = JSON.parse(jsonMatch[0]) as AISuggestion[];
  } catch {
    return apiServerError('AI service temporarily unavailable');
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return NextResponse.json({ created: 0, suggestions: [] });
  }

  // Load existing task_alerts keywords for this provider to avoid duplicates
  const { data: existingAlert } = await service
    .from('task_alerts')
    .select('id, keywords')
    .eq('provider_id', user.id)
    .maybeSingle();

  const existingKeywords: string[] = existingAlert?.keywords ?? [];

  // Determine which suggestions are new (not all keywords already present)
  const newSuggestions = suggestions.filter((s) => {
    if (!Array.isArray(s.keywords) || s.keywords.length === 0) return false;
    const allExist = s.keywords.every((kw) =>
      existingKeywords.some((ek) => ek.toLowerCase() === kw.toLowerCase())
    );
    return !allExist;
  });

  if (newSuggestions.length === 0) {
    return NextResponse.json({ created: 0, suggestions });
  }

  // Merge all new keywords into a flat deduplicated list
  const incomingKeywords = Array.from(
    new Set(
      newSuggestions.flatMap((s) => s.keywords.map((kw) => kw.toLowerCase().trim())).filter(Boolean)
    )
  );

  const mergedKeywords = Array.from(
    new Set([...existingKeywords.map((k) => k.toLowerCase().trim()), ...incomingKeywords])
  ).filter(Boolean);

  // Upsert the task_alerts row (one row per provider — unique on provider_id)
  const { error: upsertError } = await service
    .from('task_alerts')
    .upsert(
      {
        provider_id: user.id,
        keywords: mergedKeywords,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'provider_id' }
    );

  if (upsertError) {
    return apiServerError('Could not save suggested alerts.');
  }

  return NextResponse.json({ created: newSuggestions.length, suggestions });
}

export const POST = withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler);
