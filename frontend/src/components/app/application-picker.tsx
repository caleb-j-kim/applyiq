import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

import { useApplicationFilters } from '@/components/app/application-filters';
import { StatusBadge } from '@/components/app/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { mapApplicationResponse, type JobApplicationResponseDto } from '@/lib/mappers';
import { cn } from '@/lib/utils';
import type { JobApplication } from '@/types';

// Filter bar + single-select applications table shared by Resume Match and Interview Prep.
// Same width rules as the Applications page table.
export function useApplicationPicker() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<JobApplicationResponseDto[]>('/applications');
        setApplications(data.map(mapApplicationResponse));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { filtered, filterBar } = useApplicationFilters(applications);

  const emptyRow = (content: ReactNode) => (
    <TableRow>
      <TableCell colSpan={7} className="py-8 text-center text-slate-400 dark:text-white/40">
        {content}
      </TableCell>
    </TableRow>
  );

  const picker = (
    <>
      {filterBar}
      <Card className="relative left-1/2 w-[min(calc(100vw-4rem),128rem)] -translate-x-1/2">
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && emptyRow('Loading applications...')}
              {!loading &&
                filtered.map((app) => {
                  const selected = app.id === selectedId;
                  return (
                    <TableRow
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      aria-selected={selected}
                      className={cn(
                        'cursor-pointer border-slate-200 dark:border-white/10',
                        selected && 'bg-sky-500/10 hover:bg-sky-500/10'
                      )}
                    >
                      <TableCell>
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 text-sky-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 dark:text-white/15" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">{app.companyName}</TableCell>
                      <TableCell className="text-slate-600 dark:text-white/70">{app.jobTitle}</TableCell>
                      <TableCell className="text-slate-500 dark:text-white/50">{app.location}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-white/50">{app.priorityLevel}</TableCell>
                      <TableCell className="text-slate-500 dark:text-white/50">{app.dateApplied}</TableCell>
                    </TableRow>
                  );
                })}
              {!loading &&
                filtered.length === 0 &&
                emptyRow(
                  applications.length === 0 ? (
                    <>
                      No applications yet —{' '}
                      <Link to="/applications" className="text-sky-400 hover:underline">
                        add one first
                      </Link>
                      .
                    </>
                  ) : (
                    'No applications match your filters.'
                  )
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  // Lets a page reflect its own edits (e.g. a status change) without refetching.
  const updateApplication = (app: JobApplication) => setApplications((list) => list.map((a) => (a.id === app.id ? app : a)));

  return { selectedApplication: applications.find((a) => a.id === selectedId), picker, updateApplication };
}
