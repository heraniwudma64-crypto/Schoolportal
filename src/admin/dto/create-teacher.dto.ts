import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateTeacherDto {
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
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
