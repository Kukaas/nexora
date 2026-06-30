<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Server Components by default

Every route file is a React Server Component. **Never put `"use client"` at the top of a `page.tsx` or `layout.tsx`.** When a route needs interactivity (forms, hooks, event handlers, browser APIs), keep the page/layout as a server component and extract the interactive parts into a client component (convention: a colocated `_components/*-form.tsx` or similar) that the server page renders.

Why: pages stay server-rendered, each page can export `metadata`, and the client JS bundle stays small (only the interactive leaf ships `"use client"`). The client boundary lives as deep in the tree as possible, never at the route root.

# Forms get their own full-width page, not a modal

Inside the authenticated areas (resident / secretary / treasurer), creating or editing a record is its own route that takes the whole page — **never a dialog/modal.** The list links to it (`Add` → `…/new`, the row's edit → `…/[id]/edit`); the form page reads its data as a server component and renders a colocated client form (e.g. `_components/*-form.tsx`). On success the form navigates back to the list (`router.push(backHref)`), it does not close an overlay.

Why: authenticated pages are full-width and deep-linkable, the back/refresh buttons behave, and long forms (like the document field builder) get room to breathe in a multi-column layout instead of being crammed into a dialog. Don't wrap these pages in a narrow centered `max-w-*` column — use the full width, splitting long forms into columns where it helps. Short read-only detail pages may still constrain width; this rule is about create/edit forms.
