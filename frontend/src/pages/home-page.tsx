import { HeroSection } from '@/components/sections/hero-section';
import { StatsStrip } from '@/components/sections/stats-strip';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Testimonials } from '@/components/sections/testimonials';
import { FAQ } from '@/components/sections/faq';
import { CtaSection } from '@/components/sections/cta-section';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CtaSection />
    </>
  );
}
