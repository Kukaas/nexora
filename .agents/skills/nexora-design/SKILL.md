---
name: nexora-design
description: Master design system guide, component catalog, layout rules, and UI conventions for the entire Nexora Barangay Portal. Use when the user types /design, /ui-design, /nexora-design, or asks for frontend UI design, creating or modifying resident/official pages, forms, data tables, cards, navigation, state banners, or document templates.
---

# Master Design System & Architectural Guidelines — Nexora Barangay Portal (`/design`)

This skill is the single authoritative reference for the **Nexora Barangay Portal** design language, component suite, layout conventions, typography, and state verification rules.

---

## 1. Core Architectural & Code Conventions

1. **Server Components by Default**: Route files (`page.tsx`, `layout.tsx`) are React Server Components. NEVER put `"use client"` at the top of a route file. Keep pages server-rendered so they export `metadata` and keep JS bundles small. Extract interactive parts into colocated leaf client components (`_components/*-form.tsx`, `_components/*-list.tsx`).
2. **Full-Width Pages for Forms (AGENTS.md Rule)**: Creating or editing a record is its own full-width route (`/new`, `/[id]/edit`) — **NEVER a modal dialog/overlay**.
3. **Database Schema & Safe Query Fallbacks**: Schema changes are made in `prisma/schema.prisma`. Data fetchers (`lib/*-data.ts`) must wrap queries in `try/catch` blocks so that if database tables or columns are pending user migration, they return empty lists (`[]`) gracefully without crashing the server.

---

## 2. Design Tokens, Radii Scale & Color System

- **Framework & CSS Engine**: Next.js 16 App Router + Tailwind CSS 4 using dynamic OKLCH CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-accent`, `bg-primary`, `border-border`).
- **Dark Mode**: Built-in system/manual dark mode support using `dark:` variants (`dark:bg-card`, `dark:text-amber-300`, `dark:ring-foreground/10`).
- **Radii Scale**:
  - `rounded-2xl` (`calc(var(--radius) * 1.8)` = 18px): Standard radius for form controls, text inputs, select triggers, comboboxes, and icon badges (`size-11 rounded-2xl`).
  - `rounded-4xl` (`calc(var(--radius) * 2.6)` = 26px): Signature outer container radius for all Nexora cards (`Card`), data table frames (`TableCard`), feature banners, and notice alerts.
  - `rounded-full`: Primary action pill buttons (`h-10 px-5 rounded-full`), status badges, and user avatars.
- **Card Ring & Elevation**: Cards use subtle high-contrast border rings for depth: `border border-border bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10`.

---

## 3. Complete shadcn/ui Component Catalog (`@/components/ui/`)

### Container Cards (`@/components/ui/card`)
```tsx
<Card className="rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
  <CardHeader>
    <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
      <Icon className="size-5.5" aria-hidden />
    </div>
    <CardTitle className="mt-3 text-xl font-semibold tracking-tight text-foreground">
      Card Title
    </CardTitle>
    <CardDescription className="text-sm text-muted-foreground text-pretty">
      Card description text
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

### Data Table Suite (`@/components/ui/table` & `@/components/ui/data-table`)
The authoritative Nexora Table Design Pattern (as seen in Secretary Requests & official consoles):

#### 1. Header & KPI Stat Bar
```tsx
<header className="flex flex-wrap items-start justify-between gap-4">
  <div className="flex flex-col gap-1">
    <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
    <p className="max-w-prose text-sm text-muted-foreground text-pretty">Description text</p>
  </div>
  <Button asChild><Link href="/new"><Plus /> Action</Link></Button>
</header>

<dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
  <Stat label="Pending" value={summary.pendingCount} />
  <Stat label="Active" value={summary.activeCount} accent />
  <Stat label="Completed" value={summary.completedCount} />
</dl>
```

