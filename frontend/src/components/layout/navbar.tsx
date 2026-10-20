import { useEffect, useState, type MouseEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { Menu, X } from 'lucide-react';
import { toast } from 'sonner';

import applyiqIcon from '@/assets/images/applyiq-icon.png';
import { Button } from '@/components/ui/button';
import { AccountMenu } from '@/components/layout/account-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useAuth } from '@/context/auth-context';
import { PREVIEW_ACCOUNT_EMAIL, PREVIEW_ACCOUNT_PASSWORD } from '@/lib/preview-account';
import { cn } from '@/lib/utils';

const MARKETING_ROUTES = new Set(['/', '/features', '/login', '/signup']);

const MARKETING_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Demo', href: '/dashboard' },
];

const APP_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Applications', href: '/applications' },
  { label: 'Resume Match', href: '/resume-match' },
  { label: 'Interview Prep', href: '/interview-prep' },
  { label: 'Follow-Ups', href: '/follow-ups' },
  { label: 'Analytics', href: '/analytics' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const isAppSection = !MARKETING_ROUTES.has(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = isAppSection ? APP_LINKS : MARKETING_LINKS;

  const handleDemoLogin = async (event: MouseEvent) => {
    event.preventDefault();
    try {
      await login(PREVIEW_ACCOUNT_EMAIL, PREVIEW_ACCOUNT_PASSWORD);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Demo login failed');
    }
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300 print:hidden',
        scrolled || open || isAppSection
          ? 'border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-lg'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to={isAppSection ? '/dashboard' : '/'} className="flex items-center gap-2">
          <img src={applyiqIcon} alt="ApplyIQ" className="h-8 w-8 rounded-md" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Apply<span className="text-sky-400">IQ</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={link.label === 'Demo' ? handleDemoLogin : undefined}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium text-slate-600 dark:text-white/70 transition-colors hover:text-slate-900 dark:hover:text-white',
                  isActive && isAppSection && 'text-slate-900 dark:text-white'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAppSection ? (
            <>
              <NotificationBell />
              <AccountMenu />
            </>
          ) : (
            <>
              <Button
                render={<Link to="/login" />}
                nativeButton={false}
                variant="ghost"
                className="text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              >
                Log in
              </Button>
              <Button
                render={<Link to="/signup" />}
                nativeButton={false}
                className="bg-sky-500 text-white hover:bg-sky-400"
              >
                Sign up free
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-900 dark:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-black/95 px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={link.label === 'Demo' ? handleDemoLogin : undefined}
                className="text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              >
                {link.label}
              </NavLink>
            ))}
            {isAppSection ? (
              <div className="mt-2 flex items-center gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
                <NotificationBell />
                <AccountMenu />
                <span className="text-sm text-slate-500 dark:text-white/60">Account</span>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                <Button
                  render={<Link to="/login" />}
                  nativeButton={false}
                  variant="ghost"
                  className="w-full justify-center text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                >
                  Log in
                </Button>
                <Button
                  render={<Link to="/signup" />}
                  nativeButton={false}
                  className="w-full justify-center bg-sky-500 text-white hover:bg-sky-400"
                >
                  Sign up free
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
