const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    console.log(await prisma.class.findFirst());
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
