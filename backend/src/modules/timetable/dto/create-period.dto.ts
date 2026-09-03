import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsInt()
  @Min(1)
  periodNumber!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM 24-hour format (e.g. "08:00")',
  })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM 24-hour format (e.g. "08:45")',
  })
  endTime!: string;

  @IsBoolean()
  @IsOptional()
  isBreak?: boolean;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
