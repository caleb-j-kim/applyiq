import { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import type { JobApplicationResponseDto } from '@/lib/mappers';
import { addNotification } from '@/lib/notification-store';

// Appends one titled, bulleted section to the application's notes.
export async function appendToNotes(applicationId: string, subject: string, title: string, lines: string[]) {
  try {
    // Re-fetch so we append to the latest notes rather than a stale copy.
    const app = await apiFetch<JobApplicationResponseDto>(`/applications/${applicationId}`);
    // Trailing newline leaves a blank line between consecutively saved sections.
    const block = `\n${title}\n${lines.map((line) => `• ${line}`).join('\n')}\n`;
    await apiFetch(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: (app.notes ?? '') + block }),
    });
    const message = `Saved "${title}" to the notes for ${subject}.`;
    toast.success(message);
    addNotification(message);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save to notes');
  }
}

// Saving is opt-in per section; nothing about a result is persisted otherwise.
export function SaveToNotesButton({ onSave, disabledReason }: { onSave: () => Promise<void>; disabledReason?: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={saving || !!disabledReason}
      title={disabledReason ?? 'Append this section to the application notes'}
      className="h-7 shrink-0 gap-1.5 border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-100 print:hidden dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
      onClick={async () => {
        setSaving(true);
        try {
          await onSave();
        } finally {
          setSaving(false);
        }
      }}
    >
      <NotebookPen className="h-3.5 w-3.5" />
      {saving ? 'Saving...' : 'Save to notes'}
    </Button>
  );
}

// Browser print dialog -> "Save as PDF". The dark: variant is screen-only (index.css), so the
// printout always uses the light palette; pages set print-color-adjust:exact so bars survive.
export function printAsPdf(title: string) {
  const previousTitle = document.title;
  document.title = title;
  window.print();
  document.title = previousTitle;
}
