import type { ReactNode } from 'react';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/sections/footer';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-black">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
