import { Link, useNavigate } from 'react-router';
import { ArrowRight, LayoutDashboard, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { HeroFuturistic } from '@/components/ui/hero-futuristic';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { PREVIEW_ACCOUNT_EMAIL, PREVIEW_ACCOUNT_PASSWORD } from '@/lib/preview-account';

export function HeroSection() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const viewDemoDashboard = async () => {
    try {
      await login(PREVIEW_ACCOUNT_EMAIL, PREVIEW_ACCOUNT_PASSWORD);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Demo login failed');
    }
  };

  return (
    <section id="top" className="relative">
      <HeroFuturistic
        title="Apply Smarter"
        subtitle="Track every application, score your resume against the job, and know exactly when to follow up."
        scrollLabel="See how it works"
        actions={
          <div className="pointer-events-auto mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              render={<Link to="/signup" />}
              nativeButton={false}
              size="lg"
              className="gap-2 bg-sky-500 px-6 text-white hover:bg-sky-400"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              render={<Link to="/resume-match" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Upload className="h-4 w-4 text-sky-400" />
              Upload resume
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={viewDemoDashboard}
              className="gap-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-sky-400" />
              View demo dashboard
            </Button>
          </div>
        }
      />

      <div className="pointer-events-none absolute top-24 left-1/2 z-30 -translate-x-1/2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
          AI-powered resume match scoring, interview prep, and follow-up tracking
        </span>
      </div>
    </section>
  );
}
