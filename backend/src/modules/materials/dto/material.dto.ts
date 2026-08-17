import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['material', 'notice', 'rule', 'syllabus'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['all', 'teacher', 'student', 'parent'])
  targetRole?: string;
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['material', 'notice', 'rule', 'syllabus'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['all', 'teacher', 'student', 'parent'])
  targetRole?: string;
}
