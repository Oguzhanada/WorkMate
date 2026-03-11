export const JOB_BUDGET_OPTIONS = [
  '€0-€50',
  '€50-€100',
  '€100-€200',
  '€200-€500',
  '€500-€1,000',
  '€1,000+',
] as const;

/** @deprecated Use free-text title input instead. Kept for GuestJobIntentForm backward compat. */
export const JOB_TITLE_OPTIONS = [
  'Repair needed',
  'Installation needed',
  'Maintenance needed',
  'Cleaning service needed',
  'Moving support needed',
  'Private lesson request',
  'Other',
] as const;

export const JOB_SCOPE_OPTIONS = [
  'Small job (up to 2 hours)',
  'Medium job (half day)',
  'Large job (full day or more)',
] as const;

export const JOB_SCOPE_DESCRIPTIONS: Record<(typeof JOB_SCOPE_OPTIONS)[number], string> = {
  'Small job (up to 2 hours)': 'Quick fix, under 2 hours',
  'Medium job (half day)': 'Half-day project',
  'Large job (full day or more)': 'Full day or multi-day',
};

export const JOB_URGENCY_OPTIONS = [
  'Today',
  'Within 3 days',
  'This week',
  'Flexible',
] as const;
