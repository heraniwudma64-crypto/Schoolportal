import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReturnSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'classSectionId is required' })
  classSectionId!: string;

  @IsString()
  @IsNotEmpty({ message: 'academicYearId is required' })
  academicYearId!: string;

  @IsString()
  @IsNotEmpty({ message: 'subjectId is required' })
  subjectId!: string;

  @IsString()
  @IsNotEmpty({ message: 'term is required' })
  term!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Reason must not exceed 1000 characters' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return value;
  })
  reason?: string;
}

export class GetSubjectStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'classSectionId is required' })
  classSectionId!: string;

  @IsString()
  @IsNotEmpty({ message: 'academicYearId is required' })
  academicYearId!: string;

  @IsString()
  @IsNotEmpty({ message: 'subjectId is required' })
  subjectId!: string;

  @IsString()
  @IsNotEmpty({ message: 'term is required' })
  term!: string;
}
