import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  /** loginId — the ID used at login */
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  loginId!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsIn(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'])
  role!: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  // ── Profile fields (used to create Student/Teacher/Parent record) ──

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  // Student fields
  @IsOptional()
  @IsString()
  admissionNo?: string;

  @IsOptional()
  @IsString()
  classSectionId?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  // Teacher fields
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  // Parent fields
  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  relationship?: string;
}
