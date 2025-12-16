import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StoreStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({ enum: StoreStatus })
  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;
}
