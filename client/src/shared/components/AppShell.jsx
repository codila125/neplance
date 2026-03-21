"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/shared/components/Navbar";

export function AppShell({
  activeRole,
  children,
  initialChatUnreadCount,
  notifications,
  unreadCount,
  user,
}) {
  const pathname = usePathname();
  const showNavbar = !pathname?.startsWith("/admin");

  return (
    <>
      {showNavbar ? (
        <Navbar
          activeRole={activeRole}
          initialChatUnreadCount={initialChatUnreadCount}
          notifications={notifications}
          unreadCount={unreadCount}
          user={user}
        />
      ) : null}
      {children}
    </>
  );
}
