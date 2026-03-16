"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiCall } from "@/services/api";
import {
  getStoredActiveRole,
  logoutRequest,
  normalizeRoleList,
  persistActiveRole,
} from "@/shared/utils/auth";

const AuthContext = createContext(null);

const getNextRole = (currentRole, roleList) => {
  const canSwitchToClient = roleList.includes("client");
  const canSwitchToFreelancer = roleList.includes("freelancer");

  if (currentRole === "freelancer" && canSwitchToClient) return "client";
  if (currentRole === "client" && canSwitchToFreelancer) return "freelancer";
  return roleList[0] || currentRole || "freelancer";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const applyUser = useCallback((nextUser) => {
    if (!nextUser) {
      setUser(null);
      setActiveRole(null);
      return;
    }

    const roleList = normalizeRoleList(nextUser.role);
    const initialRole = getStoredActiveRole(
      roleList,
      roleList[0] || "freelancer",
    );
    const orderedRoles = roleList.length
      ? [initialRole, ...roleList.filter((role) => role !== initialRole)]
      : [initialRole];

    setActiveRole(initialRole);
    setUser({ ...nextUser, role: orderedRoles });
  }, []);

  const refreshUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      // Use a direct fetch here to avoid `apiCall`'s automatic redirect
      // behavior when tokens are expired. This keeps public pages (like
      // /admin) accessible while still attempting to hydrate the user.
      const resp = await fetch("/api/auth/me", { credentials: "include" });
      if (resp.ok) {
        const json = await resp.json();
        applyUser(json?.data?.user || null);
      } else {
        applyUser(null);
      }
    } catch (_) {
      applyUser(null);
    } finally {
      setLoadingUser(false);
      setIsHydrated(true);
    }
  }, [applyUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const updateUser = useCallback(
    (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setActiveRole(null);
        return;
      }

      const roleList = normalizeRoleList(nextUser.role);
      const nextRole = getStoredActiveRole(
        roleList,
        activeRole || roleList[0] || "freelancer",
      );
      persistActiveRole(nextRole);
      setActiveRole(nextRole);
      setUser({
        ...nextUser,
        role: [nextRole, ...roleList.filter((role) => role !== nextRole)],
      });
    },
    [activeRole],
  );

  const switchRole = useCallback(
    (updatedUser) => {
      const sourceUser = updatedUser || user;
      if (!sourceUser) return;

      const roleList = normalizeRoleList(sourceUser.role);
      const current = activeRole || roleList[0] || "freelancer";
      const nextRole = getNextRole(current, roleList);

      persistActiveRole(nextRole);
      setActiveRole(nextRole);
      setUser({
        ...sourceUser,
        role: [nextRole, ...roleList.filter((role) => role !== nextRole)],
      });
    },
    [activeRole, user],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setActiveRole(null);
    setIsHydrated(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      activeRole,
      isHydrated,
      loadingUser,
      refreshUser,
      updateUser,
      switchRole,
      logout,
    }),
    [
      user,
      activeRole,
      isHydrated,
      loadingUser,
      refreshUser,
      updateUser,
      switchRole,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
