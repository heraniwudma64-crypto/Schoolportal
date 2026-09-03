import { DayOfWeek } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ScheduleEntryItemDto {
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsOptional()
  roomOverride?: string;
}

export class BulkSaveScheduleDto {
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleEntryItemDto)
  entries!: ScheduleEntryItemDto[];
}
