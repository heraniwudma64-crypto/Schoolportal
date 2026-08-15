/**
 * One-time admin seed script.
 * Usage: node seed-admin.js
 *
 * Edit the values below, run once, then delete (or keep) this file.
 */

const ADMIN_LOGIN_ID = 'admin-001';   // the ID you'll type at login
const ADMIN_EMAIL    = null;          // optional email, or set to 'admin@school.com'
const ADMIN_PASSWORD = 'Admin@1234'; // change to something strong

// ─────────────────────────────────────────────────────────────

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { loginId: ADMIN_LOGIN_ID },
    select: { id: true },
  });

  if (existing) {
    console.log(`Admin with loginId "${ADMIN_LOGIN_ID}" already exists (id: ${existing.id}). Nothing changed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      id:       randomUUID(),
      loginId:  ADMIN_LOGIN_ID,
      email:    ADMIN_EMAIL || undefined,
      password: passwordHash,
      role:     'ADMIN',
      isActive: true,
      isDeleted: false,
    },
    select: { id: true, loginId: true, role: true },
  });

  console.log('Admin created successfully:');
  console.log(`  id:      ${admin.id}`);
  console.log(`  loginId: ${admin.loginId}`);
  console.log(`  role:    ${admin.role}`);
  console.log(`\nYou can now log in with:`);
  console.log(`  ID/Email: ${ADMIN_LOGIN_ID}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
