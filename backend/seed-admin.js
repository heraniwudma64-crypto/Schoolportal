/**
 * One-time admin seed script.
 * Usage: node seed-admin.js
 *
 * Run this whenever the development admin account needs to be repaired.
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
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Upsert rather than skipping existing records. This fixes a stale seed with
  // an old password, incorrect role, or disabled/deleted state.
  const admin = await prisma.user.upsert({
    where: { loginId: ADMIN_LOGIN_ID },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      isActive: true,
      isDeleted: false,
      ...(ADMIN_EMAIL ? { email: ADMIN_EMAIL } : {}),
    },
    create: {
      id: randomUUID(),
      loginId: ADMIN_LOGIN_ID,
      email: ADMIN_EMAIL || undefined,
      password: passwordHash,
      role: 'ADMIN',
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
