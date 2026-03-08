import { useSyncExternalStore } from "react";
import { t, getLocale, setLocale, subscribe, type Locale, type TranslationKey } from "@/lib/i18n";

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale);
  return { t, locale, setLocale };
}

export type { Locale, TranslationKey };
