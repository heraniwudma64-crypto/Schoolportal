import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('Teacher:', teacher?.loginId, teacher?.password);
  console.log('Admin:', admin?.loginId, admin?.password);
  
  const subjects = await prisma.subject.findMany();
  const classes = await prisma.class.findMany();
  console.log('Subjects:', subjects.length, 'Classes:', classes.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
