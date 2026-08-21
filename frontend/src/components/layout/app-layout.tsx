import type { ReactNode } from 'react';

import { Navbar } from '@/components/layout/navbar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-black">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">{children}</main>
    </div>
  );
}