#### 2. Status Tab Bar Toolbar
```tsx
<div role="tablist" className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1">
  {FILTERS.map((f) => (
    <button
      key={f.value}
      role="tab"
      aria-selected={active}
      onClick={() => setStatus(f.value)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {f.label}
      <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums", active ? "bg-accent text-accent-foreground" : "bg-border/70 text-muted-foreground")}>
        {counts[f.value]}
      </span>
    </button>
  ))}
</div>
```

#### 3. Dual Responsive Table Structure
Desktop (`hidden md:block`) uses `<TableCard>` with `after:absolute after:inset-0` clickable rows. Mobile (`md:hidden`) uses stacked `<ul>` with `<ChevronRight>`.
```tsx
{/* Desktop View */}
<TableCard className="hidden md:block">
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">Title / ID</TableHead>
        <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">Category / Type</TableHead>
        <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">Details</TableHead>
        <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">Status</TableHead>
        <TableHead className="h-11 w-10 pe-5" aria-label="Open" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((row) => (
        <TableRow key={row.id} className="group relative cursor-pointer">
          <TableCell className="ps-5 font-medium">
            <Link href={`${basePath}/${row.id}`} className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/30">
              {row.title}
            </Link>
          </TableCell>
          <TableCell className="text-muted-foreground">{row.category}</TableCell>
          <TableCell className="font-mono text-xs text-muted-foreground">{row.details}</TableCell>
          <TableCell><StatusBadge status={row.status} /></TableCell>
          <TableCell className="pe-5 text-right">
            <ChevronRight className="ml-auto size-4 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableCard>

{/* Mobile Stacked List View */}
<ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
  {items.map((row) => (
    <li key={row.id}>
      <Link href={`${basePath}/${row.id}`} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-muted/60 transition-colors">
        <div className="min-w-0 flex-1">
          <span className="truncate font-medium">{row.title}</span>
          <p className="mt-0.5 text-sm text-muted-foreground">{row.category}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={row.status} />
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
    </li>
  ))}
</ul>

<DataPagination
  page={page}
  pageCount={pageCount}
  pageSize={pageSize}
  pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
  total={total}
  from={from}
  to={to}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

### Form Controls (`@/components/ui/field`, `input`, `select`, `combobox`, `textarea`)
Accessibility-first form fields wrapped in `FieldGroup` or structured `<div className="flex flex-col gap-2">` wrappers:

#### Standard Input Field
```tsx
<FieldGroup>
  <Field data-invalid={!!errors.title}>
    <FieldLabel htmlFor={titleId}>Incident Title</FieldLabel>
    <Input id={titleId} placeholder="Describe what happened" {...register("title")} />
    {errors.title && <FieldError>{errors.title.message}</FieldError>}
  </Field>
</FieldGroup>
```

#### Official Select Component (`@/components/ui/select`)
Modeled after the Announcement compose form (`announcements/new`):
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

<div className="flex flex-col gap-2">
  <Label>Category</Label>
  <Select
    value={category}
    onValueChange={(v) => setCategory(v as AnnouncementCategory)}
    disabled={busy}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select category..." />
    </SelectTrigger>
    <SelectContent>
      {CATEGORY_ORDER.map((c) => (
        <SelectItem key={c} value={c}>
          {CATEGORY_LABELS[c]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Select the appropriate classification for this official notice.
  </p>
</div>
```
- **Styling Specs**: `SelectTrigger` uses `rounded-3xl` (or `rounded-2xl`), `bg-input/50`, with `h-9` default height and `<ChevronDownIcon>` icon indicator.
- **Dropdown Portal**: `SelectContent` opens in a Radix Portal with `rounded-3xl bg-popover shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10`.
- **Items**: `SelectItem` options feature `rounded-2xl` hover highlights (`focus:bg-accent`) and automatic `<CheckIcon>` checkmark indicators.

