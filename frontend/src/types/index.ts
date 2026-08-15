export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export interface User {
  id: string;
  idNumber: string;
  name: string;
  email?: string;
  role: UserRole;
  grade?: string;
  department?: string;
  gender?: string;
  avatar?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  grade: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  fileUrl?: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue' | 'graded';
  grade?: number;
  published?: boolean;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectName: string;
  teacherName: string;
  duration: number; // in minutes
  questions: ExamQuestion[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  adminRemarks?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface SubjectResult {
  id: string;
  studentId: string;
  subjectId: string;
  quarter: 1 | 2 | 3 | 4;
  components: {
    midTerm: number;
    assignment: number;
    quiz: number;
    classWork: number;
    homework: number;
    finalExam: number;
  };
  total: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetRole?: UserRole | 'all';
}

export interface SchoolMaterial {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  category: 'notice' | 'material' | 'rule';
  date: string;
}

export interface Schedule {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string;
  subjectName: string;
  teacherName: string;
  room: string;
  grade: string;
}
