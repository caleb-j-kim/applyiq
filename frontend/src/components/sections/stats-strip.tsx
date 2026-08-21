const STATS = [
  { value: '3.2x', label: 'more interviews per applicant' },
  { value: '68%', label: 'response rate on referred applications' },
  { value: '90k+', label: 'applications tracked' },
  { value: '4.9/5', label: 'average user rating' },
];

export function StatsStrip() {
  return (
    <section className="border-y border-white/10 bg-black py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
            <div className="mt-1 text-xs text-white/50 sm:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