### Proof & Evidence File Upload Component
Allows optional file attachments (images, PDFs, TXT documents up to 15 MB) via Cloudinary (`uploadAttachment`):
- Renders drag-and-drop / file selector with file type validation.
- Displays uploaded file preview card with filename, file size, and remove button.
- Displays direct download/view link on detail lists and official review forms.

---

## 4. Account ID Verification Rules (`ResidencyReviewNotice`)

### Restricted Service Routes
1. **Document Requests** (`/resident/[id]/requests`, `/resident/[id]/request`)
2. **Community Incident Reports** (`/resident/[id]/incidents`, `/resident/[id]/incidents/new`)
3. **Official Barangay Blotter** (`/resident/[id]/blotter`, `/resident/[id]/blotter/new`)

### Access & Banner Conventions
- **Unified Review Banner**: Render `ResidencyReviewNotice` at the top of restricted service list pages when `residencyStatus !== "approved"`.
- **Standardized Copy**:
  - **Title**: `Account ID Verification Required`
  - **Body**: `An official is currently reviewing your submitted ID. To ensure community accountability, ID verification is required before you can officially submit incident reports, file blotter cases, or request barangay documents.`
- **Sidebar Gating**: Items under **Services** in `ResidentSidebar` are disabled (`disabled`, `opacity-50`, `cursor-not-allowed`, `<Lock />`) when `verified` is false.
- **Form Route Protection**: Creation routes (`/incidents/new`, `/blotter/new`, `/request/[typeId]`) redirect unverified residents back to their list notice pages.
- **CTA Return Redirect**: `ResubmitIdForm` accepts `?redirect=` to return residents back to their target route upon ID resubmission.

---

## 5. Exempt Public & Informational Routes

The following resident pages do **NOT** show restriction banners and remain fully accessible:
- Overview Dashboard (`/resident/[id]`)
- Realtime Chat Messages (`/resident/[id]/messages`)
- Community Announcements (`/resident/[id]/announcements`)
- Barangay Officials Directory (`/resident/[id]/officials`)
- Resident Profile Settings (`/resident/[id]/profile`)

---

## 6. Official Consoles & Document Designer Surface

- **Document Designer Surface** (`.nx-doc`, `.nx-doc-print`, `.nx-merge`, `.nx-float-text`):
  - A4 white sheet layout (`794px` width) for Tiptap document template authoring.
  - Merge-field chips (`.nx-merge`) with width-honest font inheritance.
  - Printed output view (`.nx-doc-print`) perfectly mirrors designer surface WYSIWYG for official certificate printing.
- **Lupon Tagapamayapa Case Management**:
  - Distinct workflow for Barangay Blotter formal legal records (hearing schedules, mediation status, escalation to PNP).

---

## 7. Resident Portal Service & List Standard (`/resident/[id]/incidents` & `/resident/[id]/blotter`)

Modeled directly after the official Resident Incident Reports (`ResidentIncidentList`) & Barangay Blotter Records (`ResidentBlotterList`) reference:

### 1. Server Page Architecture
Route files (`app/(protected)/resident/[id]/incidents/page.tsx`, `blotter/page.tsx`) stay React Server Components that fetch data and render leaf client components:
```tsx
export default async function ResidentIncidentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  const incidents = await getResidentIncidents(id);

  return (
    <ResidentIncidentList
      residentId={id}
      incidents={incidents}
      verified={residency === "approved"}
      residencyStatus={residency}
    />
  );
}
```

### 2. Standard Header & Account Verification Notice
Every resident service page features a top back link (`ArrowLeft`), header title with subtitle, and `ResidencyReviewNotice` gating banner when ID is unverified:
```tsx
<div className="flex flex-col gap-6">
  <Link
    href={`/resident/${residentId}`}
    className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
  >
    <ArrowLeft className="size-4" aria-hidden />
    Back to portal
  </Link>

  {!verified && (
    <ResidencyReviewNotice
      status={residencyStatus}
      residentId={residentId}
      returnUrl={`/resident/${residentId}/incidents`}
      title="Account ID Verification Required"
    />
  )}

  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">My Incident Reports</h1>
      <p className="max-w-prose text-sm text-muted-foreground text-pretty">
        Report public safety concerns, environmental hazards, noise complaints, and track official responses.
      </p>
    </div>
    {verified ? (
      <Button asChild>
        <Link href={`/resident/${residentId}/incidents/new`}>
          <Plus />
          Report Incident
        </Link>
      </Button>
    ) : (
      <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
        <Lock />
        Verification Required
      </Button>
    )}
  </header>
```

