import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DeliveryTierDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minOrderAmount: number;

  @ApiProperty({ example: 15000 })
  @IsInt()
  @Min(0)
  deliveryFee: number;
}

export class CreateDeliveryZoneDto {
  @ApiProperty({ example: 'Chilanzar District' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'GeoJSON polygon' })
  @IsOptional()
  @IsObject()
  polygon?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [DeliveryTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryTierDto)
  tiers?: DeliveryTierDto[];
}
