import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  loginId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  admissionNo: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  classSectionId?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
