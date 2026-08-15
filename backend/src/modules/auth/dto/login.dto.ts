import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}
