import { useEffect, type ReactNode } from 'react';

import { Navbar } from '@/components/layout/navbar';
import { useTheme } from '@/context/theme-context';
import { addNotification } from '@/lib/notification-store';
import { cn } from '@/lib/utils';

// Module-level (not component) state: each <Route> re-creates its own <AppLayout>
// element (see App.tsx), so whether React treats client-side navigation between
// app pages as a remount is route-structure-dependent and not worth relying on.
// A flag scoped to the module instead of the component guarantees this fires
// exactly once per real page load, regardless of how many times AppLayout mounts
// underneath it.
let hasShownStartupNotification = false;

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  // Dialogs/dropdowns/selects portal straight to document.body, outside this
  // component's subtree, so they only pick up dark: styling if <html> itself
  // carries the "dark" class. Marketing/login/signup/features force their own
  // "dark" wrapper regardless, so this only matters while an app page is mounted.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    return () => {
      root.classList.add('dark');
    };
  }, [theme]);

  useEffect(() => {
    if (hasShownStartupNotification) return;
    hasShownStartupNotification = true;
    addNotification(
      "Hello! I have added a new feature so the Resume Match page is now fully functional! Simply add " +
        'your  resume(s) into the app and either enter job application details manually and through ' +
        'mystical powers it will calculate a resume keyword match score! I have also added a couple of ' +
        'UI changes and now have added AI into the application. Please do not abuse the AI tokens as I ' +
        'am paying for these out of my own pocket.'
    );
  }, []);

  return (
    <div className={cn('min-h-svh', theme === 'dark' ? 'dark bg-black' : 'bg-white')}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">{children}</main>
    </div>
  );
}
