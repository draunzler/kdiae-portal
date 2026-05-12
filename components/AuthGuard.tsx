"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken, secondsUntilExpiry } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { settingsApi, type RoleEntry } from "@/lib/api";

// Refresh proactively when <5 min (300s) remain on the access token
const REFRESH_THRESHOLD_SEC = 300;
// How often to check (every 2 minutes)
const CHECK_INTERVAL_MS = 2 * 60 * 1000;

// Maps each route prefix to a perm key in the roles matrix.
// Routes not listed here are accessible to any authenticated user.
const ROUTE_PERM: Array<{ prefix: string; permKey: string }> = [
  { prefix: "/students",      permKey: "students"      },
  { prefix: "/admissions",    permKey: "admissions"    },
  { prefix: "/classes",       permKey: "classes"       },
  { prefix: "/timetable",     permKey: "classes"       },
  { prefix: "/fees",          permKey: "fees"          },
  { prefix: "/exams",         permKey: "exams"         },
  { prefix: "/attendance",    permKey: "attendance"    },
  { prefix: "/transport",     permKey: "transport"     },
  { prefix: "/announcements", permKey: "announcements" },
  { prefix: "/reports",       permKey: "reports"       },
  { prefix: "/settings",      permKey: "settings"      },
  // Gallery has no perm key — kept admin-only via the fallback below
];

// Static fallback for routes that don't have a perm key (e.g. gallery)
const STATIC_ROUTE_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/gallery", roles: ["admin"] },
];

function isAllowed(
  pathname: string,
  role: string | undefined,
  matrix: RoleEntry[],
): boolean {
  if (!role) return false;
  if (role === "admin") return true;

  // Check dynamic matrix first
  const permMatch = ROUTE_PERM.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (permMatch) {
    if (matrix.length === 0) {
      // Matrix not loaded yet — optimistically allow to avoid flicker;
      // the sidebar will hide the link anyway once loaded.
      return true;
    }
    const row = matrix.find((r) => r.role.toLowerCase() === role.toLowerCase());
    return row ? !!row.perms[permMatch.permKey] : false;
  }

  // Check static fallback routes (gallery)
  const staticMatch = STATIC_ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (staticMatch) return staticMatch.roles.includes(role);

  return true; // no restriction
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const activityRef = useRef(false);
  const [rolesMatrix, setRolesMatrix] = useState<RoleEntry[]>([]);

  // Fetch roles matrix once on mount so access checks use live permissions
  useEffect(() => {
    settingsApi.getRoles()
      .then((d) => { if (d.roles?.length) setRolesMatrix(d.roles); })
      .catch(() => { /* fall back to empty matrix — static fallback rules apply */ });
  }, []);

  const logout = useCallback(() => {
    auth.logout().then(() => router.replace("/login"));
  }, [auth, router]);

  // Wait for provider-level session restoration, then allow/deny access.
  useEffect(() => {
    if (!auth.initialized) return;

    if (!auth.accessToken) {
      router.replace("/login");
      return;
    }

    // RBAC: redirect to /forbidden if the user's role doesn't allow this route
    if (auth.user && !isAllowed(pathname, auth.user.role, rolesMatrix)) {
      router.replace("/forbidden");
    }
  }, [auth.initialized, auth.accessToken, auth.user, pathname, router, rolesMatrix]);

  // Periodic check: refresh proactively if user has been active
  useEffect(() => {
    if (!auth.initialized || !auth.accessToken) return;

    const tryRefresh = async () => {
      const token = await auth.refresh();
      if (!token) {
        logout();
        return null;
      }
      return token;
    };

    const interval = setInterval(async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const secs = secondsUntilExpiry(token);

      if (secs <= 0) {
        await tryRefresh();
        return;
      }

      if (secs < REFRESH_THRESHOLD_SEC && activityRef.current) {
        activityRef.current = false;
        const newToken = await auth.refresh();
        if (!newToken) logout();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [auth, auth.initialized, auth.accessToken, logout, router]);

  // Track user activity
  useEffect(() => {
    const markActive = () => { activityRef.current = true; };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActive));
  }, []);

  if (!auth.initialized || !auth.accessToken) return null;

  return <>{children}</>;
}

