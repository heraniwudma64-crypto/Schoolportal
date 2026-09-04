import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['YOUTUBE', 'UPLOAD'])
  sourceType?: 'YOUTUBE' | 'UPLOAD';

  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsOptional()
  classSectionId?: string;

  @IsOptional()
  isDraft?: boolean | string;
}
