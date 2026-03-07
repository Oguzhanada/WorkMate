import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseRouteClient } from '@/lib/supabase/route';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  // Auth guard — only logged-in users
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

  const body = rawBody as {
    jobTitle?: string;
    categoryName?: string;
    scope?: string;
    urgency?: string;
    taskType?: string;
  };

  if (!body.jobTitle || !body.categoryName) {
    return NextResponse.json({ error: 'jobTitle and categoryName are required' }, { status: 400 });
  }

  const promptParts = [
    `Job type: ${body.jobTitle}`,
    `Service category: ${body.categoryName}`,
    body.scope ? `Scope: ${body.scope}` : null,
    body.urgency ? `Urgency: ${body.urgency}` : null,
    body.taskType ? `Task type: ${body.taskType}` : null,
  ].filter(Boolean);

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
      return NextResponse.json({ error: 'No description generated' }, { status: 500 });
    }

    return NextResponse.json({ description: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
