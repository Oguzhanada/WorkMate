# Hybrid Workflow: Premium Customer Dashboard Redesign Prompt

**To the Claude Code Instance (or Claude AI):**

You are taking over from the **DesignAgent**. Your task is to implement an "Apple-level Premium UI" redesign for the Customer Dashboard in the WorkMate project. 

## Context
The project is a Next.js 16 (App Router) app using Tailwind CSS v4, Framer Motion, and shadcn/ui. 
The user wants the `Customer Dashboard` to look incredibly premium, resembling an Apple macOS interface.

## Core Design Directives
1. **Generous Whitespace**: Double the standard padding in `DashboardShell` and widgets (e.g., from `p-4/p-5` to `p-8/p-10`). Use large gaps between sections.
2. **Soft Shadows (Apple style)**: Replace harsh borders with extremely soft, dispersed shadows. E.g., `shadow-[0_8px_30px_rgb(0,0,0,0.06)]` in light mode, and a subtle glowing or layered border in dark mode.
3. **Emerald Green Accent (#10b981)**: The user specifically requested this green accent. Update the primary buttons, focus rings, and active states in the dashboard shell to use `bg-emerald-500 hover:bg-emerald-600` instead of the default `--wm-primary`.
4. **Framer Motion Animations**:
   - Add `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3 }}` to the `DashboardShell` container.
   - Add `whileHover={{ scale: 1.01, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}` to widget cards.
   - Ensure `layout` animations are active in `WidgetGrid.tsx` for smooth repositioning.
5. **Glassmorphism / Translucency**: Make the Top Header/Shell container slightly translucent with a blur. Use `bg-white/70 backdrop-blur-xl border border-white/20 dark:bg-zinc-900/70 dark:border-white/5`.
6. **Typography**: Headings should be bold, crisp, and tightly tracked (`tracking-tight text-zinc-900 dark:text-zinc-50`).

## Target Files to Update
1. **`marketplace/components/dashboard/DashboardShell.tsx`**: Apply the layout padding, glassmorphism header, and container animations.
2. **`marketplace/components/dashboard/WidgetGrid.tsx`**: Add Framer Motion layout animations for the grid items if not already present.
3. **`marketplace/components/ui/Button.tsx` (if needed) OR inline overrides**: Ensure the "Post a Job" button looks premium and uses the emerald accent.
4. **Any widget cards (e.g. `CustomerStatsWidget.tsx`)**: Apply the soft shadow and hover animations.

## Execution
Please edit the necessary files locally to apply these aesthetic changes. Ensure the code remains clean, accessible, and does not break the existing `@dnd-kit` logic. Build the "Apple-level Premium UI" now.
