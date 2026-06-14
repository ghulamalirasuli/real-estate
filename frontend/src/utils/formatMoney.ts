export function formatMoney(
  amount: number,
  symbol = '$',
  decimalPlaces = 2,
  locale?: string,
): string {
  const formatted = Number(amount).toLocaleString(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  return `${symbol}${formatted}`;
}