### 3. KPI Stat Bar Suite
```tsx
<dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
  <Stat label="Total reports" value={summary.total} />
  <Stat label="Pending review" value={summary.submitted} accent />
  <Stat label="Under action" value={summary.active} />
  <Stat label="Resolved" value={summary.resolved} />
</dl>
```

### 4. Integrated Filter, Search & Select Toolbar
Toolbar row combines status tab pills with counters, search input, shadcn `@/components/ui/select` dropdown filter, and layout `ViewToggle` (without duplicating primary CTA buttons):
```tsx
<div className="flex flex-col gap-3">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <div role="tablist" className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1">
      {FILTERS.map((f) => {
        const active = statusFilter === f.value;
        return (
          <button
            key={f.value}
            role="tab"
            aria-selected={active}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors",
              active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums", active ? "bg-accent text-accent-foreground" : "bg-border/70 text-muted-foreground")}>
              {f.count}
            </span>
          </button>
        );
      })}
    </div>

    <div className="flex items-center gap-2">
      <div className="relative min-w-44 sm:w-56">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="text"
          placeholder="Search title, report #..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
        />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
        <SelectTrigger className="h-9 w-[150px] text-xs">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {/* Options */}
        </SelectContent>
      </Select>

      <ViewToggle view={view} onChange={setView} />
    </div>
  </div>
</div>
```

### 5. Single Primary CTA & Filter Hygiene Rules
To avoid visual clutter, duplicate controls, and redundant UI elements on data table pages:
1. **Header CTA (Primary Action)**: The main action button belongs strictly in the top Page Header (`<header className="flex flex-wrap items-start justify-between gap-4">`). This is the canonical placement for creating or adding records.
2. **Clean Toolbar (No Duplicate CTA)**: Filter toolbars must NOT repeat the primary action CTA button. The toolbar focuses purely on search inputs, role/category filters, view toggles, and status tab pills.
3. **No Duplicate Filter Controls**: Never render both a Tab Bar filter and a Dropdown Select filter for the exact same field (e.g. filtering roles in both tab pills and a Select dropdown). Tab pills are used for primary state/role filters; Select dropdowns are reserved for distinct orthogonal filters (e.g., filtering categories when tabs handle status).
4. **Empty State Card CTA**: Primary action button appears inside the `<Empty>` card ONLY when the list has 0 records (displays `<Lock /> Verification Required` disabled button when `verified` is false).

### 6. Dual Cards Grid & Expandable Table Views (`view === "card"` vs `view === "table"`)
- **Card Grid View (`grid grid-cols-1 gap-4 sm:grid-cols-2`)**: Mobile-first elevated cards (`rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10`) displaying ID/Report number in `font-mono text-xs text-primary`, status badges, location badges, proof attachment links, and official response boxes.
- **Desktop Table View (`<TableCard>`)**: Desktop table layout with clickable row expander (`tr` with `expandedId`) displaying complete narrative text, attached proof documents, and official response notes.
- **Pagination & Empty States**: Clean client pagination (`useClientPagination`) with `<DataPagination>` and `<Empty className="rounded-4xl border border-dashed border-border bg-card/50">`.

---

## 8. Categorized Form Layouts & Visual Section Cards Standard

For multi-field creation and edit forms (e.g. `AnnouncementForm`, `DocumentTypeForm`, `HouseholdForm`, `BlotterForm`), group related fields into distinct, visually separated section cards rather than rendering a continuous stack of inputs:

