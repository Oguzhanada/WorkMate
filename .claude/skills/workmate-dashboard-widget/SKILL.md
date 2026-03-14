---
name: workmate-dashboard-widget
description: Step-by-step workflow for adding a new dashboard widget to WorkMate. Use when creating a new widget type, adding it to a dashboard mode, or debugging widget rendering/drag-drop issues. Covers the full 5-step process from type registration to component implementation.
metadata:
  severity: standard
  status: active
  last_synced: 2026-03-14
  synced_with: FD-04, FD-06, FD-08, FD-31
---

# WorkMate Dashboard Widget Development

Dashboard architecture: `DashboardShell` → `WidgetGrid` (@dnd-kit) → `WidgetRenderer` → widget component.

## Widget Architecture

```
lib/dashboard/widgets.ts          ← WidgetType enum + ALLOWED_WIDGETS + DEFAULT_WIDGETS
components/dashboard/
  WidgetGrid.tsx                  ← @dnd-kit drag-drop container
  widget-types.ts                 ← DashboardWidgetRow type (DB row shape)
  widgets/
    WidgetRenderer.tsx            ← switch on widget_type → renders component
    ActiveJobsWidget.tsx          ← example widget
    PendingQuotesWidget.tsx
    RecentMessagesWidget.tsx
    TaskAlertsWidget.tsx
    CustomerStatsWidget.tsx
    AdminStatsWidget.tsx
    AdminPendingJobsWidget.tsx
    AdminApplicationsWidget.tsx
    AdminApiKeysWidget.tsx
```

## Current Widget Types

```typescript
// lib/dashboard/widgets.ts
type WidgetType =
  | 'active_jobs'        // customer + provider
  | 'pending_quotes'     // customer + provider
  | 'recent_messages'    // all modes
  | 'task_alerts'        // provider only
  | 'customer_stats'     // customer only
  | 'admin_pending_jobs' // admin only
  | 'admin_applications' // admin only
  | 'admin_stats'        // admin only
  | 'admin_api_keys';    // admin only
```

## Adding a New Widget — 5 Steps

### Step 1: Register the type

In [lib/dashboard/widgets.ts](lib/dashboard/widgets.ts):

```typescript
// Add to WidgetType union
export type WidgetType =
  | ... existing types ...
  | 'my_new_widget';       // ← add here

// Add to ALLOWED_WIDGETS for the correct mode(s)
const ALLOWED_WIDGETS: Record<DashboardMode, WidgetType[]> = {
  customer: [..., 'my_new_widget'],  // if customer widget
  provider: [...],
  admin: [...],
};

// Optionally add to DEFAULT_WIDGETS if shown by default
const DEFAULT_WIDGETS: Record<DashboardMode, WidgetConfig[]> = {
  customer: [
    ...,
    { widget_type: 'my_new_widget', position: { x: 0, y: 3, w: 6, h: 2 }, settings: {} },
  ],
  ...
};

// Add label
export function getWidgetLabel(widgetType: WidgetType) {
  switch (widgetType) {
    case 'my_new_widget': return 'My New Widget';
    ...
  }
}
```

### Step 2: Create the component

In `components/dashboard/widgets/MyNewWidget.tsx`:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export function MyNewWidget() {
  const [data, setData] = useState<...[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    // fetch data
    setLoading(false);
  }, []);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (data.length === 0) return <EmptyState title="No items" description="..." />;

  return (
    <Card>
      {/* widget content */}
    </Card>
  );
}
```

### Step 3: Register in WidgetRenderer

In [components/dashboard/widgets/WidgetRenderer.tsx](components/dashboard/widgets/WidgetRenderer.tsx):

```typescript
import { MyNewWidget } from './MyNewWidget';

// Add to switch:
case 'my_new_widget':
  return <MyNewWidget />;
```

### Step 4: Verify API allows it

`app/api/user/dashboard/widgets/route.ts` validates widget types against `getAllowedWidgetTypes(mode)`. Since you added to `ALLOWED_WIDGETS`, this auto-allows the new type.

### Step 5: Test drag-drop

The `WidgetGrid` handles positioning via @dnd-kit. No changes needed unless widget needs custom sizing. Default `w: 6, h: 2` = half-width, standard height.

## Widget Component Rules

- Use `getSupabaseBrowserClient()` — never server client in widget (client component)
- Always handle loading state with `<Skeleton />`
- Always handle empty state with `<EmptyState />`
- Colors via `--wm-*` CSS vars only — use expanded token families: `--wm-status-*` (success, warning, error, info), `--wm-admin-*`, `--wm-chart-*`, `--wm-neutral-*` in addition to core tokens
- Widget must be wrapped in a `<Card>` for consistent styling
- FD-31: TypeScript `strict: true` is enabled — all components must have explicit type annotations

## Architecture Example: AdminApplicationsPanel Refactor

AdminApplicationsPanel was refactored from 1457 to 790 lines by extracting custom hooks into `components/dashboard/hooks/`:
- `useApplicationsData` — data fetching and state
- `useApplicationFilters` — filter/search logic
- `useApplicationActions` — approve/reject/bulk actions
- `useApplicationStats` — computed statistics

Use this pattern when building complex widgets: extract stateful logic into co-located hooks under the relevant `components/` feature directory.

## DB Widget Config (migration 049)

```sql
-- dashboard_widgets table
id, user_id, mode, widget_type, position (jsonb), settings (jsonb), created_at
```

API endpoints:
- `GET /api/user/dashboard/widgets?mode=customer` — load saved config
- `POST /api/user/dashboard/widgets` — save widget
- `PATCH /api/user/dashboard/widgets/[id]` — update position/settings
- `DELETE /api/user/dashboard/widgets/[id]` — remove widget
