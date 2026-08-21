import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-black py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-sky-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Stop tracking your job search in a spreadsheet.
        </h2>
        <p className="mt-4 text-base text-white/60 sm:text-lg">
          Join thousands of job seekers who track applications, score their resume, and know
          exactly when to follow up. Free to start, no credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            render={<Link to="/signup" />}
            nativeButton={false}
            size="lg"
            className="gap-2 bg-sky-500 px-8 text-white hover:bg-sky-400"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            render={<Link to="/dashboard" />}
            nativeButton={false}
            size="lg"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            View demo dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}
