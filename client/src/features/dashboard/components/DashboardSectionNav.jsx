"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardSectionNav({ items }) {
  const pathname = usePathname();

  return (
    <nav className="tab-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`tab-btn ${pathname === item.href ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
