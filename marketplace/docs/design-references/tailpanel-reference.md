# TailPanel Design Reference

Source: TailPanel — Tailwind CSS Dashboard (Live Demo Preview)
Captured: 2026-03-13
Purpose: Design inspiration for WorkMate admin dashboard

## Screenshots Overview

### 1. Dashboard Overview (Main)
- Dark navy sidebar (#0f172a), green (#34d399) active highlights
- Logo + "Admin HQ" label at top, user initials at bottom
- Top header: breadcrumb left, page title center, bell + avatar right
- 4-column KPI cards row with colored icon badges + trend indicators
- Revenue Overview (area chart) + Profit vs Expenses (grouped bar chart)
- Recent Orders + Top Products tables below

### 2. UI Components Showcase — Alerts & Notifications
- Inline alert banners: success (green), error (red), warning (amber), info (blue)
- Each with left icon + title + description
- Dismissible variants with × button
- Toast button row (Success / Error / Warning / Info Toast)

### 3. UI Components Showcase — Avatars
- Sizes: XS, SM, MD, LG, XL, 2X
- With status dot indicators (online/offline/busy/away)
- Avatar groups with +N overflow badge

### 4. Progress Indicators
- Linear progress bars: 4 colors (blue, green, amber, red), adjustable via −10/+10 buttons
- Circular progress: 3 sizes showing 45%, 75%, 50% with colored stroke

### 5. Tabs
- Line variant: underline-style active tab
- Pills variant: filled pill active state

### 6. Accordion
- Default variant: bordered, single-expand
- Separated variant: gap between items
- Single Item: standalone expandable row

### 7. Timeline
- Default: colored icon circles (green/blue/amber), title + description + timestamp right-aligned
- Simple: plain dot indicator, same info structure

### 8. Overlays & Dialogs
- Modal: Open Basic Modal / Open Confirmation (red CTA) / Form Modal
- Drawer: slide-in panel
- Dropdown Menu
- Popover
- Tooltip: Top / Bottom / Left / Right positions

### 9. Loading States + Empty States + Badges
- Show Skeletons button (click to reveal skeleton loaders)
- Empty state: icon + "No users found" + primary + outline CTA buttons
- Badges: 5 variants (Primary/Secondary/Success/Warning/Danger), 3 sizes

### 10. Component Showcase (Interactive)
- Toast examples with usage code block shown
- Modal dialogs: Basic, Confirmation, Form, Size previews (sm/md/lg/xl/full)

### 11. Calendar (March 2026)
- Monthly grid view, today highlighted in blue
- Events rendered inside day cells (colored text)
- Right sidebar: Upcoming Events list (with type badge: event/task/meeting) + Quick Stats

### 12. Coming Soon Page
- Dark card on black background, rocket icon
- Countdown: Days / Hours / Minutes / Seconds
- Email input + "Notify Me" button

### 13. Under Maintenance Page
- Dark card on black, wrench icon (amber)
- Estimated completion + checklist of what's being done
- Twitter follow CTA at bottom

### 14. Success Page
- Checkmark icon (animated green circle)
- "What happens next?" explanation block
- "Go to Dashboard" (filled) + "Continue" (outlined) buttons
- Reference ID at bottom

### 15. FAQ Page
- Centered narrow layout, accordion style
- Clean white-text questions on dark background

### 16. Profile Page
- Header: avatar + name + role + company + bio + stats row (Projects/Tasks/Hours/Members)
- Tabs: Profile Details / Account Settings / Security
- Content: Personal Information form + Social Links form
- Right sidebar: Recent Activity + Quick Actions

### 17. Settings Page
- Left sidebar tabs: Profile / Notifications / Security / Appearance / Preferences
- Content: Profile Photo upload, First/Last Name, Email, Username, Bio, Website, Location
- Privacy indicator on card header
- Cancel + Save Changes buttons

### 18. Pricing Tables (4 styles)
- Style 1: Classic 3-column (Starter/Professional/Enterprise) with Monthly/Yearly toggle
- Style 2: Compact 4-column (Free/Starter/Professional/Enterprise)
- Style 3: Feature comparison table (rows = features, cols = plans with ✓/✗)
- Style 4: Horizontal card layout with feature chips
- Footer: "Need a custom plan?" CTA

### 19. Form Elements
- Text Inputs: Full Name, Email, Phone, Website
- Input with Icons: Email (envelope), Password (lock), Username (person), Phone (phone icon)
- Select Dropdowns: Country, Role, Timezone
- Textarea: Bio, Message
- Validation states: valid (green hint), invalid (red error), disabled, read-only
- Sizes: Small / Medium (Default) / Large

### 20. Form Elements — Checkboxes & Radio Buttons
- Checkboxes with labels + disabled state
- Radio buttons for plan selection
- Complete User Registration Form with validation

### 21. Form Elements — File Upload
- Drag & Drop Upload (dashed border, upload icon)
- Multiple Files upload
- Compact Upload (choose file button)
- Avatar Upload (with preview circle)

### 22. Data Tables
- Users Management: avatar + name/email, Role, Department, Status badge, Join Date, Actions (⋮)
  - Sortable column headers with ↑ indicator
  - Search box top-right
  - "Showing 8 of 8 users" footer
- Recent Invoices: INV-ID, Customer, Amount, Date, Due Date, Status badge, download action
  - Export button top-right
  - Status colors: Paid (green), Pending (amber), Overdue (red), Cancelled (red)

### 23. Charts & Visualizations
- 4 mini stat cards at top
- Area Chart: Revenue vs Expenses (dual series, stacked)
- Area Chart: Product Sales Distribution (3 products, colored fill)
- Bar Chart: Sales vs Target by Category (grouped blue/green)
- Line Chart: Weekly Traffic Metrics (3 lines with dots)
- Pie Chart: Device Distribution (with legend)
- Donut Chart: Project Status (Completed/In Progress/Pending/Cancelled)
- Radar Chart: Performance Comparison (2 products)
- Composite Chart: Sales, Profit & Growth (bar + line overlay)

---

## Priority elements for WorkMate Admin (ranked)

| # | Element | Why it fits WorkMate |
|---|---------|---------------------|
| 1 | **Data Tables** (sortable, searchable) | Verification queue, audit logs, jobs list, applications |
| 2 | **Charts — Analytics page** (expanded) | Revenue, job trends, provider growth, geographic distribution |
| 3 | **Timeline** | Audit logs view — shows admin action history elegantly |
| 4 | **Inline Alerts** | Admin action feedback (approve/reject confirmation) |
| 5 | **Progress Indicators** (linear) | Provider onboarding completion, verification steps |
| 6 | **Calendar** | Provider availability admin view, scheduled jobs |
| 7 | **Toast Notifications** system | Success/error feedback for all admin actions |
| 8 | **Empty States** (improved) | All list pages when no data |
| 9 | **Settings-style sidebar tabs** | Admin settings / GDPR page tabbed navigation |
| 10 | **Success / Error full-page states** | Post-action confirmation pages |
