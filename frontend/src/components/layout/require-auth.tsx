import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const { theme } = useTheme();

  if (isInitializing) {
    return (
      <div
        className={cn(
          'flex min-h-svh items-center justify-center text-sm',
          theme === 'dark' ? 'dark bg-black text-white/40' : 'bg-white text-slate-400'
        )}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
