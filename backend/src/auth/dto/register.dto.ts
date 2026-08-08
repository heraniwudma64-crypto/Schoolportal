export class RegisterDto {
  fullName: string;
  idNumber: string; // <-- Add this line
  email?: string;
  password: string;
  gender: string;
  name: string;      // Added student name
  class: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  classGrade?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  medicalStatus?: string;
}