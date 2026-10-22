import { useEffect, useState } from 'react';
import { Copy, Send } from 'lucide-react';

import type { FollowUpDraft } from '@/components/app/follow-up-drafts-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FollowUpRecommendation } from '@/types';

export interface FollowUpEmail {
  sendEmail: boolean;
  to: string;
  subject: string;
  body: string;
}

// Same rule as the backend's SendRequest: something@something.suffix, no spaces.
const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

function fill(text: string, rec: FollowUpRecommendation, senderName: string) {
  return text
    .replaceAll('[Recruiter]', rec.recruiterName || 'Hiring Team')
    .replaceAll('[Role]', rec.jobTitle)
    .replaceAll('[Company]', rec.companyName)
    .replaceAll('[Name]', senderName);
}

/** Preview of the picked draft with placeholders filled in; sends it from the connected inbox or copies it. */
export function FollowUpSendDialog({
  rec,
  draft,
  senderName,
  canEmail,
  onClose,
  onSend,
}: {
  rec: FollowUpRecommendation | null;
  draft: FollowUpDraft | null;
  senderName: string;
  // True when the user has connected Gmail in Settings.
  canEmail: boolean;
  onClose: () => void;
  onSend: (email: FollowUpEmail) => Promise<void>;
}) {
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  // Only shown once the user has left the field or tried to send, not while they're still typing.
  const [toTouched, setToTouched] = useState(false);

  useEffect(() => {
    if (!rec || !draft) return;
    setEmail({
      to: rec.recruiterEmail ?? '',
      subject: `Following up on my ${rec.jobTitle} application`,
      body: fill(draft.description, rec, senderName),
    });
    setToTouched(false);
  }, [rec, draft, senderName]);

  const toError = !email.to.trim()
    ? 'Enter the recipient’s email address.'
    : !isValidEmail(email.to)
      ? 'Enter a valid email address, like recruiter@company.com.'
      : null;

  const submit = async (sendEmail: boolean) => {
    if (sendEmail && toError) {
      setToTouched(true);
      return;
    }
    setSending(true);
    try {
      await onSend({ sendEmail, ...email });
    } finally {
      setSending(false);
    }
  };

  const showToError = toTouched && toError !== null;

  return (
    <Dialog open={rec !== null && draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send follow-up</DialogTitle>
          <DialogDescription>
            {rec?.companyName} · {rec?.jobTitle}.{' '}
            {canEmail
              ? 'Send it from your connected inbox, or copy it and send it yourself.'
              : 'Copy it and send it yourself — connect Gmail in Settings to send from ApplyIQ.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="send-to">To</Label>
            <Input
              id="send-to"
              type="email"
              placeholder="recruiter@company.com"
              value={email.to}
              onChange={(e) => setEmail({ ...email, to: e.target.value })}
              onBlur={() => setToTouched(true)}
              aria-invalid={showToError}
              aria-describedby={showToError ? 'send-to-error' : undefined}
              className={showToError ? 'border-rose-400 focus-visible:ring-rose-400/40' : undefined}
            />
            {showToError && (
              <p id="send-to-error" role="alert" className="text-xs text-rose-500 dark:text-rose-400">
                {toError}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="send-subject">Subject</Label>
            <Input id="send-subject" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="send-body">Message</Label>
            <Textarea id="send-body" rows={10} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="gap-2" disabled={sending || !email.body.trim()} onClick={() => submit(false)}>
            <Copy className="h-4 w-4" />
            Copy &amp; mark sent
          </Button>
          {canEmail && (
            <Button
              className="gap-2 bg-sky-500 text-white hover:bg-sky-400"
              disabled={sending || !email.subject.trim() || !email.body.trim()}
              onClick={() => submit(true)}
            >
              <Send className="h-4 w-4" />
              Send email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
