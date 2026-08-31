import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiFetch, setAuthToken } from '@/lib/api-client';

interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthResponseDto {
  token: string;
  tokenType: string;
  user: UserResponseDto;
}

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
  login: (email: string, password: string) => Promise<void>;
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
    if (window.location.pathname !== '/') {
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
        setAuthToken(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isInitializing,
      user,
      login: async (email: string, password: string) => {
        const result = await apiFetch<AuthResponseDto>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
        setAuthToken(result.token);
        setUser(toAuthUser(result.user));
      },
      register: async (firstName: string, lastName: string, email: string, password: string) => {
        const result = await apiFetch<AuthResponseDto>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, password }),
        });
        localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
        setAuthToken(result.token);
        setUser(toAuthUser(result.user));
      },
      logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
        setUser(null);
      },
    }),
    [user, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
