import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g. "MATH101"

  @IsString()
  @IsNotEmpty()
  name: string; // e.g. "Mathematics"

  @IsString()
  @IsOptional()
  description?: string;
}
