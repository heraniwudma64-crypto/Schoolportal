import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  
  loginId: string;
  password: string;
}