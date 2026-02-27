import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import type { AppLanguage } from '../../common/i18n';
import { SUPPORTED_LANGUAGES } from '../../common/i18n';

export class CustomerRegistrationStartDto {
  @Matches(/^\d+$/)
  telegramUserId!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class CustomerLanguageSelectDto {
  @Matches(/^\d+$/)
  telegramUserId!: string;

  @IsIn(SUPPORTED_LANGUAGES)
  languageCode!: AppLanguage;
}

export class CustomerRegistrationContactDto {
  @Matches(/^\d+$/)
  telegramUserId!: string;

  @Matches(/^\d+$/)
  contactUserId!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}
