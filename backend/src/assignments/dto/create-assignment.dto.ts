import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  targetClass: string; // e.g., "Grade 10A"

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}