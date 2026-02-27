'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const taskAlertSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(120)).max(10),
  categories: z.array(z.string().uuid()).max(20),
  counties: z.array(z.string().trim().min(2).max(120)).max(26),
  taskTypes: z.array(z.enum(['in_person', 'remote', 'flexible'])).min(1),
  budgetMin: z.number().int().min(0).optional(),
  urgencyLevels: z.array(z.enum(['asap', 'this_week', 'flexible'])).min(1),
  enabled: z.boolean(),
});

type TaskAlertInput = z.infer<typeof taskAlertSchema>;

function parseJsonArray<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function parseTaskAlertInput(source: FormData | TaskAlertInput) {
  if (source instanceof FormData) {
    return taskAlertSchema.safeParse({
      keywords: parseJsonArray<string[]>(source.get('keywords'), []),
      categories: parseJsonArray<string[]>(source.get('categories'), []),
      counties: parseJsonArray<string[]>(source.get('counties'), []),
      taskTypes: parseJsonArray<Array<'in_person' | 'remote' | 'flexible'>>(source.get('taskTypes'), ['in_person']),
      budgetMin: source.get('budgetMin') ? Number(source.get('budgetMin')) : undefined,
      urgencyLevels: parseJsonArray<Array<'asap' | 'this_week' | 'flexible'>>(
        source.get('urgencyLevels'),
        ['asap', 'this_week', 'flexible']
      ),
      enabled: source.get('enabled') === null ? true : String(source.get('enabled')) === 'true',
    });
  }

  return taskAlertSchema.safeParse(source);
}

export async function saveTaskAlerts(input: FormData | TaskAlertInput) {
  const parsed = parseTaskAlertInput(input);
  if (!parsed.success) {
    return { error: 'Invalid task alert input', details: parsed.error.flatten() };
  }

  const supabase = await getSupabaseServerClient();
  const serviceSupabase = getSupabaseServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' as const };
  }

  const { error } = await serviceSupabase.from('task_alerts').upsert(
    {
      provider_id: user.id,
      keywords: parsed.data.keywords,
      categories: parsed.data.categories,
      counties: parsed.data.counties,
      task_types: parsed.data.taskTypes,
      budget_min: parsed.data.budgetMin ?? null,
      urgency_levels: parsed.data.urgencyLevels,
      enabled: parsed.data.enabled,
    },
    { onConflict: 'provider_id' }
  );

  if (error) {
    return { error: 'Failed to save task alert preferences' as const };
  }

  revalidatePath('/dashboard/pro');
  return { success: true as const };
}

export async function getTaskAlerts() {
  const supabase = await getSupabaseServerClient();
  const serviceSupabase = getSupabaseServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await serviceSupabase
    .from('task_alerts')
    .select('*')
    .eq('provider_id', user.id)
    .maybeSingle();

  return data;
}
