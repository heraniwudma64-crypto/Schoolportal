import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // `identifier` is the canonical field sent by the current client.  The
  // aliases keep older clients and admin login forms compatible.
  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  loginId?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}
