/**
 * Fixed exchange rates from USD.
 * Calculation is always done in USD internally.
 * These rates convert USD → target currency for display.
 */
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  RUB: 89.5,
  KZT: 470.0,
};

/**
 * Convert a value from USD to the target currency using a fixed rate.
 */
export function convertCurrency(valueInUsd: number, currency: string): number {
  const rate = USD_RATES[currency] ?? 1;
  return valueInUsd * rate;
}

/**
 * Format a numeric value as currency using Intl.NumberFormat.
 * The value is assumed to already be in the target currency.
 */
const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  RUB: "ru-RU",
  KZT: "ru-RU",
};

export function formatCurrency(
  value: number,
  currency: string = "USD"
): string {
  const locale = CURRENCY_LOCALES[currency] || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback for unknown currencies
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Convert from USD and format in one step.
 */
export function convertAndFormat(
  valueInUsd: number,
  currency: string = "USD"
): string {
  return formatCurrency(convertCurrency(valueInUsd, currency), currency);
}

export function formatWeight(value: number, locale: string = "en"): string {
  return `${value.toFixed(1)} ${locale === "ru" ? "г" : "g"}`;
}
