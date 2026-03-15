"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction, switchRoleAction } from "@/lib/actions/session";

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
export function Navbar({ activeRole: activeRoleProp, user }) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <Link href="/login" className="navbar-link">
                Log In
              </Link>
            </li>
            <li>
              <Link href="/signup" className="btn btn-primary btn-sm">
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
