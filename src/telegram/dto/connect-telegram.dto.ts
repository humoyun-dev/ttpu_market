import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectTelegramDto {
  @ApiProperty({ example: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ example: 'https://your-domain.com' })
  @IsOptional()
  @IsUrl()
  webhookBaseUrl?: string;
}
