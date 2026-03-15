---
name: workmate-dashboard-widget
description: Step-by-step workflow for adding a new dashboard widget to WorkMate. Use when creating a new widget type, adding it to a dashboard mode, or debugging widget rendering/drag-drop issues.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate Dashboard Widget Development

Dashboard architecture: `DashboardShell` -> `WidgetGrid` (@dnd-kit) -> `WidgetRenderer` -> widget component.

## Widget Architecture

Widget types: read `lib/dashboard/widgets.ts` for the canonical `WidgetType` union and `ALLOWED_WIDGETS` map. Each dashboard mode (customer, provider, admin) defines its own allowed widget set.

Dashboard components: explore `components/dashboard/` directory. Core registry: `lib/dashboard/widgets.ts`. Widget implementations: `components/dashboard/widgets/`.

## Adding a New Widget — 5 Steps

### Step 1: Register the type

In `lib/dashboard/widgets.ts`:

```typescript
// Add to WidgetType union
export type WidgetType =
  | ... existing types ...
  | 'my_new_widget';

// Add to ALLOWED_WIDGETS for the correct mode(s)
const ALLOWED_WIDGETS: Record<DashboardMode, WidgetType[]> = {
  customer: [..., 'my_new_widget'],
  provider: [...],
  admin: [...],
};

// Optionally add to DEFAULT_WIDGETS if shown by default
const DEFAULT_WIDGETS: Record<DashboardMode, WidgetConfig[]> = {
  customer: [
    ...,
    { widget_type: 'my_new_widget', position: { x: 0, y: 3, w: 6, h: 2 }, settings: {} },
  ],
};

// Add label
export function getWidgetLabel(widgetType: WidgetType) {
  switch (widgetType) {
    case 'my_new_widget': return 'My New Widget';
  }
}
```

### Step 2: Create the component

Create `components/dashboard/widgets/MyNewWidget.tsx`. Use `getSupabaseBrowserClient()` for data fetching. Include `<Skeleton>` for loading and `<EmptyState>` for empty states. Wrap content in `<Card>`.

### Step 3: Register in WidgetRenderer

In `components/dashboard/widgets/WidgetRenderer.tsx`, import and add a case:

```typescript
case 'my_new_widget':
  return <MyNewWidget />;
```

### Step 4: Verify API allows it

`app/api/user/dashboard/widgets/route.ts` validates widget types against `getAllowedWidgetTypes(mode)`. Adding to `ALLOWED_WIDGETS` auto-allows the new type.

### Step 5: Test drag-drop

`WidgetGrid` handles positioning via @dnd-kit. No changes needed unless the widget requires custom sizing. Default `w: 6, h: 2` = half-width, standard height.

## Widget Component Rules

- Use `getSupabaseBrowserClient()` — never server client in widgets (client components).
- Always handle loading state with `<Skeleton />`.
- Always handle empty state with `<EmptyState />`.
- Colors via `--wm-*` CSS vars only. Read `app/tokens.css` for available token families.
- Wrap widget content in `<Card>` for consistent styling.
- TypeScript `strict: true` is enabled — all components must have explicit type annotations.
- Extract stateful logic into co-located hooks when a widget exceeds ~200 lines. Read `components/dashboard/hooks/` for reference patterns.

## DB Widget Config

Read migration `049` for the `dashboard_widgets` table schema: `id, user_id, mode, widget_type, position (jsonb), settings (jsonb), created_at`.

API endpoints:
- `GET /api/user/dashboard/widgets?mode=customer` — load saved config
- `POST /api/user/dashboard/widgets` — save widget
- `PATCH /api/user/dashboard/widgets/[id]` — update position/settings
- `DELETE /api/user/dashboard/widgets/[id]` — remove widget

## Where to Look

- Widget registry: `lib/dashboard/widgets.ts`
- Widget components: `components/dashboard/widgets/`
- Widget grid: `components/dashboard/WidgetGrid.tsx`
- API route: `app/api/user/dashboard/widgets/route.ts`
- DB migration: `marketplace/migrations/049*`
- Design tokens: `app/tokens.css`

## NEVER DO

- Never use server-side Supabase client inside widget components (they are client components).
- Never hardcode hex colors — use `--wm-*` tokens from `app/tokens.css`.
- Never skip loading or empty states in data-dependent widgets.
- Never add a widget type without registering it in both `WidgetType` union and `ALLOWED_WIDGETS`.
- Never bypass TypeScript strict mode with `any` casts or `@ts-ignore`.
