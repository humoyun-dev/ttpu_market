export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: string | undefined | null): value is AppLanguage {
  return Boolean(value && SUPPORTED_LANGUAGES.includes(value as AppLanguage));
}
