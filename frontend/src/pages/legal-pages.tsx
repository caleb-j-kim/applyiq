import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { Navbar } from '@/components/layout/navbar';
import { CONTACT_EMAIL } from '@/pages/contact-page';

const LAST_UPDATED = 'October 22, 2026';

function LegalLayout({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="dark min-h-svh bg-black">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">{eyebrow}</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-white/50">Last updated: {LAST_UPDATED}</p>
        <div className="mt-10 space-y-8 text-base leading-relaxed text-white/70 [&_a]:text-sky-400 [&_a]:hover:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <Link to="/contact">our Contact page</Link>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Privacy Policy">
      <section>
        <p>
          This Privacy Policy explains what information ApplyIQ ("we", "us") collects when you use the ApplyIQ
          website and app, how we use it, and the choices you have.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> your name, email address and a hashed password.</li>
          <li><strong>Content you provide:</strong> job applications, notes, resumes, follow-up drafts and settings you enter.</li>
          <li><strong>Security data:</strong> two-factor authentication secrets and recovery codes, stored encrypted or hashed.</li>
          <li><strong>Google account data</strong> (only if you choose to connect Gmail), described below.</li>
        </ul>
      </section>

      <section>
        <h2>Google user data</h2>
        <p>If you connect your Gmail account, ApplyIQ requests these permissions:</p>
        <ul>
          <li>
            <strong>Read your email (gmail.readonly):</strong> used only to find job-application emails — confirmations,
            interview invitations, rejections and offers — so ApplyIQ can add applications and update their status for
            you. Messages are scanned automatically on our servers; no person reads them.
          </li>
          <li>
            <strong>Send email (gmail.send):</strong> used only to send follow-up emails that you write or approve and
            explicitly choose to send from ApplyIQ.
          </li>
        </ul>
        <p className="mt-3">
          From matching emails we store only what's needed for your application tracker: the company name, job title,
          application status, the date, and the email's subject line. We do not store the body of your emails. We store
          your Google OAuth tokens encrypted, and use them only to provide the features above.
        </p>
        <p className="mt-3">
          ApplyIQ's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Specifically, we:
        </p>
        <ul>
          <li>use Google user data only to provide and improve the user-facing features described above;</li>
          <li>do not sell Google user data or transfer it to third parties, except as needed to provide these features, to comply with law, or as part of a merger or acquisition with your notice;</li>
          <li>do not use Google user data for advertising, including personalized or retargeted ads;</li>
          <li>do not use Google user data to train generalized AI or machine-learning models;</li>
          <li>do not allow humans to read Google user data unless you give us explicit consent, it's needed for security purposes (such as investigating abuse), or it's required by law.</li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <p>
          We use your information to run ApplyIQ: tracking your applications, matching resumes, drafting and sending
          follow-ups, sending you in-app notifications, keeping your account secure, and responding to support
          requests. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2>Sharing</h2>
        <p>
          We share information only with service providers that host and operate ApplyIQ (for example, our cloud
          hosting and database providers), under obligations to protect it, or when required by law.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We use HTTPS, encrypt OAuth tokens and 2FA secrets at rest, hash passwords and recovery codes, and
          rate-limit sensitive actions. No system is perfectly secure, but we work to protect your data.
        </p>
      </section>

      <section>
        <h2>Retention and deletion</h2>
        <ul>
          <li>
            You can disconnect Gmail at any time in <strong>Settings</strong>; this deletes your stored Google tokens
            immediately. You can also revoke access from your{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions</a>.
          </li>
          <li>Applications created from email stay in your tracker until you delete them.</li>
          <li>To delete your account and all associated data, contact us at <Contact />. We'll complete deletion within 30 days.</li>
        </ul>
      </section>

      <section>
        <h2>Children</h2>
        <p>ApplyIQ is not intended for anyone under 13, and we don't knowingly collect their information.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy, we'll update the date above and, for significant changes, notify you in the app.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions about privacy? Reach us at <Contact />.</p>
      </section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms of Service">
      <section>
        <p>
          These Terms govern your use of ApplyIQ. By creating an account or using ApplyIQ, you agree to them. If you
          don't agree, don't use the service.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          ApplyIQ helps you track job applications, match resumes to roles, prepare for interviews and manage
          follow-ups, including optional Gmail integration. Features may change, and we may suspend or discontinue
          any part of the service.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be at least 18 years old and provide accurate information.</li>
          <li>You're responsible for keeping your password and 2FA codes secure and for activity on your account.</li>
          <li>Tell us promptly if you suspect unauthorized access.</li>
        </ul>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use ApplyIQ to send spam, harassing or unlawful messages;</li>
          <li>attempt to access other users' data or disrupt or reverse-engineer the service;</li>
          <li>upload content you don't have the right to use;</li>
          <li>use the service in violation of any law or third-party terms, including Google's.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of everything you add to ApplyIQ. You give us permission to store and process it only as
          needed to provide the service to you. How we handle your data, including Google user data, is described in
          our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Email you send</h2>
        <p>
          Follow-up emails sent through ApplyIQ are sent from your own account on your behalf. You are responsible for
          their content and recipients. Review drafts and AI suggestions before sending.
        </p>
      </section>

      <section>
        <h2>No guarantees</h2>
        <p>
          ApplyIQ is provided "as is" without warranties of any kind. Match scores, suggestions and automatically
          detected statuses may be inaccurate, and we don't guarantee any job outcome.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent allowed by law, ApplyIQ is not liable for indirect, incidental or consequential
          damages, or for lost data, opportunities or profits, arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You can stop using ApplyIQ and request account deletion at any time. We may suspend or terminate accounts
          that violate these Terms.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these Terms. We'll update the date above, and continued use after changes means you accept
          them.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions about these Terms? Reach us at <Contact />.</p>
      </section>
    </LegalLayout>
  );
}
