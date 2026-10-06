"use client";

import { usePathname } from "next/navigation";

/**
 * The app is a 460px phone column everywhere except admin (a desktop dashboard)
 * and the home page and /explore, which widen to a desktop layout on large screens and stay the phone
 * column below. Token pages are the phone column everywhere.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dashboard = pathname?.startsWith("/admin");
  const home =
    pathname === "/" || pathname === "/explore";
  return <div className={`shell-safe mx-auto w-full px-5 min-h-screen ${dashboard ? "max-w-[1240px]" : home ? "shell-home" : "max-w-[460px]"}`}>{children}</div>;
}
