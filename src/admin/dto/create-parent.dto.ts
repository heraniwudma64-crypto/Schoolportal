import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateParentDto {
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
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  occupation?: string;
}