### 1. Visual Section Cards Architecture
- **Elevated Card Containers**: Wrap each logical field group in an elevated card container (`rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10`).
- **Standardized Section Header**: Every section card begins with a header row featuring:
  - Tinted icon badge (`size-9 rounded-2xl bg-accent text-accent-foreground` with a relevant Lucide icon)
  - Numbered section title (`text-base font-semibold tracking-tight text-foreground`, e.g., `1. Notice Content & Classification`)
  - Subtitle guidance (`text-xs text-muted-foreground`)
  - Bottom border divider line (`border-b border-border pb-4`)

### 2. Multi-Column Layout Strategy & Bottom Action Bar Structure
- **Form Wrapper Layout**: Outer form element must use `className="flex flex-col gap-6"`.
- **Section Cards Grid**: Section cards sit inside a multi-column grid (`grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]` or `grid lg:grid-cols-2`):
  - **Left / Main Column**: Primary content cards (e.g., Title, details narrative text, identification & address).
  - **Right / Side Column**: Settings and metadata cards (e.g., Schedule & dates, target audience scope, welfare program flags).
- **Full-Width Bottom Action Bar**:
  - Action buttons (`Cancel`, `Save Record`, `Publish`, `Delete`) MUST be placed in a dedicated flex container (`<div className="flex items-center justify-end gap-3 pt-2">` or `<div className="flex items-center gap-2">`) as a direct child of the outer `<form className="flex flex-col gap-6">`, OUTSIDE the multi-column grid container.
  - **Grid Nesting Rule**: NEVER nest the bottom action bar inside a single column of a multi-column grid.
  - **Button Spacing**: Maintain `gap-3` (or `gap-2` in full-width split rows with Delete) between buttons, using `rounded-2xl` radius scale.

---

## 9. Report Export & Date Range Filtering Standard

When implementing reports, audit statements, or data export interfaces (e.g. COA Financial Reports, Captain Analytics, Payment Summaries):

### 1. Single Authoritative Export CTA
- **Header Placement**: Render ONE primary export CTA button (e.g. `<Button className="rounded-2xl font-semibold"><Download className="mr-1.5 size-4" /> Export Statement (CSV)</Button>`) in the top Page Header (`<header className="flex flex-wrap items-start justify-between gap-4">`).
- **No Toolbar Duplication**: Do NOT duplicate small secondary export buttons inside the search/filter toolbar row.

### 2. Standardized Date Range Filter (`DateRangeFilter`)
- **Shared Component**: Use the canonical `@/components/date-range-filter` popover component (`DateRangeFilter`) and helper `dateBounds(dateFilter)` / `dateFilterLabel(dateFilter)`.
- **Supported Filter Modes**:
  - `All dates` (`{ kind: "all" }`)
  - `Today` (`{ kind: "preset", preset: "TODAY" }`)
  - `Last 7 days` (`{ kind: "preset", preset: "7D" }`)
  - `Last 30 days` (`{ kind: "preset", preset: "30D" }`)
  - `This month` (`{ kind: "preset", preset: "MONTH" }`)
  - `Custom Range` (`{ kind: "custom", from: Date, to: Date }` with interactive dual-calendar popover and draft confirmation)
- **Dynamic Metric & Report Sync**: All KPI stat cards, table records, empty state descriptions, and exported CSV headers MUST dynamically reflect the active date filter range and period label.

### 3. Interactive Export Options Popup Dialog (`<Dialog>`)
- **Export Modal Trigger**: Clicking the primary `Export Statement (CSV)` button opens an interactive Export Options Popup Dialog (`@/components/ui/dialog`).
- **Default Date Preset**: The export modal's date period filter MUST default to **This Month** (`{ kind: "preset", preset: "MONTH" }`).
- **Live Calculated Preview**: Displays a live summary box with the transaction count and gross revenue total matching the configured export parameters before triggering CSV file download.

