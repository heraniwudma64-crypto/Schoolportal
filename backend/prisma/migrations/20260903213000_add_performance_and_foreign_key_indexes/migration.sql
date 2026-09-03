-- Performance and Foreign Key Indexes Migration
-- Uses CREATE INDEX IF NOT EXISTS to guarantee idempotent, non-blocking execution

-- Student & Teacher name indexes
CREATE INDEX IF NOT EXISTS "Student_firstName_lastName_idx" ON "Student"("firstName", "lastName");
CREATE INDEX IF NOT EXISTS "Teacher_firstName_lastName_idx" ON "Teacher"("firstName", "lastName");

-- Timetable class and teacher indexes
CREATE INDEX IF NOT EXISTS "Timetable_classSectionId_idx" ON "Timetable"("classSectionId");
CREATE INDEX IF NOT EXISTS "Timetable_teacherId_idx" ON "Timetable"("teacherId");

-- Examination section and status compound index
CREATE INDEX IF NOT EXISTS "Examination_classSectionId_status_idx" ON "Examination"("classSectionId", "status");

-- Question & Option foreign key indexes
CREATE INDEX IF NOT EXISTS "Question_examId_idx" ON "Question"("examId");
CREATE INDEX IF NOT EXISTS "Option_questionId_idx" ON "Option"("questionId");

-- Student Exam Results & Answers
CREATE INDEX IF NOT EXISTS "StudentExamResult_studentId_examId_idx" ON "StudentExamResult"("studentId", "examId");
CREATE INDEX IF NOT EXISTS "StudentExamResult_examId_idx" ON "StudentExamResult"("examId");
CREATE INDEX IF NOT EXISTS "StudentAnswer_resultId_idx" ON "StudentAnswer"("resultId");
CREATE INDEX IF NOT EXISTS "StudentAnswer_questionId_idx" ON "StudentAnswer"("questionId");

-- ExamAttempt student index
CREATE INDEX IF NOT EXISTS "ExamAttempt_studentId_idx" ON "ExamAttempt"("studentId");

-- Submissions & Student Assignments
CREATE INDEX IF NOT EXISTS "Submission_assignmentId_idx" ON "Submission"("assignmentId");
CREATE INDEX IF NOT EXISTS "Submission_studentId_idx" ON "Submission"("studentId");
CREATE INDEX IF NOT EXISTS "StudentAssignment_studentId_idx" ON "StudentAssignment"("studentId");
CREATE INDEX IF NOT EXISTS "StudentAssignment_assignmentId_idx" ON "StudentAssignment"("assignmentId");

-- Fees
CREATE INDEX IF NOT EXISTS "FeeInvoice_studentId_idx" ON "FeeInvoice"("studentId");
CREATE INDEX IF NOT EXISTS "FeePayment_invoiceId_idx" ON "FeePayment"("invoiceId");

-- Grades
CREATE INDEX IF NOT EXISTS "Grade_studentId_idx" ON "Grade"("studentId");
CREATE INDEX IF NOT EXISTS "Grade_examinationId_idx" ON "Grade"("examinationId");
CREATE INDEX IF NOT EXISTS "Grade_assignmentId_idx" ON "Grade"("assignmentId");
