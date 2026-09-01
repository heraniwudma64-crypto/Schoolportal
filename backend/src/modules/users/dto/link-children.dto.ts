import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class LinkChildrenDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  studentIds!: string[];
}
