import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const PUBLIC_REGISTRATION_ROLES = ['student', 'teacher', 'parent'] as const;

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  idNumber!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsIn(PUBLIC_REGISTRATION_ROLES)
  role?: (typeof PUBLIC_REGISTRATION_ROLES)[number];

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  classSectionId?: string;

  @IsOptional()
  @IsString()
  grades?: string;

  @IsOptional() @IsString() institutionId?: string;
  @IsOptional() @IsString() institutionName?: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() grandfatherName?: string;
  @IsOptional() @IsString() admissionType?: string;
  @IsOptional() @IsString() disability?: string;
  @IsOptional() @IsString() disabilityType?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() familyKebele?: string;
  @IsOptional() @IsString() locationType?: string;
  @IsOptional() @IsString() fatherEducationLevel?: string;
  @IsOptional() @IsString() motherEducationLevel?: string;
  @IsOptional() @IsString() economicStatus?: string;
  @IsOptional() @IsString() guardianFullName?: string;
  @IsOptional() @IsString() familyHeadGender?: string;
  @IsOptional() @Transform(({ value }) => (value === '' ? undefined : value)) @IsEmail() guardianEmail?: string;
  @IsOptional() @IsString() guardianPhone?: string;
  @IsOptional() @IsString() nationalId?: string;
  @IsOptional() @IsString() residenceRegion?: string;
  @IsOptional() @IsString() residenceZone?: string;
  @IsOptional() @IsString() residenceWoreda?: string;
  @IsOptional() @IsString() birthRegion?: string;
  @IsOptional() @IsString() birthZone?: string;
  @IsOptional() @IsString() birthWoreda?: string;
  @IsOptional() @IsString() parentStatus?: string;
}
