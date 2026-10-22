import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { isDemoAccount } from '@/lib/demo-ai';

// Backend: com.applyiq.auth.TwoFactorController (/auth/2fa, /setup, /enable, /disable)
interface StatusDto {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

type Step =
  | { kind: 'closed' }
  | { kind: 'password' } // re-enter password to start setup
  | { kind: 'scan'; secret: string; otpauthUri: string } // add to app, enter first code
  | { kind: 'codes'; codes: string[] } // one-time recovery codes, shown once
  | { kind: 'disable' };

const fieldClass = 'flex flex-col gap-1.5';

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  } catch {
    toast.error("Couldn't copy to the clipboard.");
  }
}

export function TwoFactorCard() {
  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const [status, setStatus] = useState<StatusDto | null>(null);
  const [step, setStep] = useState<Step>({ kind: 'closed' });
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<StatusDto>('/auth/2fa').then(setStatus).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isDemo) load();
  }, [isDemo, load]);

  const open = (next: Step) => {
    setPassword('');
    setCode('');
    setStep(next);
  };

  // Every step is one request; errors (wrong password/code, too many attempts) come back as toasts.
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step.kind === 'password') {
      run(async () => {
        const setup = await apiFetch<{ secret: string; otpauthUri: string }>('/auth/2fa/setup', {
          method: 'POST',
          body: JSON.stringify({ password }),
        });
        open({ kind: 'scan', ...setup });
      });
    } else if (step.kind === 'scan') {
      run(async () => {
        const { recoveryCodes } = await apiFetch<{ recoveryCodes: string[] }>('/auth/2fa/enable', {
          method: 'POST',
          body: JSON.stringify({ code: code.trim() }),
        });
        open({ kind: 'codes', codes: recoveryCodes });
        load();
      });
    } else if (step.kind === 'disable') {
      run(async () => {
        await apiFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password, code: code.trim() }) });
        toast.success('Two-factor authentication is off.');
        open({ kind: 'closed' });
        load();
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Two-factor authentication</h2>
        <p className="text-sm text-slate-500 dark:text-white/50">
          Log in with your password plus a code from an authenticator app (Google Authenticator, Authy, 1Password…). Required to
          connect Gmail or send email from ApplyIQ.
        </p>
      </CardHeader>
      <CardContent>
        {isDemo ? (
          <p className="text-sm text-slate-500 dark:text-white/50">Not available on the shared demo account.</p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={
                  status?.enabled
                    ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400'
                    : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50'
                }
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {status === null ? 'Loading…' : status.enabled ? 'On' : 'Off'}
                </p>
                {status?.enabled && (
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {status.recoveryCodesRemaining} unused recovery code{status.recoveryCodesRemaining === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
            {status &&
              (status.enabled ? (
                <Button size="sm" variant="outline" onClick={() => open({ kind: 'disable' })}>
                  Turn off
                </Button>
              ) : (
                <Button size="sm" className="bg-sky-500 text-white hover:bg-sky-400" onClick={() => open({ kind: 'password' })}>
                  Turn on
                </Button>
              ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={step.kind !== 'closed'}
        onOpenChange={(isOpen) => {
          // The recovery codes are only ever shown once — make closing them a deliberate choice.
          if (!isOpen && step.kind === 'codes' && !window.confirm('Have you saved your recovery codes? They won’t be shown again.')) return;
          if (!isOpen) open({ kind: 'closed' });
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg">
          <form onSubmit={submit} className="flex flex-col gap-4">
            {step.kind === 'password' && (
              <>
                <DialogHeader>
                  <DialogTitle>Turn on two-factor authentication</DialogTitle>
                  <DialogDescription>Confirm your password to continue.</DialogDescription>
                </DialogHeader>
                <div className={fieldClass}>
                  <Label htmlFor="tfa-password">Password</Label>
                  <Input id="tfa-password" type="password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </>
            )}

            {step.kind === 'scan' && (
              <>
                <DialogHeader>
                  <DialogTitle>Add ApplyIQ to your authenticator app</DialogTitle>
                  <DialogDescription>
                    In your app, choose “Enter a setup key” and paste this key (time-based). On your phone you can tap “Open in
                    authenticator app” instead.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                  <code className="min-w-0 flex-1 font-mono text-sm tracking-wider break-all sm:break-normal sm:whitespace-nowrap text-slate-900 dark:text-white">
                    {step.secret.match(/.{1,4}/g)?.join(' ')}
                  </code>
                  <Button type="button" size="icon" variant="ghost" aria-label="Copy setup key" onClick={() => copy(step.secret, 'Setup key')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <a href={step.otpauthUri} className="text-sm font-medium text-sky-500 hover:underline">
                  Open in authenticator app
                </a>
                <div className={fieldClass}>
                  <Label htmlFor="tfa-code">Then enter the 6-digit code it shows</Label>
                  <Input
                    id="tfa-code"
                    autoFocus
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </>
            )}

            {step.kind === 'codes' && (
              <>
                <DialogHeader>
                  <DialogTitle>Save your recovery codes</DialogTitle>
                  <DialogDescription>
                    Two-factor authentication is on. If you lose your phone, each of these codes logs you in once. Store them
                    somewhere safe, like a password manager. They won’t be shown again.
                  </DialogDescription>
                </DialogHeader>
                <ul className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900 sm:grid-cols-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                  {step.codes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <Button type="button" variant="outline" className="gap-2" onClick={() => copy(step.codes.join('\n'), 'Recovery codes')}>
                  <Copy className="h-4 w-4" />
                  Copy all
                </Button>
              </>
            )}

            {step.kind === 'disable' && (
              <>
                <DialogHeader>
                  <DialogTitle>Turn off two-factor authentication</DialogTitle>
                  <DialogDescription>Confirm your password and a current code. Gmail must be disconnected first.</DialogDescription>
                </DialogHeader>
                <div className={fieldClass}>
                  <Label htmlFor="tfa-off-password">Password</Label>
                  <Input id="tfa-off-password" type="password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="tfa-off-code">Authenticator or recovery code</Label>
                  <Input id="tfa-off-code" required autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              </>
            )}

            <DialogFooter>
              {step.kind === 'codes' ? (
                <Button type="button" onClick={() => open({ kind: 'closed' })}>
                  I’ve saved them
                </Button>
              ) : (
                <Button type="submit" disabled={busy}>
                  {step.kind === 'password' ? 'Continue' : step.kind === 'scan' ? 'Turn on' : 'Turn off'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