---

## 10. Interactive Date & Time Picker Standard

For forms requiring occurrence or event timestamp selection (e.g. `ResidentIncidentForm`, `ResidentBlotterForm`):

### 1. Full-Width Popover Date Trigger
- **Trigger Button**: Uses full width (`w-full`) with `truncate` text to display formatted dates (e.g. `Tue, Aug 11, 2026`) cleanly on a single line without text wrapping or squishing.
- **Popover Calendar**: Opens Radix `<Popover>` containing shadcn single-mode `<Calendar>` component with `disabled={{ after: new Date() }}` to prevent future invalid timestamps.

### 2. Contained Time & AM/PM Selector Row
- **Time Controls Row**: `flex items-center gap-2` containing:
  - **Hour & Minute Selectors**: `flex-1 min-w-0 flex items-center justify-between rounded-2xl border border-border bg-background px-2 py-1` with Hour (`01`–`12`) and Minute (`00`–`55`) dropdowns.
  - **AM / PM Toggle Pills**: `inline-flex h-9 items-center rounded-2xl bg-muted p-1 border border-border/40 shrink-0` with active background highlights.
- **ISO Output Synchronization**: Automatically synchronizes state into standard `YYYY-MM-DDTHH:mm` string format expected by server APIs.

---

## 11. Clickable List Navigation & Large Evidence Image Previews

### 1. Clickable Row & Card Navigation (`>` Chevron Indicator)
- **Direct Link Wrapping**: Entire cards and data table rows in list views (Incidents, Blotter Cases, Requests) MUST be wrapped in direct `<Link>` navigation items.
- **Hover Micro-Interactions**: Cards use `transition-all hover:border-primary/50 hover:shadow-md cursor-pointer`.
- **Trailing Navigation Indicator**: Always include a right chevron icon (`<ChevronRight className="size-4 group-hover:translate-x-0.5 group-hover:text-primary transition-transform text-muted-foreground" />`) on the trailing edge of cards and table rows to clearly signal item clickability (`>`).

### 2. Prominent Evidence Photo Previews
- **Large Image Display**: Attached proof/evidence images MUST be rendered using large image containers (`max-h-[30rem]` or `max-h-96`) with `object-contain rounded-2xl` inside a padded `bg-muted/30 border border-border` card.
- **Full Resolution Link**: Always pair the image preview with a dedicated button/link (`Open Full Resolution Image`) to inspect high-definition files in a new tab.

---

## 12. Fixed Phone Number Prefix Input (`+63` Non-Deletable Badge)

All Philippine mobile number inputs across Nexora MUST use a **fixed, non-deletable `+63` prefix** badge with a 10-digit suffix input. The user cannot erase or modify `+63`; they only type the remaining 10 digits (e.g. `9123456789`). The database always stores numbers in domestic format `09XXXXXXXXX`.

### 1. UI Container Pattern
```html
<div class="flex h-10 w-full overflow-hidden rounded-2xl border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
  <span class="flex items-center justify-center bg-muted/60 px-3.5 font-mono font-bold text-xs text-primary border-e border-border shrink-0 select-none">
    +63
  </span>
  <input type="tel" maxLength={10} placeholder="9123456789"
    class="flex-1 bg-transparent px-3 text-xs font-mono text-foreground outline-none border-none placeholder:text-muted-foreground" />
</div>
```

### 2. State & Validation Rules
- **State variable**: Hold only the 10 digits after `+63` (`contactDigits` / `mobileNumber` without country code prefix).
- **Initialization from existing DB data**: Strip leading `0` from persisted domestic number: `value.replace(/^0/, "").slice(0, 10)`. (DB `09123456789` → display `9123456789`.)
- **onChange handler**: Allow digits only, cap at 10: `e.target.value.replace(/\D/g, "").slice(0, 10)`.
- **Submit handler**: Reconstruct domestic format for DB storage by prepending `0`: `"0" + contactDigits.trim()` → `09123456789`. If empty, send `null` or `undefined`.
- **Validation**: Check that trimmed digits length is exactly 10, or empty (optional fields): `contactDigits.trim().length !== 10` → error.

