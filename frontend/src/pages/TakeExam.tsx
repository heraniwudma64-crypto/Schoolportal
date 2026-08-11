import { useMemo, useState } from 'react';

type Question = {
  id: number;
  prompt: string;
  options: string[];
};

const questions: Question[] = [
  {
    id: 1,
    prompt: 'What is the value of 8 × 7?',
    options: ['54', '56', '58', '60'],
  },
  {
    id: 2,
    prompt: 'Which of the following is a prime number?',
    options: ['9', '15', '17', '21'],
  },
  {
    id: 3,
    prompt: 'What is the square root of 81?',
    options: ['7', '8', '9', '10'],
  },
];

export default function TakeExam() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleSelect = (questionId: number, option: string) => {
    setAnswers((current) => ({ ...current, [questionId]: option }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Mid-Term Mathematics</h1>
              <p className="mt-2 text-sm text-slate-500">Duration: 60 mins • 100 marks • Answer all questions.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Questions answered: {answeredCount}/{questions.length}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="font-semibold text-slate-900">{question.id}. {question.prompt}</div>
                <div className="mt-4 grid gap-3">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleSelect(question.id, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">Ensure you submit before the timer ends.</div>
            <button
              onClick={handleSubmit}
              className="rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              {submitted ? 'Submitted ✓' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
