import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf, ValidateNested } from 'class-validator';

class StudentAccountFieldsDto {
  @IsOptional() @IsString() @MinLength(1) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) fatherName?: string;
  @IsOptional() @IsString() @MinLength(1) grandfatherName?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value) @IsDateString() dob?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsBoolean() hasDisability?: boolean;
  @ValidateIf((o) => o.disabilityType !== null && (o.hasDisability === true || o.disabilityType !== undefined)) @IsString() disabilityType?: string | null;
  @IsOptional() @IsString() familyKebele?: string;
  @IsOptional() @IsString() locationType?: string;
  @IsOptional() @IsString() fatherEducationLevel?: string;
  @IsOptional() @IsString() motherEducationLevel?: string;
  @IsOptional() @IsString() economicStatus?: string;
  @IsOptional() @IsString() guardianFullName?: string;
  @IsOptional() @IsString() familyHeadGender?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value) @IsEmail() guardianEmail?: string;
  @IsOptional() @IsString() @Matches(/^[+0-9()\-\s]{7,25}$/, { message: 'guardianPhone must be a valid phone number' }) guardianPhone?: string;
  @IsOptional() @IsString() @MinLength(3) nationalId?: string;
  @IsOptional() @IsString() residenceRegion?: string;
  @IsOptional() @IsString() residenceZone?: string;
  @IsOptional() @IsString() residenceWoreda?: string;
  @IsOptional() @IsString() birthRegion?: string;
  @IsOptional() @IsString() birthZone?: string;
  @IsOptional() @IsString() birthWoreda?: string;
  @IsOptional() @IsString() parentStatus?: string;
}

export class UpdateStudentAccountDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) loginId?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value) @IsEmail() email?: string;
  @IsOptional() @ValidateNested() @Type(() => StudentAccountFieldsDto) student?: StudentAccountFieldsDto;
}
