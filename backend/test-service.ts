import { PrismaClient } from '@prisma/client';
import { ExaminationsService } from './src/modules/examinations/examinations.service';

const prisma = new PrismaClient();
const service = new ExaminationsService(prisma as any);

async function main() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' }, include: { Teacher: true } });
  if (!teacher || !teacher.Teacher) throw new Error('No teacher found');
  
  const subjects = await prisma.subject.findMany();
  const classes = await prisma.class.findMany();
  const sections = await prisma.classSection.findMany();
  
  console.log('--- TEST 1: TEACHER CREATES EXAM ---');
  const examDto = {
    title: 'Mathematics Mid-Term Exam',
    subjectId: subjects[0].id,
    classId: classes[0].id,
    classSectionId: sections[0].id,
    duration: 90,
    status: 'PENDING',
    questions: [
      {
        questionText: 'What is 2+2?',
        options: [
          { optionText: '3', isCorrect: false },
          { optionText: '4', isCorrect: true },
        ]
      }
    ]
  };
  
  const createdExam = await service.createExamination(examDto, teacher.id);
  console.log('Created exam:', createdExam.id, 'Status:', createdExam.status);
  
  console.log('--- TEST 2: ADMIN VIEWS PENDING ---');
  const pending = await service.findPendingExaminations();
  console.log('Pending count:', pending.length, 'Includes new exam?', pending.some(e => e.id === createdExam.id));
  
  console.log('--- TEST 3: ADMIN APPROVES ---');
  await service.updateExamStatus(createdExam.id, 'APPROVED');
  const updatedExam = await prisma.examination.findUnique({ where: { id: createdExam.id } });
  console.log('Status after approval:', updatedExam?.status);
  
  console.log('--- TEST 4: TEACHER VIEWS THEIR EXAMS ---');
  const teacherExams = await service.findTeacherExaminations(teacher.id);
  console.log('Teacher exams count:', teacherExams.length, 'Includes new exam?', teacherExams.some(e => e.id === createdExam.id));
}

main().catch(console.error).finally(() => prisma.$disconnect());
