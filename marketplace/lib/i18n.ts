import type {Locale} from '@/i18n/config';
import {locales} from '@/i18n/config';

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function loadMessages(locale: Locale) {
  return (await import(`@/messages/${locale}.json`)).default;
}
