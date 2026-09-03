import { IsOptional, IsString } from 'class-validator';

export class ScheduleQueryDto {
  @IsString()
  @IsOptional()
  academicYearId?: string;
}
