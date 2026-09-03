import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  youtubeUrl!: string;

  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsOptional()
  classSectionId?: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;
}
