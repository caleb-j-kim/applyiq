import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    question: 'Does ApplyIQ submit job applications for me?',
    answer:
      'No. You still apply on the company site or job board — ApplyIQ is where you log and manage that application afterward: status, referral, recruiter contact, and every follow-up, all in one dashboard instead of a spreadsheet.',
  },
  {
    question: 'How does the resume match score work?',
    answer:
      'Upload your resume and paste in a job description. ApplyIQ compares the two and returns a match score, the skills you already cover, the skills you\'re missing, and suggested resume bullets to close the gap.',
  },
  {
    question: 'How does ApplyIQ know when I should follow up?',
    answer:
      'Every application is scored using signals like days since you applied, days since your last contact, interview stage, and whether you have a referral. ApplyIQ recommends a specific action — send a follow-up, wait, or archive — with the reasoning behind it.',
  },
  {
    question: 'What is ghosting risk prediction?',
    answer:
      'Applications that go quiet for too long are flagged with a ghosting risk score, so you can stop waiting on a dead lead and put your energy toward applications that are still active.',
  },
  {
    question: 'Can I track referrals separately from cold applications?',
    answer:
      'Yes. Each application can be marked as referred, with the referrer\'s name, relationship, and contact info — and your dashboard breaks out response and interview rates for referred vs. non-referred applications.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. ApplyIQ is month-to-month with no contracts — cancel from your account settings in one click, no questions asked.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion className="mt-12 w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-white hover:text-sky-400">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-white/60">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
