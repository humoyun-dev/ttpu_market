import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreLocationDto {
  @ApiProperty({ example: 'Main Store' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Tashkent, Chilanzar 1' })
  @IsString()
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({ example: 41.2995 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 69.2401 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
