"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken, secondsUntilExpiry } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

// Refresh proactively when <5 min (300s) remain on the access token
const REFRESH_THRESHOLD_SEC = 300;
// How often to check (every 2 minutes)
const CHECK_INTERVAL_MS = 2 * 60 * 1000;

// ── RBAC: which roles may access each route prefix ───────────────────────────
// undefined entry = any authenticated user
const ROUTE_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/settings",     roles: ["admin"] },
  { prefix: "/admissions",   roles: ["admin", "teacher"] },
  { prefix: "/classes",      roles: ["admin", "teacher"] },
  { prefix: "/timetable",    roles: ["admin", "teacher"] },
  { prefix: "/exams",        roles: ["admin", "teacher"] },
  { prefix: "/attendance",   roles: ["admin", "teacher"] },
  { prefix: "/announcements",roles: ["admin", "teacher"] },
  { prefix: "/gallery",      roles: ["admin", "teacher"] },
  { prefix: "/fees",         roles: ["admin", "finance"] },
  { prefix: "/reports",      roles: ["admin", "finance"] },
  { prefix: "/transport",    roles: ["admin", "finance"] },
];

function isAllowed(pathname: string, role: string | undefined): boolean {
  if (!role) return false;
  const match = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!match) return true; // no restriction
  return match.roles.includes(role);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const activityRef = useRef(false);

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
    if (auth.user && !isAllowed(pathname, auth.user.role)) {
      router.replace("/forbidden");
    }
  }, [auth.initialized, auth.accessToken, auth.user, pathname, router]);

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

