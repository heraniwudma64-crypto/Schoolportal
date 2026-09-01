import { IsString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  classSectionId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  duration?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  totalMarks?: number;

  @IsOptional()
  @IsString()
  examDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  // Add these two to allow the properties coming from the frontend
  @IsOptional()
  subject?: any;

  @IsOptional()
  @IsArray()
  questions?: any[];
}