import { Upload, FileSearch, MessagesSquare, BellRing } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload your resume',
    description: 'Drop in your resume once — ApplyIQ builds your profile and reuses it across every application.',
  },
  {
    icon: FileSearch,
    step: '02',
    title: 'Log an application',
    description: 'Add the company, role, and job description. ApplyIQ instantly scores your resume against it.',
  },
  {
    icon: MessagesSquare,
    step: '03',
    title: 'Prep with AI',
    description: 'Generate technical and behavioral questions, talking points, and skills to review for that role.',
  },
  {
    icon: BellRing,
    step: '04',
    title: 'Get follow-up nudges',
    description: 'ApplyIQ watches every application and tells you exactly when to follow up — or when to move on.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From resume to offer, in four steps
          </h2>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
          {STEPS.map((item) => (
            <div key={item.step} className="relative flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-black text-sky-400 ring-4 ring-black">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="mt-4 text-xs font-semibold tracking-widest text-white/40">
                STEP {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
