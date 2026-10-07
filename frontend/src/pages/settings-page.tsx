import { useState } from 'react';
import { toast } from 'sonner';
import { Moon, Sun } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTheme } from '@/context/theme-context';

const NOTIFICATION_SETTINGS = [
  { id: 'followUps', label: 'Follow-up reminders', description: 'Get notified when ApplyIQ recommends a follow-up.' },
  { id: 'matchScores', label: 'Resume match results', description: 'Get notified when a resume match analysis finishes.' },
  { id: 'weeklyDigest', label: 'Weekly digest', description: 'A weekly summary of your application activity.' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    followUps: true,
    matchScores: true,
    weeklyDigest: false,
  });

  const handleDeleteAccount = () => {
    if (!window.confirm("Delete your account? This can't be undone.")) return;
    toast.info('Account deletion is not available yet.');
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your notification preferences and account." />

      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <Label htmlFor="theme-toggle" className="text-slate-900 dark:text-white">
                  Dark mode
                </Label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">
                  Switch between light and dark for the app pages.
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {NOTIFICATION_SETTINGS.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={setting.id} className="text-slate-900 dark:text-white">
                  {setting.label}
                </Label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">{setting.description}</p>
              </div>
              <Switch
                id={setting.id}
                checked={notifications[setting.id]}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [setting.id]: checked }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-500/20 bg-rose-500/[0.03] backdrop-blur">
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Danger zone</h2>
          <p className="text-sm text-slate-500 dark:text-white/50">Permanently delete your account and all tracked applications.</p>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4 bg-slate-100 dark:bg-white/10" />
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
