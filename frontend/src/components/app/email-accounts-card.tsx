import { useCallback, useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { isDemoAccount } from '@/lib/demo-ai';

// Backend: com.applyiq.email.EmailController (GET/PATCH/DELETE /email/{provider}, POST .../authorize, .../sync)
type EmailProvider = 'GMAIL';

interface EmailAccountDto {
  provider: EmailProvider;
  configured: boolean;
  connected: boolean;
  emailAddress: string | null;
  lastSyncedAt: string | null;
  autoUpdateStatus: boolean;
  autoAddApplications: boolean;
}

const PROVIDER_LABEL: Record<EmailProvider, string> = { GMAIL: 'Gmail' };

const AUTOMATIONS = [
  {
    key: 'autoUpdateStatus',
    label: 'Auto-update statuses',
    description: 'Move an application to Interviewing or Rejected when a matching email arrives.',
  },
  {
    key: 'autoAddApplications',
    label: 'Auto-add applications',
    description: 'Add a new Applied application when an "application received" email comes in.',
  },
] as const;

// Google's standard sign-in button (developers.google.com/identity/branding-guidelines): official
// four-color "G", their light/dark colors and border, and one of the three approved labels.
// Verification of the Gmail scopes reviews this button, so keep it to spec rather than restyling it.
function GoogleButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full border border-[#747775] bg-white px-3 text-sm font-medium text-[#1F1F1F] transition-colors hover:bg-[#F2F2F2] focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F1F1F]"
    >
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      Continue with Google
    </button>
  );
}

export function EmailAccountsCard() {
  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const [accounts, setAccounts] = useState<EmailAccountDto[] | null>(null);
  const [busy, setBusy] = useState<EmailProvider | null>(null);
  // Connecting asks for the account password again first (backend re-checks it).
  const [confirming, setConfirming] = useState<EmailProvider | null>(null);
  const [password, setPassword] = useState('');

  const load = useCallback(() => {
    apiFetch<EmailAccountDto[]>('/email')
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (!isDemo) load();
  }, [isDemo, load]);

  const connect = async (provider: EmailProvider) => {
    // Opened before the await so the browser treats it as part of the click and doesn't block it.
    const popup = window.open('', 'applyiq-email', 'width=520,height=680');
    try {
      const { url } = await apiFetch<{ url: string }>(`/email/${provider}/authorize`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setConfirming(null);
      setPassword('');
      if (!popup) {
        window.location.href = url;
        return;
      }
      popup.location.href = url;
      // Google's sign-in pages set Cross-Origin-Opener-Policy, which cuts this page off from the
      // popup (popup.closed reads true right away and postMessage can't reach us). So instead of
      // watching the popup, poll the backend until the connection appears, for up to 5 minutes.
      const startedAt = Date.now();
      const timer = window.setInterval(async () => {
        const latest = await apiFetch<EmailAccountDto[]>('/email', {}, { quiet: true }).catch(() => null);
        const connected = latest?.some((a) => a.provider === provider && a.connected);
        if (latest) setAccounts(latest);
        if (connected || Date.now() - startedAt > 5 * 60_000) window.clearInterval(timer);
        if (connected) toast.success(`${PROVIDER_LABEL[provider]} connected.`);
      }, 2000);
    } catch (error) {
      // e.g. wrong password, 2FA not on yet, or missing OAuth credentials — say why instead of the popup just vanishing.
      popup?.close();
      toast.error(error instanceof Error ? error.message : `Couldn't start ${PROVIDER_LABEL[provider]} sign-in.`);
    }
  };

  const update = async (provider: EmailProvider, patch: Partial<Pick<EmailAccountDto, 'autoUpdateStatus' | 'autoAddApplications'>>) => {
    const updated = await apiFetch<EmailAccountDto>(`/email/${provider}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setAccounts((prev) => prev?.map((a) => (a.provider === provider ? updated : a)) ?? null);
  };

  const sync = async (provider: EmailProvider) => {
    setBusy(provider);
    try {
      const { changes } = await apiFetch<{ changes: number }>(`/email/${provider}/sync`, { method: 'POST' });
      toast.success(changes === 0 ? 'Inbox checked — nothing new.' : `${changes} application${changes === 1 ? '' : 's'} updated from email.`);
      load();
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (provider: EmailProvider) => {
    if (!window.confirm(`Disconnect ${PROVIDER_LABEL[provider]}? ApplyIQ will stop reading this inbox.`)) return;
    await apiFetch(`/email/${provider}`, { method: 'DELETE' });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Email accounts</h2>
        <p className="text-sm text-slate-500 dark:text-white/50">
          Connect your inbox and ApplyIQ keeps your applications up to date from recruiter emails. It only sends the follow-ups you
          send from the Follow-Ups page, and never deletes or changes your mail.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isDemo && (
          <p className="text-sm text-slate-500 dark:text-white/50">Email connections are disabled on the demo account.</p>
        )}
        {!isDemo && accounts === null && <p className="text-sm text-slate-400 dark:text-white/40">Loading…</p>}
        {accounts?.map((account, i) => (
          <div key={account.provider} className="flex flex-col gap-3">
            {i > 0 && <Separator className="bg-slate-100 dark:bg-white/10" />}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{PROVIDER_LABEL[account.provider]}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {account.connected
                      ? `${account.emailAddress ?? 'Connected'}${account.lastSyncedAt ? ` · checked ${new Date(account.lastSyncedAt).toLocaleString()}` : ''}`
                      : account.configured
                        ? 'Not connected'
                        : 'Not available — this server has no OAuth credentials for it yet'}
                  </p>
                </div>
              </div>
              {account.connected ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === account.provider}
                    onClick={() => sync(account.provider)}
                    aria-label={`Check ${PROVIDER_LABEL[account.provider]} now`}
                  >
                    <RefreshCw className={busy === account.provider ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => disconnect(account.provider)}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <GoogleButton
                  disabled={!account.configured}
                  onClick={() => {
                    setPassword('');
                    setConfirming(account.provider);
                  }}
                />
              )}
            </div>
            {account.connected &&
              AUTOMATIONS.map((automation) => {
                const id = `${account.provider}-${automation.key}`;
                return (
                  <div key={id} className="flex items-center justify-between gap-4 pl-12">
                    <div>
                      <Label htmlFor={id} className="text-slate-900 dark:text-white">
                        {automation.label}
                      </Label>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">{automation.description}</p>
                    </div>
                    <Switch
                      id={id}
                      checked={account[automation.key]}
                      onCheckedChange={(checked) => update(account.provider, { [automation.key]: checked })}
                    />
                  </div>
                );
              })}
          </div>
        ))}
      </CardContent>

      <Dialog open={confirming !== null} onOpenChange={(isOpen) => !isOpen && setConfirming(null)}>
        <DialogContent className="max-w-sm sm:max-w-sm">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (confirming) connect(confirming);
            }}
          >
            <DialogHeader>
              <DialogTitle>Confirm it’s you</DialogTitle>
              <DialogDescription>
                Connecting Gmail lets ApplyIQ send email as you, so enter your password to continue. Two-factor authentication must
                be on.
              </DialogDescription>
            </DialogHeader>
            <Input type="password" autoFocus required placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!password}>
                Continue to Google
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
