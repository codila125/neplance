"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { logoutAction, switchRoleAction } from "@/lib/actions/session";
import { API_BASE_URL } from "@/lib/api/config";

const NAVBAR_POLL_INTERVAL_MS = 4000;
const NAVBAR_NOTIFICATION_LIMIT = 3;

async function parseApiResponse(response) {
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "GET",
    credentials: "include",
  });

  return response.ok;
}

async function fetchWithSessionRefresh(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsed = await parseApiResponse(response);
  const errorCode = parsed.data?.errorCode;

  if (parsed.ok) {
    return parsed.data;
  }

  if (parsed.status === 401 && errorCode === "TOKEN_EXPIRED") {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error("Session expired");
    }

    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const retried = await parseApiResponse(retryResponse);

    if (retried.ok) {
      return retried.data;
    }
  }

  throw new Error(parsed.data?.message || "Failed to fetch latest data.");
}

/**
 * Inline logo SVG - consistent 32x32 green circle with mountain icon.
 */
const Logo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Neplance logo</title>
    <circle cx="16" cy="16" r="16" fill="#14a800" />
    <path
      d="M12 10L16 20L20 10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 15H22" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Unified Navbar used on EVERY page.
 *
 * Props:
 * - user: user object (null when logged out)
 */
export function Navbar({
  activeRole: activeRoleProp,
  initialChatUnreadCount = 0,
  notifications = [],
  unreadCount = 0,
  user,
}) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState(notifications);
  const [liveNotificationUnreadCount, setLiveNotificationUnreadCount] =
    useState(unreadCount);
  const [liveMessageUnreadCount, setLiveMessageUnreadCount] = useState(
    initialChatUnreadCount,
  );
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Derive role info
  const roleList = Array.isArray(user?.role)
    ? user.role
    : user?.role
      ? [user.role]
      : [];
  const activeRole =
    activeRoleProp && roleList.includes(activeRoleProp)
      ? activeRoleProp
      : roleList[0] || "freelancer";
  const isFreelancer = activeRole === "freelancer";
  const nextRole = isFreelancer ? "client" : "freelancer";
  const workLink = isFreelancer ? "/jobs" : "/talent";
  const hasBothRoles =
    roleList.includes("freelancer") && roleList.includes("client");

  const isActive = (path) => pathname === path;
  const isMessagesActive = pathname.startsWith("/messages");
  const isNotificationsActive = pathname.startsWith("/notifications");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setLiveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    setLiveNotificationUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    setLiveMessageUnreadCount(initialChatUnreadCount);
  }, [initialChatUnreadCount]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let cancelled = false;

    const syncNavbarData = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      try {
        const [
          notificationListResponse,
          notificationSummaryResponse,
          chatSummaryResponse,
        ] = await Promise.all([
          fetchWithSessionRefresh(
            `/api/notifications?limit=${NAVBAR_NOTIFICATION_LIMIT}`,
          ),
          fetchWithSessionRefresh("/api/notifications/summary"),
          fetchWithSessionRefresh("/api/chat/summary"),
        ]);

        if (cancelled) {
          return;
        }

        setLiveNotifications(notificationListResponse?.data || []);
        setLiveNotificationUnreadCount(
          notificationSummaryResponse?.data?.unreadCount || 0,
        );
        setLiveMessageUnreadCount(chatSummaryResponse?.data?.unreadCount || 0);
      } catch {
        // Keep the last known navbar state if background refresh fails.
      }
    };

    syncNavbarData();

    const intervalId = window.setInterval(
      syncNavbarData,
      NAVBAR_POLL_INTERVAL_MS,
    );
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncNavbarData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  // ----- Guest (logged out) -----
  if (!user) {
    return (
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <Logo />
            <span>Neplance</span>
          </Link>

          <ul className="navbar-links">
            <li>
              <a href="/#hire-talent" className="navbar-link">
                Find Talent
              </a>
            </li>
            <li>
              <a href="/#find-opportunities" className="navbar-link">
                Find Work
              </a>
            </li>
            <li>
              <Link href="/login" className="btn btn-secondary btn-sm navbar-auth-btn">
                Log In
              </Link>
            </li>
            <li>
              <Link href="/signup" className="btn btn-primary btn-sm navbar-auth-btn">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  // ----- Authenticated -----
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/dashboard" className="navbar-brand">
          <Logo />
          <span>Neplance</span>
        </Link>

        <ul className="navbar-links">
          <li>
            <Link
              href="/dashboard"
              className={`navbar-link ${
                isActive("/dashboard") ? "active" : ""
              }`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href={workLink}
              className={`navbar-link ${isActive(workLink) ? "active" : ""}`}
            >
              {isFreelancer ? "Find Work" : "Find Talent"}
            </Link>
          </li>
        </ul>

        <div className="navbar-right">
          <Link
            href="/messages"
            className={`navbar-icon-link ${isMessagesActive ? "active" : ""}`}
            aria-label="Messages"
            title="Messages"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {liveMessageUnreadCount > 0 ? (
              <>
                <span className="navbar-dot" aria-hidden="true" />
                <span className="sr-only">
                  {liveMessageUnreadCount} unread messages
                </span>
              </>
            ) : null}
          </Link>

          <div className="profile-menu" ref={notificationsRef}>
            <button
              type="button"
              className={`navbar-icon-button ${
                isNotificationsActive ? "active" : ""
              }`}
              onClick={() => setShowNotifications((previous) => !previous)}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {liveNotificationUnreadCount > 0 ? (
                <span className="navbar-badge">
                  {liveNotificationUnreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications && (
              <div
                className="profile-dropdown"
                style={{ width: "360px", maxWidth: "calc(100vw - 2rem)" }}
              >
                <div className="dropdown-header">
                  <div className="dropdown-header-name">Notifications</div>
                  <div className="dropdown-header-email">
                    Recent updates across proposals, contracts, and chat.
                  </div>
                </div>
                {liveNotifications.length > 0 ? (
                  <>
                    {liveNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className="dropdown-item"
                        style={{
                          display: "block",
                          paddingBottom: "var(--space-3)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "var(--space-2)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          <strong>{notification.title}</strong>
                          {!notification.isRead ? (
                            <span className="dropdown-badge">New</span>
                          ) : null}
                        </div>
                        <div
                          className="text-light"
                          style={{ fontSize: "var(--text-sm)" }}
                        >
                          {notification.message}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "var(--space-2)",
                            marginTop: "var(--space-2)",
                            flexWrap: "wrap",
                          }}
                        >
                          {notification.link ? (
                            <form
                              action={markNotificationReadAction.bind(
                                null,
                                notification._id,
                                notification.link,
                              )}
                            >
                              <button
                                type="submit"
                                className="btn btn-ghost btn-sm"
                              >
                                Open
                              </button>
                            </form>
                          ) : null}
                          {!notification.isRead ? (
                            <form
                              action={markNotificationReadAction.bind(
                                null,
                                notification._id,
                                null,
                              )}
                            >
                              <button
                                type="submit"
                                className="btn btn-ghost btn-sm"
                              >
                                Mark read
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    <div className="dropdown-divider" />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "var(--space-2)",
                        alignItems: "center",
                      }}
                    >
                      <Link
                        href="/notifications"
                        className="dropdown-item"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all
                      </Link>
                      {liveNotificationUnreadCount > 0 ? (
                        <form action={markAllNotificationsReadAction}>
                          <button
                            type="submit"
                            className="btn btn-ghost btn-sm"
                          >
                            Mark all read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="dropdown-item text-light">
                    No notifications yet.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="profile-menu" ref={dropdownRef}>
            <button
              type="button"
              className="profile-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="profile-avatar">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="profile-name">{user.name || "User"}</span>
            </button>

            {showDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-header-name">
                    {user.name || "User"}
                  </div>
                  <div className="dropdown-header-email">{user.email}</div>
                </div>
                <Link
                  href="/messages"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg
                    className="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Messages</title>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Messages
                </Link>
                <Link
                  href="/notifications"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg
                    className="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Notifications</title>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notifications
                  {liveNotificationUnreadCount > 0 ? (
                    <span className="dropdown-badge">
                      {liveNotificationUnreadCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg
                    className="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Profile</title>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/chain"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg
                    className="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Blockchain</title>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M10 6h4" />
                    <path d="M17.5 10v4" />
                    <path d="M14 17.5h-4" />
                    <path d="M6.5 14v-4" />
                  </svg>
                  Blockchain
                </Link>
                {hasBothRoles && (
                  <form action={switchRoleAction}>
                    <input
                      type="hidden"
                      name="currentPath"
                      value={pathname || "/dashboard"}
                    />
                    <button
                      type="submit"
                      name="nextRole"
                      value={nextRole}
                      className="dropdown-item"
                    >
                      <svg
                        className="dropdown-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <title>Switch role</title>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      Switch to {isFreelancer ? "Client" : "Freelancer"}
                    </button>
                  </form>
                )}
                <div className="dropdown-divider" />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="dropdown-item dropdown-item-logout"
                  >
                    <svg
                      className="dropdown-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Log out</title>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
