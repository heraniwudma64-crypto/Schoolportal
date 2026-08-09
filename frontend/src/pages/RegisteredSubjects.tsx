const subjects = [
  {
    code: 'MATH101',
    name: 'Mathematics',
    grade: 'Grade 10',
    teacher: 'Meron Tadesse',
    type: 'Core Subject',
  },
  {
    code: 'PHYS101',
    name: 'Physics',
    grade: 'Grade 10',
    teacher: 'Meron Tadesse',
    type: 'Core Subject',
  },
  {
    code: 'ENG101',
    name: 'English',
    grade: 'Grade 10',
    teacher: 'Dawit Gebre',
    type: 'Core Subject',
  },
];

export default function RegisteredSubjects() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Registered Subjects</h1>
          <p className="mt-2 text-sm text-slate-500">View your current subjects and access materials.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          {subjects.length} Subjects
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => (
          <div key={subject.code} className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="bg-slate-950 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 text-3xl text-slate-100">
                📖
              </div>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {subject.code}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{subject.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{subject.grade}</p>
              </div>

              <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">👨‍🏫</span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Teacher</div>
                    <div className="font-medium text-slate-900">{subject.teacher}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">🏷️</span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Subject Type</div>
                    <div className="font-medium text-slate-900">{subject.type}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="flex-1 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                    Course Material
                  </button>
                  <button className="flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                    View Syllabus
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
