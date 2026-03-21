"use client";

import { Navbar } from "@/shared/components/Navbar";

export function AppShell({
  activeRole,
  children,
  initialChatUnreadCount,
  notifications,
  unreadCount,
  user,
}) {
  return (
    <>
      <Navbar
        activeRole={activeRole}
        initialChatUnreadCount={initialChatUnreadCount}
        notifications={notifications}
        unreadCount={unreadCount}
        user={user}
      />
      {children}
    </>
  );
}
