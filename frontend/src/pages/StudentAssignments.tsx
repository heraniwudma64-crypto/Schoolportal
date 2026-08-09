import { useMemo, useState } from 'react';

type AssignmentStatus = 'PENDING' | 'SUBMITTED';

type AssignmentItem = {
  id: number;
  title: string;
  subject: 'Mathematics' | 'Physics' | 'English';
  teacher: string;
  description: string;
  dueDate: string;
  material: string;
  status: AssignmentStatus;
};

const subjectOptions = ['All Subjects', 'Mathematics', 'Physics', 'English'];
const statusOptions = ['All Status', 'Pending', 'Submitted'];

const assignments: AssignmentItem[] = [
  {
    id: 1,
    title: 'Algebra Problem Set',
    subject: 'Mathematics',
    teacher: 'Prof. Meron Tadesse',
    description: 'Solve problems 1-10 on page 45.',
    dueDate: '2024-05-20',
    material: 'Resources',
    status: 'PENDING',
  },
  {
    id: 2,
    title: `Newton's Laws Exercise`,
    subject: 'Physics',
    teacher: 'Prof. Meron Tadesse',
    description: 'Complete the exercises from chapter 3.',
    dueDate: '2024-05-22',
    material: 'Resources',
    status: 'PENDING',
  },
  {
    id: 3,
    title: 'English Essay',
    subject: 'English',
    teacher: 'Prof. Dawit Gebre',
    description: 'Write a short essay about the topic discussed in class.',
    dueDate: '2024-05-18',
    material: 'Resources',
    status: 'SUBMITTED',
  },
  {
    id: 4,
    title: 'Geometry Worksheet',
    subject: 'Mathematics',
    teacher: 'Prof. Meron Tadesse',
    description: 'Complete the geometry worksheet and submit your answers.',
    dueDate: '2024-05-15',
    material: 'Resources',
    status: 'SUBMITTED',
  },
];

const getStatusClasses = (status: AssignmentStatus) =>
  status === 'PENDING'
    ? 'text-[#d97706] bg-amber-100 border border-amber-200'
    : 'text-[#16a34a] bg-emerald-100 border border-emerald-200';

const getIconClasses = (status: AssignmentStatus) =>
  status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700';

export default function StudentAssignments() {
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const subjectMatches =
          selectedSubject === 'All Subjects' || assignment.subject === selectedSubject;
        const statusMatches =
          selectedStatus === 'All Status' ||
          (selectedStatus === 'Pending' && assignment.status === 'PENDING') ||
          (selectedStatus === 'Submitted' && assignment.status === 'SUBMITTED');
        return subjectMatches && statusMatches;
      }),
    [selectedSubject, selectedStatus],
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 rounded-[24px] bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Assignments & Homework</h1>
            <p className="mt-2 text-sm text-slate-500">Review your homework and submission status.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-[190px] items-center justify-between rounded-full bg-slate-100 px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <span className="text-slate-500">All Subjects</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="ml-3 min-w-[130px] bg-transparent text-sm text-slate-900 outline-none"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[190px] items-center justify-between rounded-full bg-slate-100 px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <span className="text-slate-500">All Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="ml-3 min-w-[130px] bg-transparent text-sm text-slate-900 outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {filteredAssignments.map((assignment) => (
            <article
              key={assignment.id}
              className="overflow-hidden rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 sm:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6 lg:flex-[1.7]">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${getIconClasses(assignment.status)}`}>
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-xl font-semibold text-slate-900 truncate">
                        {assignment.title}
                      </h2>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getStatusClasses(
                          assignment.status,
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {assignment.subject} • {assignment.teacher}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      {assignment.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-5 lg:flex-none">
                  <div className="min-w-[220px] flex-1 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      DUE DATE
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-900">
                      <span>📅</span>
                      <span>{assignment.dueDate}</span>
                    </div>
                  </div>
                  <div className="min-w-[220px] flex-1 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      MATERIAL
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-sky-700">
                      <span>📎</span>
                      <button className="whitespace-nowrap font-semibold text-sky-700 underline">
                        {assignment.material}
                      </button>
                    </div>
                  </div>
                  <div className="min-w-[220px] flex-1 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    {assignment.status === 'PENDING' ? (
                      <button className="inline-flex w-full flex-nowrap items-center justify-center gap-2 rounded-2xl bg-[#1e2a5e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
                        <span>↗</span>
                        Submit Work
                      </button>
                    ) : (
                      <button className="inline-flex w-full flex-nowrap items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 whitespace-nowrap">
                        <span>👁</span>
                        View Submission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {filteredAssignments.length === 0 && (
            <div className="rounded-[24px] bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
              No assignments match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
