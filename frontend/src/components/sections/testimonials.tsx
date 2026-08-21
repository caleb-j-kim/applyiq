import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The match score finally told me why my resume kept getting filtered out. I fixed three gaps and started hearing back within a week.",
    name: 'Maya Chen',
    role: 'Product Designer',
    initials: 'MC',
  },
  {
    quote:
      'I stopped losing track of where I applied. The follow-up reminders alone got me two interviews I would have let go cold.',
    name: 'Daniel Osei',
    role: 'Data Analyst',
    initials: 'DO',
  },
  {
    quote:
      "Seeing my referred vs. cold-application response rates side by side changed how I spend my time job hunting.",
    name: 'Priya Nair',
    role: 'Software Engineer',
    initials: 'PN',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            Loved by job seekers
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Real people, real offers
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex h-full flex-col">
                <div className="flex gap-1 text-sky-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/70">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-400">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
