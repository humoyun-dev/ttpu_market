import { Injectable } from '@nestjs/common';
import { I18N_MESSAGES } from './i18n.dictionary';
import type { AppLanguage } from './i18n.types';
import { isSupportedLanguage } from './i18n.types';

type TranslationParams = Record<string, string | number>;

@Injectable()
export class I18nService {
  resolveLanguage(
    preferred?: string | null,
    fallbackLanguage: AppLanguage = 'uz',
  ): AppLanguage {
    if (isSupportedLanguage(preferred)) {
      return preferred;
    }

    if (isSupportedLanguage(fallbackLanguage)) {
      return fallbackLanguage;
    }

    return 'uz';
  }

  t(
    key: string,
    language?: string | null,
    fallbackLanguage: AppLanguage = 'uz',
    params?: TranslationParams,
  ): string {
    const primaryLanguage = this.resolveLanguage(language, fallbackLanguage);
    const fallbackChain: AppLanguage[] = this.makeFallbackChain(primaryLanguage, fallbackLanguage);

    for (const lang of fallbackChain) {
      const template = this.readValue(lang, key);
      if (template) {
        return this.interpolate(template, params);
      }
    }

    return key;
  }

  private makeFallbackChain(
    primary: AppLanguage,
    fallbackLanguage: AppLanguage,
  ): AppLanguage[] {
    const chain: AppLanguage[] = [primary, fallbackLanguage, 'uz', 'en'];
    return Array.from(new Set(chain));
  }

  private readValue(language: AppLanguage, path: string): string | null {
    const segments = path.split('.');
    let current: unknown = I18N_MESSAGES[language];

    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return null;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === 'string' ? current : null;
  }

  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) {
      return template;
    }

    return Object.entries(params).reduce((message, [key, value]) => {
      return message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, template);
  }
}
