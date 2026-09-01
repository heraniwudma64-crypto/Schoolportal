/**
 * Test Users Seed Script
 * Usage: node seed-test-users.js
 * 
 * Creates test users for development and testing purposes:
 * - Admin user
 * - Teacher user with Teacher profile
 * - Student user with Student profile
 * 
 * All passwords follow the 8+ character minimum requirement.
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    loginId: 'admin-001',
    email: 'admin@school.local',
    password: 'Admin@1234',
    role: 'ADMIN',
    name: 'System Administrator',
  },
  {
    loginId: 'teacher-001',
    email: 'john.doe@school.local',
    password: 'Teacher@2024',
    role: 'TEACHER',
    name: 'John Doe',
    teacherData: {
      firstName: 'John',
      lastName: 'Doe',
      staffId: 'STF-001',
      qualification: 'M.Ed',
      address: '123 Main Street',
      phoneNumber: '+1-555-0101',
    },
  },
  {
    loginId: 'student-001',
    email: 'jane.smith@school.local',
    password: 'Student@2024',
    role: 'STUDENT',
    name: 'Jane Smith',
    studentData: {
      firstName: 'Jane',
      lastName: 'Smith',
      admissionNo: 'STU-2024-001',
      gender: 'Female',
    },
  },
  {
    loginId: 'teacher-002',
    email: 'alice.johnson@school.local',
    password: 'Teacher@2024',
    role: 'TEACHER',
    name: 'Alice Johnson',
    teacherData: {
      firstName: 'Alice',
      lastName: 'Johnson',
      staffId: 'STF-002',
      qualification: 'B.Sc Education',
      address: '456 Oak Avenue',
      phoneNumber: '+1-555-0102',
    },
  },
];

async function main() {
  console.log('🌱 Seeding test users...\n');

  for (const testUser of TEST_USERS) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { loginId: testUser.loginId },
        select: { id: true, loginId: true, role: true },
      });

      if (existing) {
        console.log(`✓ User "${testUser.loginId}" already exists (${existing.role})`);
        continue;
      }

      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const userId = randomUUID();

      // Create user
      const user = await prisma.user.create({
        data: {
          id: userId,
          loginId: testUser.loginId,
          email: testUser.email,
          password: passwordHash,
          role: testUser.role,
          name: testUser.name,
          isActive: true,
          isDeleted: false,
        },
        select: { id: true, loginId: true, role: true },
      });

      // Create teacher profile if needed
      if (testUser.role === 'TEACHER' && testUser.teacherData) {
        await prisma.teacher.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName: testUser.teacherData.firstName,
            lastName: testUser.teacherData.lastName,
            staffId: testUser.teacherData.staffId,
            qualification: testUser.teacherData.qualification,
            address: testUser.teacherData.address,
            phoneNumber: testUser.teacherData.phoneNumber,
            updatedAt: new Date(),
          },
        });
        console.log(`✓ Created teacher user: ${testUser.loginId}`);
      }
      // Create student profile if needed
      else if (testUser.role === 'STUDENT' && testUser.studentData) {
        await prisma.student.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName: testUser.studentData.firstName,
            lastName: testUser.studentData.lastName,
            admissionNo: testUser.studentData.admissionNo,
            gender: testUser.studentData.gender,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        });
        console.log(`✓ Created student user: ${testUser.loginId}`);
      } else if (testUser.role === 'ADMIN') {
        console.log(`✓ Created admin user: ${testUser.loginId}`);
      }
    } catch (error) {
      console.error(`✗ Failed to create user "${testUser.loginId}":`, error.message);
    }
  }

  console.log('\n📋 Test Users Summary:');
  console.log('─'.repeat(50));
  TEST_USERS.forEach((user) => {
    console.log(`Login ID: ${user.loginId.padEnd(20)} | Password: ${user.password}`);
  });
  console.log('─'.repeat(50));
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
