"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  setAccessToken,
  getAccessToken,
  secondsUntilExpiry,
  clearSession,
  silentRefresh,
  fetchMe,
  serverLogout,
  touchActivity,
  isRecentlyActive,
  AuthUser,
} from "./auth";

interface AuthContextValue {
  /** Whether initial session restoration has completed. */
  initialized: boolean;
  /** Current access token (in memory). null when logged out. */
  accessToken: string | null;
  /** Non-sensitive user info for UI rendering. Never trust for auth decisions. */
  user: AuthUser | null;
  /** Store token + user after a successful login response. */
  login: (token: string, user: AuthUser) => void;
  /** Restore auth session at app startup using refresh cookie + /auth/me. */
  restoreSession: () => Promise<boolean>;
  /** Perform a silent token refresh using the HttpOnly cookie. */
  refresh: () => Promise<string | null>;
  /** Clear memory state and tell the backend to clear the cookie. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Refresh 5 minutes before expiry
const REFRESH_BEFORE_EXPIRY_S = 5 * 60;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [accessToken, setTokenState] = useState<string | null>(getAccessToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Schedule a silent refresh so it fires REFRESH_BEFORE_EXPIRY_S seconds before the token expires.
   *  If the user has been idle for longer than the session timeout, let the token expire instead. */
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const secsLeft = secondsUntilExpiry(token);
    const delay = Math.max(0, secsLeft - REFRESH_BEFORE_EXPIRY_S) * 1000;
    refreshTimerRef.current = setTimeout(async () => {
      if (!isRecentlyActive()) {
        // User has been idle — let the token expire without refreshing
        clearSession();
        setTokenState(null);
        setUser(null);
        return;
      }
      const newToken = await silentRefresh();
      if (newToken) {
        setTokenState(newToken);
        scheduleRefresh(newToken);
      } else {
        // Refresh token expired or revoked — force logout
        clearSession();
        setTokenState(null);
        setUser(null);
      }
    }, delay);
  }, []);

  const login = useCallback((token: string, newUser: AuthUser) => {
    touchActivity(); // seed activity so the first scheduled refresh passes the idle check
    setAccessToken(token);
    setTokenState(token);
    setUser(newUser);
    setInitialized(true);
    scheduleRefresh(token);
  }, [scheduleRefresh]);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    // If there is no recorded activity in sessionStorage (tab was closed and
    // reopened, or this is a fresh tab), do NOT silently restore the session.
    if (!isRecentlyActive()) {
      clearSession();
      setTokenState(null);
      setUser(null);
      return false;
    }

    let token = getAccessToken();

    if (!token || secondsUntilExpiry(token) <= 30) {
      token = await silentRefresh();
    }

    if (!token) {
      clearSession();
      setTokenState(null);
      setUser(null);
      return false;
    }

    const me = await fetchMe(token);
    if (!me) {
      clearSession();
      setTokenState(null);
      setUser(null);
      return false;
    }

    setAccessToken(token);
    setTokenState(token);
    setUser(me);
    scheduleRefresh(token);
    return true;
  }, [scheduleRefresh]);

  const refresh = useCallback(async () => {
    const token = await silentRefresh();
    if (!token) {
      setUser(null);
    } else {
      scheduleRefresh(token);
    }
    setTokenState(token);
    return token;
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await serverLogout();
    clearSession();
    setTokenState(null);
    setUser(null);
  }, []);

  // Track user activity events so we know whether the session should stay alive
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    const handler = () => touchActivity();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await restoreSession();
      if (mounted) setInitialized(true);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [restoreSession]);

  return (
    <AuthContext.Provider
      value={{
        initialized,
        accessToken,
        user,
        login,
        restoreSession,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
