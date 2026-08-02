"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NexoraMark } from "@/app/(auth)/_components/nexora-mark";

// Real routes, not homepage anchors: these are the site's primary internal
// links, so each one has to be a crawlable destination with its own page.
const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/announcements", label: "Announcements" },
  { href: "/verify", label: "Verify" },
];

/**
 * `solid` pins the header to its opaque treatment from the first paint. The
 * homepage leaves it off so the header floats transparently over the hero;
 * every other public page has content at the top and needs the sheet
 * immediately, or the nav sits unreadable over the page heading.
 */
export function SiteHeader({ solid = false }: { solid?: boolean }) {
  // Transparent over the hero at the top; resolves to a near-opaque sheet with
  // a hairline once the page scrolls, so the header never competes with content.
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        solid || scrolled || menuOpen
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          aria-label="Nexora, for Barangay Libtangin"
        >
          <NexoraMark />
          <span
            aria-hidden
            className="hidden h-5 w-px bg-border sm:block"
          />
          <span className="hidden text-sm leading-tight text-muted-foreground sm:block">
            for Barangay
            <span className="block font-medium text-foreground">Libtangin</span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-primary/30",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu sheet. */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-background px-5 py-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-2xl px-3 py-3 text-base font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-primary/30",
                    active ? "bg-accent text-accent-foreground" : "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5">
            <Button asChild size="lg">
              <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
