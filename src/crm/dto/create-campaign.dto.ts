import { IsString, IsOptional, MaxLength, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale Announcement' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Get 20% off on all products!' })
  @IsString()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;
}
