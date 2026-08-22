import { IsString, IsOptional } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  target_role?: string;
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  target_role?: string;
}
