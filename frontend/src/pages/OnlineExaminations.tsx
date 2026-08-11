import { useMemo, useState } from 'react';

type Exam = {
  id: number;
  subject: string;
  title: string;
  duration: string;
  marks: number;
  description: string;
};

const exams: Exam[] = [
  {
    id: 1,
    subject: 'MATHEMATICS',
    title: 'Mid-Term Mathematics',
    duration: '60 mins',
    marks: 100,
    description: 'Answer all questions. No calculators allowed.',
  },
  {
    id: 2,
    subject: 'PHYSICS',
    title: 'Motion and Forces Quiz',
    duration: '45 mins',
    marks: 80,
    description: 'Solve the conceptual and numerical problems carefully.',
  },
  {
    id: 3,
    subject: 'ENGLISH',
    title: 'Reading Comprehension Test',
    duration: '30 mins',
    marks: 50,
    description: 'Read the passage and answer the questions thoughtfully.',
  },
];

export default function OnlineExaminations() {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Upcoming' | 'Available'>('All');

  const visibleExams = useMemo(() => {
    if (activeFilter === 'Upcoming') {
      return exams.slice(0, 1);
    }
    if (activeFilter === 'Available') {
      return exams.slice(1);
    }
    return exams;
  }, [activeFilter]);

  const handleStartExam = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Online Examinations</h1>
            <p className="mt-2 text-sm text-slate-500">Prepare for your upcoming online assessments in one place.</p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {(['All', 'Upcoming', 'Available'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeFilter === filter ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">⚠️</div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Important Examination Notice</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                  Please ensure you have a stable internet connection before starting an exam. Once started, the timer cannot be paused. Refreshing the page may result in automatic submission.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {visibleExams.map((exam) => (
            <article key={exam.id} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                  {exam.subject}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  <span>🕒</span>
                  {exam.duration}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">{exam.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{exam.description}</p>

              <div className="mt-6 border-t border-slate-200 pt-4" />

              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Total Marks</div>
                  <div className="mt-1 font-semibold text-slate-900">{exam.marks} pts</div>
                </div>
                <button
                  onClick={() => handleStartExam('/student/take-exam')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1e2a5e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Start Exam <span aria-hidden>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
