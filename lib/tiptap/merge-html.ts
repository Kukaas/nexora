/**
 * Replace every merge-field placeholder in a stored document layout with the
 * request's resolved value. Runs in the browser (uses `DOMParser`), so only
 * import this from client components.
 *
 * The designer emits placeholders as `<span data-merge="…" data-key="…">`; here
 * we walk each one and swap it for a plain text node from `context` (built by
 * `buildMergeContext`). An unknown/renamed key resolves to "" so nothing leaks
 * the placeholder onto a printed document.
 */
export function mergeHtml(
  html: string,
  context: Record<string, string>,
): string {
  // Browser-only (DOMParser). If ever called on the server, return the template
  // unchanged rather than throwing — callers resolve it again on the client.
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll<HTMLElement>("[data-merge]").forEach((el) => {
    const key = el.getAttribute("data-key") ?? "";
    const value = context[key] ?? "";
    el.replaceWith(doc.createTextNode(value));
  });

  return doc.body.innerHTML;
}
