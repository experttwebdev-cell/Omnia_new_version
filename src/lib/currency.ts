export function getCurrencySymbol(currencyCode: string): string {
  const symbolMap: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$',
  };

  return symbolMap[currencyCode] || currencyCode;
}

export function formatPrice(price: number, currencyCode: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = price.toFixed(2);

  if (currencyCode === 'EUR') {
    return `${formattedAmount} ${symbol}`;
  }

  if (currencyCode === 'USD' || currencyCode === 'GBP' || currencyCode === 'CAD' || currencyCode === 'AUD' || currencyCode === 'NZD') {
    return `${symbol}${formattedAmount}`;
  }

  return `${formattedAmount} ${symbol}`;
}
