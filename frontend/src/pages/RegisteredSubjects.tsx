const materials = [
  {
    title: 'Mathematics',
    description: 'Mathematics notes, study guides, and learning resources.',
    badge: 'Core Subject',
    icon: '📘',
  },
  {
    title: 'Computer Science',
    description: 'Course notes, programming resources, and practical materials.',
    badge: 'Practical',
    icon: '💻',
  },
  {
    title: 'English',
    description: 'Reading materials, grammar resources, and study guides.',
    badge: 'Language',
    icon: '📖',
  },
];

const rules = [
  'Attendance and punctuality',
  'Examination rules',
  'Academic integrity',
  'Classroom behavior',
  'Student responsibilities',
];

const resources = [
  'Student Handbook',
  'Academic Calendar',
  'Examination Guidelines',
  'Code of Conduct',
];

export default function RegisteredSubjects() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Learning Materials & Rules</h1>
              <p className="mt-2 text-sm text-slate-500">
                Access your learning resources, academic guidelines, and important school information.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Updated Today
            </div>
          </div>
        </div>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Learning Materials</h2>
              <p className="mt-1 text-sm text-slate-500">Review your study resources and course materials.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {materials.map((item) => (
              <article key={item.title} className="rounded-[16px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e3a8a] text-xl text-white">
                    {item.icon}
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#1e3a8a] ring-1 ring-slate-200">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <button className="mt-5 inline-flex rounded-full bg-[#1e2a5e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900">
                  View Materials
                </button>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">School Rules & Guidelines</h2>
            <div className="mt-5 space-y-3">
              {rules.map((rule, index) => (
                <div key={rule} className="flex items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-700">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium text-slate-700">{rule}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Important Resources</h2>
            <div className="mt-5 grid gap-3">
              {resources.map((resource) => (
                <div key={resource} className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-lg text-sky-700">📄</div>
                    <span className="text-sm font-semibold text-slate-800">{resource}</span>
                  </div>
                  <button className="text-sm font-semibold text-[#1e3a8a]">Open</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
