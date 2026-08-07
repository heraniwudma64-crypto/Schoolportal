const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Sign-up Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { loginId, password, email, role, firstName, lastName, ...extraData } = req.body;

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    let roleSpecificRelation = {};

    if (role === 'STUDENT') {
      roleSpecificRelation = {
        student: {
          create: {
            admissionNo: extraData.admissionNo,
            firstName,
            lastName,
            classGrade: extraData.classGrade,
            address: extraData.address,
            parentName: extraData.parentName,
            parentPhone: extraData.parentPhone,
            medicalStatus: extraData.medicalStatus,
          },
        },
      };
    } else if (role === 'TEACHER') {
      roleSpecificRelation = {
        teacher: {
          create: {
            firstName,
            lastName,
            address: extraData.address,
            medicalStatus: extraData.medicalStatus,
          },
        },
      };
    } else if (role === 'PARENT') {
      roleSpecificRelation = {
        parent: {
          create: { firstName, lastName },
        },
      };
    }

    // Create User and link their role table simultaneously
    const newUser = await prisma.user.create({
      data: {
        loginId,
        password: hashedPassword,
        email,
        role,
        ...roleSpecificRelation,
      },
    });

    res.status(201).json({ message: 'User registered successfully!', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});