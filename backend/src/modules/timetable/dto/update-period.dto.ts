import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdatePeriodDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  periodNumber?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM 24-hour format (e.g. "08:00")',
  })
  @IsOptional()
  startTime?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM 24-hour format (e.g. "08:45")',
  })
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isBreak?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
