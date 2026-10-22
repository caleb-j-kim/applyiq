import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { HeartHandshake, Mail } from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// The donation card shows a "coming soon" note while DONATION_URL is empty.
export const CONTACT_EMAIL = 'coolycaleb@gmail.com';
const DONATION_URL = '';

export function ContactPage() {
  const { hash } = useLocation();
  // Footer "Pricing" links to #support; client-side navigation doesn't scroll to hashes on its own.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="dark min-h-svh bg-black">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">Contact</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Get in touch</h1>
        <p className="mt-4 text-base text-white/60 sm:text-lg">
          Questions, feedback or ideas for ApplyIQ? I'd love to hear from you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">Email</h2>
            </CardHeader>
            <CardContent className="text-sm text-white/60">
              <p>The best way to reach me. I usually reply within a few days.</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-block font-medium text-sky-400 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </CardContent>
          </Card>

          <Card id="support" className="scroll-mt-32 border-white/10 bg-white/[0.03]">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">Support ApplyIQ</h2>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3 text-sm text-white/60">
              <p>ApplyIQ is built and run by one developer. Donations help cover hosting and AI costs.</p>
              {DONATION_URL ? (
                <Button
                  render={<a href={DONATION_URL} target="_blank" rel="noopener noreferrer" />}
                  nativeButton={false}
                  className="bg-sky-500 text-white hover:bg-sky-400"
                >
                  Donate
                </Button>
              ) : (
                <p className="text-white/40">Donation options coming soon.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
