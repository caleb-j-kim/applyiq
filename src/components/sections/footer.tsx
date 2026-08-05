import applyiqIcon from '@/assets/images/applyiq-icon.png';
import { Separator } from '@/components/ui/separator';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  Support: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#' },
    { label: 'Privacy policy', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-black pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-2">
            <a href="#top" className="flex items-center gap-2">
              <img src={applyiqIcon} alt="ApplyIQ" className="h-8 w-8 rounded-md" />
              <span className="text-lg font-bold tracking-tight text-white">
                Apply<span className="text-sky-400">IQ</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-white/50">
              AI-powered job applications that get you noticed. Tailored resumes, smarter
              matches, faster offers.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-white">{heading}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} ApplyIQ. All rights reserved.</p>
          <p>Built for job seekers who'd rather be interviewing.</p>
        </div>
      </div>
    </footer>
  );
}
