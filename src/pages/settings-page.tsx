import { useState } from 'react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const NOTIFICATION_SETTINGS = [
  { id: 'followUps', label: 'Follow-up reminders', description: 'Get notified when ApplyIQ recommends a follow-up.' },
  { id: 'matchScores', label: 'Resume match results', description: 'Get notified when a resume match analysis finishes.' },
  { id: 'weeklyDigest', label: 'Weekly digest', description: 'A weekly summary of your application activity.' },
];

export function SettingsPage() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    followUps: true,
    matchScores: true,
    weeklyDigest: false,
  });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your notification preferences and account." />

      <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Notifications</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {NOTIFICATION_SETTINGS.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={setting.id} className="text-white">
                  {setting.label}
                </Label>
                <p className="mt-0.5 text-xs text-white/50">{setting.description}</p>
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
          <h2 className="text-base font-semibold text-white">Danger zone</h2>
          <p className="text-sm text-white/50">Permanently delete your account and all tracked applications.</p>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4 bg-white/10" />
          <Button variant="destructive">Delete account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
