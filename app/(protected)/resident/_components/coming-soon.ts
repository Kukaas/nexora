import { toast } from "sonner";

/**
 * Interim feedback for portal actions whose flow isn't built yet (document
 * requests, profile, officials directory). Keeps every entry point honest and
 * clickable instead of pointing at a 404. Replace the call sites with real
 * navigation once those routes exist.
 */
export function announceComingSoon(label: string) {
  toast(`${label} is coming soon`, {
    description:
      "We're still building this part of the portal. We'll let you know the moment it opens.",
  });
}
