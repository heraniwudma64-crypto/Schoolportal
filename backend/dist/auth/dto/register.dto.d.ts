export declare class RegisterDto {
    fullName: string;
    idNumber: string;
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
