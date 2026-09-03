import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ReviewVideoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
