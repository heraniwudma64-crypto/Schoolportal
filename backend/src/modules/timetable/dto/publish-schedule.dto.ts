import { IsOptional, IsString } from 'class-validator';
import { BulkSaveScheduleDto } from './bulk-save-schedule.dto';

export class PublishScheduleDto extends BulkSaveScheduleDto {
  @IsString()
  @IsOptional()
  expectedUpdatedAt?: string;
}
