import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function InterviewPrepPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Interview Prep"
        description="Generate personalized prep material for an upcoming interview."
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-24 text-center text-slate-400 dark:text-white/40">
          <Sparkles className="h-6 w-6 text-sky-400/60" />
          <p className="text-lg font-medium text-slate-600 dark:text-white/70">Coming Soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
