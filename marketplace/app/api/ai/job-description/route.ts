import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { jobDescriptionSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { liveServices } from '@/lib/live-services';
import { getAnthropicClient } from '@/lib/cloudflare/ai-gateway';
import { apiError, apiUnauthorized, apiServerError } from '@/lib/api/error-response';
import { AI_MODELS } from '@/lib/ai/config';
import { sanitizeForPrompt } from '@/lib/ai/sanitize';

async function handler(request: NextRequest): Promise<NextResponse> {
  // Cost guard — blocked until LIVE_SERVICES_ENABLED=true (or AI_CALLS_ENABLED=true)
  if (!liveServices.ai) {
    return apiError('AI endpoints disabled. Set LIVE_SERVICES_ENABLED=true to enable.', 503);
  }

  // Auth guard — only logged-in users
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = jobDescriptionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }

  const { jobTitle, categoryName, scope, urgency, taskType } = parsed.data;

  // Sanitize all user-supplied strings before prompt interpolation
  const promptParts = [
    `Job type: ${sanitizeForPrompt(jobTitle, 100)}`,
    `Service category: ${sanitizeForPrompt(categoryName, 100)}`,
    scope ? `Scope: ${sanitizeForPrompt(scope, 300)}` : null,
    urgency ? `Urgency: ${sanitizeForPrompt(urgency, 50)}` : null,
    taskType ? `Task type: ${sanitizeForPrompt(taskType, 50)}` : null,
  ].filter(Boolean);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: AI_MODELS.JOB_DESCRIPTION,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are helping a customer in Ireland write a clear, concise job description for a home services marketplace.

Given the following job details:
${promptParts.join('\n')}

Write a short job description (3–5 sentences) that:
- Explains what the customer needs done
- Mentions any relevant scope or urgency information
- Uses plain, professional English
- Does NOT include a subject line or title — just the description body
- Is suitable for posting in Ireland

Return only the description text, no preamble.`,
        },
      ],
    });

    const text =
      message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';

    if (!text) {
      return apiServerError('No description generated');
    }

    return NextResponse.json({ description: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return apiServerError(message);
  }
}

export const POST = withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler);
