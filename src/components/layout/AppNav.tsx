"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Chat", icon: "💬" },
  { href: "/markets", label: "Markets", icon: "📈" },
  { href: "/history", label: "History", icon: "🗂️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-zinc-800 md:bg-zinc-950/80 md:px-3 md:py-6">
        <div className="mb-8 px-3">
          <Link href="/" className="group block">
            <span className="text-lg font-semibold tracking-tight text-emerald-400">
              ChainIQ
            </span>
            <span className="ml-1 text-lg font-light text-zinc-400 group-hover:text-zinc-200">
              Lite
            </span>
          </Link>
          <p className="mt-1 text-xs text-zinc-500">
            Blockchain &amp; markets educator
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-3 text-[10px] leading-relaxed text-zinc-600">
          Informational only. Not investment advice. Never share seed phrases.
        </p>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden"
        aria-label="Main mobile"
      >
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                active ? "text-emerald-400" : "text-zinc-500"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base" aria-hidden>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
