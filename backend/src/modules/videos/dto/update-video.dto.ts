import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateVideoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  classSectionId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_APPROVAL'])
  status?: 'DRAFT' | 'PENDING_APPROVAL';
}
