import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';

export class StoreTelegramBotSummaryDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '123456789' })
  botId: string;

  @ApiProperty({ example: 'my_store_bot' })
  username: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class StoreTelegramBotDetailDto extends StoreTelegramBotSummaryDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://example.com/telegram/webhook/1/secret',
  })
  webhookUrl?: string | null;
}

export class StoreListCountDto {
  @ApiProperty({ example: 12 })
  products: number;

  @ApiProperty({ example: 34 })
  orders: number;
}

export class StoreDetailCountDto {
  @ApiProperty({ example: 12 })
  products: number;

  @ApiProperty({ example: 5 })
  categories: number;

  @ApiProperty({ example: 34 })
  orders: number;

  @ApiProperty({ example: 87 })
  telegramCustomers: number;
}

export class StoreDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '1' })
  ownerId: string;

  @ApiProperty({ example: 'My Store' })
  name: string;

  @ApiProperty({ example: 'my-store' })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'A great store description' })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'https://example.com/logo.png' })
  logoUrl?: string | null;

  @ApiProperty({ type: [String], example: ['uz', 'ru'] })
  supportedLanguages: string[];

  @ApiProperty({ example: 'uz' })
  defaultLanguage: string;

  @ApiProperty({ example: 'UZS' })
  currency: string;

  @ApiProperty({ example: 'Asia/Tashkent' })
  timezone: string;

  @ApiProperty({ enum: StoreStatus })
  status: StoreStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class StoreListItemDto extends StoreDto {
  @ApiPropertyOptional({ type: StoreTelegramBotSummaryDto, nullable: true })
  telegramBot?: StoreTelegramBotSummaryDto | null;

  @ApiProperty({ type: StoreListCountDto })
  _count: StoreListCountDto;
}

export class StoreDetailDto extends StoreDto {
  @ApiPropertyOptional({ type: StoreTelegramBotDetailDto, nullable: true })
  telegramBot?: StoreTelegramBotDetailDto | null;

  @ApiProperty({ type: StoreDetailCountDto })
  _count: StoreDetailCountDto;
}
