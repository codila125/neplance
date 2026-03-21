"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LoggedInFooter({ user }) {
  const pathname = usePathname();

  if (!user || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-actions">
          <Link href="/about" className="btn btn-secondary btn-sm">
            About Us
          </Link>
          <Link href="/contact" className="btn btn-secondary btn-sm">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
