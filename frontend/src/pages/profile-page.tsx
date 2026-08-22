import { useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/app/page-header';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? 'Your Name');
  const [email, setEmail] = useState(user?.email ?? 'you@example.com');
  const [targetRole, setTargetRole] = useState('Software Engineer');

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Profile" description="Your ApplyIQ account details." />

      <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback className="bg-sky-500/15 text-sky-400">{initialsFor(name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-white/50">{email}</div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Profile updated');
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetRole">Target role</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="border-white/15 bg-black/30 text-white"
              />
            </div>
            <Button type="submit" className="mt-2 w-fit bg-sky-500 text-white hover:bg-sky-400">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
