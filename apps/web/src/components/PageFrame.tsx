"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "home" },
  { href: "/history", label: "history" },
  { href: "/sleep", label: "sleep" },
  { href: "/settings", label: "settings" }
];

export function PageFrame({
  title,
  children,
  action
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,227,176,0.55),transparent_35%),linear-gradient(180deg,#FFF8EE_0%,#FFF1DE_100%)] text-tomori-text-light dark:bg-[radial-gradient(circle_at_top,rgba(240,160,48,0.18),transparent_30%),linear-gradient(180deg,#1B1814_0%,#191612_100%)] dark:text-tomori-text-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-8 pt-4">
        <header className="mb-6 flex items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.78)]">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-tomori-muted-light dark:text-tomori-muted-dark">tomori</div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Link className="rounded-full border border-tomori-accent-100 px-3 py-2 text-sm dark:border-tomori-accent-700/50" href="/settings">
              ⚙
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <nav className="mt-6 grid grid-cols-4 gap-2 rounded-[28px] border border-white/70 bg-white/75 p-2 backdrop-blur dark:border-white/10 dark:bg-[rgba(42,37,33,0.78)]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={[
                  "rounded-2xl px-3 py-2 text-center text-xs font-medium transition",
                  active
                    ? "bg-tomori-accent-500 text-white"
                    : "text-tomori-muted-light hover:bg-tomori-accent-50 dark:text-tomori-muted-dark dark:hover:bg-[rgba(240,160,48,0.12)]"
                ].join(" ")}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
