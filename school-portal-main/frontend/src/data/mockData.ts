import { User, Exam, Assignment, Subject, Announcement, SchoolMaterial, Schedule, SubjectResult } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', idNumber: 'student1', name: 'John Doe', email: 'john@example.com', role: 'student', grade: '10A' },
  { id: '2', idNumber: 'teacher1', name: 'Jane Smith', email: 'jane@example.com', role: 'teacher', department: 'Mathematics' },
  { id: '3', idNumber: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  // Demo accounts for development
  { id: '4', idNumber: 'STD001', name: 'Abebe Kebede', email: 'abebe@school.edu', role: 'student', grade: '10A' },
  { id: '5', idNumber: 'TCH001', name: 'Selamawit Tadesse', email: 'selamawit@school.edu', role: 'teacher', department: 'Mathematics' },
  { id: '6', idNumber: 'ADM001', name: 'Alemayehu Gebre', email: 'alemayehu@school.edu', role: 'admin' },
];

/** Demo credentials for development — keyed by ID number, not stored on User objects */
export const MOCK_CREDENTIALS: Record<string, string> = {
  STD001: '12345678',
  TCH001: '12345678',
  ADM001: '12345678',
};

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'e1',
    title: 'Mid-Term Mathematics Exam',
    subjectName: 'Mathematics',
    teacherName: 'Mr. Schrodinger',
    status: 'pending_approval',
    duration: 90,
    questions: [
      { id: 'q1', text: 'What is 2 + 2?', options: ['3', '4', '5'], correctAnswer: '4' },
      { id: 'q2', text: 'What is the square root of 16?', options: ['2', '4', '8'], correctAnswer: '4' },
    ],
  },
  {
    id: 'e2',
    title: 'Final Physics Exam',
    subjectName: 'Physics',
    teacherName: 'Mrs. Curie',
    status: 'approved',
    duration: 120,
    questions: [
      { id: 'q1', text: 'What is F=ma?', options: ['Newtons First Law', 'Newtons Second Law', 'Newtons Third Law'], correctAnswer: 'Newtons Second Law' },
    ],
    adminRemarks: 'Looks good!',
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'as1',
    subjectId: 's1',
    title: 'Algebra Homework',
    subjectName: 'Mathematics',
    description: 'Complete the exercises on page 42.',
    dueDate: '2024-08-15',
    status: 'pending',
    published: true,
  },
  {
    id: 'as2',
    subjectId: 's2',
    title: 'Lab Report: The Pendulum',
    subjectName: 'Physics',
    description: 'Submit your lab report on the pendulum experiment.',
    dueDate: '2024-08-20',
    status: 'submitted',
    published: true,
  },
  {
    id: 'as3',
    subjectId: 's3',
    title: 'Essay: The Great Gatsby',
    subjectName: 'Literature',
    description: 'Write a 5-page essay on the themes of The Great Gatsby.',
    dueDate: '2024-09-01',
    status: 'pending',
    published: false,
  },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Mathematics', code: 'MATH10', teacherId: '2', teacherName: 'Jane Smith', grade: '10A' },
  { id: 's2', name: 'Physics', code: 'PHYS10', teacherId: '2', teacherName: 'Jane Smith', grade: '10A' },
  { id: 's3', name: 'Literature', code: 'LIT10', teacherId: '2', teacherName: 'John Doe', grade: '10A' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann1',
    title: 'School Reopening',
    content: 'The school will reopen on August 15, 2024 for the new academic year. All students are expected to report by 7:30 AM.',
    date: '15 Aug 2024',
    targetRole: 'all',
  },
  {
    id: 'ann2',
    title: 'Staff Meeting at 3PM',
    content: 'All teaching and non-teaching staff are required to attend the staff meeting scheduled for 3:00 PM on May 18, 2024.',
    date: '18 May 2024',
    targetRole: 'teacher',
  },
  {
    id: 'ann3',
    title: 'Q2 Exam Timetable Released',
    content: 'The Quarter 2 examination timetable has been released. Please check the Materials section for the full schedule.',
    date: '10 May 2024',
    targetRole: 'all',
  },
];

export const MOCK_MATERIALS: SchoolMaterial[] = [
  {
    id: 'mat1',
    title: 'Student Handbook 2024',
    description: 'Comprehensive guide to school policies and student conduct rules.',
    fileUrl: '#',
    category: 'rule',
    date: 'Jan 01, 2024',
  },
  {
    id: 'mat2',
    title: 'Q2 Exam Timetable',
    description: 'Official schedule for all grade levels for Quarter 2 exams.',
    fileUrl: '#',
    category: 'notice',
    date: 'May 10, 2024',
  },
  {
    id: 'mat3',
    title: 'Math Formulas Library',
    description: 'A collection of all formulas required for high school mathematics.',
    fileUrl: '#',
    category: 'material',
    date: 'Feb 15, 2024',
  },
];

export const MOCK_SCHEDULE: Schedule[] = [
  { id: 'sc1', day: 'Monday', time: '08:00 - 09:30', subjectName: 'Mathematics', teacherName: 'Jane Smith', room: 'Room 101', grade: '10A' },
  { id: 'sc2', day: 'Monday', time: '10:00 - 11:30', subjectName: 'Physics', teacherName: 'Jane Smith', room: 'Lab 2', grade: '10A' },
  { id: 'sc3', day: 'Tuesday', time: '08:00 - 09:30', subjectName: 'Literature', teacherName: 'John Doe', room: 'Room 203', grade: '10A' },
  { id: 'sc4', day: 'Wednesday', time: '10:00 - 11:30', subjectName: 'Mathematics', teacherName: 'Jane Smith', room: 'Room 101', grade: '10A' },
  { id: 'sc5', day: 'Thursday', time: '12:00 - 01:30', subjectName: 'Physics', teacherName: 'Jane Smith', room: 'Lab 2', grade: '10A' },
  { id: 'sc6', day: 'Friday', time: '08:00 - 09:30', subjectName: 'Literature', teacherName: 'John Doe', room: 'Room 203', grade: '10A' },
];

export const MOCK_RESULTS: SubjectResult[] = [
  {
    id: 'res1',
    studentId: '1',
    subjectId: 's1',
    quarter: 1,
    components: { midTerm: 18, assignment: 17, quiz: 9, classWork: 9, homework: 9, finalExam: 37 },
    total: 95,
  },
  {
    id: 'res2',
    studentId: '1',
    subjectId: 's2',
    quarter: 1,
    components: { midTerm: 16, assignment: 15, quiz: 8, classWork: 8, homework: 8, finalExam: 35 },
    total: 88,
  },
  {
    id: 'res3',
    studentId: '1',
    subjectId: 's3',
    quarter: 1,
    components: { midTerm: 17, assignment: 16, quiz: 9, classWork: 9, homework: 8, finalExam: 36 },
    total: 92,
  },
];
