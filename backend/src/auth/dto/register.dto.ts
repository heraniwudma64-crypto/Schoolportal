export class RegisterDto {
  fullName: string;
  idNumber: string; // <-- Add this line
  email?: string;
  password: string;
  gender: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  classGrade?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  medicalStatus?: string;
}