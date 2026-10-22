import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch, setAuthToken } from '@/lib/api-client';
import { clearAllNotifications } from '@/lib/notification-store';
import { clearStoredResults } from '@/lib/stored-results';

interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// With 2FA on, a correct password returns only twoFactorRequired + challengeToken (no token/user);
// that challenge plus a code goes to /auth/login/2fa for the real session.
interface AuthResponseDto {
  token: string | null;
  tokenType: string | null;
  user: UserResponseDto | null;
  twoFactorRequired: boolean;
  challengeToken: string | null;
}

export type LoginResult = { twoFactorRequired: false } | { twoFactorRequired: true; challengeToken: string };

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactorLogin: (challengeToken: string, code: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_STORAGE_KEY = 'applyiq.token';

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(dto: UserResponseDto): AuthUser {
  return { id: dto.id, firstName: dto.firstName, lastName: dto.lastName, name: `${dto.firstName} ${dto.lastName}`, email: dto.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // AuthProvider wraps the app above <Routes>, so this effect only ever runs on a real
  // browser page load/refresh — never on in-app client-side navigation. Any such load sends
  // the user back to the home screen first: this both matches the requested "refresh always
  // lands on home" behavior and guarantees a clean landing spot if the stored token turns out
  // to be stale (e.g. expired after the machine was asleep or off for a while), rather than
  // leaving the app stuck on a deep route it's mid-way through logging out of.
  useEffect(() => {
    // Legal pages must load directly (Google OAuth verification links to them).
    if (!['/', '/privacy', '/terms'].includes(window.location.pathname)) {
      window.location.href = '/';
      return;
    }

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsInitializing(false);
      return;
    }
    setAuthToken(storedToken);
    apiFetch<UserResponseDto>('/auth/me')
      .then((dto) => setUser(toAuthUser(dto)))
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        clearStoredResults();
        // The bell is a module-level store; without this the next account to log in sees these.
        clearAllNotifications();
        setAuthToken(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const startSession = (result: AuthResponseDto) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token!);
      clearStoredResults();
      setAuthToken(result.token);
      setUser(toAuthUser(result.user!));
    };
    return {
      isAuthenticated: user !== null,
      isInitializing,
      user,
      login: async (email: string, password: string): Promise<LoginResult> => {
        const result = await apiFetch<AuthResponseDto>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (result.twoFactorRequired) return { twoFactorRequired: true, challengeToken: result.challengeToken! };
        startSession(result);
        return { twoFactorRequired: false };
      },
      completeTwoFactorLogin: async (challengeToken: string, code: string) => {
        startSession(
          await apiFetch<AuthResponseDto>('/auth/login/2fa', {
            method: 'POST',
            body: JSON.stringify({ challengeToken, code }),
          })
        );
      },
      register: async (firstName: string, lastName: string, email: string, password: string) => {
        startSession(
          await apiFetch<AuthResponseDto>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ firstName, lastName, email, password }),
          })
        );
      },
      logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        clearStoredResults();
        // The bell is a module-level store; without this the next account to log in sees these.
        clearAllNotifications();
        setAuthToken(null);
        setUser(null);
      },
    };
  }, [user, isInitializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
