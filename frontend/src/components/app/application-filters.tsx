import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication } from '@/types';

// Search-by-company/role + status filter shared by the Applications and Resume Match pages.
// Returns the filtered list (newest first) and the filter bar to render above it.
export function useApplicationFilters(applications: JobApplication[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications
      .filter((app) => statusFilter === 'All' || app.status === statusFilter)
      .filter((app) => !q || app.companyName.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q))
      .sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : -1));
  }, [applications, search, statusFilter]);

  const filterBar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
        <Input
          placeholder="Search by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-black/30 pl-8 text-slate-900 dark:text-white"
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as ApplicationStatus | 'All')}
        items={{ All: 'All statuses' }}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All statuses</SelectItem>
          {APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return { filtered, filterBar };
}