### 3. Helper Text
```html
<p class="text-[11px] text-muted-foreground">
  The prefix <span class="font-mono font-semibold text-primary">+63</span> is fixed. Enter the remaining 10 digits.
</p>
```

### 4. Forms Using This Pattern
- `ResidentIncidentForm` (`resident-incident-form.tsx`) — `contactDigits` state
- `ResidentIncidentEditForm` (`resident-incident-edit-form.tsx`) — `contactDigits` state
- `ResidentBlotterForm` (`resident-blotter-form.tsx`) — `contactDigits` state
- `ResidentBlotterEditForm` (`resident-blotter-edit-form.tsx`) — `contactDigits` state
- `ProfileForm` (`profile-form.tsx`) — `mobileNumber` via `react-hook-form` `Controller` + Zod `PH_MOBILE_DIGITS = /^\d{10}$/`
- `SetupForm` (`setup-form.tsx`) — `mobileNumber` via `react-hook-form` `Controller` + Zod `PH_MOBILE_DIGITS = /^\d{10}$/`

---

## 13. Pre-fill Personal Information Pattern

When a form contains fields that overlap with the resident's profile data (e.g. contact number, name, purok, address), the form SHOULD provide a pre-fill mechanism.

### 1. Phone Number Auto-Fill (Incident & Blotter Create Forms)
- Phone number is auto-filled on mount via `defaultContact` prop.
- Helper text dynamically shows:
  - ✅ `Pre-filled from your profile` (green, with CheckCircle2 icon) when value matches profile.
  - 👤 `Use my profile number` (clickable button) when user clears the field.
  - Standard `+63 is fixed. Enter the remaining 10 digits.` otherwise.

### 2. Dynamic Field Pre-Fill (Document Request Form)
For forms with **dynamic/configurable fields** (like `RequestForm` with `DocumentField[]`), use the `ProfileInfo` + label-matching pattern:

#### `ProfileInfo` Type (exported from `request-form.tsx`)
```ts
type ProfileInfo = {
  fullName: string;    // "Juan Santos Dela Cruz"
  firstName: string;   // "Juan"
  middleName: string;  // "Santos"
  lastName: string;    // "Dela Cruz"
  mobileNumber: string; // "09123456789"
  purok: string;       // "Purok 1"
  birthDate: string;   // "2000-01-15"
  address: string;     // "Purok 1, Barangay Libtangin"
};
```

#### Label Matching (`matchFieldToProfile`)
Case-insensitive keyword matching on field labels:
- `"full name"`, `"complete name"`, generic `"name"` → `fullName` (excludes spouse/father/mother/maiden/respondent/business/document)
- `"first name"` → `firstName`; `"middle name"` → `middleName`; `"last name"` / `"surname"` → `lastName`
- `"address"`, `"purok"` → `address`
- `"mobile"`, `"contact"`, `"phone"`, `"cellphone"` → `mobileNumber`
- `"birth"`, `"birthday"`, `"dob"` (date-type fields only) → `birthDate`

#### UI Button
A pill-shaped `"Pre-fill from my profile"` button appears above the dynamic fields grid when matchable fields exist. It only fills **empty** fields (never overwrites user edits) and shows a toast on success.

#### Server Page Setup
Build `ProfileInfo` from `getResidentProfile()` + `PUROK_LABELS` and pass as `profileInfo` prop.

### 3. Forms Using Pre-Fill
- `ResidentIncidentForm` — phone auto-fill + "Use my profile number" restore
- `ResidentBlotterForm` — phone auto-fill + "Use my profile number" restore
- `RequestForm` — "Pre-fill from my profile" button for dynamic document fields (create + edit/resubmit)


