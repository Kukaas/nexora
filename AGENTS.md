<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Server Components by default

Every route file is a React Server Component. **Never put `"use client"` at the top of a `page.tsx` or `layout.tsx`.** When a route needs interactivity (forms, hooks, event handlers, browser APIs), keep the page/layout as a server component and extract the interactive parts into a client component (convention: a colocated `_components/*-form.tsx` or similar) that the server page renders.

Why: pages stay server-rendered, each page can export `metadata`, and the client JS bundle stays small (only the interactive leaf ships `"use client"`). The client boundary lives as deep in the tree as possible, never at the route root.
